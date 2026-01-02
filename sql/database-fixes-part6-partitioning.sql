-- ========================================
-- PART 6: TABLE PARTITIONING FOR SCALE
-- Implement partitioning for high-volume tables
-- ========================================

-- 1. PARTITION ORDERS BY MONTH
-- First convert to partitioned table
DO $$
BEGIN
    -- Check if orders is already partitioned
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table 
        WHERE partrelid = 'public.orders'::regclass
    ) THEN
        -- Create new partitioned orders table
        CREATE TABLE public.orders_partitioned (
            LIKE public.orders INCLUDING ALL
        ) PARTITION BY RANGE (created_at);
        
        -- Copy data to new table (for small datasets)
        INSERT INTO public.orders_partitioned SELECT * FROM public.orders;
        
        -- Rename tables
        ALTER TABLE public.orders RENAME TO orders_old;
        ALTER TABLE public.orders_partitioned RENAME TO orders;
        
        -- Recreate foreign key constraints
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id);
        
        -- Note: In production, use logical replication for zero-downtime migration
    END IF;
END $$;

-- Create monthly partitions for orders (current and future months)
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for last 6 months and next 12 months
    FOR i IN -6..12 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '%s month' % i);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'orders_y' || TO_CHAR(start_date, 'YYYY') || 'm' || TO_CHAR(start_date, 'MM');
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.orders
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
    END LOOP;
END $$;

-- 2. PARTITION APP_STATS BY DATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table 
        WHERE partrelid = 'public.app_stats'::regclass
    ) THEN
        CREATE TABLE public.app_stats_partitioned (
            LIKE public.app_stats INCLUDING ALL
        ) PARTITION BY RANGE (date);
        
        INSERT INTO public.app_stats_partitioned SELECT * FROM public.app_stats;
        
        ALTER TABLE public.app_stats RENAME TO app_stats_old;
        ALTER TABLE public.app_stats_partitioned RENAME TO app_stats;
    END IF;
END $$;

-- Create daily partitions for app_stats (more granular for analytics)
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for last 30 days and next 90 days
    FOR i IN -30..90 LOOP
        start_date := CURRENT_DATE + i;
        end_date := start_date + INTERVAL '1 day';
        partition_name := 'app_stats_' || TO_CHAR(start_date, 'YYYYMMDD');
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.app_stats
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
    END LOOP;
END $$;

-- 3. PARTITION ORDER_WORKFLOWS BY DATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table 
        WHERE partrelid = 'public.order_workflows'::regclass
    ) THEN
        CREATE TABLE public.order_workflows_partitioned (
            LIKE public.order_workflows INCLUDING ALL
        ) PARTITION BY RANGE (transitioned_at);
        
        INSERT INTO public.order_workflows_partitioned SELECT * FROM public.order_workflows;
        
        ALTER TABLE public.order_workflows RENAME TO order_workflows_old;
        ALTER TABLE public.order_workflows_partitioned RENAME TO order_workflows;
        
        -- Recreate constraints
        ALTER TABLE public.order_workflows 
        ADD CONSTRAINT order_workflows_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create weekly partitions for order_workflows
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN -12..24 LOOP -- 12 weeks back, 24 weeks forward
        start_date := DATE_TRUNC('week', CURRENT_DATE + INTERVAL '%s week' % i);
        end_date := start_date + INTERVAL '1 week';
        partition_name := 'order_workflows_w' || TO_CHAR(start_date, 'YYYYWW');
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.order_workflows
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
    END LOOP;
END $$;

-- 4. AUTOMATED PARTITION MANAGEMENT
-- Function to create future partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name TEXT,
    months_ahead INTEGER DEFAULT 3
) RETURNS INTEGER AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
    partitions_created INTEGER := 0;
BEGIN
    FOR i IN 1..months_ahead LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '%s month' % i);
        end_date := start_date + INTERVAL '1 month';
        partition_name := table_name || '_y' || TO_CHAR(start_date, 'YYYY') || 'm' || TO_CHAR(start_date, 'MM');
        
        BEGIN
            EXECUTE format(
                'CREATE TABLE public.%I PARTITION OF public.%I
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, table_name, start_date, end_date
            );
            partitions_created := partitions_created + 1;
        EXCEPTION WHEN duplicate_table THEN
            -- Partition already exists, skip
            CONTINUE;
        END;
    END LOOP;
    
    RETURN partitions_created;
END;
$$ LANGUAGE plpgsql;

-- Function to drop old partitions
CREATE OR REPLACE FUNCTION drop_old_partitions(
    table_name TEXT,
    retention_months INTEGER DEFAULT 12
) RETURNS INTEGER AS $$
DECLARE
    partition_record RECORD;
    partitions_dropped INTEGER := 0;
    cutoff_date DATE;
BEGIN
    cutoff_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '%s month' % retention_months);
    
    FOR partition_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE table_name || '_y%'
        AND tablename < table_name || '_y' || TO_CHAR(cutoff_date, 'YYYY') || 'm' || TO_CHAR(cutoff_date, 'MM')
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I', partition_record.tablename);
        partitions_dropped := partitions_dropped + 1;
    END LOOP;
    
    RETURN partitions_dropped;
END;
$$ LANGUAGE plpgsql;

-- 5. PARTITION MAINTENANCE JOBS
-- Create function to maintain partitions (run monthly)
CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    created INTEGER;
    dropped INTEGER;
BEGIN
    -- Create future partitions
    created := create_monthly_partition('orders', 3);
    result := result || format('Created %s order partitions. ', created);
    
    created := create_monthly_partition('app_stats', 3);
    result := result || format('Created %s app_stats partitions. ', created);
    
    -- Drop old partitions (keep 12 months)
    dropped := drop_old_partitions('orders', 12);
    result := result || format('Dropped %s old order partitions. ', dropped);
    
    dropped := drop_old_partitions('app_stats', 6); -- Keep 6 months of stats
    result := result || format('Dropped %s old app_stats partitions.', dropped);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. PARTITION-AWARE INDEXES
-- Create indexes on partitioned tables
CREATE INDEX IF NOT EXISTS idx_orders_user_created_partitioned 
ON public.orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_partitioned 
ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_partitioned 
ON public.orders (payment_status, status, created_at);

CREATE INDEX IF NOT EXISTS idx_app_stats_service_metric_partitioned 
ON public.app_stats (service_type, metric_name, date DESC);

CREATE INDEX IF NOT EXISTS idx_app_stats_metric_value_partitioned 
ON public.app_stats (metric_name, metric_value, date DESC);

-- 7. PARTITION CONSTRAINTS FOR PERFORMANCE
-- Add partition-wise constraints where possible
DO $$
DECLARE
    partition_name TEXT;
BEGIN
    -- Add check constraints to existing partitions for better query planning
    FOR partition_name IN
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'orders_y%'
    LOOP
        -- PostgreSQL automatically adds these for RANGE partitions
        -- But we can add additional constraints for better performance
        NULL; -- Placeholder for custom constraints
    END LOOP;
END $$;

-- 8. VERIFICATION QUERIES
-- Check partition status
SELECT 
    'Partitioning Status' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE 'orders_y%' OR tablename LIKE 'app_stats_%')
ORDER BY tablename;

-- Show partition pruning example
EXPLAIN (COSTS OFF, BUFFERS OFF)
SELECT COUNT(*) 
FROM public.orders 
WHERE created_at >= CURRENT_DATE - INTERVAL '1 month';

COMMENT ON FUNCTION create_monthly_partition(TEXT, INTEGER) IS 'Automatically create future monthly partitions';
COMMENT ON FUNCTION drop_old_partitions(TEXT, INTEGER) IS 'Drop old partitions beyond retention period';
COMMENT ON FUNCTION maintain_partitions() IS 'Automated partition maintenance function';

