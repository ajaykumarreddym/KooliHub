-- ========================================
-- SUBCATEGORY DIAGNOSTIC AND FIX SCRIPT
-- ========================================
-- This script diagnoses and fixes subcategory listing issues
-- Run this in Supabase SQL Editor

-- Step 1: Check current categories structure
SELECT 
    'Current Categories Structure' as info,
    id,
    name,
    service_type,
    parent_id,
    level,
    is_active,
    sort_order
FROM categories
ORDER BY service_type, parent_id NULLS FIRST, sort_order;

-- Step 2: Check if parent_id column exists and is properly indexed
SELECT 
    'Parent ID Column Check' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'categories' 
AND column_name = 'parent_id';

-- Step 3: Count categories by level
SELECT 
    'Categories by Level' as info,
    level,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM categories
GROUP BY level
ORDER BY level;

-- Step 4: Find categories with subcategories
SELECT 
    'Categories with Subcategories' as info,
    parent.id as category_id,
    parent.name as category_name,
    parent.service_type,
    COUNT(child.id) as subcategory_count
FROM categories parent
LEFT JOIN categories child ON child.parent_id = parent.id
WHERE parent.parent_id IS NULL
GROUP BY parent.id, parent.name, parent.service_type
HAVING COUNT(child.id) > 0
ORDER BY parent.name;

-- Step 5: Find orphaned subcategories (parent doesn't exist)
SELECT 
    'Orphaned Subcategories' as info,
    c.id,
    c.name,
    c.parent_id,
    c.service_type
FROM categories c
WHERE c.parent_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM categories p WHERE p.id = c.parent_id
);

-- Step 6: Check for level inconsistencies
SELECT 
    'Level Inconsistencies' as info,
    c.id,
    c.name,
    c.parent_id,
    c.level,
    p.level as parent_level,
    CASE 
        WHEN p.level IS NULL AND c.level != 0 THEN 'Root should be level 0'
        WHEN p.level IS NOT NULL AND c.level != p.level + 1 THEN 'Child level should be parent + 1'
        ELSE 'OK'
    END as issue
FROM categories c
LEFT JOIN categories p ON p.id = c.parent_id
WHERE 
    (p.level IS NULL AND c.level != 0) OR
    (p.level IS NOT NULL AND c.level != p.level + 1);

-- Step 7: Fix missing parent_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added parent_id column to categories table';
    ELSE
        RAISE NOTICE 'parent_id column already exists';
    END IF;
END $$;

-- Step 8: Ensure level column exists and has default values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'level'
    ) THEN
        ALTER TABLE categories ADD COLUMN level INTEGER DEFAULT 0;
        RAISE NOTICE 'Added level column to categories table';
    ELSE
        RAISE NOTICE 'level column already exists';
    END IF;
END $$;

-- Step 9: Fix level values based on parent_id
UPDATE categories
SET level = 0
WHERE parent_id IS NULL AND level IS NULL;

UPDATE categories c
SET level = p.level + 1
FROM categories p
WHERE c.parent_id = p.id
AND (c.level IS NULL OR c.level != p.level + 1);

-- Step 10: Create index on parent_id for better performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_service_type_parent ON categories(service_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;

-- Step 11: Sample query to fetch subcategories (what the app should use)
SELECT 
    'Sample Subcategory Query for Service' as info,
    id,
    name,
    description,
    parent_id,
    level,
    sort_order
FROM categories
WHERE parent_id = (
    -- Replace this with actual category ID
    SELECT id FROM categories WHERE parent_id IS NULL LIMIT 1
)
AND is_active = true
ORDER BY sort_order;

-- Step 12: Create helper function to get subcategories
CREATE OR REPLACE FUNCTION get_subcategories(p_category_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    service_type UUID,
    parent_id UUID,
    level INTEGER,
    is_active BOOLEAN,
    sort_order INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.service_type,
        c.parent_id,
        c.level,
        c.is_active,
        c.sort_order,
        c.created_at
    FROM categories c
    WHERE c.parent_id = p_category_id
    AND c.is_active = true
    ORDER BY c.sort_order, c.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 13: Verify the fix - Show all subcategories with their parents
SELECT 
    'Verification - All Subcategories with Parents' as info,
    p.name as parent_category,
    p.service_type as parent_service,
    c.id as subcategory_id,
    c.name as subcategory_name,
    c.level,
    c.is_active,
    c.sort_order
FROM categories c
JOIN categories p ON p.id = c.parent_id
WHERE c.parent_id IS NOT NULL
ORDER BY p.name, c.sort_order;

-- Step 14: Show summary
SELECT 
    'Summary' as info,
    (SELECT COUNT(*) FROM categories WHERE parent_id IS NULL) as root_categories,
    (SELECT COUNT(*) FROM categories WHERE parent_id IS NOT NULL) as subcategories,
    (SELECT COUNT(*) FROM categories WHERE is_active = true) as active_categories,
    (SELECT COUNT(*) FROM categories WHERE is_active = false OR is_active IS NULL) as inactive_categories;

