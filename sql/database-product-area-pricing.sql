-- Product Area Pricing Schema
-- This table links products to specific service areas with area-specific pricing and availability

-- Create product_area_pricing table
CREATE TABLE IF NOT EXISTS public.product_area_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    service_area_id UUID NOT NULL REFERENCES public.serviceable_areas(id) ON DELETE CASCADE,
    
    -- Area-specific pricing
    area_price DECIMAL(10,2) NOT NULL, -- Price for this specific area
    area_original_price DECIMAL(10,2), -- Original price (for discounts)
    area_discount_percentage INTEGER DEFAULT 0, -- Area-specific discount
    
    -- Area-specific availability
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0, -- Area-specific stock
    max_order_quantity INTEGER DEFAULT 100, -- Max quantity per order in this area
    
    -- Area-specific delivery and logistics
    estimated_delivery_hours INTEGER, -- Override global delivery time
    delivery_charge DECIMAL(8,2), -- Override global delivery charge
    handling_charge DECIMAL(8,2) DEFAULT 0, -- Area-specific handling charges
    
    -- Special pricing tiers (for bulk orders)
    tier_pricing JSONB, -- JSON: {"tier1": {"min_qty": 5, "price": 95}, "tier2": {"min_qty": 10, "price": 90}}
    
    -- Time-based pricing (optional)
    peak_hour_multiplier DECIMAL(3,2) DEFAULT 1.0, -- 1.2 = 20% increase during peak hours
    off_peak_discount DECIMAL(3,2) DEFAULT 0.0, -- 0.1 = 10% discount during off-peak
    
    -- Seasonal/promotional pricing
    promotional_price DECIMAL(10,2), -- Special promotional price
    promo_start_date TIMESTAMP WITH TIME ZONE,
    promo_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1, -- Higher priority products shown first in area
    notes TEXT, -- Area-specific notes (e.g., "Limited stock", "New in this area")
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    
    -- Constraints
    UNIQUE(product_id, service_area_id), -- One pricing record per product per area
    CHECK (area_price > 0),
    CHECK (area_discount_percentage >= 0 AND area_discount_percentage <= 100),
    CHECK (stock_quantity >= 0),
    CHECK (max_order_quantity > 0),
    CHECK (estimated_delivery_hours >= 0),
    CHECK (delivery_charge >= 0),
    CHECK (handling_charge >= 0),
    CHECK (peak_hour_multiplier > 0),
    CHECK (off_peak_discount >= 0 AND off_peak_discount <= 1),
    CHECK (priority > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_area_pricing_product_id ON public.product_area_pricing(product_id);
CREATE INDEX IF NOT EXISTS idx_product_area_pricing_service_area_id ON public.product_area_pricing(service_area_id);
CREATE INDEX IF NOT EXISTS idx_product_area_pricing_active ON public.product_area_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_product_area_pricing_available ON public.product_area_pricing(is_available);
CREATE INDEX IF NOT EXISTS idx_product_area_pricing_promo ON public.product_area_pricing(promotional_price, promo_start_date, promo_end_date);
CREATE INDEX IF NOT EXISTS idx_product_area_pricing_priority ON public.product_area_pricing(priority DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_product_area_active_available ON public.product_area_pricing(product_id, service_area_id, is_active, is_available);

-- Enable RLS
ALTER TABLE public.product_area_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active product area pricing" ON public.product_area_pricing
    FOR SELECT USING (is_active = true AND is_available = true);

CREATE POLICY "Admin can manage product area pricing" ON public.product_area_pricing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Update trigger
CREATE TRIGGER update_product_area_pricing_updated_at
    BEFORE UPDATE ON public.product_area_pricing
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get effective price for a product in an area
CREATE OR REPLACE FUNCTION get_effective_product_price(
    p_product_id UUID,
    p_service_area_id UUID,
    p_quantity INTEGER DEFAULT 1,
    p_check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    effective_price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    total_price DECIMAL(10,2),
    delivery_charge DECIMAL(8,2),
    handling_charge DECIMAL(8,2),
    is_promotional BOOLEAN,
    pricing_tier TEXT
) AS $$
DECLARE
    area_pricing RECORD;
    base_price DECIMAL(10,2);
    final_price DECIMAL(10,2);
    tier_price DECIMAL(10,2);
    is_promo BOOLEAN := false;
BEGIN
    -- Get area-specific pricing
    SELECT * INTO area_pricing
    FROM public.product_area_pricing
    WHERE product_id = p_product_id 
    AND service_area_id = p_service_area_id
    AND is_active = true 
    AND is_available = true;
    
    IF NOT FOUND THEN
        -- Fallback to base product price
        SELECT price INTO base_price
        FROM public.products
        WHERE id = p_product_id AND is_active = true;
        
        IF NOT FOUND THEN
            RETURN; -- Product not found or inactive
        END IF;
        
        RETURN QUERY SELECT 
            base_price,
            base_price,
            0::DECIMAL(10,2),
            base_price * p_quantity,
            0::DECIMAL(8,2),
            0::DECIMAL(8,2),
            false,
            'base'::TEXT;
        RETURN;
    END IF;
    
    -- Check for promotional pricing
    IF area_pricing.promotional_price IS NOT NULL 
       AND p_check_time >= area_pricing.promo_start_date 
       AND p_check_time <= area_pricing.promo_end_date THEN
        final_price := area_pricing.promotional_price;
        is_promo := true;
    ELSE
        final_price := area_pricing.area_price;
    END IF;
    
    -- Check for tier pricing
    tier_price := final_price;
    IF area_pricing.tier_pricing IS NOT NULL THEN
        -- Simple tier pricing logic (can be enhanced)
        IF p_quantity >= 10 AND area_pricing.tier_pricing->>'tier2' IS NOT NULL THEN
            tier_price := (area_pricing.tier_pricing->'tier2'->>'price')::DECIMAL(10,2);
        ELSIF p_quantity >= 5 AND area_pricing.tier_pricing->>'tier1' IS NOT NULL THEN
            tier_price := (area_pricing.tier_pricing->'tier1'->>'price')::DECIMAL(10,2);
        END IF;
    END IF;
    
    -- Apply discount if any
    IF area_pricing.area_discount_percentage > 0 THEN
        tier_price := tier_price * (1 - area_pricing.area_discount_percentage::DECIMAL / 100);
    END IF;
    
    RETURN QUERY SELECT 
        tier_price,
        COALESCE(area_pricing.area_original_price, area_pricing.area_price),
        COALESCE(area_pricing.area_original_price, area_pricing.area_price) - tier_price,
        tier_price * p_quantity,
        COALESCE(area_pricing.delivery_charge, 0::DECIMAL(8,2)),
        COALESCE(area_pricing.handling_charge, 0::DECIMAL(8,2)),
        is_promo,
        CASE 
            WHEN tier_price < final_price THEN 'tier'
            WHEN is_promo THEN 'promotional'
            ELSE 'regular'
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get available products for an area
CREATE OR REPLACE FUNCTION get_area_products(
    p_service_area_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    base_price DECIMAL(10,2),
    area_price DECIMAL(10,2),
    stock_quantity INTEGER,
    is_available BOOLEAN,
    category_name TEXT,
    brand TEXT,
    discount_percentage INTEGER,
    estimated_delivery_hours INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.price,
        pap.area_price,
        pap.stock_quantity,
        pap.is_available,
        c.name as category_name,
        p.brand,
        pap.area_discount_percentage,
        pap.estimated_delivery_hours
    FROM public.products p
    JOIN public.product_area_pricing pap ON p.id = pap.product_id
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE pap.service_area_id = p_service_area_id
    AND pap.is_active = true
    AND pap.is_available = true
    AND p.is_active = true
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    ORDER BY pap.priority DESC, p.name
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO public.product_area_pricing (product_id, service_area_id, area_price, area_original_price, stock_quantity, estimated_delivery_hours, delivery_charge)
SELECT 
    p.id,
    sa.id,
    p.price + (RANDOM() * 50 - 25), -- Random price variation ±25
    p.price,
    (RANDOM() * 100)::INTEGER, -- Random stock 0-100
    sa.delivery_time_hours,
    sa.delivery_charge
FROM public.products p
CROSS JOIN public.serviceable_areas sa
WHERE p.is_active = true AND sa.is_serviceable = true
LIMIT 100; -- Limit to avoid too much test data

COMMENT ON TABLE public.product_area_pricing IS 'Stores area-specific pricing, availability, and logistics information for products';
COMMENT ON FUNCTION get_effective_product_price IS 'Calculates the effective price for a product in a specific area considering all pricing rules';
COMMENT ON FUNCTION get_area_products IS 'Returns available products for a specific service area with area-specific pricing';
