-- ========================================
-- PART 5: CANONICAL ORDER SYSTEM
-- Fix dual order storage and implement proper workflow
-- ========================================

-- 1. ORDER WORKFLOW TRACKING
-- Proper order state management
CREATE TABLE IF NOT EXISTS public.order_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    previous_status TEXT,
    transition_reason TEXT,
    transition_metadata JSONB DEFAULT '{}',
    transitioned_by UUID REFERENCES public.profiles(id),
    transitioned_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (status IN (
        'draft', 'pending', 'confirmed', 'processing', 
        'packed', 'shipped', 'out_for_delivery', 'delivered', 
        'cancelled', 'returned', 'refunded'
    ))
);

-- 2. PAYMENT STATE MACHINE
-- Proper payment transaction tracking
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    state TEXT NOT NULL CHECK (state IN (
        'initialized', 'pending', 'processing', 'completed', 
        'failed', 'cancelled', 'refunded', 'partially_refunded'
    )),
    previous_state TEXT,
    gateway_transaction_id TEXT,
    gateway_response JSONB,
    idempotency_key UUID UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDER PROMOTIONS AND ADJUSTMENTS
-- Better structure for discounts and adjustments
CREATE TABLE IF NOT EXISTS public.order_promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    promotion_type TEXT NOT NULL CHECK (promotion_type IN (
        'coupon', 'discount', 'cashback', 'loyalty_points', 'referral'
    )),
    promotion_code TEXT,
    promotion_name TEXT NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'buy_x_get_y')),
    discount_value DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    applied_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DELIVERY SCHEDULING
-- Proper delivery slot management
CREATE TABLE IF NOT EXISTS public.delivery_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id UUID REFERENCES public.service_zones(id),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER DEFAULT 50,
    booked_count INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(zone_id, slot_date, start_time, end_time),
    CHECK (end_time > start_time),
    CHECK (booked_count <= capacity)
);

-- 5. ORDER DELIVERY DETAILS
-- Enhanced delivery information
CREATE TABLE IF NOT EXISTS public.order_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    delivery_slot_id UUID REFERENCES public.delivery_slots(id),
    delivery_type TEXT DEFAULT 'standard' CHECK (delivery_type IN (
        'standard', 'express', 'same_day', 'scheduled', 'pickup'
    )),
    estimated_delivery TIMESTAMPTZ,
    actual_delivery TIMESTAMPTZ,
    delivery_instructions TEXT,
    contact_phone TEXT,
    delivery_charge DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(order_id)
);

-- 6. INDEXES FOR ORDER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_order_workflows_order_status 
ON public.order_workflows (order_id, transitioned_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_workflows_status_date 
ON public.order_workflows (status, transitioned_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment 
ON public.payment_transactions (payment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_state 
ON public.payment_transactions (state, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_idempotency 
ON public.payment_transactions (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_promotions_order 
ON public.order_promotions (order_id, promotion_type);

CREATE INDEX IF NOT EXISTS idx_delivery_slots_zone_date 
ON public.delivery_slots (zone_id, slot_date, is_available);

CREATE INDEX IF NOT EXISTS idx_order_deliveries_slot 
ON public.order_deliveries (delivery_slot_id, estimated_delivery);

-- 7. RLS POLICIES
ALTER TABLE public.order_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;

-- Users can view their order workflows
CREATE POLICY "user_view_order_workflows" ON public.order_workflows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = order_id AND o.user_id = auth.uid()
        )
    );

-- Admin can manage all workflows
CREATE POLICY "admin_manage_order_workflows" ON public.order_workflows
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Similar policies for other tables
CREATE POLICY "admin_manage_payment_transactions" ON public.payment_transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "user_view_order_promotions" ON public.order_promotions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = order_id AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "public_view_delivery_slots" ON public.delivery_slots
    FOR SELECT USING (is_available = true);

CREATE POLICY "admin_manage_delivery_slots" ON public.delivery_slots
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 8. ORDER MANAGEMENT FUNCTIONS
-- Function to transition order status
CREATE OR REPLACE FUNCTION transition_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    current_status TEXT;
    workflow_id UUID;
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM public.orders
    WHERE id = p_order_id;
    
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;
    
    -- Update order status
    UPDATE public.orders
    SET status = p_new_status, updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Insert workflow record
    INSERT INTO public.order_workflows (
        order_id, status, previous_status, transition_reason, 
        transition_metadata, transitioned_by
    )
    VALUES (
        p_order_id, p_new_status, current_status, p_reason, 
        p_metadata, auth.uid()
    )
    RETURNING id INTO workflow_id;
    
    RETURN workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process payment
CREATE OR REPLACE FUNCTION process_payment_transaction(
    p_payment_id UUID,
    p_new_state TEXT,
    p_gateway_transaction_id TEXT DEFAULT NULL,
    p_gateway_response JSONB DEFAULT '{}',
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    current_state TEXT;
    payment_amount DECIMAL(10,2);
    transaction_id UUID;
BEGIN
    -- Get current payment state and amount
    SELECT 
        COALESCE(
            (SELECT state FROM public.payment_transactions 
             WHERE payment_id = p_payment_id 
             ORDER BY created_at DESC LIMIT 1), 
            'initialized'
        ),
        amount
    INTO current_state, payment_amount
    FROM public.payments
    WHERE id = p_payment_id;
    
    IF payment_amount IS NULL THEN
        RAISE EXCEPTION 'Payment not found: %', p_payment_id;
    END IF;
    
    -- Insert transaction record
    INSERT INTO public.payment_transactions (
        payment_id, state, previous_state, gateway_transaction_id,
        gateway_response, amount, failure_reason
    )
    VALUES (
        p_payment_id, p_new_state, current_state, p_gateway_transaction_id,
        p_gateway_response, payment_amount, p_failure_reason
    )
    RETURNING id INTO transaction_id;
    
    -- Update payment status
    UPDATE public.payments
    SET status = p_new_state::payment_status, updated_at = NOW()
    WHERE id = p_payment_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 9. UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_order_canonical_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_order_canonical_updated_at();

-- Verification
SELECT 
    'Canonical order system ready!' as status,
    (SELECT COUNT(*) FROM public.order_workflows) as workflow_records,
    (SELECT COUNT(*) FROM public.payment_transactions) as payment_transactions;

COMMENT ON TABLE public.order_workflows IS 'Complete order state transition tracking';
COMMENT ON TABLE public.payment_transactions IS 'Payment state machine with idempotency';
COMMENT ON TABLE public.order_promotions IS 'Order-level promotions and discounts';
COMMENT ON TABLE public.delivery_slots IS 'Delivery time slot management';
COMMENT ON TABLE public.order_deliveries IS 'Enhanced delivery information';

