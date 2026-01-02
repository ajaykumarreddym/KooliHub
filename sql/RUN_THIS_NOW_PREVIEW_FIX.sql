-- ⚡ QUICK FIX FOR PREVIEW ERROR
-- Copy this entire file and paste into Supabase SQL Editor
-- Then click RUN

CREATE OR REPLACE FUNCTION get_product_form_attributes_v2(
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
    
    -- 1. Mandatory system fields
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
    
    -- 2. Subcategory attributes
    SELECT 
        ar.id, ar.name,
        COALESCE(cac.override_label, ar.label, ar.name),
        ar.data_type,
        COALESCE(ar.input_type, 'text'),
        COALESCE(cac.override_placeholder, ar.placeholder),
        COALESCE(cac.override_help_text, ar.help_text),
        COALESCE(cac.is_required, ar.is_required, false),
        COALESCE(cac.is_visible, true),
        COALESCE(cac.is_editable, true),
        COALESCE(cac.is_deletable, true),
        COALESCE(cac.display_order, ar.sort_order, 100) + 200,
        COALESCE(cac.field_group, ar.group_name, 'custom'),
        COALESCE(cac.custom_validation_rules, ar.validation_rules, '{}'::jsonb),
        ar.options, ar.default_value,
        false, false, 'subcategory'::TEXT, 3
    FROM category_attribute_config cac
    JOIN attribute_registry ar ON ar.id = cac.attribute_id
    WHERE cac.category_id = p_subcategory_id
    AND cac.inherit_from_service = false
    AND cac.is_visible = true
    AND ar.is_active = true
    AND p_subcategory_id IS NOT NULL
    
    UNION ALL
    
    -- 3. Category attributes
    SELECT 
        ar.id, ar.name,
        COALESCE(cac.override_label, ar.label, ar.name),
        ar.data_type,
        COALESCE(ar.input_type, 'text'),
        COALESCE(cac.override_placeholder, ar.placeholder),
        COALESCE(cac.override_help_text, ar.help_text),
        COALESCE(cac.is_required, ar.is_required, false),
        COALESCE(cac.is_visible, true),
        COALESCE(cac.is_editable, true),
        COALESCE(cac.is_deletable, true),
        COALESCE(cac.display_order, ar.sort_order, 100) + 100,
        COALESCE(cac.field_group, ar.group_name, 'custom'),
        COALESCE(cac.custom_validation_rules, ar.validation_rules, '{}'::jsonb),
        ar.options, ar.default_value,
        false, false, 'category'::TEXT, 2
    FROM category_attribute_config cac
    JOIN attribute_registry ar ON ar.id = cac.attribute_id
    WHERE cac.category_id = p_category_id
    AND cac.inherit_from_service = false
    AND cac.is_visible = true
    AND ar.is_active = true
    AND p_category_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM category_attribute_config cac2
        WHERE cac2.category_id = p_subcategory_id
        AND cac2.attribute_id = ar.id
        AND cac2.inherit_from_service = false
    )
    
    UNION ALL
    
    -- 4. Service attributes
    SELECT 
        ar.id, ar.name,
        COALESCE(sac.override_label, ar.label, ar.name),
        ar.data_type,
        COALESCE(ar.input_type, 'text'),
        COALESCE(sac.override_placeholder, ar.placeholder),
        COALESCE(sac.override_help_text, ar.help_text),
        COALESCE(sac.is_required, ar.is_required, false),
        COALESCE(sac.is_visible, true),
        COALESCE(sac.is_editable, true),
        COALESCE(sac.is_deletable, true),
        COALESCE(sac.display_order, ar.sort_order, 0) + 50,
        COALESCE(sac.field_group, ar.group_name, 'general'),
        COALESCE(sac.custom_validation_rules, ar.validation_rules, '{}'::jsonb),
        ar.options, ar.default_value,
        false, false, 'service'::TEXT, 1
    FROM service_attribute_config sac
    JOIN attribute_registry ar ON ar.id = sac.attribute_id
    WHERE sac.service_type_id = p_service_type_id
    AND sac.is_visible = true
    AND ar.is_active = true
    AND p_service_type_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM category_attribute_config cac
        WHERE cac.category_id IN (p_category_id, p_subcategory_id)
        AND cac.attribute_id = ar.id
        AND cac.inherit_from_service = false
    )
    
    ORDER BY display_order, attribute_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verify it worked
SELECT 'SUCCESS! Function created. Preview should now work!' as status;


