-- ========================================
-- PART 7: EVENT SOURCING AND AUDIT TRAILS
-- Complete audit system for compliance and debugging
-- ========================================

-- 1. DOMAIN EVENTS TABLE
-- Central event store for all business events
CREATE TABLE IF NOT EXISTS public.domain_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aggregate_type TEXT NOT NULL, -- 'order', 'payment', 'product', 'vendor'
    aggregate_id UUID NOT NULL,   -- ID of the entity
    event_type TEXT NOT NULL,     -- 'order_created', 'payment_processed', etc.
    event_version INTEGER NOT NULL DEFAULT 1,
    event_data JSONB NOT NULL,    -- Event payload
    metadata JSONB DEFAULT '{}',  -- Context data (user_agent, ip, etc.)
    correlation_id UUID,          -- For tracing related events
    causation_id UUID,           -- ID of the event that caused this event
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id),
    
    -- Constraints
    CHECK (aggregate_type != ''),
    CHECK (event_type != ''),
    CHECK (event_version > 0)
);

-- 2. AUDIT LOG TABLE
-- Traditional audit trail for all table changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES public.profiles(id),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PARTITION DOMAIN EVENTS BY DATE
-- Event store grows quickly, needs partitioning
CREATE TABLE public.domain_events_partitioned (
    LIKE public.domain_events INCLUDING ALL
) PARTITION BY RANGE (occurred_at);

-- Move existing data and swap tables
INSERT INTO public.domain_events_partitioned SELECT * FROM public.domain_events;
ALTER TABLE public.domain_events RENAME TO domain_events_old;
ALTER TABLE public.domain_events_partitioned RENAME TO domain_events;

-- Create weekly partitions for domain events
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN -4..12 LOOP -- 4 weeks back, 12 weeks forward
        start_date := DATE_TRUNC('week', CURRENT_DATE + INTERVAL '%s week' % i);
        end_date := start_date + INTERVAL '1 week';
        partition_name := 'domain_events_w' || TO_CHAR(start_date, 'YYYYWW');
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.domain_events
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
    END LOOP;
END $$;

-- 4. INDEXES FOR EVENT SOURCING
-- Critical indexes for event queries
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate 
ON public.domain_events (aggregate_type, aggregate_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_domain_events_type_time 
ON public.domain_events (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_domain_events_correlation 
ON public.domain_events (correlation_id, occurred_at) 
WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_domain_events_user 
ON public.domain_events (user_id, occurred_at DESC) 
WHERE user_id IS NOT NULL;

-- GIN index for event data queries
CREATE INDEX IF NOT EXISTS idx_domain_events_data 
ON public.domain_events USING gin(event_data);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record 
ON public.audit_logs (table_name, record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time 
ON public.audit_logs (user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_time 
ON public.audit_logs (operation, created_at DESC);

-- 5. RLS POLICIES FOR EVENTS
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all events
CREATE POLICY "admin_view_all_events" ON public.domain_events
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Users can view their own events
CREATE POLICY "user_view_own_events" ON public.domain_events
    FOR SELECT USING (user_id = auth.uid());

-- Vendors can view events for their aggregates
CREATE POLICY "vendor_view_own_aggregate_events" ON public.domain_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vendor_users vu
            JOIN public.profiles p ON p.id = vu.user_id
            WHERE p.id = auth.uid() 
            AND (
                (aggregate_type = 'vendor' AND vu.vendor_id::text = aggregate_id::text) OR
                (aggregate_type = 'product' AND EXISTS (
                    SELECT 1 FROM public.products pr 
                    WHERE pr.id = domain_events.aggregate_id AND pr.vendor_id = vu.vendor_id
                ))
            )
        )
    );

-- Admin can view all audit logs
CREATE POLICY "admin_view_audit_logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. EVENT SOURCING FUNCTIONS
-- Function to publish domain event
CREATE OR REPLACE FUNCTION publish_domain_event(
    p_aggregate_type TEXT,
    p_aggregate_id UUID,
    p_event_type TEXT,
    p_event_data JSONB,
    p_metadata JSONB DEFAULT '{}',
    p_correlation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    current_version INTEGER;
BEGIN
    -- Get current version for this aggregate
    SELECT COALESCE(MAX(event_version), 0) + 1 
    INTO current_version
    FROM public.domain_events
    WHERE aggregate_type = p_aggregate_type AND aggregate_id = p_aggregate_id;
    
    -- Insert event
    INSERT INTO public.domain_events (
        aggregate_type, aggregate_id, event_type, event_version,
        event_data, metadata, correlation_id, user_id
    )
    VALUES (
        p_aggregate_type, p_aggregate_id, p_event_type, current_version,
        p_event_data, p_metadata, p_correlation_id, auth.uid()
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get aggregate events
CREATE OR REPLACE FUNCTION get_aggregate_events(
    p_aggregate_type TEXT,
    p_aggregate_id UUID,
    p_from_version INTEGER DEFAULT 1
)
RETURNS TABLE (
    event_id UUID,
    event_type TEXT,
    event_version INTEGER,
    event_data JSONB,
    occurred_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.event_type,
        de.event_version,
        de.event_data,
        de.occurred_at
    FROM public.domain_events de
    WHERE de.aggregate_type = p_aggregate_type
    AND de.aggregate_id = p_aggregate_id
    AND de.event_version >= p_from_version
    ORDER BY de.event_version;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. AUDIT TRIGGER FUNCTION
-- Generic audit function for any table
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    field_name TEXT;
BEGIN
    -- Convert records to JSONB
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSE -- UPDATE
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Find changed fields
        FOR field_name IN SELECT key FROM jsonb_each(new_data) LOOP
            IF old_data->>field_name IS DISTINCT FROM new_data->>field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Insert audit record
    INSERT INTO public.audit_logs (
        table_name, record_id, operation, old_values, new_values, 
        changed_fields, user_id
    )
    VALUES (
        TG_TABLE_NAME, 
        COALESCE((new_data->>'id')::UUID, (old_data->>'id')::UUID),
        TG_OP, old_data, new_data, changed_fields, auth.uid()
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. EVENT TRIGGERS FOR KEY TABLES
-- Add event publishing to critical business operations

-- Order events
CREATE OR REPLACE FUNCTION order_event_trigger()
RETURNS TRIGGER AS $$
DECLARE
    event_type TEXT;
    event_data JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        event_type := 'order_created';
        event_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        event_type := 'order_updated';
        event_data := jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'order_data', to_jsonb(NEW)
        );
    ELSE
        RETURN OLD;
    END IF;
    
    PERFORM publish_domain_event('order', NEW.id, event_type, event_data);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_event_trigger ON public.orders;
CREATE TRIGGER order_event_trigger
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION order_event_trigger();

-- Payment events
CREATE OR REPLACE FUNCTION payment_event_trigger()
RETURNS TRIGGER AS $$
DECLARE
    event_type TEXT;
    event_data JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        event_type := 'payment_created';
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        event_type := 'payment_status_changed';
    ELSE
        RETURN NEW;
    END IF;
    
    event_data := to_jsonb(NEW);
    PERFORM publish_domain_event('payment', NEW.id, event_type, event_data);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_event_trigger ON public.payments;
CREATE TRIGGER payment_event_trigger
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION payment_event_trigger();

-- 9. ADD AUDIT TRIGGERS TO KEY TABLES
-- Enable comprehensive auditing
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'orders', 'order_items', 'payments', 'products', 'vendors',
            'categories', 'serviceable_areas', 'product_area_pricing'
        ])
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS audit_trigger_%s ON public.%I',
            table_name, table_name
        );
        
        EXECUTE format(
            'CREATE TRIGGER audit_trigger_%s
             AFTER INSERT OR UPDATE OR DELETE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()',
            table_name, table_name
        );
    END LOOP;
END $$;

-- 10. EVENT CLEANUP FUNCTIONS
-- Function to archive old events
CREATE OR REPLACE FUNCTION archive_old_events(
    retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - INTERVAL '%s days' % retention_days;
    
    -- In a real implementation, you'd move to archive table
    DELETE FROM public.domain_events 
    WHERE occurred_at < cutoff_date;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Verification
SELECT 
    'Event sourcing system ready!' as status,
    (SELECT COUNT(*) FROM public.domain_events) as total_events,
    (SELECT COUNT(*) FROM public.audit_logs) as total_audit_records;

COMMENT ON TABLE public.domain_events IS 'Central event store for business events';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all table changes';
COMMENT ON FUNCTION publish_domain_event(TEXT, UUID, TEXT, JSONB, JSONB, UUID) IS 'Publish business domain event';
COMMENT ON FUNCTION get_aggregate_events(TEXT, UUID, INTEGER) IS 'Retrieve events for specific aggregate';

