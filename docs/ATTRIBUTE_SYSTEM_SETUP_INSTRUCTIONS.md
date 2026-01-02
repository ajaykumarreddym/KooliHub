# Attribute Inheritance System - Setup Instructions

## ⚡ Quick Setup (5 Minutes)

Follow these steps to enable the comprehensive attribute inheritance system in your KooliHub instance.

## Step 1: Apply Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your KooliHub project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute Migration**
   - Open file: `supabase/migrations/20250118_comprehensive_attribute_inheritance.sql`
   - Copy ALL content
   - Paste into Supabase SQL Editor
   - Click **"Run"** (or press Cmd/Ctrl + Enter)

4. **Verify Success**
   - You should see: `SUCCESS! Comprehensive attribute inheritance system is ready!`
   - If you see any errors, check the error message and try again

### Option B: Using Supabase CLI

```bash
# Make sure you're in the project root
cd /path/to/koolihub

# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up 20250118_comprehensive_attribute_inheritance
```

## Step 2: Verify Installation

Run this query in Supabase SQL Editor to verify functions exist:

```sql
-- Check if functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_product_form_attributes_v2',
    'get_attributes_with_inheritance'
);
```

**Expected Result:**
```
routine_name                          | routine_type
--------------------------------------|-------------
get_product_form_attributes_v2        | FUNCTION
get_attributes_with_inheritance       | FUNCTION
```

## Step 3: Test the System

### Test 1: Check Mandatory Fields

```sql
SELECT * FROM default_mandatory_fields ORDER BY display_order;
```

You should see system fields like:
- product_name
- product_description
- price
- units
- product_images

### Test 2: Test Attribute Function

```sql
-- Test with just a service type
SELECT 
    attribute_name,
    attribute_label,
    inherited_from,
    inheritance_level
FROM get_product_form_attributes_v2(
    'grocery',  -- Replace with your service type ID
    NULL,
    NULL
)
ORDER BY display_order;
```

## Step 4: Access Admin Panel

1. **Navigate to Service Management**
   - URL: `http://localhost:8080/admin/service-management`
   - (Or your production URL)

2. **Click on Attribute Configuration Tab**
   - You should see four tabs: Service, Category, Subcategory, Defaults

3. **Test Service Level Configuration**
   - Select a service type from dropdown
   - Click "Add Attributes"
   - Select some attributes and click "Add X Attribute(s)"
   - Click "Preview Form" to see the complete form

## What You Get

### ✅ Features Enabled

1. **Hierarchical Attribute Management**
   - Service-level attributes
   - Category-level attributes (inherit from service)
   - Subcategory-level attributes (inherit from service + category)

2. **Visual Inheritance Indicators**
   - Blue-highlighted inherited attributes
   - White background direct attributes
   - Badges showing inheritance source

3. **Statistics Dashboard**
   - Direct attribute count
   - Inherited attribute count
   - Required fields count
   - Total form fields

4. **Smart Preview System**
   - Shows complete merged form
   - Includes all inheritance levels
   - Real-time form preview

5. **Attribute Management**
   - Add/Edit/Delete attributes
   - Reorder attributes
   - Toggle required status
   - Override labels and placeholders

## Common Issues & Solutions

### Issue 1: Function Not Found Error
**Symptom:** "function get_product_form_attributes_v2 does not exist"

**Solution:**
1. Verify migration was applied successfully
2. Check function exists: `\df get_product_form_attributes_v2` in psql
3. Re-run the migration SQL

### Issue 2: RLS Policy Errors
**Symptom:** "new row violates row-level security policy"

**Solution:**
The migration includes RLS policies. Ensure you're logged in as:
- Admin role: Full access
- Vendor Admin role: Vendor-specific access

### Issue 3: Attributes Not Showing
**Symptom:** Added attributes don't appear in preview

**Solution:**
1. Check `is_active = true` in attribute_registry
2. Check `is_visible = true` in service/category config
3. Refresh the page
4. Check browser console for errors

### Issue 4: Preview Shows Empty Form
**Symptom:** Preview only shows mandatory fields

**Solution:**
1. Ensure attributes are configured at service level
2. Select correct service/category/subcategory
3. Check database function returns data:
   ```sql
   SELECT * FROM get_product_form_attributes_v2('your_service_id', NULL, NULL);
   ```

## Database Schema Overview

### New Functions Created

1. **`get_product_form_attributes_v2()`**
   - Purpose: Get complete merged attribute list for product forms
   - Used by: Product creation/edit forms
   - Returns: All attributes with inheritance applied

2. **`get_attributes_with_inheritance()`**
   - Purpose: Get attributes with inheritance metadata for admin
   - Used by: Admin attribute configuration panel
   - Returns: Attributes with is_direct and inherited_from flags

### Existing Tables Used

- `attribute_registry` - Master attribute library
- `service_attribute_config` - Service-level configuration
- `category_attribute_config` - Category/Subcategory configuration
- `default_mandatory_fields` - System mandatory fields

### New Columns Added

Both config tables now have:
- `is_editable` - Whether attribute can be edited (default: true)
- `is_deletable` - Whether attribute can be deleted (default: true)

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Functions exist in database
- [ ] Mandatory fields populated
- [ ] Can access Attribute Configuration in admin
- [ ] Can add service-level attributes
- [ ] Can add category-level attributes
- [ ] Can add subcategory-level attributes
- [ ] Inherited attributes show with blue background
- [ ] Statistics show correct counts
- [ ] Preview form displays all attributes
- [ ] Can edit direct attributes
- [ ] Cannot edit inherited attributes (disabled)
- [ ] Can reorder attributes
- [ ] Can toggle required status
- [ ] Can delete attributes

## Next Steps

1. **Configure Service Attributes**
   - Go through each service type
   - Add commonly used attributes
   - Set appropriate required statuses

2. **Configure Category Attributes**
   - Add category-specific attributes
   - Review inherited attributes
   - Adjust as needed

3. **Configure Subcategory Attributes**
   - Add niche subcategory attributes
   - Verify complete inheritance chain

4. **Test Product Creation**
   - Create a product in each category
   - Verify all attributes appear
   - Check form usability

5. **Train Admin Team**
   - Share the comprehensive guide
   - Demonstrate the hierarchy
   - Explain inheritance rules

## Support Resources

- **Comprehensive Guide**: `ATTRIBUTE_INHERITANCE_SYSTEM_GUIDE.md`
- **Database Schema**: `supabase/migrations/20250118_comprehensive_attribute_inheritance.sql`
- **Component Code**: `client/components/admin/ComprehensiveAttributeManagement.tsx`

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove functions
DROP FUNCTION IF EXISTS get_product_form_attributes_v2;
DROP FUNCTION IF EXISTS get_attributes_with_inheritance;

-- Remove new columns (optional)
ALTER TABLE service_attribute_config DROP COLUMN IF EXISTS is_editable;
ALTER TABLE service_attribute_config DROP COLUMN IF EXISTS is_deletable;
ALTER TABLE category_attribute_config DROP COLUMN IF EXISTS is_editable;
ALTER TABLE category_attribute_config DROP COLUMN IF EXISTS is_deletable;
```

---

**Setup Complete!** 🎉

Your KooliHub instance now has a complete attribute inheritance system ready to use.

**Questions?** Refer to `ATTRIBUTE_INHERITANCE_SYSTEM_GUIDE.md` for detailed usage instructions.

