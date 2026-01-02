# Fix Preview Error - Step by Step Instructions

## Error
```
Preview Error
Could not find the function public.get_product_form_attributes_v2(p_category_id, p_service_type_id, p_subcategory_id) in the schema cache
```

## Root Cause
The database function `get_product_form_attributes_v2` doesn't exist in your Supabase database. The migration file exists locally but hasn't been applied to the database yet.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the SQL Script
1. Open the file: `APPLY_PREVIEW_FIX_IN_SUPABASE.sql`
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click **Run** or press `Cmd/Ctrl + Enter`

### Step 3: Verify Success
You should see:
```
Function created successfully!
function_name: get_product_form_attributes_v2
num_parameters: 3
```

### Step 4: Test the Preview
1. Go back to your KooliHub admin panel
2. Navigate to **Service Management → Attribute Configuration**
3. Select a Service Type
4. Click **Preview Form** button
5. The preview should now work without errors!

## What This Function Does

The `get_product_form_attributes_v2` function:
- ✅ Returns ALL mandatory fields from `default_mandatory_fields` table
- ✅ Merges service-level attributes
- ✅ Merges category-level attributes
- ✅ Merges subcategory-level attributes
- ✅ Handles inheritance properly (child overrides parent)
- ✅ Includes metadata: `inherited_from`, `is_mandatory`, `is_system_field`

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
cd /Users/ajayreddy/koolihub
supabase db push
```

This will apply all pending migrations including the preview function.

## Troubleshooting

### Error: "relation default_mandatory_fields does not exist"
You need to create the `default_mandatory_fields` table first. Run the main setup SQL:
```bash
# In Supabase SQL Editor, run:
APPLY_THIS_IN_SUPABASE_SQL_EDITOR.sql
```

### Error: "relation attribute_registry does not exist"
Your database schema is incomplete. You need to run the comprehensive setup:
1. Run `APPLY_THIS_IN_SUPABASE_SQL_EDITOR.sql` first
2. Then run `APPLY_PREVIEW_FIX_IN_SUPABASE.sql`

### Function created but preview still fails
1. Check browser console for detailed error
2. Verify you have data in `default_mandatory_fields`:
   ```sql
   SELECT * FROM default_mandatory_fields ORDER BY display_order;
   ```
3. Clear your browser cache and reload

## Files Reference

- `APPLY_PREVIEW_FIX_IN_SUPABASE.sql` - Creates the preview function
- `APPLY_THIS_IN_SUPABASE_SQL_EDITOR.sql` - Full database setup (if needed)
- `supabase/migrations/20250115_add_naming_convention_system.sql` - Original migration file

## Next Steps After Fix

Once the function is created:
1. ✅ Preview will show all mandatory fields
2. ✅ Preview will show custom attributes from service/category/subcategory
3. ✅ Preview will show proper inheritance information
4. ✅ Error handling will provide clear feedback

## Support

If you still encounter issues:
1. Check the browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify all tables exist: `default_mandatory_fields`, `attribute_registry`, `service_attribute_config`, `category_attribute_config`


