-- Migration: Service Area Product Mapping System
-- Description: Enable location-based product availability management
-- Date: 2025-01-19

-- =====================================================
-- 1. Create service_area_products table (many-to-many relationship)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_area_products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_area_id uuid NOT NULL REFERENCES public.serviceable_areas(id) ON DELETE CASCADE,
    offering_id uuid NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
    
    -- Product-specific overrides for this location
    is_available boolean DEFAULT true,
    stock_quantity integer DEFAULT NULL, -- Location-specific stock (NULL = inherit from main inventory)
    price_override numeric(10,2) DEFAULT NULL, -- Location-specific pricing
    delivery_time_override integer DEFAULT NULL, -- Override delivery time for this product in this location
    priority_order integer DEFAULT 0, -- Display order for this product in this location
    
    -- Location-specific product metadata
    location_notes text, -- Special notes for this product in this location
    min_order_quantity integer DEFAULT 1,
    max_order_quantity integer DEFAULT NULL,
    is_featured boolean DEFAULT false, -- Feature this product in this location
    
    -- Scheduling
    available_from timestamp with time zone DEFAULT NULL,
    available_until timestamp with time zone DEFAULT NULL,
    
    -- Audit fields
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Ensure unique product per service area
    UNIQUE(service_area_id, offering_id)
);

-- Add indexes for performance
CREATE INDEX idx_service_area_products_service_area ON public.service_area_products(service_area_id);
CREATE INDEX idx_service_area_products_offering ON public.service_area_products(offering_id);
CREATE INDEX idx_service_area_products_available ON public.service_area_products(is_available) WHERE is_available = true;
CREATE INDEX idx_service_area_products_featured ON public.service_area_products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_service_area_products_scheduling ON public.service_area_products(available_from, available_until);

-- Add comment
COMMENT ON TABLE public.service_area_products IS 'Maps products to specific service areas with location-specific settings and availability';

-- =====================================================
-- 2. Create service_area_categories table (enable category-level availability)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_area_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_area_id uuid NOT NULL REFERENCES public.serviceable_areas(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    
    -- Category availability in this location
    is_available boolean DEFAULT true,
    display_order integer DEFAULT 0,
    
    -- Auto-include products
    auto_include_new_products boolean DEFAULT true, -- Automatically include new products from this category
    
    -- Audit fields
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure unique category per service area
    UNIQUE(service_area_id, category_id)
);

-- Add indexes
CREATE INDEX idx_service_area_categories_service_area ON public.service_area_categories(service_area_id);
CREATE INDEX idx_service_area_categories_category ON public.service_area_categories(category_id);

-- Add comment
COMMENT ON TABLE public.service_area_categories IS 'Enables category-level product availability in service areas';

-- =====================================================
-- 3. Create function to get products available in a service area
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_products_by_service_area(
    p_service_area_id uuid,
    p_service_type text DEFAULT NULL,
    p_category_id uuid DEFAULT NULL,
    p_search_term text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    offering_id uuid,
    offering_name text,
    offering_type offering_type,
    base_price numeric,
    location_price numeric,
    location_stock integer,
    is_available boolean,
    is_featured boolean,
    category_name text,
    service_type text,
    primary_image_url text,
    delivery_time_hours integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        o.id as offering_id,
        o.name as offering_name,
        o.type as offering_type,
        o.base_price,
        COALESCE(sap.price_override, o.base_price) as location_price,
        sap.stock_quantity as location_stock,
        COALESCE(sap.is_available, true) as is_available,
        COALESCE(sap.is_featured, false) as is_featured,
        c.name as category_name,
        c.service_type,
        o.primary_image_url,
        COALESCE(sap.delivery_time_override, sa.delivery_time_hours) as delivery_time_hours
    FROM 
        public.offerings o
    INNER JOIN 
        public.service_area_products sap ON o.id = sap.offering_id
    INNER JOIN 
        public.serviceable_areas sa ON sa.id = sap.service_area_id
    LEFT JOIN 
        public.categories c ON o.category_id = c.id
    WHERE 
        sap.service_area_id = p_service_area_id
        AND sap.is_available = true
        AND o.is_active = true
        AND o.status = 'active'
        AND (p_service_type IS NULL OR c.service_type = p_service_type)
        AND (p_category_id IS NULL OR o.category_id = p_category_id)
        AND (p_search_term IS NULL OR o.name ILIKE '%' || p_search_term || '%')
        -- Check scheduling
        AND (sap.available_from IS NULL OR sap.available_from <= now())
        AND (sap.available_until IS NULL OR sap.available_until >= now())
    ORDER BY 
        sap.is_featured DESC,
        sap.priority_order ASC,
        o.name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment
COMMENT ON FUNCTION public.get_products_by_service_area IS 'Retrieves all available products for a specific service area with location-specific overrides';

-- =====================================================
-- 4. Create function to bulk assign products to service area
-- =====================================================
CREATE OR REPLACE FUNCTION public.bulk_assign_products_to_service_area(
    p_service_area_id uuid,
    p_offering_ids uuid[],
    p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    success boolean,
    inserted_count integer,
    skipped_count integer,
    message text
) AS $$
DECLARE
    v_inserted_count integer := 0;
    v_skipped_count integer := 0;
    v_offering_id uuid;
BEGIN
    -- Loop through offering IDs
    FOREACH v_offering_id IN ARRAY p_offering_ids
    LOOP
        -- Try to insert, skip if already exists
        INSERT INTO public.service_area_products (
            service_area_id,
            offering_id,
            created_by,
            updated_by
        )
        VALUES (
            p_service_area_id,
            v_offering_id,
            p_user_id,
            p_user_id
        )
        ON CONFLICT (service_area_id, offering_id) DO NOTHING;
        
        -- Check if insert was successful
        IF FOUND THEN
            v_inserted_count := v_inserted_count + 1;
        ELSE
            v_skipped_count := v_skipped_count + 1;
        END IF;
    END LOOP;
    
    -- Return result
    RETURN QUERY SELECT 
        true as success,
        v_inserted_count,
        v_skipped_count,
        format('Successfully assigned %s products, skipped %s duplicates', v_inserted_count, v_skipped_count) as message;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION public.bulk_assign_products_to_service_area IS 'Bulk assigns multiple products to a service area';

-- =====================================================
-- 5. Create function to check product availability by pincode
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_product_available_in_pincode(
    p_offering_id uuid,
    p_pincode text
)
RETURNS boolean AS $$
DECLARE
    v_is_available boolean := false;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.service_area_products sap
        INNER JOIN public.serviceable_areas sa ON sa.id = sap.service_area_id
        WHERE 
            sap.offering_id = p_offering_id
            AND sa.pincode = p_pincode
            AND sa.is_serviceable = true
            AND sap.is_available = true
            AND (sap.available_from IS NULL OR sap.available_from <= now())
            AND (sap.available_until IS NULL OR sap.available_until >= now())
    ) INTO v_is_available;
    
    RETURN v_is_available;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment
COMMENT ON FUNCTION public.is_product_available_in_pincode IS 'Checks if a product is available in a specific pincode';

-- =====================================================
-- 6. Create trigger to update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_service_area_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_area_products_updated_at
    BEFORE UPDATE ON public.service_area_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_service_area_products_updated_at();

-- =====================================================
-- 7. Create view for service area product summary
-- =====================================================
CREATE OR REPLACE VIEW public.service_area_product_summary AS
SELECT 
    sa.id as service_area_id,
    sa.pincode,
    sa.city,
    sa.state,
    COUNT(DISTINCT sap.offering_id) as total_products,
    COUNT(DISTINCT sap.offering_id) FILTER (WHERE sap.is_available = true) as available_products,
    COUNT(DISTINCT sap.offering_id) FILTER (WHERE sap.is_featured = true) as featured_products,
    COUNT(DISTINCT o.category_id) as total_categories,
    sa.is_serviceable,
    sa.service_types
FROM 
    public.serviceable_areas sa
LEFT JOIN 
    public.service_area_products sap ON sa.id = sap.service_area_id
LEFT JOIN 
    public.offerings o ON sap.offering_id = o.id
GROUP BY 
    sa.id, sa.pincode, sa.city, sa.state, sa.is_serviceable, sa.service_types;

-- Add comment
COMMENT ON VIEW public.service_area_product_summary IS 'Summary view of products per service area';

-- =====================================================
-- 8. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.service_area_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_area_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to service area products" ON public.service_area_products;
DROP POLICY IF EXISTS "Allow authenticated users to manage service area products" ON public.service_area_products;
DROP POLICY IF EXISTS "Allow public read access to service area categories" ON public.service_area_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage service area categories" ON public.service_area_categories;

-- RLS Policies for service_area_products
CREATE POLICY "Allow public read access to service area products"
    ON public.service_area_products
    FOR SELECT
    TO public
    USING (is_available = true);

CREATE POLICY "Allow authenticated users to manage service area products"
    ON public.service_area_products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for service_area_categories  
CREATE POLICY "Allow public read access to service area categories"
    ON public.service_area_categories
    FOR SELECT
    TO public
    USING (is_available = true);

CREATE POLICY "Allow authenticated users to manage service area categories"
    ON public.service_area_categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 9. Grant permissions
-- =====================================================
GRANT SELECT ON public.service_area_products TO anon, authenticated;
GRANT ALL ON public.service_area_products TO authenticated;
GRANT SELECT ON public.service_area_categories TO anon, authenticated;
GRANT ALL ON public.service_area_categories TO authenticated;
GRANT SELECT ON public.service_area_product_summary TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_products_by_service_area TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_assign_products_to_service_area TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_product_available_in_pincode TO anon, authenticated;

-- =====================================================
-- Done!
-- =====================================================
-- This migration creates a comprehensive location-based product availability system
-- that allows admins to assign products to specific service areas with granular control
-- over pricing, stock, availability, and display settings per location.

