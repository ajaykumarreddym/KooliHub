-- ========================================
-- COMPREHENSIVE ATTRIBUTE INHERITANCE SYSTEM
-- Implements full hierarchy: service → category → subcategory
-- ========================================

-- 1. CREATE/UPDATE FUNCTION: Get all attributes with inheritance
CREATE OR REPLACE FUNCTION public.get_product_form_attributes_v2(
    p_service_type_id TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_subcategory_id UUID DEFAULT NULL
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
    is_editable BOOLEAN,
    is_deletable BOOLEAN,
    display_order INTEGER,
    field_group TEXT,
    validation_rules JSONB,
    options JSONB,
    default_value TEXT,
    is_system_field BOOLEAN,
    is_mandatory BOOLEAN,
    inherited_from TEXT,
    inheritance_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    
    -- 1. MANDATORY SYSTEM FIELDS (Level 0 - Always present)
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
        false as is_editable,
        false as is_deletable,
        dmf.display_order,
        'mandatory'::TEXT as field_group,
        '{}'::JSONB as validation_rules,
        NULL::JSONB as options,
        NULL::TEXT as default_value,
        dmf.is_system_field,
        true as is_mandatory,
        'default'::TEXT as inherited_from,
        0 as inheritance_level
    FROM default_mandatory_fields dmf
    WHERE dmf.is_system_field = true
    ORDER BY dmf.display_order
    
    UNION ALL
    
    -- 2. SERVICE-LEVEL ATTRIBUTES (Level 1)
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
        true as is_editable,
        true as is_deletable,
        COALESCE(sac.display_order, ar.sort_order, 0) + 50 as display_order,
        COALESCE(sac.field_group, ar.group_name, 'general') as field_group,
        COALESCE(sac.custom_validation_rules, ar.validation_rules, '{}'::jsonb) as validation_rules,
        ar.options,
        ar.default_value,
        false as is_system_field,
        false as is_mandatory,
        'service'::TEXT as inherited_from,
        1 as inheritance_level
    FROM service_attribute_config sac
    JOIN attribute_registry ar ON ar.id = sac.attribute_id
    WHERE sac.service_type_id = p_service_type_id
    AND sac.is_visible = true
    AND ar.is_active = true
    AND p_service_type_id IS NOT NULL
    -- Don't show if overridden at category or subcategory level
    AND NOT EXISTS (
        SELECT 1 FROM category_attribute_config cac
        WHERE cac.category_id IN (p_category_id, p_subcategory_id)
        AND cac.attribute_id = ar.id
        AND cac.inherit_from_service = false
    )
    
    UNION ALL
    
    -- 3. CATEGORY-LEVEL ATTRIBUTES (Level 2)
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
        true as is_editable,
        true as is_deletable,
        COALESCE(cac.display_order, ar.sort_order, 100) + 100 as display_order,
        COALESCE(cac.field_group, ar.group_name, 'custom') as field_group,
        COALESCE(cac.custom_validation_rules, ar.validation_rules, '{}'::jsonb) as validation_rules,
        ar.options,
        ar.default_value,
        false as is_system_field,
        false as is_mandatory,
        'category'::TEXT as inherited_from,
        2 as inheritance_level
    FROM category_attribute_config cac
    JOIN attribute_registry ar ON ar.id = cac.attribute_id
    WHERE cac.category_id = p_category_id
    AND cac.inherit_from_service = false
    AND cac.is_visible = true
    AND ar.is_active = true
    AND p_category_id IS NOT NULL
    -- Don't show if overridden at subcategory level
    AND NOT EXISTS (
        SELECT 1 FROM category_attribute_config cac2
        WHERE cac2.category_id = p_subcategory_id
        AND cac2.attribute_id = ar.id
        AND cac2.inherit_from_service = false
    )
    
    UNION ALL
    
    -- 4. SUBCATEGORY-LEVEL ATTRIBUTES (Level 3)
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
        true as is_editable,
        true as is_deletable,
        COALESCE(cac.display_order, ar.sort_order, 100) + 200 as display_order,
        COALESCE(cac.field_group, ar.group_name, 'custom') as field_group,
        COALESCE(cac.custom_validation_rules, ar.validation_rules, '{}'::jsonb) as validation_rules,
        ar.options,
        ar.default_value,
        false as is_system_field,
        false as is_mandatory,
        'subcategory'::TEXT as inherited_from,
        3 as inheritance_level
    FROM category_attribute_config cac
    JOIN attribute_registry ar ON ar.id = cac.attribute_id
    WHERE cac.category_id = p_subcategory_id
    AND cac.inherit_from_service = false
    AND cac.is_visible = true
    AND ar.is_active = true
    AND p_subcategory_id IS NOT NULL
    
    ORDER BY display_order, attribute_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. HELPER FUNCTION: Get attributes with inheritance details for admin view
CREATE OR REPLACE FUNCTION public.get_attributes_with_inheritance(
    p_service_type_id TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_subcategory_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    attribute_id UUID,
    attribute_name TEXT,
    attribute_label TEXT,
    data_type TEXT,
    input_type TEXT,
    is_required BOOLEAN,
    is_visible BOOLEAN,
    display_order INTEGER,
    field_group TEXT,
    inherited_from TEXT,
    is_direct BOOLEAN,
    override_label TEXT,
    override_placeholder TEXT,
    override_help_text TEXT
) AS $$
BEGIN
    -- For service level: show service attributes only
    IF p_service_type_id IS NOT NULL AND p_category_id IS NULL THEN
        RETURN QUERY
        SELECT 
            sac.id,
            sac.attribute_id,
            ar.name,
            COALESCE(sac.override_label, ar.label, ar.name),
            ar.data_type,
            ar.input_type,
            sac.is_required,
            sac.is_visible,
            sac.display_order,
            sac.field_group,
            'service'::TEXT,
            true,
            sac.override_label,
            sac.override_placeholder,
            sac.override_help_text
        FROM service_attribute_config sac
        JOIN attribute_registry ar ON ar.id = sac.attribute_id
        WHERE sac.service_type_id = p_service_type_id
        ORDER BY sac.display_order;
    END IF;
    
    -- For category level: show service (inherited) + category (direct) attributes
    IF p_category_id IS NOT NULL AND p_subcategory_id IS NULL THEN
        RETURN QUERY
        SELECT * FROM (
            -- Service attributes (inherited)
            SELECT 
                sac.id,
                sac.attribute_id,
                ar.name,
                COALESCE(sac.override_label, ar.label, ar.name),
                ar.data_type,
                ar.input_type,
                sac.is_required,
                sac.is_visible,
                sac.display_order,
                sac.field_group,
                'service'::TEXT,
                false,
                sac.override_label,
                sac.override_placeholder,
                sac.override_help_text
            FROM service_attribute_config sac
            JOIN attribute_registry ar ON ar.id = sac.attribute_id
            WHERE sac.service_type_id = p_service_type_id
            AND sac.is_visible = true
            
            UNION ALL
            
            -- Category attributes (direct)
            SELECT 
                cac.id,
                cac.attribute_id,
                ar.name,
                COALESCE(cac.override_label, ar.label, ar.name),
                ar.data_type,
                ar.input_type,
                cac.is_required,
                cac.is_visible,
                cac.display_order,
                cac.field_group,
                'category'::TEXT,
                true,
                cac.override_label,
                cac.override_placeholder,
                cac.override_help_text
            FROM category_attribute_config cac
            JOIN attribute_registry ar ON ar.id = cac.attribute_id
            WHERE cac.category_id = p_category_id
            AND cac.inherit_from_service = false
        ) AS cat_attrs
        ORDER BY display_order;
    END IF;
    
    -- For subcategory level: show service + category + subcategory attributes
    IF p_subcategory_id IS NOT NULL THEN
        RETURN QUERY
        SELECT * FROM (
            -- Service attributes (inherited from service)
            SELECT 
                sac.id,
                sac.attribute_id,
                ar.name,
                COALESCE(sac.override_label, ar.label, ar.name),
                ar.data_type,
                ar.input_type,
                sac.is_required,
                sac.is_visible,
                sac.display_order,
                sac.field_group,
                'service'::TEXT,
                false,
                sac.override_label,
                sac.override_placeholder,
                sac.override_help_text
            FROM service_attribute_config sac
            JOIN attribute_registry ar ON ar.id = sac.attribute_id
            WHERE sac.service_type_id = p_service_type_id
            AND sac.is_visible = true
        
        UNION ALL
        
        -- Category attributes (inherited from parent category)
        SELECT 
            cac.id,
            cac.attribute_id,
            ar.name,
            COALESCE(cac.override_label, ar.label, ar.name),
            ar.data_type,
            ar.input_type,
            cac.is_required,
            cac.is_visible,
            cac.display_order,
            cac.field_group,
            'category'::TEXT,
            false,
            cac.override_label,
            cac.override_placeholder,
            cac.override_help_text
        FROM category_attribute_config cac
        JOIN attribute_registry ar ON ar.id = cac.attribute_id
        JOIN categories subcat ON subcat.id = p_subcategory_id
        WHERE cac.category_id = subcat.parent_id
        AND cac.inherit_from_service = false
            
            UNION ALL
            
            -- Subcategory attributes (direct)
            SELECT 
                cac.id,
                cac.attribute_id,
                ar.name,
                COALESCE(cac.override_label, ar.label, ar.name),
                ar.data_type,
                ar.input_type,
                cac.is_required,
                cac.is_visible,
                cac.display_order,
                cac.field_group,
                'subcategory'::TEXT,
                true,
                cac.override_label,
                cac.override_placeholder,
                cac.override_help_text
            FROM category_attribute_config cac
            JOIN attribute_registry ar ON ar.id = cac.attribute_id
            WHERE cac.category_id = p_subcategory_id
            AND cac.inherit_from_service = false
        ) AS subcat_attrs
        ORDER BY display_order;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Add missing columns to category_attribute_config if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'category_attribute_config' AND column_name = 'is_editable') THEN
        ALTER TABLE public.category_attribute_config ADD COLUMN is_editable BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'category_attribute_config' AND column_name = 'is_deletable') THEN
        ALTER TABLE public.category_attribute_config ADD COLUMN is_deletable BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Add missing columns to service_attribute_config if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_attribute_config' AND column_name = 'is_editable') THEN
        ALTER TABLE public.service_attribute_config ADD COLUMN is_editable BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_attribute_config' AND column_name = 'is_deletable') THEN
        ALTER TABLE public.service_attribute_config ADD COLUMN is_deletable BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_service 
ON public.categories(parent_id, service_type) 
WHERE parent_id IS NOT NULL;

-- Success message
SELECT 'SUCCESS! Comprehensive attribute inheritance system is ready!' as status;

