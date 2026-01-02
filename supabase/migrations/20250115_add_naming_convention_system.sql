-- ================================================
-- NAMING CONVENTION & FIELD MANAGEMENT ENHANCEMENT
-- Extends existing attribute system without breaking changes
-- ================================================

-- 1. ADD SUBCATEGORY SUPPORT TO EXISTING CATEGORIES TABLE
-- Trigger to auto-calculate category level based on parent
CREATE OR REPLACE FUNCTION update_category_level()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.level := 0;
    ELSE
        SELECT COALESCE(level, 0) + 1 INTO NEW.level
        FROM categories
        WHERE id = NEW.parent_id;
        
        -- Update path for breadcrumb navigation
        SELECT COALESCE(path, name) || ' > ' || NEW.name INTO NEW.path
        FROM categories
        WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_level ON categories;
CREATE TRIGGER trigger_update_category_level
    BEFORE INSERT OR UPDATE OF parent_id ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_level();

-- 2. ADD DELETABLE/EDITABLE FLAGS TO EXISTING CONFIG TABLES
-- These allow marking which attributes can be removed/edited by users

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_attribute_config' AND column_name = 'is_editable') THEN
        ALTER TABLE service_attribute_config ADD COLUMN is_editable BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_attribute_config' AND column_name = 'is_deletable') THEN
        ALTER TABLE service_attribute_config ADD COLUMN is_deletable BOOLEAN DEFAULT true;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'category_attribute_config' AND column_name = 'is_editable') THEN
        ALTER TABLE category_attribute_config ADD COLUMN is_editable BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'category_attribute_config' AND column_name = 'is_deletable') THEN
        ALTER TABLE category_attribute_config ADD COLUMN is_deletable BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. ENHANCE get_product_form_attributes FUNCTION
-- Add support for subcategories and better inheritance

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
    
    -- 1. Mandatory system fields (always shown, locked)
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
    
    -- 2. Subcategory-specific attributes (if subcategory provided)
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
        COALESCE(cac.is_editable, true) as is_editable,
        COALESCE(cac.is_deletable, true) as is_deletable,
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
    
    UNION ALL
    
    -- 3. Category attributes (not overridden by subcategory)
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
        COALESCE(cac.is_editable, true) as is_editable,
        COALESCE(cac.is_deletable, true) as is_deletable,
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
    AND NOT EXISTS (
        SELECT 1 FROM category_attribute_config cac2
        WHERE cac2.category_id = p_subcategory_id
        AND cac2.attribute_id = ar.id
        AND cac2.inherit_from_service = false
    )
    
    UNION ALL
    
    -- 4. Service attributes (not overridden by category/subcategory)
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
        COALESCE(sac.is_editable, true) as is_editable,
        COALESCE(sac.is_deletable, true) as is_deletable,
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
    AND NOT EXISTS (
        SELECT 1 FROM category_attribute_config cac
        WHERE cac.category_id IN (p_category_id, p_subcategory_id)
        AND cac.attribute_id = ar.id
        AND cac.inherit_from_service = false
    )
    
    ORDER BY display_order, attribute_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. CREATE VIEW FOR ATTRIBUTE HIERARCHY VISUALIZATION
CREATE OR REPLACE VIEW attribute_hierarchy_view AS
SELECT 
    st.id as service_id,
    st.title as service_name,
    cat.id as category_id,
    cat.name as category_name,
    cat.level as category_level,
    subcat.id as subcategory_id,
    subcat.name as subcategory_name,
    ar.id as attribute_id,
    ar.name as attribute_name,
    ar.label as attribute_label,
    CASE
        WHEN sac.id IS NOT NULL THEN 'service'
        WHEN cat_ac.id IS NOT NULL AND cat.level = 0 THEN 'category'
        WHEN subcat_ac.id IS NOT NULL THEN 'subcategory'
    END as configured_at_level
FROM service_types st
LEFT JOIN categories cat ON cat.service_type = st.id AND cat.is_active = true
LEFT JOIN categories subcat ON subcat.parent_id = cat.id AND subcat.is_active = true
LEFT JOIN service_attribute_config sac ON sac.service_type_id = st.id
LEFT JOIN category_attribute_config cat_ac ON cat_ac.category_id = cat.id
LEFT JOIN category_attribute_config subcat_ac ON subcat_ac.category_id = subcat.id
LEFT JOIN attribute_registry ar ON ar.id IN (sac.attribute_id, cat_ac.attribute_id, subcat_ac.attribute_id)
WHERE ar.is_active = true;

-- 5. ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_categories_parent_level ON categories(parent_id, level) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_service_level ON categories(service_type, level);
CREATE INDEX IF NOT EXISTS idx_service_attr_config_deletable ON service_attribute_config(service_type_id, is_deletable);
CREATE INDEX IF NOT EXISTS idx_category_attr_config_deletable ON category_attribute_config(category_id, is_deletable);

-- 6. COMMENTS
COMMENT ON FUNCTION get_product_form_attributes_v2 IS 'Enhanced version with subcategory support and inheritance tracking';
COMMENT ON VIEW attribute_hierarchy_view IS 'Shows complete attribute inheritance hierarchy for admin visualization';
COMMENT ON COLUMN service_attribute_config.is_editable IS 'Indicates if this attribute configuration can be edited';
COMMENT ON COLUMN service_attribute_config.is_deletable IS 'Indicates if this attribute can be removed from the entity';
COMMENT ON COLUMN category_attribute_config.is_editable IS 'Indicates if this attribute configuration can be edited';
COMMENT ON COLUMN category_attribute_config.is_deletable IS 'Indicates if this attribute can be removed from the entity';

-- Success message
SELECT 'Naming Convention & Field Management System migration completed successfully!' as status;

