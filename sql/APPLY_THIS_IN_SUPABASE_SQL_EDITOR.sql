-- ========================================
-- COMPREHENSIVE MULTI-SERVICE DYNAMIC ATTRIBUTE SYSTEM
-- COMPLETE SETUP - COPY AND PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- ========================================

-- PART 1: ENHANCE ATTRIBUTE REGISTRY
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'label') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'input_type') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN input_type TEXT DEFAULT 'text';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'placeholder') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN placeholder TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'help_text') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN help_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'group_name') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN group_name TEXT DEFAULT 'general';
    END IF;
END $$;

-- PART 2: CREATE TABLES
CREATE TABLE IF NOT EXISTS public.service_attribute_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type_id TEXT NOT NULL REFERENCES public.service_types(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES public.attribute_registry(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    field_group TEXT DEFAULT 'general',
    override_label TEXT,
    override_placeholder TEXT,
    override_help_text TEXT,
    custom_validation_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    UNIQUE(service_type_id, attribute_id)
);

CREATE TABLE IF NOT EXISTS public.category_attribute_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES public.attribute_registry(id) ON DELETE CASCADE,
    inherit_from_service BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    field_group TEXT DEFAULT 'general',
    override_label TEXT,
    override_placeholder TEXT,
    override_help_text TEXT,
    custom_validation_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    UNIQUE(category_id, attribute_id)
);

CREATE TABLE IF NOT EXISTS public.default_mandatory_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    field_name TEXT NOT NULL UNIQUE,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    input_type TEXT NOT NULL,
    placeholder TEXT,
    help_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_system_field BOOLEAN DEFAULT true,
    applicable_to_all_services BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PART 3: POPULATE DEFAULT MANDATORY FIELDS
INSERT INTO public.default_mandatory_fields (field_name, field_label, field_type, input_type, placeholder, help_text, display_order, is_system_field) VALUES
('product_name', 'Product/Offering Name', 'text', 'text', 'Enter product name', 'The name of the product or service offering', 1, true),
('product_description', 'Description', 'text', 'textarea', 'Describe the product...', 'Detailed description of the product', 2, true),
('product_specification', 'Specifications', 'text', 'textarea', 'Technical specifications...', 'Technical specifications and details', 3, true),
('product_images', 'Product Images', 'file', 'image', 'Upload product images', 'Upload high-quality product images', 4, true),
('price', 'Price', 'number', 'number', 'Enter price', 'Product price in base currency', 5, true),
('units', 'Units/Quantity', 'text', 'select', 'Select unit', 'Unit of measurement (piece, kg, liter, etc.)', 6, true),
('discount', 'Discount', 'number', 'number', 'Discount percentage', 'Discount percentage (0-100)', 7, true),
('vendor_name', 'Vendor', 'text', 'select', 'Select vendor', 'The vendor providing this product', 8, true),
('meta_title', 'SEO Title', 'text', 'text', 'SEO optimized title', 'Meta title for search engines', 9, false),
('meta_tags', 'Meta Tags', 'text', 'text', 'Comma-separated tags', 'Meta keywords/tags for SEO', 10, false),
('meta_description', 'SEO Description', 'text', 'textarea', 'SEO description', 'Meta description for search engines', 11, false)
ON CONFLICT (field_name) DO NOTHING;

-- PART 4: CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_service_attribute_config_service 
ON public.service_attribute_config(service_type_id, display_order);

CREATE INDEX IF NOT EXISTS idx_service_attribute_config_attribute 
ON public.service_attribute_config(attribute_id);

CREATE INDEX IF NOT EXISTS idx_category_attribute_config_category 
ON public.category_attribute_config(category_id, display_order);

CREATE INDEX IF NOT EXISTS idx_category_attribute_config_attribute 
ON public.category_attribute_config(attribute_id);

CREATE INDEX IF NOT EXISTS idx_category_attribute_config_inherit 
ON public.category_attribute_config(category_id, inherit_from_service) 
WHERE inherit_from_service = false;

-- PART 5: ENABLE ROW LEVEL SECURITY
ALTER TABLE public.service_attribute_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_attribute_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.default_mandatory_fields ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "read_service_attribute_config" ON public.service_attribute_config;
DROP POLICY IF EXISTS "admin_manage_service_attribute_config" ON public.service_attribute_config;
DROP POLICY IF EXISTS "read_category_attribute_config" ON public.category_attribute_config;
DROP POLICY IF EXISTS "admin_manage_category_attribute_config" ON public.category_attribute_config;
DROP POLICY IF EXISTS "read_default_mandatory_fields" ON public.default_mandatory_fields;
DROP POLICY IF EXISTS "admin_manage_default_mandatory_fields" ON public.default_mandatory_fields;

-- PART 6: CREATE RLS POLICIES
CREATE POLICY "read_service_attribute_config" 
ON public.service_attribute_config FOR SELECT USING (true);

CREATE POLICY "admin_manage_service_attribute_config" 
ON public.service_attribute_config FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendor_admin'))
);

CREATE POLICY "read_category_attribute_config" 
ON public.category_attribute_config FOR SELECT USING (true);

CREATE POLICY "admin_manage_category_attribute_config" 
ON public.category_attribute_config FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'vendor_admin')
    )
);

CREATE POLICY "read_default_mandatory_fields" 
ON public.default_mandatory_fields FOR SELECT USING (true);

CREATE POLICY "admin_manage_default_mandatory_fields" 
ON public.default_mandatory_fields FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PART 7: CREATE FUNCTIONS

-- Function 1: Get Service Attributes
CREATE OR REPLACE FUNCTION public.get_service_attributes(p_service_type_id TEXT)
RETURNS TABLE (
    attribute_id UUID,
    attribute_name TEXT,
    attribute_label TEXT,
    data_type TEXT,
    input_type TEXT,
    placeholder TEXT,
    help_text TEXT,
    is_required BOOLEAN,
    is_visible BOOLEAN,
    display_order INTEGER,
    field_group TEXT,
    validation_rules JSONB,
    options JSONB,
    default_value TEXT,
    is_system_field BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id as attribute_id,
        ar.name as attribute_name,
        COALESCE(sac.override_label, ar.label, ar.name) as attribute_label,
        ar.data_type,
        COALESCE(ar.input_type, 'text') as input_type,
        COALESCE(sac.override_placeholder, ar.placeholder) as placeholder,
        COALESCE(sac.override_help_text, ar.help_text) as help_text,
        COALESCE(sac.is_required, ar.is_required, false) as is_required,
        COALESCE(sac.is_visible, true) as is_visible,
        COALESCE(sac.display_order, ar.sort_order, 0) as display_order,
        COALESCE(sac.field_group, ar.group_name, 'general') as field_group,
        COALESCE(sac.custom_validation_rules, ar.validation_rules, '{}'::jsonb) as validation_rules,
        ar.options,
        ar.default_value,
        false as is_system_field
    FROM public.service_attribute_config sac
    JOIN public.attribute_registry ar ON ar.id = sac.attribute_id
    WHERE sac.service_type_id = p_service_type_id
    AND sac.is_visible = true
    AND ar.is_active = true
    ORDER BY sac.display_order, ar.sort_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 2: Get Category Attributes
CREATE OR REPLACE FUNCTION public.get_category_attributes(p_category_id UUID)
RETURNS TABLE (
    attribute_id UUID,
    attribute_name TEXT,
    attribute_label TEXT,
    data_type TEXT,
    input_type TEXT,
    placeholder TEXT,
    help_text TEXT,
    is_required BOOLEAN,
    is_visible BOOLEAN,
    display_order INTEGER,
    field_group TEXT,
    validation_rules JSONB,
    options JSONB,
    default_value TEXT,
    inherited_from TEXT,
    is_system_field BOOLEAN
) AS $$
DECLARE
    v_service_type_id TEXT;
BEGIN
    SELECT service_type INTO v_service_type_id
    FROM public.categories WHERE id = p_category_id;
    
    RETURN QUERY
    WITH category_attrs AS (
        SELECT 
            ar.id, ar.name,
            COALESCE(cac.override_label, ar.label, ar.name) as label,
            ar.data_type, COALESCE(ar.input_type, 'text') as input_type,
            COALESCE(cac.override_placeholder, ar.placeholder) as placeholder,
            COALESCE(cac.override_help_text, ar.help_text) as help_text,
            COALESCE(cac.is_required, ar.is_required, false) as is_required,
            COALESCE(cac.is_visible, true) as is_visible,
            COALESCE(cac.display_order, ar.sort_order, 0) as display_order,
            COALESCE(cac.field_group, ar.group_name, 'general') as field_group,
            COALESCE(cac.custom_validation_rules, ar.validation_rules, '{}'::jsonb) as validation_rules,
            ar.options, ar.default_value, 'category' as inherited_from, false as is_system_field
        FROM public.category_attribute_config cac
        JOIN public.attribute_registry ar ON ar.id = cac.attribute_id
        WHERE cac.category_id = p_category_id
        AND cac.inherit_from_service = false AND cac.is_visible = true AND ar.is_active = true
    ),
    service_attrs AS (
        SELECT 
            ar.id, ar.name,
            COALESCE(sac.override_label, ar.label, ar.name) as label,
            ar.data_type, COALESCE(ar.input_type, 'text') as input_type,
            COALESCE(sac.override_placeholder, ar.placeholder) as placeholder,
            COALESCE(sac.override_help_text, ar.help_text) as help_text,
            COALESCE(sac.is_required, ar.is_required, false) as is_required,
            COALESCE(sac.is_visible, true) as is_visible,
            COALESCE(sac.display_order, ar.sort_order, 0) as display_order,
            COALESCE(sac.field_group, ar.group_name, 'general') as field_group,
            COALESCE(sac.custom_validation_rules, ar.validation_rules, '{}'::jsonb) as validation_rules,
            ar.options, ar.default_value, 'service' as inherited_from, false as is_system_field
        FROM public.service_attribute_config sac
        JOIN public.attribute_registry ar ON ar.id = sac.attribute_id
        WHERE sac.service_type_id = v_service_type_id
        AND sac.is_visible = true AND ar.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM public.category_attribute_config cac2
            WHERE cac2.category_id = p_category_id AND cac2.attribute_id = ar.id
            AND cac2.inherit_from_service = false
        )
    )
    SELECT * FROM category_attrs
    UNION ALL SELECT * FROM service_attrs
    ORDER BY display_order, name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 3: Get Product Form Attributes
CREATE OR REPLACE FUNCTION public.get_product_form_attributes(
    p_service_type_id TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
    attribute_id UUID, attribute_name TEXT, attribute_label TEXT,
    data_type TEXT, input_type TEXT, placeholder TEXT, help_text TEXT,
    is_required BOOLEAN, is_visible BOOLEAN, display_order INTEGER,
    field_group TEXT, validation_rules JSONB, options JSONB, default_value TEXT,
    is_system_field BOOLEAN, is_mandatory BOOLEAN, inherited_from TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        SELECT gen_random_uuid(), dmf.field_name, dmf.field_label, dmf.field_type, dmf.input_type,
               dmf.placeholder, dmf.help_text, true, true, dmf.display_order, 'mandatory'::TEXT,
               '{}'::JSONB, NULL::JSONB, NULL::TEXT, dmf.is_system_field, true, 'default'::TEXT
        FROM public.default_mandatory_fields dmf WHERE dmf.is_system_field = true
        UNION ALL
        SELECT ca.attribute_id, ca.attribute_name, ca.attribute_label, ca.data_type, ca.input_type,
               ca.placeholder, ca.help_text, ca.is_required, ca.is_visible, ca.display_order + 100,
               ca.field_group, ca.validation_rules, ca.options, ca.default_value,
               ca.is_system_field, false, ca.inherited_from
        FROM public.get_category_attributes(p_category_id) ca
        WHERE p_category_id IS NOT NULL
        UNION ALL
        SELECT sa.attribute_id, sa.attribute_name, sa.attribute_label, sa.data_type, sa.input_type,
               sa.placeholder, sa.help_text, sa.is_required, sa.is_visible, sa.display_order + 100,
               sa.field_group, sa.validation_rules, sa.options, sa.default_value,
               sa.is_system_field, false, 'service'::TEXT
        FROM public.get_service_attributes(p_service_type_id) sa
        WHERE p_category_id IS NULL AND p_service_type_id IS NOT NULL
    ) combined ORDER BY display_order, attribute_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 4: Reorder Service Attributes
CREATE OR REPLACE FUNCTION public.reorder_service_attributes(
    p_service_type_id TEXT, p_attribute_orders JSONB
) RETURNS BOOLEAN AS $$
DECLARE attr_order JSONB; attr_id UUID; new_order INT;
BEGIN
    FOR attr_order IN SELECT * FROM jsonb_array_elements(p_attribute_orders) LOOP
        attr_id := (attr_order->>'attribute_id')::UUID;
        new_order := (attr_order->>'display_order')::INT;
        UPDATE public.service_attribute_config SET display_order = new_order, updated_at = NOW()
        WHERE service_type_id = p_service_type_id AND attribute_id = attr_id;
    END LOOP;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function 5: Add Attributes to Service
CREATE OR REPLACE FUNCTION public.add_attributes_to_service(
    p_service_type_id TEXT, p_attribute_ids UUID[], p_created_by UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE added_count INTEGER := 0; attr_id UUID; max_order INTEGER;
BEGIN
    SELECT COALESCE(MAX(display_order), 0) INTO max_order
    FROM public.service_attribute_config WHERE service_type_id = p_service_type_id;
    
    FOREACH attr_id IN ARRAY p_attribute_ids LOOP
        INSERT INTO public.service_attribute_config (
            service_type_id, attribute_id, display_order, created_by, updated_by
        ) VALUES (p_service_type_id, attr_id, max_order + added_count + 1, p_created_by, p_created_by)
        ON CONFLICT (service_type_id, attribute_id) DO NOTHING;
        IF FOUND THEN added_count := added_count + 1; END IF;
    END LOOP;
    RETURN added_count;
END;
$$ LANGUAGE plpgsql;

-- PART 8: CREATE TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_attribute_config_updated_at ON public.service_attribute_config;
CREATE TRIGGER update_service_attribute_config_updated_at
    BEFORE UPDATE ON public.service_attribute_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_category_attribute_config_updated_at ON public.category_attribute_config;
CREATE TRIGGER update_category_attribute_config_updated_at
    BEFORE UPDATE ON public.category_attribute_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- VERIFICATION
-- ========================================
SELECT 'Migration completed successfully! Checking results...' as status;

SELECT 
    'Tables Created: ' || COUNT(*) as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('service_attribute_config', 'category_attribute_config', 'default_mandatory_fields');

SELECT 
    'Mandatory Fields Populated: ' || COUNT(*) as result
FROM public.default_mandatory_fields;

SELECT 
    'Functions Created: ' || COUNT(*) as result
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%attribute%';

SELECT '✅ SETUP COMPLETE! System is ready to use.' as final_status;

