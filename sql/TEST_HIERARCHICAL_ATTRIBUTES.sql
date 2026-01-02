-- Test Hierarchical Attribute Inheritance System
-- Run these queries to verify the system is working correctly

-- ============================================
-- 1. VERIFY TABLE EXISTS
-- ============================================
SELECT 
    table_name, 
    table_type
FROM information_schema.tables
WHERE table_name = 'subcategory_attribute_config'
  AND table_schema = 'public';
-- Expected: Should return 1 row showing the table exists

-- ============================================
-- 2. VERIFY FUNCTIONS EXIST
-- ============================================
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN ('get_subcategory_attributes', 'get_subcategory_attribute_summary')
  AND routine_schema = 'public';
-- Expected: Should return 2 rows (both functions)

-- ============================================
-- 3. VIEW CURRENT SUBCATEGORIES
-- ============================================
SELECT 
    s.id,
    s.name as subcategory_name,
    s.service_type_id,
    c.name as category_name,
    st.title as service_name
FROM subcategories s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN service_types st ON s.service_type_id = st.id
WHERE s.is_active = true
ORDER BY st.title, c.name, s.name;
-- This shows all active subcategories with their relationships

-- ============================================
-- 4. TEST ATTRIBUTE INHERITANCE FOR A SUBCATEGORY
-- ============================================
-- Replace '<subcategory-id>' with an actual subcategory ID from query #3
-- Example: SELECT * FROM get_subcategory_attributes('d220312d-06a2-4e22-bb5d-a5a2ed7aac64');

-- Get first subcategory ID
WITH first_subcat AS (
    SELECT id FROM subcategories WHERE is_active = true LIMIT 1
)
SELECT * FROM get_subcategory_attributes((SELECT id FROM first_subcat));
-- This shows all attributes (inherited + direct) for the first subcategory

-- ============================================
-- 5. GET ATTRIBUTE SUMMARY
-- ============================================
WITH first_subcat AS (
    SELECT id FROM subcategories WHERE is_active = true LIMIT 1
)
SELECT * FROM get_subcategory_attribute_summary((SELECT id FROM first_subcat));
-- Shows count breakdown: total, direct, inherited from category, inherited from service

-- ============================================
-- 6. VIEW SERVICE-LEVEL ATTRIBUTES
-- ============================================
SELECT 
    sac.id,
    st.title as service_name,
    ar.name as attribute_name,
    ar.label as attribute_label,
    sac.is_required,
    sac.is_visible,
    sac.field_group
FROM service_attribute_config sac
JOIN service_types st ON sac.service_type_id = st.id
JOIN attribute_registry ar ON sac.attribute_id = ar.id
WHERE sac.is_visible = true
ORDER BY st.title, sac.display_order;
-- Shows all service-level attributes

-- ============================================
-- 7. VIEW CATEGORY-LEVEL ATTRIBUTES
-- ============================================
SELECT 
    cac.id,
    c.name as category_name,
    st.title as service_name,
    ar.name as attribute_name,
    ar.label as attribute_label,
    cac.inherit_from_service,
    cac.is_required,
    cac.is_visible
FROM category_attribute_config cac
JOIN categories c ON cac.category_id = c.id
JOIN service_types st ON c.service_type = st.id
JOIN attribute_registry ar ON cac.attribute_id = ar.id
WHERE cac.is_visible = true
ORDER BY st.title, c.name, cac.display_order;
-- Shows all category-level attributes with inheritance flags

-- ============================================
-- 8. VIEW SUBCATEGORY-LEVEL ATTRIBUTES (DIRECT ONLY)
-- ============================================
SELECT 
    sac.id,
    s.name as subcategory_name,
    c.name as category_name,
    st.title as service_name,
    ar.name as attribute_name,
    ar.label as attribute_label,
    sac.inherit_from_category,
    sac.inherit_from_service,
    sac.is_required
FROM subcategory_attribute_config sac
JOIN subcategories s ON sac.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
JOIN service_types st ON s.service_type_id = st.id
JOIN attribute_registry ar ON sac.attribute_id = ar.id
WHERE sac.is_visible = true
ORDER BY st.title, c.name, s.name, sac.display_order;
-- Shows only direct subcategory attributes (not inherited)

-- ============================================
-- 9. COMPLETE INHERITANCE VIEW FOR A SPECIFIC HIERARCHY
-- ============================================
-- Replace values with your actual IDs
-- This query shows the complete attribute inheritance for a specific path

WITH hierarchy AS (
    SELECT 
        s.id as subcategory_id,
        s.name as subcategory_name,
        s.category_id,
        c.name as category_name,
        s.service_type_id,
        st.title as service_name
    FROM subcategories s
    JOIN categories c ON s.category_id = c.id
    JOIN service_types st ON s.service_type_id = st.id
    WHERE s.is_active = true
    LIMIT 1  -- Change this to filter by specific subcategory
)
SELECT 
    'Service' as level,
    h.service_name as entity_name,
    ar.name as attribute_name,
    ar.label as attribute_label,
    sac.is_required,
    sac.field_group
FROM hierarchy h
JOIN service_attribute_config sac ON sac.service_type_id = h.service_type_id
JOIN attribute_registry ar ON sac.attribute_id = ar.id
WHERE sac.is_visible = true

UNION ALL

SELECT 
    'Category' as level,
    h.category_name as entity_name,
    ar.name as attribute_name,
    ar.label as attribute_label,
    cac.is_required,
    cac.field_group
FROM hierarchy h
JOIN category_attribute_config cac ON cac.category_id = h.category_id
JOIN attribute_registry ar ON cac.attribute_id = ar.id
WHERE cac.is_visible = true

UNION ALL

SELECT 
    'Subcategory' as level,
    h.subcategory_name as entity_name,
    ar.name as attribute_name,
    ar.label as attribute_label,
    sac.is_required,
    sac.field_group
FROM hierarchy h
JOIN subcategory_attribute_config sac ON sac.subcategory_id = h.subcategory_id
JOIN attribute_registry ar ON sac.attribute_id = ar.id
WHERE sac.is_visible = true

ORDER BY 
    CASE level 
        WHEN 'Service' THEN 1 
        WHEN 'Category' THEN 2 
        WHEN 'Subcategory' THEN 3 
    END,
    attribute_name;
-- Shows all attributes across all three levels for visualization

-- ============================================
-- 10. CHECK FOR ATTRIBUTE CONFLICTS/OVERRIDES
-- ============================================
-- This query finds attributes that are defined at multiple levels
WITH all_configs AS (
    SELECT 
        sac.attribute_id,
        'service' as config_level,
        s.service_type_id as entity_id
    FROM service_attribute_config sac
    JOIN subcategories s ON true -- Cartesian to check all subcats
    WHERE s.is_active = true
    
    UNION ALL
    
    SELECT 
        cac.attribute_id,
        'category' as config_level,
        s.category_id as entity_id
    FROM category_attribute_config cac
    JOIN subcategories s ON s.category_id = cac.category_id
    WHERE s.is_active = true
    
    UNION ALL
    
    SELECT 
        sac.attribute_id,
        'subcategory' as config_level,
        sac.subcategory_id as entity_id
    FROM subcategory_attribute_config sac
)
SELECT 
    ar.name as attribute_name,
    ar.label as attribute_label,
    array_agg(DISTINCT ac.config_level ORDER BY ac.config_level) as defined_at_levels,
    count(DISTINCT ac.config_level) as level_count
FROM all_configs ac
JOIN attribute_registry ar ON ac.attribute_id = ar.id
GROUP BY ar.name, ar.label
HAVING count(DISTINCT ac.config_level) > 1
ORDER BY level_count DESC, ar.label;
-- Shows which attributes are overridden at multiple levels

-- ============================================
-- 11. PERFORMANCE CHECK
-- ============================================
EXPLAIN ANALYZE
SELECT * FROM get_subcategory_attributes(
    (SELECT id FROM subcategories WHERE is_active = true LIMIT 1)
);
-- Shows query execution plan and performance metrics

-- ============================================
-- 12. RLS POLICY CHECK
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'subcategory_attribute_config';
-- Verifies Row Level Security policies are in place

-- ============================================
-- SUCCESS CRITERIA
-- ============================================
-- ✅ Query #1 returns 1 row (table exists)
-- ✅ Query #2 returns 2 rows (both functions exist)
-- ✅ Query #3 shows your subcategories
-- ✅ Query #4 returns inherited + direct attributes
-- ✅ Query #5 shows attribute count breakdown
-- ✅ Query #6-8 show attributes at each level
-- ✅ Query #9 shows complete hierarchy
-- ✅ Query #12 shows RLS policies exist

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- If any query fails:
-- 1. Run migration again: See HIERARCHICAL_ATTRIBUTE_INHERITANCE_COMPLETE.md
-- 2. Check Supabase logs for errors
-- 3. Verify you have proper database permissions
-- 4. Check that subcategories table has data

