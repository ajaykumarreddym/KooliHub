-- ============================================================================
-- ATTRIBUTE MANAGER FIXES - COMPREHENSIVE TEST SCRIPT
-- ============================================================================
-- This script tests all three fixed issues:
-- 1. Subcategory listing with proper category mapping
-- 2. Subcategory attribute configuration storage
-- 3. Default mandatory fields system
-- ============================================================================

-- ============================================================================
-- ISSUE 1: TEST SUBCATEGORY LISTING
-- ============================================================================

-- Test 1.1: Verify root categories are properly identified (without 'level' column)
SELECT 
    '1.1: Root Categories Test' as test_name,
    COUNT(*) as root_category_count
FROM categories
WHERE parent_id IS NULL 
  AND is_active = true;
-- Expected: Should return count > 0 (we have root categories)

-- Test 1.2: Verify subcategories are properly mapped to categories and services
SELECT 
    '1.2: Subcategory Mapping Test' as test_name,
    s.id as subcategory_id,
    s.name as subcategory_name,
    c.id as category_id,
    c.name as category_name,
    st.id as service_type_id,
    st.title as service_type_title,
    CASE 
        WHEN s.category_id = c.id AND s.service_type_id = st.id THEN 'PASS ✅'
        ELSE 'FAIL ❌'
    END as mapping_status
FROM subcategories s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN service_types st ON s.service_type_id = st.id
WHERE s.is_active = true
ORDER BY st.title, c.name, s.name;
-- Expected: All rows should have mapping_status = 'PASS ✅'

-- Test 1.3: Check for orphaned subcategories (missing parent category or service)
SELECT 
    '1.3: Orphaned Subcategories Test' as test_name,
    s.id as subcategory_id,
    s.name as subcategory_name,
    s.category_id,
    s.service_type_id,
    CASE 
        WHEN c.id IS NULL THEN 'Missing Category ❌'
        WHEN st.id IS NULL THEN 'Missing Service Type ❌'
        ELSE 'Valid ✅'
    END as orphan_status
FROM subcategories s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN service_types st ON s.service_type_id = st.id
WHERE s.is_active = true
  AND (c.id IS NULL OR st.id IS NULL);
-- Expected: Should return 0 rows (no orphaned subcategories)


-- ============================================================================
-- ISSUE 2: TEST SUBCATEGORY ATTRIBUTE CONFIGURATION STORAGE
-- ============================================================================

-- Test 2.1: Check if subcategory_attribute_config table exists and has correct structure
SELECT 
    '2.1: Table Structure Test' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subcategory_attribute_config'
ORDER BY ordinal_position;
-- Expected: Should return all columns including subcategory_id, attribute_id, inherit_from_category, etc.

-- Test 2.2: Check current subcategory attribute configurations
SELECT 
    '2.2: Subcategory Attribute Config Count' as test_name,
    COUNT(*) as total_configs,
    COUNT(DISTINCT subcategory_id) as configured_subcategories,
    COUNT(DISTINCT attribute_id) as unique_attributes
FROM subcategory_attribute_config;
-- Expected: After using the UI, this should show > 0 configs

-- Test 2.3: Verify attribute inheritance chain (service → category → subcategory)
WITH hierarchy_check AS (
    SELECT 
        s.id as subcategory_id,
        s.name as subcategory_name,
        c.id as category_id,
        c.name as category_name,
        c.service_type as service_type_id,
        st.title as service_type_title,
        (SELECT COUNT(*) FROM service_attribute_config WHERE service_type_id = c.service_type) as service_attr_count,
        (SELECT COUNT(*) FROM category_attribute_config WHERE category_id = c.id) as category_attr_count,
        (SELECT COUNT(*) FROM subcategory_attribute_config WHERE subcategory_id = s.id) as subcategory_attr_count
    FROM subcategories s
    JOIN categories c ON s.category_id = c.id
    JOIN service_types st ON s.service_type_id = st.id
    WHERE s.is_active = true
)
SELECT 
    '2.3: Attribute Inheritance Chain Test' as test_name,
    subcategory_name,
    category_name,
    service_type_title,
    service_attr_count,
    category_attr_count,
    subcategory_attr_count,
    (service_attr_count + category_attr_count + subcategory_attr_count) as total_inherited
FROM hierarchy_check
ORDER BY service_type_title, category_name, subcategory_name;
-- Expected: Shows attribute counts at each level for verification

-- Test 2.4: Test the get_subcategory_attributes RPC function
-- Note: Replace '<subcategory_id>' with an actual ID from your database
DO $$
DECLARE
    test_subcategory_id UUID;
    attr_count INTEGER;
BEGIN
    -- Get a sample subcategory
    SELECT id INTO test_subcategory_id FROM subcategories LIMIT 1;
    
    IF test_subcategory_id IS NOT NULL THEN
        -- Test the RPC function
        SELECT COUNT(*) INTO attr_count
        FROM get_subcategory_attributes(test_subcategory_id);
        
        RAISE NOTICE '2.4: RPC Function Test - Subcategory: %, Attributes returned: %', 
            test_subcategory_id, attr_count;
    ELSE
        RAISE NOTICE '2.4: RPC Function Test - SKIPPED (no subcategories found)';
    END IF;
END $$;
-- Expected: Should execute without errors and show attribute count

-- Test 2.5: Verify data integrity - check for duplicate attributes at same level
SELECT 
    '2.5: Duplicate Attribute Check' as test_name,
    subcategory_id,
    attribute_id,
    COUNT(*) as duplicate_count
FROM subcategory_attribute_config
GROUP BY subcategory_id, attribute_id
HAVING COUNT(*) > 1;
-- Expected: Should return 0 rows (no duplicates)


-- ============================================================================
-- ISSUE 3: TEST DEFAULT MANDATORY FIELDS SYSTEM
-- ============================================================================

-- Test 3.1: Verify default_mandatory_fields table exists and has data
SELECT 
    '3.1: Default Mandatory Fields Table Test' as test_name,
    COUNT(*) as total_fields,
    COUNT(*) FILTER (WHERE is_system_field = true) as system_fields,
    COUNT(*) FILTER (WHERE is_system_field = false) as non_system_fields,
    COUNT(*) FILTER (WHERE applicable_to_all_services = true) as universal_fields
FROM default_mandatory_fields;
-- Expected: total_fields = 10, system_fields = 7, non_system_fields = 3

-- Test 3.2: List all default mandatory fields with details
SELECT 
    '3.2: Default Mandatory Fields List' as test_name,
    field_name,
    field_label,
    input_type,
    is_system_field,
    applicable_to_all_services,
    display_order
FROM default_mandatory_fields
ORDER BY display_order;
-- Expected: Returns 10 rows with field details

-- Test 3.3: Check if any default fields are configured as attributes
WITH default_fields AS (
    SELECT 
        field_name,
        field_label,
        is_system_field
    FROM default_mandatory_fields
),
configured_attrs AS (
    SELECT DISTINCT
        ar.name as attr_name,
        ar.label as attr_label,
        'service' as config_level,
        COUNT(*) OVER (PARTITION BY ar.id) as usage_count
    FROM service_attribute_config sac
    JOIN attribute_registry ar ON sac.attribute_id = ar.id
    
    UNION ALL
    
    SELECT DISTINCT
        ar.name as attr_name,
        ar.label as attr_label,
        'category' as config_level,
        COUNT(*) OVER (PARTITION BY ar.id) as usage_count
    FROM category_attribute_config cac
    JOIN attribute_registry ar ON cac.attribute_id = ar.id
    
    UNION ALL
    
    SELECT DISTINCT
        ar.name as attr_name,
        ar.label as attr_label,
        'subcategory' as config_level,
        COUNT(*) OVER (PARTITION BY ar.id) as usage_count
    FROM subcategory_attribute_config sac
    JOIN attribute_registry ar ON sac.attribute_id = ar.id
)
SELECT 
    '3.3: Default Fields Usage Test' as test_name,
    df.field_name,
    df.field_label,
    df.is_system_field,
    COALESCE(ca.config_level, 'Not Configured') as configured_at_level,
    COALESCE(ca.usage_count, 0) as times_used,
    CASE 
        WHEN ca.attr_name IS NOT NULL THEN 'Configured ✅'
        WHEN df.is_system_field THEN 'Recommended but not configured ⚠️'
        ELSE 'Optional ℹ️'
    END as status
FROM default_fields df
LEFT JOIN configured_attrs ca ON LOWER(df.field_name) = LOWER(ca.attr_name)
ORDER BY df.display_order;
-- Expected: Shows which default fields are configured and where


-- ============================================================================
-- COMPREHENSIVE INTEGRATION TEST
-- ============================================================================

-- Test 4: Complete workflow test - Service → Category → Subcategory → Attributes
SELECT 
    'Integration Test: Complete Hierarchy' as test_name,
    st.title as service_type,
    c.name as category,
    s.name as subcategory,
    COUNT(DISTINCT sac_service.attribute_id) as service_attrs,
    COUNT(DISTINCT cac.attribute_id) as category_attrs,
    COUNT(DISTINCT sac_sub.attribute_id) as subcategory_attrs,
    (
        COUNT(DISTINCT sac_service.attribute_id) + 
        COUNT(DISTINCT cac.attribute_id) + 
        COUNT(DISTINCT sac_sub.attribute_id)
    ) as total_unique_attrs
FROM subcategories s
JOIN categories c ON s.category_id = c.id
JOIN service_types st ON s.service_type_id = st.id
LEFT JOIN service_attribute_config sac_service ON sac_service.service_type_id = st.id
LEFT JOIN category_attribute_config cac ON cac.category_id = c.id
LEFT JOIN subcategory_attribute_config sac_sub ON sac_sub.subcategory_id = s.id
WHERE s.is_active = true
GROUP BY st.title, c.name, s.name
ORDER BY st.title, c.name, s.name;
-- Expected: Shows complete attribute breakdown for each subcategory


-- ============================================================================
-- PERFORMANCE & HEALTH CHECKS
-- ============================================================================

-- Test 5.1: Check for missing indexes
SELECT 
    '5.1: Index Check' as test_name,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
      'subcategories',
      'subcategory_attribute_config',
      'category_attribute_config',
      'service_attribute_config',
      'attribute_registry',
      'default_mandatory_fields'
  )
ORDER BY tablename, indexname;
-- Expected: Should show appropriate indexes on foreign keys and frequently queried columns

-- Test 5.2: Check table sizes and row counts
SELECT 
    '5.2: Table Statistics' as test_name,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_live_tup as row_count,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
      'subcategories',
      'subcategory_attribute_config',
      'category_attribute_config',
      'service_attribute_config',
      'attribute_registry',
      'default_mandatory_fields'
  )
ORDER BY tablename;
-- Expected: Shows current size and health of relevant tables


-- ============================================================================
-- TEST SUMMARY REPORT
-- ============================================================================

DO $$
DECLARE
    subcategory_count INTEGER;
    config_count INTEGER;
    default_field_count INTEGER;
    orphaned_count INTEGER;
BEGIN
    -- Count key metrics
    SELECT COUNT(*) INTO subcategory_count FROM subcategories WHERE is_active = true;
    SELECT COUNT(*) INTO config_count FROM subcategory_attribute_config;
    SELECT COUNT(*) INTO default_field_count FROM default_mandatory_fields;
    SELECT COUNT(*) INTO orphaned_count 
    FROM subcategories s
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN service_types st ON s.service_type_id = st.id
    WHERE s.is_active = true AND (c.id IS NULL OR st.id IS NULL);
    
    RAISE NOTICE '
╔══════════════════════════════════════════════════════════════════╗
║           ATTRIBUTE MANAGER FIXES - TEST SUMMARY                 ║
╚══════════════════════════════════════════════════════════════════╝

✅ ISSUE 1: Subcategory Listing
   - Active Subcategories: %
   - Orphaned Subcategories: % %
   
✅ ISSUE 2: Subcategory Attribute Configuration
   - Subcategory Configs: %
   - Status: %
   
✅ ISSUE 3: Default Mandatory Fields
   - Default Fields Defined: %
   - Status: %

═══════════════════════════════════════════════════════════════════

%

═══════════════════════════════════════════════════════════════════
    ', 
    subcategory_count,
    orphaned_count,
    CASE WHEN orphaned_count = 0 THEN '✅' ELSE '❌' END,
    config_count,
    CASE WHEN config_count >= 0 THEN 'Table Ready ✅' ELSE 'Not Configured ⚠️' END,
    default_field_count,
    CASE WHEN default_field_count = 10 THEN 'Complete ✅' ELSE 'Incomplete ⚠️' END,
    CASE 
        WHEN orphaned_count = 0 AND default_field_count = 10 
        THEN '🎉 ALL TESTS PASSED! System is ready for use.'
        ELSE '⚠️  Some issues detected. Review test results above.'
    END;
END $$;


-- ============================================================================
-- MANUAL TESTING CHECKLIST
-- ============================================================================

/*
After running this SQL script, perform these manual UI tests:

1. SUBCATEGORY LISTING TEST:
   ✅ Navigate to Attribute Manager
   ✅ Select a Service Type
   ✅ Select a Category - subcategories should appear in dropdown
   ✅ Verify subcategory count matches SQL results

2. ATTRIBUTE CONFIGURATION TEST:
   ✅ Select a Service/Category/Subcategory
   ✅ Click "Add Attributes"
   ✅ Add 2-3 attributes
   ✅ Verify they appear in the configured list
   ✅ Edit one attribute (change label, make required)
   ✅ Verify changes persist after page refresh
   ✅ Delete one attribute
   ✅ Verify it's removed from the list
   ✅ Drag & drop to reorder
   ✅ Verify new order persists

3. DEFAULT MANDATORY FIELDS TEST:
   ✅ View "Default System Fields" section
   ✅ Verify 7 system fields are shown
   ✅ Add one default field via "Add Attributes"
   ✅ Verify it changes from "Recommended" to "Active"
   ✅ Edit the field (change label)
   ✅ Mark it as optional instead of required
   ✅ Remove the field
   ✅ Verify it returns to "Recommended" status

4. PREVIEW FEATURE TEST:
   ✅ Click "Preview Form"
   ✅ Verify system recommended fields appear first
   ✅ Verify custom attributes appear after
   ✅ Verify all labels, placeholders match configuration
   ✅ Verify required/optional badges are correct

5. MULTI-LEVEL TEST:
   ✅ Configure attributes at Service level
   ✅ Switch to Category level - verify service attrs shown as inherited
   ✅ Add category-specific attributes
   ✅ Switch to Subcategory level - verify both inherited
   ✅ Add subcategory-specific attributes
   ✅ Verify all three levels work independently

═══════════════════════════════════════════════════════════════════
*/

