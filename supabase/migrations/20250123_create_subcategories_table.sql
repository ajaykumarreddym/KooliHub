-- Migration: Create Separate Subcategories Table
-- Date: 2025-01-23
-- Description: Create dedicated subcategories table and migrate data from categories table

-- =====================================================
-- 1. CREATE SUBCATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    image_url TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT subcategories_image_url_check 
        CHECK (image_url IS NULL OR image_url = '' OR image_url LIKE 'https://%')
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_service_type ON public.subcategories(service_type);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON public.subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_subcategories_sort_order ON public.subcategories(sort_order);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_sort ON public.subcategories(category_id, sort_order);

-- =====================================================
-- 3. MIGRATE EXISTING SUBCATEGORIES FROM CATEGORIES TABLE
-- =====================================================

-- Migrate subcategories (where parent_id is NOT NULL)
INSERT INTO public.subcategories (
    id,
    name,
    description,
    icon,
    color,
    image_url,
    category_id,
    service_type,
    is_active,
    sort_order,
    created_at,
    updated_at
)
SELECT 
    id,
    name,
    description,
    icon,
    color,
    image_url,
    parent_id as category_id,
    service_type,
    is_active,
    sort_order,
    created_at,
    updated_at
FROM public.categories
WHERE parent_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. CLEAN UP CATEGORIES TABLE (Remove subcategories)
-- =====================================================

-- Remove subcategories from categories table (keep only parent categories)
DELETE FROM public.categories
WHERE parent_id IS NOT NULL;

-- Remove parent_id and level columns from categories (no longer needed)
ALTER TABLE public.categories DROP COLUMN IF EXISTS parent_id;
ALTER TABLE public.categories DROP COLUMN IF EXISTS level;

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Admin can manage subcategories" ON public.subcategories;

-- Public read access to active subcategories
CREATE POLICY "Anyone can view active subcategories" 
ON public.subcategories
FOR SELECT 
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin can manage subcategories" 
ON public.subcategories
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- 6. CREATE UPDATED_AT TRIGGER
-- =====================================================

CREATE TRIGGER update_subcategories_updated_at
    BEFORE UPDATE ON public.subcategories
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. UPDATE PRODUCTS TABLE TO SUPPORT SUBCATEGORIES
-- =====================================================

-- Add subcategory_id column to products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'subcategory_id'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_products_subcategory_id ON public.products(subcategory_id);
    END IF;
END $$;

-- =====================================================
-- 8. CREATE VIEW FOR FULL CATEGORY HIERARCHY
-- =====================================================

CREATE OR REPLACE VIEW public.category_hierarchy_full AS
SELECT 
    st.id as service_type_id,
    st.title as service_type_name,
    st.icon as service_icon,
    st.color as service_color,
    st.is_active as service_active,
    c.id as category_id,
    c.name as category_name,
    c.description as category_description,
    c.icon as category_icon,
    c.color as category_color,
    c.image_url as category_image,
    c.is_active as category_active,
    c.sort_order as category_sort,
    sc.id as subcategory_id,
    sc.name as subcategory_name,
    sc.description as subcategory_description,
    sc.icon as subcategory_icon,
    sc.color as subcategory_color,
    sc.image_url as subcategory_image,
    sc.is_active as subcategory_active,
    sc.sort_order as subcategory_sort
FROM public.service_types st
LEFT JOIN public.categories c ON c.service_type = st.id
LEFT JOIN public.subcategories sc ON sc.category_id = c.id
ORDER BY st.sort_order, c.sort_order, sc.sort_order;

-- =====================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.subcategories IS 'Subcategories table - child categories under main categories';
COMMENT ON COLUMN public.subcategories.category_id IS 'Foreign key to parent category';
COMMENT ON COLUMN public.subcategories.service_type IS 'Denormalized service type for faster queries';
COMMENT ON COLUMN public.subcategories.icon IS 'Emoji icon for visual representation';
COMMENT ON COLUMN public.subcategories.color IS 'Tailwind gradient color class for theming';
COMMENT ON COLUMN public.subcategories.image_url IS 'Public URL to subcategory image (must be HTTPS)';
COMMENT ON COLUMN public.subcategories.sort_order IS 'Display order within parent category';

COMMENT ON VIEW public.category_hierarchy_full IS 'Complete hierarchy: Service Types -> Categories -> Subcategories';

-- Grant permissions
GRANT SELECT ON public.category_hierarchy_full TO authenticated;
GRANT SELECT ON public.category_hierarchy_full TO anon;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Subcategories table created successfully! Data migrated from categories table.' as status;

