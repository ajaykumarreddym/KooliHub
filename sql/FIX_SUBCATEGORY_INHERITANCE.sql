-- ========================================
-- FIX SUBCATEGORY ATTRIBUTE INHERITANCE
-- Ensures subcategories show inherited attributes from both service and category levels
-- ========================================

-- Update the get_attributes_with_inheritance function to properly handle subcategories
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
    -- For service level: show only direct service attributes
    IF p_service_type_id IS NOT NULL AND p_category_id IS NULL AND p_subcategory_id IS NULL THEN
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
        -- ✅ REMOVED is_visible filter to show all attributes in admin view
        AND ar.is_active = true
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
            -- ✅ REMOVED is_visible filter to show all attributes in admin view
            AND ar.is_active = true
            
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
            -- ✅ REMOVED is_visible filter to show all attributes in admin view
            AND ar.is_active = true
        ) AS cat_attrs
        ORDER BY display_order;
    END IF;
    
    -- For subcategory level: show service + category + subcategory attributes
    -- ✅ FIXED: Now properly fetches category attributes using subcategories.category_id
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
            -- ✅ REMOVED is_visible filter to show all attributes in admin view
            AND ar.is_active = true
        
            UNION ALL
            
            -- ✅ Category attributes (inherited from parent category)
            -- FIXED: Use subcategories.category_id instead of categories.parent_id
            SELECT 
                cac.id,
                cac.attribute_id,
                ar.name,
                COALESCE(cac.override_label, ar.label, ar.name),
                ar.data_type,
                ar.input_type,
                cac.is_required,
                cac.is_visible,
                cac.display_order + 1000,  -- Offset to maintain order
                cac.field_group,
                'category'::TEXT,
                false,  -- Not direct, inherited
                cac.override_label,
                cac.override_placeholder,
                cac.override_help_text
            FROM category_attribute_config cac
            JOIN attribute_registry ar ON ar.id = cac.attribute_id
            WHERE cac.category_id = p_category_id  -- Use the passed category_id
            AND cac.inherit_from_service = false
            -- ✅ REMOVED is_visible filter to show all attributes in admin view
            AND ar.is_active = true
            
            UNION ALL
            
            -- ✅ Subcategory attributes (direct to subcategory)
            -- NOTE: Subcategory attributes are stored in category_attribute_config
            --       with category_id = subcategory_id
            SELECT 
                cac.id,
                cac.attribute_id,
                ar.name,
                COALESCE(cac.override_label, ar.label, ar.name),
                ar.data_type,
                ar.input_type,
                cac.is_required,
                cac.is_visible,
                cac.display_order + 2000,  -- Offset to maintain order
                cac.field_group,
                'subcategory'::TEXT,
                true,  -- Direct to subcategory
                cac.override_label,
                cac.override_placeholder,
                cac.override_help_text
            FROM category_attribute_config cac
            JOIN attribute_registry ar ON ar.id = cac.attribute_id
            WHERE cac.category_id = p_subcategory_id
            AND cac.inherit_from_service = false
            -- ✅ REMOVED is_visible filter to show all attributes in admin view
            AND ar.is_active = true
        ) AS subcat_attrs
        ORDER BY display_order;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ✅ Verification Query
-- Test the function with your data:
-- SELECT * FROM get_attributes_with_inheritance(
--     'your_service_id',  
--     'your_category_id', 
--     'your_subcategory_id'
-- );

COMMENT ON FUNCTION get_attributes_with_inheritance IS 
'Returns attributes with proper inheritance for admin view. 
For subcategory level: shows service (inherited) + category (inherited) + subcategory (direct).
No longer filters by is_visible to allow admin to see all attributes including hidden ones.';

