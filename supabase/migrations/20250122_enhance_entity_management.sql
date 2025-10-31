-- Migration: Enhance Entity Management Tables
-- Date: 2025-01-22
-- Description: Add image validation, proper indexes, and icon/color fields to categories table

-- Add icon and color columns to categories table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon') THEN
        ALTER TABLE public.categories ADD COLUMN icon TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'color') THEN
        ALTER TABLE public.categories ADD COLUMN color TEXT;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_service_type ON public.categories(service_type);
CREATE INDEX IF NOT EXISTS idx_categories_level ON public.categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON public.categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_service_parent ON public.categories(service_type, parent_id);

-- Create indexes for service_types table
CREATE INDEX IF NOT EXISTS idx_service_types_active ON public.service_types(is_active);
CREATE INDEX IF NOT EXISTS idx_service_types_sort_order ON public.service_types(sort_order);

-- Add constraint for valid image URLs (must be HTTPS or empty)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'categories_image_url_check'
    ) THEN
        ALTER TABLE public.categories 
        ADD CONSTRAINT categories_image_url_check 
        CHECK (image_url IS NULL OR image_url = '' OR image_url LIKE 'https://%');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'service_types_image_url_check'
    ) THEN
        ALTER TABLE public.service_types 
        ADD CONSTRAINT service_types_image_url_check 
        CHECK (image_url IS NULL OR image_url = '' OR image_url LIKE 'https://%');
    END IF;
END $$;

-- Function to validate and sanitize entity data
CREATE OR REPLACE FUNCTION validate_entity_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Trim whitespace from text fields
    IF NEW.name IS NOT NULL THEN
        NEW.name := TRIM(NEW.name);
    END IF;
    
    IF NEW.description IS NOT NULL THEN
        NEW.description := TRIM(NEW.description);
    END IF;
    
    -- Ensure sort_order is not negative
    IF NEW.sort_order < 0 THEN
        NEW.sort_order := 0;
    END IF;
    
    -- Set level based on parent_id for categories
    IF TG_TABLE_NAME = 'categories' THEN
        IF NEW.parent_id IS NULL THEN
            NEW.level := 0;
        ELSE
            NEW.level := 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for data validation
DROP TRIGGER IF EXISTS validate_category_data ON public.categories;
CREATE TRIGGER validate_category_data
    BEFORE INSERT OR UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION validate_entity_data();

-- Add comments for documentation
COMMENT ON TABLE public.categories IS 'Hierarchical category structure using self-referencing parent_id. Level 0 = categories, Level 1 = subcategories. This is industry best practice for hierarchical data.';
COMMENT ON COLUMN public.categories.parent_id IS 'NULL for top-level categories, references another category.id for subcategories';
COMMENT ON COLUMN public.categories.level IS 'Denormalized hierarchy level: 0 for categories, 1 for subcategories, etc.';
COMMENT ON COLUMN public.categories.sort_order IS 'Display order within the same parent. Lower numbers appear first.';
COMMENT ON COLUMN public.categories.icon IS 'Emoji icon for visual representation';
COMMENT ON COLUMN public.categories.color IS 'Tailwind gradient color class for theming';
COMMENT ON COLUMN public.categories.image_url IS 'Public URL to category image (must be HTTPS)';

COMMENT ON TABLE public.service_types IS 'Main service type definitions for the multi-service platform';
COMMENT ON COLUMN public.service_types.sort_order IS 'Display order in service listings. Lower numbers appear first.';
COMMENT ON COLUMN public.service_types.icon IS 'Emoji icon for visual representation';
COMMENT ON COLUMN public.service_types.color IS 'Tailwind gradient color class for theming';
COMMENT ON COLUMN public.service_types.image_url IS 'Public URL to service image (must be HTTPS)';

-- Create view for full category hierarchy
CREATE OR REPLACE VIEW category_hierarchy AS
WITH RECURSIVE category_tree AS (
    -- Base case: top-level categories
    SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        c.color,
        c.image_url,
        c.service_type,
        c.parent_id,
        c.level,
        c.is_active,
        c.sort_order,
        c.created_at,
        c.updated_at,
        c.name::TEXT as path,
        ARRAY[c.sort_order] as sort_path,
        0 as depth
    FROM public.categories c
    WHERE c.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: subcategories
    SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        c.color,
        c.image_url,
        c.service_type,
        c.parent_id,
        c.level,
        c.is_active,
        c.sort_order,
        c.created_at,
        c.updated_at,
        ct.path || ' > ' || c.name,
        ct.sort_path || c.sort_order,
        ct.depth + 1
    FROM public.categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree
ORDER BY sort_path;

COMMENT ON VIEW category_hierarchy IS 'Recursive view showing full category hierarchy with breadcrumb paths';

-- Grant appropriate permissions
GRANT SELECT ON category_hierarchy TO authenticated;
GRANT SELECT ON category_hierarchy TO anon;

