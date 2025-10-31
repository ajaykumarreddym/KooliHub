-- Migration: Fix Storage Bucket and Add Missing Fields
-- Date: 2025-01-23
-- Description: Ensure all required fields exist and create storage bucket setup instructions

-- =====================================================
-- 1. ENSURE SERVICE_TYPES TABLE HAS ALL REQUIRED FIELDS
-- =====================================================

-- Check and add missing columns to service_types table
DO $$ 
BEGIN
    -- Add icon column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'icon'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN icon TEXT;
    END IF;
    
    -- Add color column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'color'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN color TEXT;
    END IF;
    
    -- Add image_url column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add description column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN description TEXT;
    END IF;
    
    -- Add features column if not exists (for service-specific features)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'features'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN features JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add is_active column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add sort_order column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    
    -- Add created_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_types' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.service_types ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 2. ENSURE CATEGORIES TABLE HAS ALL REQUIRED FIELDS
-- =====================================================

DO $$ 
BEGIN
    -- Add icon column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'icon'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN icon TEXT;
    END IF;
    
    -- Add color column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'color'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN color TEXT;
    END IF;
END $$;

-- =====================================================
-- 3. CREATE STORAGE BUCKET SETUP FUNCTION
-- =====================================================

-- Function to help create storage bucket (run manually in Supabase Dashboard)
-- This is a reference - actual bucket creation must be done via Supabase Dashboard

-- Create a helper table to store bucket configuration
CREATE TABLE IF NOT EXISTS public._storage_bucket_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_name TEXT NOT NULL,
    public BOOLEAN DEFAULT true,
    file_size_limit BIGINT DEFAULT 5242880, -- 5MB in bytes
    allowed_mime_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert configuration for assets bucket (using existing bucket)
INSERT INTO public._storage_bucket_config (
    bucket_name,
    public,
    file_size_limit,
    allowed_mime_types,
    instructions
) VALUES (
    'assets',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    'Using existing "assets" bucket - verify policies:
    
    1. Go to Supabase Dashboard > Storage
    2. Click on "assets" bucket
    3. Go to "Policies" tab
    4. Ensure these policies exist:
       
       Policy 1 - Public Read:
       - Name: "Public read access"
       - Allowed operation: SELECT
       - Policy: (bucket_id = ''assets'')
       
       Policy 2 - Authenticated Upload:
       - Name: "Authenticated users can upload"
       - Allowed operation: INSERT
       - Policy: (bucket_id = ''assets'' AND auth.role() = ''authenticated'')
       
       Policy 3 - Authenticated Update:
       - Name: "Authenticated users can update"
       - Allowed operation: UPDATE
       - Policy: (bucket_id = ''assets'' AND auth.role() = ''authenticated'')
       
       Policy 4 - Authenticated Delete:
       - Name: "Authenticated users can delete"
       - Allowed operation: DELETE
       - Policy: (bucket_id = ''assets'' AND auth.role() = ''authenticated'')
    '
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. ADD VALIDATION CONSTRAINTS
-- =====================================================

-- Image URL validation for service_types
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

-- Image URL validation for categories
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

-- =====================================================
-- 5. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_service_types_active ON public.service_types(is_active);
CREATE INDEX IF NOT EXISTS idx_service_types_sort_order ON public.service_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_service_type ON public.categories(service_type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- =====================================================
-- 6. ADD TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for service_types
DROP TRIGGER IF EXISTS update_service_types_updated_at ON public.service_types;
CREATE TRIGGER update_service_types_updated_at
    BEFORE UPDATE ON public.service_types
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for categories (if not exists)
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE public._storage_bucket_config IS 'Configuration and setup instructions for Supabase storage buckets';
COMMENT ON COLUMN public.service_types.icon IS 'Emoji icon for service type visual representation';
COMMENT ON COLUMN public.service_types.color IS 'Tailwind CSS gradient color class for theming';
COMMENT ON COLUMN public.service_types.image_url IS 'Public HTTPS URL to service type image/icon';
COMMENT ON COLUMN public.service_types.description IS 'Detailed description of the service type';
COMMENT ON COLUMN public.service_types.features IS 'JSON object containing service-specific features and settings';

-- =====================================================
-- SUCCESS MESSAGE WITH INSTRUCTIONS
-- =====================================================

DO $$
DECLARE
    instructions TEXT;
BEGIN
    SELECT _storage_bucket_config.instructions INTO instructions
    FROM public._storage_bucket_config
    WHERE bucket_name = 'assets'
    LIMIT 1;
    
    RAISE NOTICE '%', instructions;
    RAISE NOTICE 'Migration completed! Using existing "assets" bucket. Please verify policies.';
END $$;

SELECT 'Using existing "assets" bucket - verify policies in Supabase Dashboard!' as notice,
       instructions as setup_instructions
FROM public._storage_bucket_config
WHERE bucket_name = 'assets';

