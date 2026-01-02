-- Add vendor_id to products table and create necessary constraints
-- This migration adds vendor relationship to products for multi-vendor support

-- First, check if vendor_id column already exists
DO $$ 
BEGIN
    -- Add vendor_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'vendor_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN vendor_id UUID;
        
        RAISE NOTICE 'Added vendor_id column to products table';
    ELSE
        RAISE NOTICE 'vendor_id column already exists in products table';
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_products_vendor_id'
        AND table_name = 'products'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT fk_products_vendor_id 
        FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint fk_products_vendor_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_products_vendor_id already exists';
    END IF;
END $$;

-- Create index for vendor_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_products_vendor_id'
        AND tablename = 'products'
        AND schemaname = 'public'
    ) THEN
        CREATE INDEX idx_products_vendor_id ON public.products(vendor_id);
        RAISE NOTICE 'Created index idx_products_vendor_id';
    ELSE
        RAISE NOTICE 'Index idx_products_vendor_id already exists';
    END IF;
END $$;

-- Create index for vendor_id + is_active for efficient vendor product filtering
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_products_vendor_active'
        AND tablename = 'products'
        AND schemaname = 'public'
    ) THEN
        CREATE INDEX idx_products_vendor_active ON public.products(vendor_id, is_active);
        RAISE NOTICE 'Created index idx_products_vendor_active';
    ELSE
        RAISE NOTICE 'Index idx_products_vendor_active already exists';
    END IF;
END $$;

-- Update RLS policies to include vendor-based access
-- Drop existing RLS policy if it exists and recreate with vendor support
DO $$
BEGIN
    -- Drop existing policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'products_select_policy'
        AND tablename = 'products'
        AND schemaname = 'public'
    ) THEN
        DROP POLICY products_select_policy ON public.products;
        RAISE NOTICE 'Dropped existing products_select_policy';
    END IF;
    
    -- Create new RLS policy with vendor support
    CREATE POLICY products_select_policy ON public.products
        FOR SELECT USING (
            -- Admin can see all products
            (auth.jwt() ->> 'role' = 'admin') OR
            -- Vendors can see their own products
            (
                vendor_id IN (
                    SELECT v.id FROM public.vendors v
                    JOIN public.vendor_users vu ON v.id = vu.vendor_id
                    WHERE vu.user_id = auth.uid() AND vu.is_active = true
                )
            ) OR
            -- Public can see active products
            (is_active = true)
        );
    
    RAISE NOTICE 'Created new products_select_policy with vendor support';
END $$;

-- Create insert policy for vendors
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'products_insert_policy'
        AND tablename = 'products'
        AND schemaname = 'public'
    ) THEN
        DROP POLICY products_insert_policy ON public.products;
        RAISE NOTICE 'Dropped existing products_insert_policy';
    END IF;
    
    CREATE POLICY products_insert_policy ON public.products
        FOR INSERT WITH CHECK (
            -- Admin can insert products for any vendor
            (auth.jwt() ->> 'role' = 'admin') OR
            -- Vendors can insert products for their own vendor
            (
                vendor_id IN (
                    SELECT v.id FROM public.vendors v
                    JOIN public.vendor_users vu ON v.id = vu.vendor_id
                    WHERE vu.user_id = auth.uid() AND vu.is_active = true
                )
            )
        );
    
    RAISE NOTICE 'Created products_insert_policy with vendor support';
END $$;

-- Create update policy for vendors
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'products_update_policy'
        AND tablename = 'products'
        AND schemaname = 'public'
    ) THEN
        DROP POLICY products_update_policy ON public.products;
        RAISE NOTICE 'Dropped existing products_update_policy';
    END IF;
    
    CREATE POLICY products_update_policy ON public.products
        FOR UPDATE USING (
            -- Admin can update all products
            (auth.jwt() ->> 'role' = 'admin') OR
            -- Vendors can update their own products
            (
                vendor_id IN (
                    SELECT v.id FROM public.vendors v
                    JOIN public.vendor_users vu ON v.id = vu.vendor_id
                    WHERE vu.user_id = auth.uid() AND vu.is_active = true
                )
            )
        );
    
    RAISE NOTICE 'Created products_update_policy with vendor support';
END $$;

-- Create delete policy for vendors
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'products_delete_policy'
        AND tablename = 'products'
        AND schemaname = 'public'
    ) THEN
        DROP POLICY products_delete_policy ON public.products;
        RAISE NOTICE 'Dropped existing products_delete_policy';
    END IF;
    
    CREATE POLICY products_delete_policy ON public.products
        FOR DELETE USING (
            -- Admin can delete all products
            (auth.jwt() ->> 'role' = 'admin') OR
            -- Vendors can delete their own products
            (
                vendor_id IN (
                    SELECT v.id FROM public.vendors v
                    JOIN public.vendor_users vu ON v.id = vu.vendor_id
                    WHERE vu.user_id = auth.uid() AND vu.is_active = true
                )
            )
        );
    
    RAISE NOTICE 'Created products_delete_policy with vendor support';
END $$;

-- Add comment explaining the vendor relationship
COMMENT ON COLUMN public.products.vendor_id IS 'References the vendor that owns this product. Required for multi-vendor marketplace functionality.';

-- Final notification
DO $$
BEGIN
    RAISE NOTICE 'Successfully added vendor support to products table with:';
    RAISE NOTICE '1. vendor_id column with foreign key constraint';
    RAISE NOTICE '2. Optimized indexes for vendor-based queries';
    RAISE NOTICE '3. Row Level Security policies for vendor access control';
    RAISE NOTICE '4. Multi-vendor marketplace functionality is now enabled';
END $$;

