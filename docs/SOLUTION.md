# Fix for "Error fetching area products: [object Object]"

## Root Cause

The error occurs because the `product_area_pricing` table does not exist in your Supabase database. The `useAreaProducts` hook tries to query this table, but since it doesn't exist, Supabase returns an error that gets displayed as "[object Object]".

## Evidence

1. The hook queries `supabase.from("product_area_pricing")` (line 63 in use-area-products.ts)
2. The database schema in `client/lib/supabase.ts` doesn't include this table
3. There's a complete SQL schema ready in `database-product-area-pricing.sql`

## Solution Steps

### Step 1: Create the Missing Table

You need to execute the SQL from `database-product-area-pricing.sql` in your Supabase dashboard:

1. Go to your Supabase dashboard: https://nxipkmxbvdrwdtujjlyr.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the entire content from `database-product-area-pricing.sql`
4. Execute the SQL script

This will create:

- ✅ `product_area_pricing` table with all required columns
- ✅ Proper indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions for pricing calculations
- ✅ Sample data for testing

### Step 2: Verify the Fix

After creating the table, the area products functionality should work immediately. You can test by:

1. Going to Admin → Area Inventory in your app
2. Selecting a service area
3. The products should load without the "[object Object]" error

### Step 3: Alternative Quick Fix (If SQL execution fails)

If you can't execute the full SQL script, here's a minimal version to create just the table:

```sql
CREATE TABLE IF NOT EXISTS public.product_area_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    service_area_id UUID NOT NULL REFERENCES public.serviceable_areas(id) ON DELETE CASCADE,
    area_price DECIMAL(10,2) NOT NULL,
    area_original_price DECIMAL(10,2),
    area_discount_percentage INTEGER DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    max_order_quantity INTEGER DEFAULT 100,
    estimated_delivery_hours INTEGER DEFAULT 24,
    delivery_charge DECIMAL(8,2) DEFAULT 0,
    handling_charge DECIMAL(8,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    promotional_price DECIMAL(10,2),
    promo_start_date TIMESTAMPTZ,
    promo_end_date TIMESTAMPTZ,
    tier_pricing JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, service_area_id)
);

-- Enable RLS
ALTER TABLE public.product_area_pricing ENABLE ROW LEVEL SECURITY;

-- Basic read policy
CREATE POLICY "Anyone can view active product area pricing" ON public.product_area_pricing
    FOR SELECT USING (is_active = true);
```

## Why This Fixes the Error

1. **Table Existence**: Creates the missing table that the hook needs
2. **Proper Schema**: Matches the expected structure from the TypeScript interfaces
3. **RLS Policies**: Ensures proper data access permissions
4. **Sample Data**: The full script includes test data so you can see results immediately

## Additional Benefits

Once the table is created, you'll also have access to:

- ✅ Area-specific product pricing
- ✅ Stock management per area
- ✅ Promotional pricing capabilities
- ✅ Tier-based pricing for bulk orders
- ✅ Custom delivery charges per area

The error will be resolved and the Area Inventory admin page will function correctly.
