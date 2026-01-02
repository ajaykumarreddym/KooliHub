-- ========================================
-- CUSTOM FIELDS MANAGEMENT MIGRATION
-- Complete database setup for dynamic custom fields
-- ========================================

-- 1. ENSURE SERVICE FIELD DEFINITIONS TABLE EXISTS
-- This table stores the field definitions for each service type
CREATE TABLE IF NOT EXISTS public.service_field_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type_id TEXT REFERENCES public.service_types(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN (
        'text', 'number', 'boolean', 'select', 'multiselect', 
        'date', 'datetime', 'url', 'email', 'tel', 'textarea'
    )),
    field_group TEXT DEFAULT 'basic',
    validation_rules JSONB DEFAULT '{}',
    field_options JSONB, -- For select/multiselect fields
    default_value TEXT,
    is_required BOOLEAN DEFAULT false,
    is_searchable BOOLEAN DEFAULT false,
    is_filterable BOOLEAN DEFAULT false,
    is_translatable BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    help_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(service_type_id, field_name)
);

-- 2. ENSURE PRODUCT SERVICE ATTRIBUTES TABLE EXISTS
-- This table stores the actual values for custom fields
CREATE TABLE IF NOT EXISTS public.product_service_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    field_definition_id UUID REFERENCES public.service_field_definitions(id) ON DELETE CASCADE,
    value_text TEXT,
    value_number DECIMAL,
    value_boolean BOOLEAN,
    value_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, field_definition_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_service_field_definitions_service 
ON public.service_field_definitions (service_type_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_service_field_definitions_searchable 
ON public.service_field_definitions (service_type_id, is_searchable) 
WHERE is_searchable = true;

CREATE INDEX IF NOT EXISTS idx_service_field_definitions_filterable 
ON public.service_field_definitions (service_type_id, is_filterable) 
WHERE is_filterable = true;

CREATE INDEX IF NOT EXISTS idx_product_service_attributes_product 
ON public.product_service_attributes (product_id, field_definition_id);

CREATE INDEX IF NOT EXISTS idx_product_service_attributes_field 
ON public.product_service_attributes (field_definition_id, value_text);

CREATE INDEX IF NOT EXISTS idx_product_service_attributes_number 
ON public.product_service_attributes (field_definition_id, value_number) 
WHERE value_number IS NOT NULL;

-- GIN index for JSON values
CREATE INDEX IF NOT EXISTS idx_product_service_attributes_json 
ON public.product_service_attributes USING gin(value_json) 
WHERE value_json IS NOT NULL;

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.service_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_service_attributes ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
-- Public can read field definitions
CREATE POLICY "read_service_field_definitions" ON public.service_field_definitions
    FOR SELECT USING (true);

-- Admin can manage field definitions
CREATE POLICY "admin_manage_service_field_definitions" ON public.service_field_definitions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Public can read product attributes
CREATE POLICY "read_product_service_attributes" ON public.product_service_attributes
    FOR SELECT USING (true);

-- Admin can manage all attributes
CREATE POLICY "admin_manage_product_service_attributes" ON public.product_service_attributes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Vendors can manage their product attributes
CREATE POLICY "vendor_manage_product_attributes" ON public.product_service_attributes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.vendor_users vu ON vu.vendor_id = p.vendor_id
            WHERE p.id = product_id 
            AND vu.user_id = auth.uid()
            AND vu.is_active = true
        )
    );

-- 6. CREATE HELPER FUNCTIONS
-- Function to set/update product service attribute
CREATE OR REPLACE FUNCTION public.set_product_service_attribute(
    p_product_id UUID,
    p_service_type_id TEXT,
    p_field_name TEXT,
    p_value TEXT
) RETURNS UUID AS $$
DECLARE
    field_def_id UUID;
    field_type TEXT;
    attr_id UUID;
BEGIN
    -- Get field definition
    SELECT id, field_type INTO field_def_id, field_type
    FROM public.service_field_definitions
    WHERE service_type_id = p_service_type_id AND field_name = p_field_name;
    
    IF field_def_id IS NULL THEN
        RAISE EXCEPTION 'Field definition not found: %', p_field_name;
    END IF;
    
    -- Insert or update attribute
    INSERT INTO public.product_service_attributes (
        product_id, field_definition_id, 
        value_text, value_number, value_boolean, value_json
    )
    VALUES (
        p_product_id, field_def_id,
        CASE WHEN field_type NOT IN ('number', 'boolean') THEN p_value END,
        CASE WHEN field_type = 'number' THEN p_value::DECIMAL END,
        CASE WHEN field_type = 'boolean' THEN p_value::BOOLEAN END,
        CASE WHEN field_type IN ('select', 'multiselect') THEN p_value::JSONB END
    )
    ON CONFLICT (product_id, field_definition_id)
    DO UPDATE SET
        value_text = CASE WHEN field_type NOT IN ('number', 'boolean') THEN EXCLUDED.value_text END,
        value_number = CASE WHEN field_type = 'number' THEN EXCLUDED.value_number END,
        value_boolean = CASE WHEN field_type = 'boolean' THEN EXCLUDED.value_boolean END,
        value_json = CASE WHEN field_type IN ('select', 'multiselect') THEN EXCLUDED.value_json END,
        updated_at = NOW()
    RETURNING id INTO attr_id;
    
    RETURN attr_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get product service attributes
CREATE OR REPLACE FUNCTION public.get_product_service_attributes(
    p_product_id UUID
) RETURNS TABLE (
    field_name TEXT,
    field_label TEXT,
    field_type TEXT,
    value_text TEXT,
    value_number DECIMAL,
    value_boolean BOOLEAN,
    value_json JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sfd.field_name,
        sfd.field_label,
        sfd.field_type,
        psa.value_text,
        psa.value_number,
        psa.value_boolean,
        psa.value_json
    FROM public.product_service_attributes psa
    JOIN public.service_field_definitions sfd ON sfd.id = psa.field_definition_id
    WHERE psa.product_id = p_product_id
    ORDER BY sfd.sort_order;
END;
$$ LANGUAGE plpgsql;

-- 7. POPULATE DEFAULT FIELD DEFINITIONS
-- Insert common field definitions for existing service types
INSERT INTO public.service_field_definitions (
    service_type_id, field_name, field_label, field_type, field_group,
    validation_rules, field_options, is_required, is_searchable, is_filterable, sort_order, help_text
) VALUES
-- Grocery fields
('grocery', 'unit', 'Unit of Measurement', 'select', 'basic', 
 '{"required": true}', '[{"label": "kg", "value": "kg"}, {"label": "gram", "value": "gram"}, {"label": "piece", "value": "piece"}, {"label": "liter", "value": "liter"}, {"label": "ml", "value": "ml"}, {"label": "packet", "value": "packet"}, {"label": "box", "value": "box"}]', true, true, true, 1, 'Select the unit of measurement'),
('grocery', 'is_organic', 'Organic Product', 'boolean', 'specifications', '{}', null, false, false, true, 2, 'Is this an organic product?'),
('grocery', 'is_fresh', 'Fresh Product', 'boolean', 'specifications', '{}', null, false, false, true, 3, 'Is this a fresh product?'),
('grocery', 'discount_percentage', 'Discount Percentage', 'number', 'pricing', '{"min": 0, "max": 100}', null, false, false, true, 4, 'Discount percentage (0-100)'),

-- Car rental fields
('car-rental', 'year', 'Manufacturing Year', 'number', 'specifications', 
 '{"min": 1990, "max": 2030}', null, false, true, true, 1, 'Year of manufacture'),
('car-rental', 'transmission', 'Transmission', 'select', 'specifications', '{}', 
 '[{"label": "Manual", "value": "manual"}, {"label": "Automatic", "value": "automatic"}, {"label": "CVT", "value": "cvt"}]', false, true, true, 2, 'Transmission type'),
('car-rental', 'fuel_type', 'Fuel Type', 'select', 'specifications', '{}', 
 '[{"label": "Petrol", "value": "petrol"}, {"label": "Diesel", "value": "diesel"}, {"label": "CNG", "value": "cng"}, {"label": "Electric", "value": "electric"}, {"label": "Hybrid", "value": "hybrid"}]', false, true, true, 3, 'Type of fuel'),
('car-rental', 'seats', 'Seating Capacity', 'number', 'specifications', 
 '{"min": 2, "max": 50}', null, false, true, true, 4, 'Number of seats'),
('car-rental', 'vehicle_category', 'Vehicle Category', 'select', 'basic', '{}', 
 '[{"label": "Economy", "value": "economy"}, {"label": "Premium", "value": "premium"}, {"label": "Luxury", "value": "luxury"}, {"label": "SUV", "value": "suv"}, {"label": "Sedan", "value": "sedan"}, {"label": "Hatchback", "value": "hatchback"}]', false, true, true, 5, 'Category of vehicle'),

-- Electronics fields
('electronics', 'warranty', 'Warranty Information', 'text', 'specifications', '{}', null, false, true, false, 1, 'Warranty details'),
('electronics', 'model_number', 'Model Number', 'text', 'specifications', '{}', null, false, true, false, 2, 'Product model number'),
('electronics', 'color_options', 'Available Colors', 'text', 'specifications', '{}', null, false, false, true, 3, 'Available colors (comma-separated)'),
('electronics', 'has_installation', 'Installation Service', 'boolean', 'services', '{}', null, false, false, true, 4, 'Does this include installation service?'),

-- Fashion fields
('fashion', 'size', 'Size', 'select', 'basic', '{"required": true}', 
 '[{"label": "XS", "value": "xs"}, {"label": "S", "value": "s"}, {"label": "M", "value": "m"}, {"label": "L", "value": "l"}, {"label": "XL", "value": "xl"}, {"label": "XXL", "value": "xxl"}, {"label": "XXXL", "value": "xxxl"}, {"label": "One Size", "value": "one-size"}]', true, true, true, 1, 'Select the available size'),
('fashion', 'color', 'Color', 'text', 'basic', '{"required": true}', null, true, true, true, 2, 'Enter available colors (comma-separated)'),
('fashion', 'material', 'Material', 'select', 'details', '{}', 
 '[{"label": "Cotton", "value": "cotton"}, {"label": "Silk", "value": "silk"}, {"label": "Polyester", "value": "polyester"}, {"label": "Wool", "value": "wool"}, {"label": "Linen", "value": "linen"}, {"label": "Denim", "value": "denim"}, {"label": "Leather", "value": "leather"}, {"label": "Chiffon", "value": "chiffon"}, {"label": "Georgette", "value": "georgette"}, {"label": "Satin", "value": "satin"}, {"label": "Velvet", "value": "velvet"}, {"label": "Net", "value": "net"}, {"label": "Organza", "value": "organza"}, {"label": "Mixed Material", "value": "mixed"}]', false, true, true, 3, 'Select the primary material'),
('fashion', 'pattern', 'Pattern', 'select', 'details', '{}', 
 '[{"label": "Solid", "value": "solid"}, {"label": "Striped", "value": "striped"}, {"label": "Printed", "value": "printed"}, {"label": "Floral", "value": "floral"}, {"label": "Geometric", "value": "geometric"}, {"label": "Polka Dot", "value": "polka-dot"}, {"label": "Checkered", "value": "checkered"}, {"label": "Embroidered", "value": "embroidered"}, {"label": "Abstract", "value": "abstract"}, {"label": "Ethnic", "value": "ethnic"}, {"label": "Plain", "value": "plain"}]', false, true, true, 4, 'Select the pattern type'),
('fashion', 'occasion', 'Occasion', 'select', 'details', '{}', 
 '[{"label": "Casual", "value": "casual"}, {"label": "Formal", "value": "formal"}, {"label": "Party", "value": "party"}, {"label": "Wedding", "value": "wedding"}, {"label": "Festive", "value": "festive"}, {"label": "Daily Wear", "value": "daily-wear"}, {"label": "Office", "value": "office"}, {"label": "Ethnic Wear", "value": "ethnic"}, {"label": "Sports/Gym", "value": "sports"}, {"label": "Beach/Resort", "value": "beach"}]', false, true, true, 5, 'Suitable occasion for wearing'),
('fashion', 'sleeve_type', 'Sleeve Type', 'select', 'details', '{}', 
 '[{"label": "Full Sleeve", "value": "full-sleeve"}, {"label": "Half Sleeve", "value": "half-sleeve"}, {"label": "Sleeveless", "value": "sleeveless"}, {"label": "3/4 Sleeve", "value": "3-4-sleeve"}, {"label": "Cap Sleeve", "value": "cap-sleeve"}, {"label": "Bell Sleeve", "value": "bell-sleeve"}, {"label": "Puff Sleeve", "value": "puff-sleeve"}]', false, true, true, 6, 'Type of sleeves'),
('fashion', 'neckline', 'Neckline', 'select', 'details', '{}', 
 '[{"label": "Round Neck", "value": "round-neck"}, {"label": "V-Neck", "value": "v-neck"}, {"label": "Scoop Neck", "value": "scoop-neck"}, {"label": "Boat Neck", "value": "boat-neck"}, {"label": "High Neck", "value": "high-neck"}, {"label": "Off Shoulder", "value": "off-shoulder"}, {"label": "One Shoulder", "value": "one-shoulder"}, {"label": "Halter Neck", "value": "halter-neck"}, {"label": "Collar", "value": "collar"}]', false, true, true, 7, 'Type of neckline'),
('fashion', 'fit_type', 'Fit Type', 'select', 'details', '{}', 
 '[{"label": "Slim Fit", "value": "slim-fit"}, {"label": "Regular Fit", "value": "regular-fit"}, {"label": "Loose Fit", "value": "loose-fit"}, {"label": "Oversized", "value": "oversized"}, {"label": "Bodycon", "value": "bodycon"}, {"label": "A-Line", "value": "a-line"}, {"label": "Straight", "value": "straight"}, {"label": "Flared", "value": "flared"}]', false, true, true, 8, 'How the garment fits'),
('fashion', 'care_instructions', 'Care Instructions', 'textarea', 'details', '{}', null, false, false, false, 9, 'Washing and care instructions'),
('fashion', 'is_customizable', 'Customizable', 'boolean', 'features', '{}', null, false, false, true, 10, 'Can this item be customized?'),
('fashion', 'has_size_chart', 'Has Size Chart', 'boolean', 'features', '{}', null, false, false, false, 11, 'Size chart available?'),

-- Trip fields
('trips', 'from_location', 'From Location', 'text', 'basic', '{"required": true}', null, true, true, true, 1, 'Starting location'),
('trips', 'to_location', 'To Location', 'text', 'basic', '{"required": true}', null, true, true, true, 2, 'Destination location'),
('trips', 'departure_time', 'Departure Time', 'text', 'basic', '{}', null, false, true, true, 3, 'Departure time'),
('trips', 'arrival_time', 'Arrival Time', 'text', 'basic', '{}', null, false, true, true, 4, 'Arrival time'),
('trips', 'duration', 'Duration', 'text', 'basic', '{}', null, false, true, true, 5, 'Trip duration'),
('trips', 'bus_type', 'Bus Type', 'select', 'specifications', '{}', 
 '[{"label": "AC", "value": "ac"}, {"label": "Non-AC", "value": "non-ac"}, {"label": "Sleeper", "value": "sleeper"}, {"label": "Semi-Sleeper", "value": "semi-sleeper"}, {"label": "Volvo", "value": "volvo"}]', false, true, true, 6, 'Type of bus'),
('trips', 'available_seats', 'Available Seats', 'number', 'basic', '{"min": 0}', null, false, true, true, 7, 'Number of available seats'),
('trips', 'operator', 'Operator', 'text', 'basic', '{}', null, false, true, true, 8, 'Bus operator name'),
('trips', 'amenities', 'Amenities', 'text', 'features', '{}', null, false, false, true, 9, 'Available amenities (comma-separated)'),

-- Handyman fields
('handyman', 'price_range', 'Price Range', 'select', 'pricing', '{}', 
 '[{"label": "Under ₹500", "value": "under-500"}, {"label": "₹500 - ₹1000", "value": "500-1000"}, {"label": "₹1000 - ₹2000", "value": "1000-2000"}, {"label": "₹2000 - ₹5000", "value": "2000-5000"}, {"label": "Over ₹5000", "value": "over-5000"}]', false, false, true, 1, 'Service price range'),
('handyman', 'service_category', 'Service Category', 'select', 'basic', '{}', 
 '[{"label": "Plumbing", "value": "plumbing"}, {"label": "Electrical", "value": "electrical"}, {"label": "Carpentry", "value": "carpentry"}, {"label": "Painting", "value": "painting"}, {"label": "Cleaning", "value": "cleaning"}, {"label": "Appliance Repair", "value": "appliance-repair"}, {"label": "Furniture Assembly", "value": "furniture-assembly"}, {"label": "Other", "value": "other"}]', false, true, true, 2, 'Type of handyman service'),
('handyman', 'urgency_levels', 'Urgency Levels', 'text', 'details', '{}', null, false, false, true, 3, 'Available urgency levels (comma-separated)'),
('handyman', 'includes_materials', 'Includes Materials', 'boolean', 'details', '{}', null, false, false, true, 4, 'Does this service include materials?'),
('handyman', 'warranty_period', 'Warranty Period', 'text', 'details', '{}', null, false, false, false, 5, 'Service warranty period'),

-- Home & Kitchen fields
('home-kitchen', 'material', 'Material', 'text', 'specifications', '{}', null, false, true, true, 1, 'Product material'),
('home-kitchen', 'dimensions', 'Dimensions', 'text', 'specifications', '{}', null, false, false, false, 2, 'Product dimensions'),
('home-kitchen', 'weight', 'Weight', 'text', 'specifications', '{}', null, false, false, false, 3, 'Product weight'),
('home-kitchen', 'care_instructions', 'Care Instructions', 'textarea', 'details', '{}', null, false, false, false, 4, 'Care and maintenance instructions'),
('home-kitchen', 'is_dishwasher_safe', 'Dishwasher Safe', 'boolean', 'features', '{}', null, false, false, true, 5, 'Is this dishwasher safe?'),
('home-kitchen', 'is_microwave_safe', 'Microwave Safe', 'boolean', 'features', '{}', null, false, false, true, 6, 'Is this microwave safe?')
ON CONFLICT (service_type_id, field_name) DO NOTHING;

-- 8. CREATE TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_field_definitions_updated_at
    BEFORE UPDATE ON public.service_field_definitions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_service_attributes_updated_at
    BEFORE UPDATE ON public.product_service_attributes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. GRANT PERMISSIONS
GRANT SELECT ON public.service_field_definitions TO authenticated;
GRANT SELECT ON public.product_service_attributes TO authenticated;
GRANT ALL ON public.service_field_definitions TO service_role;
GRANT ALL ON public.product_service_attributes TO service_role;

-- 10. CREATE VIEWS FOR EASY QUERYING
CREATE OR REPLACE VIEW public.product_custom_fields AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category_id,
    c.service_type,
    sfd.field_name,
    sfd.field_label,
    sfd.field_type,
    sfd.field_group,
    sfd.is_required,
    sfd.is_searchable,
    sfd.is_filterable,
    psa.value_text,
    psa.value_number,
    psa.value_boolean,
    psa.value_json
FROM public.products p
JOIN public.categories c ON c.id = p.category_id
JOIN public.service_field_definitions sfd ON sfd.service_type_id = c.service_type
LEFT JOIN public.product_service_attributes psa ON psa.product_id = p.id AND psa.field_definition_id = sfd.id
WHERE p.is_active = true
ORDER BY p.id, sfd.sort_order;

-- 11. CREATE SEARCH FUNCTION
CREATE OR REPLACE FUNCTION public.search_products_by_custom_fields(
    p_service_type TEXT,
    p_search_terms JSONB
) RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    match_score INTEGER
) AS $$
DECLARE
    search_term JSONB;
    field_name TEXT;
    field_value TEXT;
    score INTEGER;
BEGIN
    -- This function allows searching products by custom field values
    -- p_search_terms should be a JSONB object like: {"size": "M", "color": "red"}
    
    FOR search_term IN SELECT * FROM jsonb_each(p_search_terms)
    LOOP
        field_name := search_term.key;
        field_value := search_term.value::TEXT;
        
        RETURN QUERY
        SELECT 
            p.id as product_id,
            p.name as product_name,
            CASE 
                WHEN psa.value_text ILIKE '%' || field_value || '%' THEN 10
                WHEN psa.value_text = field_value THEN 20
                ELSE 0
            END as match_score
        FROM public.products p
        JOIN public.categories c ON c.id = p.category_id
        JOIN public.service_field_definitions sfd ON sfd.service_type_id = c.service_type
        JOIN public.product_service_attributes psa ON psa.product_id = p.id AND psa.field_definition_id = sfd.id
        WHERE c.service_type = p_service_type
        AND sfd.field_name = field_name
        AND sfd.is_searchable = true
        AND (
            psa.value_text ILIKE '%' || field_value || '%'
            OR psa.value_text = field_value
        )
        ORDER BY match_score DESC;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 12. CREATE ANALYTICS VIEW
CREATE OR REPLACE VIEW public.custom_fields_analytics AS
SELECT 
    sfd.service_type_id,
    st.title as service_type_name,
    COUNT(sfd.id) as total_fields,
    COUNT(CASE WHEN sfd.is_required THEN 1 END) as required_fields,
    COUNT(CASE WHEN sfd.is_searchable THEN 1 END) as searchable_fields,
    COUNT(CASE WHEN sfd.is_filterable THEN 1 END) as filterable_fields,
    COUNT(psa.id) as total_values,
    COUNT(DISTINCT psa.product_id) as products_with_values
FROM public.service_field_definitions sfd
JOIN public.service_types st ON st.id = sfd.service_type_id
LEFT JOIN public.product_service_attributes psa ON psa.field_definition_id = sfd.id
GROUP BY sfd.service_type_id, st.title
ORDER BY total_fields DESC;

-- 13. INSERT SAMPLE DATA (Optional - for testing)
-- This section can be uncommented to insert sample custom field values for testing

/*
-- Sample product with custom field values
INSERT INTO public.product_service_attributes (product_id, field_definition_id, value_text, value_number, value_boolean)
SELECT 
    p.id,
    sfd.id,
    CASE 
        WHEN sfd.field_type = 'text' THEN 'Sample Value'
        WHEN sfd.field_type = 'select' THEN 'sample-option'
        ELSE NULL
    END,
    CASE 
        WHEN sfd.field_type = 'number' THEN 100
        ELSE NULL
    END,
    CASE 
        WHEN sfd.field_type = 'boolean' THEN true
        ELSE NULL
    END
FROM public.products p
JOIN public.categories c ON c.id = p.category_id
JOIN public.service_field_definitions sfd ON sfd.service_type_id = c.service_type
WHERE p.is_active = true
LIMIT 10;
*/

-- 14. FINAL COMMENTS
COMMENT ON TABLE public.service_field_definitions IS 'Dynamic field definitions for different service types';
COMMENT ON TABLE public.product_service_attributes IS 'Actual values for custom fields on products';
COMMENT ON FUNCTION public.set_product_service_attribute IS 'Helper function to set product service attribute values';
COMMENT ON FUNCTION public.get_product_service_attributes IS 'Helper function to get all custom field values for a product';
COMMENT ON FUNCTION public.search_products_by_custom_fields IS 'Search products by custom field values';
COMMENT ON VIEW public.product_custom_fields IS 'View combining products with their custom field values';
COMMENT ON VIEW public.custom_fields_analytics IS 'Analytics view for custom fields usage';

-- Migration completed successfully!
-- The custom fields management system is now ready to use.
