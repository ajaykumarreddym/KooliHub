-- Migration: Setup Storage Policies for Existing "assets" Bucket
-- Date: 2025-01-23
-- Description: Configure policies for the existing "assets" bucket to support entity image uploads

-- =====================================================
-- STORAGE BUCKET POLICIES FOR "assets" BUCKET
-- =====================================================

-- Note: The "assets" bucket already exists in Supabase
-- This migration sets up the necessary policies for secure image uploads

-- =====================================================
-- 1. DROP EXISTING POLICIES (IF ANY)
-- =====================================================

DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- =====================================================
-- 2. CREATE NEW POLICIES
-- =====================================================

-- Policy 1: Public Read Access
-- Anyone can view files in the assets bucket
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assets' );

-- Policy 2: Authenticated Upload
-- Authenticated users can upload files to the assets bucket
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Authenticated Update
-- Authenticated users can update their files
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'assets' 
  AND auth.role() = 'authenticated' 
)
WITH CHECK ( 
  bucket_id = 'assets' 
  AND auth.role() = 'authenticated' 
);

-- Policy 4: Authenticated Delete
-- Authenticated users can delete their files
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'assets' 
  AND auth.role() = 'authenticated' 
);

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify policies were created
DO $$
BEGIN
    RAISE NOTICE 'Storage policies for "assets" bucket have been configured successfully!';
    RAISE NOTICE 'The following policies are now active:';
    RAISE NOTICE '1. Public read access - Anyone can view files';
    RAISE NOTICE '2. Authenticated upload - Logged-in users can upload';
    RAISE NOTICE '3. Authenticated update - Logged-in users can update files';
    RAISE NOTICE '4. Authenticated delete - Logged-in users can delete files';
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
    'Storage policies configured successfully!' as status,
    'assets' as bucket_name,
    'Image uploads are now ready to use!' as message;

