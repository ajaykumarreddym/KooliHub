-- ========================================
-- PART 4: DYNAMIC SERVICE ATTRIBUTE SYSTEM
-- Replace service-specific columns with configurable attributes
-- ========================================

-- 1. SERVICE FIELD DEFINITIONS
-- Dynamic field definitions per service type
CREATE TABLE IF NOT EXISTS public.service_field_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type_id TEXT REFERENCES public.service_types(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN (
        'text', 'number', 'boolean', 'select', 'multiselect', 
        'date', 'datetime', 'url', 'email', 'tel', 'textarea'
    )),
    field_group TEXT, -- 'basic', 'pricing', 'specifications', 'location'
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

-- 2. PRODUCT SERVICE ATTRIBUTES
-- Actual attribute values for products
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

-- 3. INDEXES FOR ATTRIBUTE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_service_field_definitions_service 
ON public.service_field_definitions (service_type_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_service_field_definitions_searchable 
ON public.service_field_definitions (service_type_id, is_searchable) 
WHERE is_searchable = true;

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

-- 4. RLS POLICIES
ALTER TABLE public.service_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_service_attributes ENABLE ROW LEVEL SECURITY;

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
            JOIN public.profiles pr ON pr.id = vu.user_id
            WHERE p.id = product_id AND pr.id = auth.uid()
        )
    );

-- 5. HELPER FUNCTIONS
-- Function to get product attributes as JSON
CREATE OR REPLACE FUNCTION get_product_attributes(p_product_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    attr RECORD;
BEGIN
    FOR attr IN
        SELECT 
            sfd.field_name,
            sfd.field_type,
            CASE 
                WHEN sfd.field_type = 'number' THEN to_jsonb(psa.value_number)
                WHEN sfd.field_type = 'boolean' THEN to_jsonb(psa.value_boolean)
                WHEN sfd.field_type IN ('select', 'multiselect') AND psa.value_json IS NOT NULL THEN psa.value_json
                ELSE to_jsonb(psa.value_text)
            END as value
        FROM public.product_service_attributes psa
        JOIN public.service_field_definitions sfd ON sfd.id = psa.field_definition_id
        WHERE psa.product_id = p_product_id
    LOOP
        result := result || jsonb_build_object(attr.field_name, attr.value);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to set product attribute
CREATE OR REPLACE FUNCTION set_product_attribute(
    p_product_id UUID,
    p_field_name TEXT,
    p_value TEXT,
    p_service_type_id TEXT
)
RETURNS UUID AS $$
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

-- 6. POPULATE SERVICE FIELD DEFINITIONS
-- Grocery service fields
INSERT INTO public.service_field_definitions (
    service_type_id, field_name, field_label, field_type, field_group,
    validation_rules, field_options, is_required, is_searchable, is_filterable, sort_order
) VALUES
-- Grocery fields
('grocery', 'unit', 'Unit of Measurement', 'select', 'basic', 
 '{"required": true}', '["kg", "gram", "piece", "liter", "ml", "packet", "box"]', true, false, true, 1),
('grocery', 'is_organic', 'Organic Product', 'boolean', 'specifications', '{}', null, false, false, true, 2),
('grocery', 'is_fresh', 'Fresh Product', 'boolean', 'specifications', '{}', null, false, false, true, 3),
('grocery', 'expiry_days', 'Shelf Life (Days)', 'number', 'specifications', '{"min": 1, "max": 3650}', null, false, false, false, 4),

-- Car rental fields
('car-rental', 'year', 'Manufacturing Year', 'number', 'specifications', '{"min": 1990, "max": 2030}', null, false, true, true, 1),
('car-rental', 'transmission', 'Transmission', 'select', 'specifications', '{}', '["manual", "automatic", "cvt"]', false, true, true, 2),
('car-rental', 'fuel_type', 'Fuel Type', 'select', 'specifications', '{}', '["petrol", "diesel", "cng", "electric", "hybrid"]', false, true, true, 3),
('car-rental', 'seats', 'Seating Capacity', 'number', 'specifications', '{"min": 2, "max": 50}', null, false, true, true, 4),
('car-rental', 'vehicle_category', 'Vehicle Category', 'select', 'basic', '{}', '["economy", "premium", "luxury", "suv", "sedan", "hatchback"]', false, true, true, 5),
('car-rental', 'price_per_hour', 'Hourly Rate', 'number', 'pricing', '{"min": 0}', null, false, false, false, 6),
('car-rental', 'price_per_day', 'Daily Rate', 'number', 'pricing', '{"min": 0}', null, false, false, false, 7),

-- Handyman fields
('handyman', 'service_category', 'Service Category', 'select', 'basic', '{}', '["plumbing", "electrical", "carpentry", "painting", "cleaning", "repair"]', true, true, true, 1),
('handyman', 'urgency_levels', 'Available Urgency', 'multiselect', 'basic', '{}', '["normal", "urgent", "emergency"]', false, false, true, 2),
('handyman', 'includes_materials', 'Materials Included', 'boolean', 'pricing', '{}', null, false, false, true, 3),
('handyman', 'warranty_period', 'Warranty Period', 'text', 'specifications', '{}', null, false, false, false, 4),

-- Electronics fields
('electronics', 'warranty', 'Warranty Information', 'text', 'specifications', '{}', null, false, true, false, 1),
('electronics', 'model_number', 'Model Number', 'text', 'specifications', '{}', null, false, true, false, 2),
('electronics', 'color_options', 'Available Colors', 'text', 'specifications', '{}', null, false, false, true, 3),
('electronics', 'has_installation', 'Installation Service', 'boolean', 'services', '{}', null, false, false, true, 4),

-- Home & Kitchen fields
('home-kitchen', 'material', 'Material', 'text', 'specifications', '{}', null, false, true, true, 1),
('home-kitchen', 'dimensions', 'Dimensions', 'text', 'specifications', '{}', null, false, false, false, 2),
('home-kitchen', 'is_dishwasher_safe', 'Dishwasher Safe', 'boolean', 'specifications', '{}', null, false, false, true, 3),
('home-kitchen', 'is_microwave_safe', 'Microwave Safe', 'boolean', 'specifications', '{}', null, false, false, true, 4)

ON CONFLICT (service_type_id, field_name) DO NOTHING;

-- 7. UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_service_attributes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_field_definitions_updated_at ON public.service_field_definitions;
CREATE TRIGGER update_service_field_definitions_updated_at
    BEFORE UPDATE ON public.service_field_definitions
    FOR EACH ROW EXECUTE FUNCTION update_service_attributes_updated_at();

DROP TRIGGER IF EXISTS update_product_service_attributes_updated_at ON public.product_service_attributes;
CREATE TRIGGER update_product_service_attributes_updated_at
    BEFORE UPDATE ON public.product_service_attributes
    FOR EACH ROW EXECUTE FUNCTION update_service_attributes_updated_at();

-- Verification
SELECT 
    'Service attribute system ready!' as status,
    COUNT(*) as total_field_definitions,
    COUNT(DISTINCT service_type_id) as service_types_configured
FROM public.service_field_definitions;

