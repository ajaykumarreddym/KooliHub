-- ========================================
-- COMPREHENSIVE MULTI-SERVICE DYNAMIC ATTRIBUTE SYSTEM
-- Complete implementation for hierarchical attribute management
-- ========================================

-- 1. ENHANCE ATTRIBUTE REGISTRY
-- Add any missing columns to attribute_registry if needed
DO $$ 
BEGIN
    -- Add label column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'label') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN label TEXT;
    END IF;
    
    -- Add input_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'input_type') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN input_type TEXT DEFAULT 'text';
    END IF;
    
    -- Add placeholder column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'placeholder') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN placeholder TEXT;
    END IF;
    
    -- Add help_text column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'help_text') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN help_text TEXT;
    END IF;
    
    -- Add group_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_registry' AND column_name = 'group_name') THEN
        ALTER TABLE public.attribute_registry ADD COLUMN group_name TEXT DEFAULT 'general';
    END IF;
END $$;

-- 2. SERVICE ATTRIBUTE CONFIGURATION
-- Stores which attributes are selected for each service, their order, and required status
CREATE TABLE IF NOT EXISTS public.service_attribute_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type_id TEXT NOT NULL REFERENCES public.service_types(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES public.attribute_registry(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    field_group TEXT DEFAULT 'general',
    override_label TEXT, -- Override the default label
    override_placeholder TEXT, -- Override the default placeholder
    override_help_text TEXT, -- Override the default help text
    custom_validation_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    
    UNIQUE(service_type_id, attribute_id)
);

-- 3. CATEGORY ATTRIBUTE CONFIGURATION
-- Allows categories to override service-level attribute settings or add new ones
CREATE TABLE IF NOT EXISTS public.category_attribute_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES public.attribute_registry(id) ON DELETE CASCADE,
    inherit_from_service BOOLEAN DEFAULT true, -- If true, inherits from service config
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

-- 4. MANDATORY DEFAULT FIELDS REGISTRY
-- Store the default mandatory fields that cannot be deleted
CREATE TABLE IF NOT EXISTS public.default_mandatory_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    field_name TEXT NOT NULL UNIQUE,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    input_type TEXT NOT NULL,
    placeholder TEXT,
    help_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_system_field BOOLEAN DEFAULT true, -- System fields cannot be deleted
    applicable_to_all_services BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. POPULATE DEFAULT MANDATORY FIELDS
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

-- 6. INDEXES FOR PERFORMANCE
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

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.service_attribute_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_attribute_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.default_mandatory_fields ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES
-- Service attribute config - admin only for writes, public read
CREATE POLICY "read_service_attribute_config" 
ON public.service_attribute_config FOR SELECT 
USING (true);

CREATE POLICY "admin_manage_service_attribute_config" 
ON public.service_attribute_config FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'vendor_admin'))
);

-- Category attribute config - admin and vendor admins
CREATE POLICY "read_category_attribute_config" 
ON public.category_attribute_config FOR SELECT 
USING (true);

CREATE POLICY "admin_manage_category_attribute_config" 
ON public.category_attribute_config FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'vendor_admin')
    )
);

-- Default mandatory fields - read-only for all, admin only for writes
CREATE POLICY "read_default_mandatory_fields" 
ON public.default_mandatory_fields FOR SELECT 
USING (true);

CREATE POLICY "admin_manage_default_mandatory_fields" 
ON public.default_mandatory_fields FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 9. HELPER FUNCTION: GET MERGED ATTRIBUTES FOR A SERVICE
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

-- 10. HELPER FUNCTION: GET MERGED ATTRIBUTES FOR A CATEGORY (WITH INHERITANCE)
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
    inherited_from TEXT, -- 'service', 'category', or 'default'
    is_system_field BOOLEAN
) AS $$
DECLARE
    v_service_type_id TEXT;
BEGIN
    -- Get the service type for this category
    SELECT service_type INTO v_service_type_id
    FROM public.categories
    WHERE id = p_category_id;
    
    -- Return category-specific overrides first, then service-level defaults
    RETURN QUERY
    WITH category_attrs AS (
        -- Category-level custom attributes (not inheriting from service)
        SELECT 
            ar.id as attribute_id,
            ar.name as attribute_name,
            COALESCE(cac.override_label, ar.label, ar.name) as attribute_label,
            ar.data_type,
            COALESCE(ar.input_type, 'text') as input_type,
            COALESCE(cac.override_placeholder, ar.placeholder) as placeholder,
            COALESCE(cac.override_help_text, ar.help_text) as help_text,
            COALESCE(cac.is_required, ar.is_required, false) as is_required,
            COALESCE(cac.is_visible, true) as is_visible,
            COALESCE(cac.display_order, ar.sort_order, 0) as display_order,
            COALESCE(cac.field_group, ar.group_name, 'general') as field_group,
            COALESCE(cac.custom_validation_rules, ar.validation_rules, '{}'::jsonb) as validation_rules,
            ar.options,
            ar.default_value,
            'category' as inherited_from,
            false as is_system_field
        FROM public.category_attribute_config cac
        JOIN public.attribute_registry ar ON ar.id = cac.attribute_id
        WHERE cac.category_id = p_category_id
        AND cac.inherit_from_service = false
        AND cac.is_visible = true
        AND ar.is_active = true
    ),
    service_attrs AS (
        -- Service-level attributes (where category doesn't override)
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
            'service' as inherited_from,
            false as is_system_field
        FROM public.service_attribute_config sac
        JOIN public.attribute_registry ar ON ar.id = sac.attribute_id
        WHERE sac.service_type_id = v_service_type_id
        AND sac.is_visible = true
        AND ar.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM public.category_attribute_config cac2
            WHERE cac2.category_id = p_category_id
            AND cac2.attribute_id = ar.id
            AND cac2.inherit_from_service = false
        )
    )
    SELECT * FROM category_attrs
    UNION ALL
    SELECT * FROM service_attrs
    ORDER BY display_order, attribute_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. HELPER FUNCTION: GET ALL ATTRIBUTES FOR PRODUCT FORM (INCLUDING MANDATORY)
CREATE OR REPLACE FUNCTION public.get_product_form_attributes(
    p_service_type_id TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL
)
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
    is_system_field BOOLEAN,
    is_mandatory BOOLEAN,
    inherited_from TEXT
) AS $$
BEGIN
    -- Return mandatory fields first, then custom attributes
    RETURN QUERY
    
    -- Mandatory system fields (always shown, locked)
    SELECT 
        gen_random_uuid() as attribute_id,
        dmf.field_name as attribute_name,
        dmf.field_label as attribute_label,
        dmf.field_type as data_type,
        dmf.input_type,
        dmf.placeholder,
        dmf.help_text,
        true as is_required,
        true as is_visible,
        dmf.display_order,
        'mandatory'::TEXT as field_group,
        '{}'::JSONB as validation_rules,
        NULL::JSONB as options,
        NULL::TEXT as default_value,
        dmf.is_system_field,
        true as is_mandatory,
        'default'::TEXT as inherited_from
    FROM public.default_mandatory_fields dmf
    WHERE dmf.is_system_field = true
    ORDER BY dmf.display_order
    
    UNION ALL
    
    -- Category-specific attributes (if category is provided)
    SELECT 
        ca.attribute_id,
        ca.attribute_name,
        ca.attribute_label,
        ca.data_type,
        ca.input_type,
        ca.placeholder,
        ca.help_text,
        ca.is_required,
        ca.is_visible,
        ca.display_order + 100, -- Offset to come after mandatory fields
        ca.field_group,
        ca.validation_rules,
        ca.options,
        ca.default_value,
        ca.is_system_field,
        false as is_mandatory,
        ca.inherited_from
    FROM public.get_category_attributes(p_category_id) ca
    WHERE p_category_id IS NOT NULL
    
    UNION ALL
    
    -- Service-level attributes (if no category provided, or as fallback)
    SELECT 
        sa.attribute_id,
        sa.attribute_name,
        sa.attribute_label,
        sa.data_type,
        sa.input_type,
        sa.placeholder,
        sa.help_text,
        sa.is_required,
        sa.is_visible,
        sa.display_order + 100, -- Offset to come after mandatory fields
        sa.field_group,
        sa.validation_rules,
        sa.options,
        sa.default_value,
        sa.is_system_field,
        false as is_mandatory,
        'service'::TEXT as inherited_from
    FROM public.get_service_attributes(p_service_type_id) sa
    WHERE p_category_id IS NULL AND p_service_type_id IS NOT NULL
    
    ORDER BY display_order, attribute_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- 12. FUNCTION TO REORDER ATTRIBUTES
CREATE OR REPLACE FUNCTION public.reorder_service_attributes(
    p_service_type_id TEXT,
    p_attribute_orders JSONB -- Array of {attribute_id, new_order}
) RETURNS BOOLEAN AS $$
DECLARE
    attr_order JSONB;
    attr_id UUID;
    new_order INT;
BEGIN
    FOR attr_order IN SELECT * FROM jsonb_array_elements(p_attribute_orders)
    LOOP
        attr_id := (attr_order->>'attribute_id')::UUID;
        new_order := (attr_order->>'display_order')::INT;
        
        UPDATE public.service_attribute_config
        SET display_order = new_order,
            updated_at = NOW()
        WHERE service_type_id = p_service_type_id
        AND attribute_id = attr_id;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 13. FUNCTION TO BULK ADD ATTRIBUTES TO SERVICE
CREATE OR REPLACE FUNCTION public.add_attributes_to_service(
    p_service_type_id TEXT,
    p_attribute_ids UUID[],
    p_created_by UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    added_count INTEGER := 0;
    attr_id UUID;
    max_order INTEGER;
BEGIN
    -- Get current max order
    SELECT COALESCE(MAX(display_order), 0) INTO max_order
    FROM public.service_attribute_config
    WHERE service_type_id = p_service_type_id;
    
    -- Add each attribute
    FOREACH attr_id IN ARRAY p_attribute_ids
    LOOP
        INSERT INTO public.service_attribute_config (
            service_type_id, attribute_id, display_order, created_by, updated_by
        ) VALUES (
            p_service_type_id, attr_id, max_order + added_count + 1, p_created_by, p_created_by
        )
        ON CONFLICT (service_type_id, attribute_id) DO NOTHING;
        
        IF FOUND THEN
            added_count := added_count + 1;
        END IF;
    END LOOP;
    
    RETURN added_count;
END;
$$ LANGUAGE plpgsql;

-- 14. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_attribute_config_updated_at ON public.service_attribute_config;
CREATE TRIGGER update_service_attribute_config_updated_at
    BEFORE UPDATE ON public.service_attribute_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_category_attribute_config_updated_at ON public.category_attribute_config;
CREATE TRIGGER update_category_attribute_config_updated_at
    BEFORE UPDATE ON public.category_attribute_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. CREATE ANALYTICS VIEW
CREATE OR REPLACE VIEW public.service_attribute_analytics AS
SELECT 
    st.id as service_type_id,
    st.title as service_type_name,
    COUNT(DISTINCT sac.attribute_id) as total_attributes,
    COUNT(DISTINCT CASE WHEN sac.is_required THEN sac.attribute_id END) as required_attributes,
    COUNT(DISTINCT ar.id) FILTER (WHERE ar.data_type = 'select') as select_fields,
    COUNT(DISTINCT ar.id) FILTER (WHERE ar.data_type = 'boolean') as boolean_fields,
    COUNT(DISTINCT ar.id) FILTER (WHERE ar.data_type = 'number') as number_fields,
    COUNT(DISTINCT c.id) as total_categories,
    COUNT(DISTINCT cac.id) as category_overrides
FROM public.service_types st
LEFT JOIN public.service_attribute_config sac ON sac.service_type_id = st.id
LEFT JOIN public.attribute_registry ar ON ar.id = sac.attribute_id
LEFT JOIN public.categories c ON c.service_type = st.id
LEFT JOIN public.category_attribute_config cac ON cac.category_id = c.id
GROUP BY st.id, st.title
ORDER BY total_attributes DESC;

-- 16. COMMENTS
COMMENT ON TABLE public.service_attribute_config IS 'Service-level attribute configuration with ordering and field customization';
COMMENT ON TABLE public.category_attribute_config IS 'Category-level attribute overrides and custom configurations';
COMMENT ON TABLE public.default_mandatory_fields IS 'System-defined mandatory fields that appear in all product forms';
COMMENT ON FUNCTION public.get_service_attributes IS 'Retrieves all configured attributes for a service type';
COMMENT ON FUNCTION public.get_category_attributes IS 'Retrieves merged attributes for a category with inheritance from service';
COMMENT ON FUNCTION public.get_product_form_attributes IS 'Retrieves complete attribute set for product form including mandatory fields';
COMMENT ON FUNCTION public.reorder_service_attributes IS 'Bulk reorder attributes for a service';
COMMENT ON FUNCTION public.add_attributes_to_service IS 'Bulk add attributes to a service configuration';

-- Migration completed successfully!
SELECT 'Comprehensive attribute system migration completed successfully!' as status;

