# 🧪 Product Form Testing Guide

## Quick Test Steps

### 1. Test Product Creation Form

#### Step 1: Open Product Management
1. Navigate to **Admin Panel → Product Management**
2. Click **"+ Add Product"** button

#### Step 2: Select Service & Category
1. Select a service from the dropdown (e.g., "Grocery", "Fashion")
2. Select a category under that service
3. Click **"Next"** or **"Continue"**

#### Step 3: Verify Form Fields

**Expected Results:**

| Field Type | Expected Behavior | Test |
|------------|------------------|------|
| ✅ **Product Name** | Editable text input (not locked) | Type "Test Product" |
| ✅ **Description** | Multi-line textarea | Type multiple lines |
| ✅ **Price** | Number input with +/- controls | Enter 99.99 |
| ✅ **Vendor** | Dropdown showing vendors | Should show vendor names |
| ✅ **Units** | Dropdown with unit options | Should show units (kg, pcs, etc) |
| ✅ **Product Images** | File input accepting multiple images | Select 2-3 images |
| ✅ **Category Fields** | Dropdowns with correct options | Check if populated |

#### Step 4: Test Dropdowns
1. **Vendor Field**: Click dropdown → Should show list of vendors
2. **Any Select Fields**: Click dropdown → Should show defined options
3. **Any Multiselect Fields**: Should show checkboxes

#### Step 5: Test Multiple Image Upload
1. Click on **Product Images** field
2. Select multiple image files (Ctrl+Click or Cmd+Click)
3. Should see: **"3 file(s) selected"** or similar message

#### Step 6: Test Form Validation
1. Leave required fields empty
2. Click **"Create Product"** or **"Save"**
3. Should see red borders and error messages

#### Step 7: Submit Form
1. Fill all required fields
2. Click **"Create Product"**
3. Should save successfully

---

## 2. Test Attribute Configuration

### Step 1: Open Attribute Configuration
1. Navigate to **Admin Panel → Service Management**
2. Go to **"Attribute Configuration"** tab

### Step 2: Select Service
1. Choose a service from dropdown
2. Click on **"Service Attributes"** tab

### Step 3: Verify Attributes Display
**Expected Results:**
- ✅ Shows list of attributes with correct `input_type`
- ✅ Attributes with options show options count
- ✅ Can add new attributes to service

### Step 4: Test Category Attributes
1. Switch to **"Categories"** tab
2. Select a category
3. Should see:
   - **Inherited attributes** (blue background, from service)
   - **Direct attributes** (white background, category-specific)
   - Can add new attributes

---

## 3. Verify Database State

### Run This Query in Supabase SQL Editor:

```sql
-- Check attribute_registry health
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE input_type IS NOT NULL) as has_input_type,
    COUNT(*) FILTER (WHERE options IS NOT NULL) as has_options,
    COUNT(*) FILTER (WHERE input_type = 'select') as select_fields,
    COUNT(*) FILTER (WHERE input_type = 'multiselect') as multiselect_fields
FROM attribute_registry;
```

**Expected Output:**
```
total: 125
has_input_type: 125
has_options: 59
select_fields: 45
multiselect_fields: 14
```

### Test Product Form Function:

```sql
-- Get form fields for a specific service
SELECT 
    attribute_name,
    label,
    input_type,
    is_required,
    CASE 
        WHEN options IS NOT NULL THEN jsonb_array_length(options)
        ELSE 0
    END as options_count
FROM get_product_form_attributes_v2(
    (SELECT id::text FROM service_types LIMIT 1),
    NULL,
    NULL
)
ORDER BY display_order;
```

**Expected:**
- ✅ Should return 11+ mandatory fields
- ✅ `product_images` should have `input_type = 'image'`
- ✅ `vendor_name` should have `input_type = 'select'`
- ✅ All fields have non-null `input_type`

---

## 4. Common Issues & Solutions

### Issue 1: Vendor Dropdown Empty
**Symptom**: Vendor field shows text input instead of dropdown

**Check:**
```sql
SELECT COUNT(*) FROM vendors WHERE status = 'active' AND deleted_at IS NULL;
```

**Solution**: If count is 0, add vendors:
```sql
INSERT INTO vendors (name, status) VALUES ('Test Vendor 1', 'active');
```

### Issue 2: Dropdown Shows No Options
**Symptom**: Select field renders as text input

**Check:**
```sql
SELECT name, input_type, options 
FROM attribute_registry 
WHERE name = 'field_name_here';
```

**Solution**: Attribute needs options:
```sql
UPDATE attribute_registry
SET options = '[
    {"label":"Option 1","value":"opt1"},
    {"label":"Option 2","value":"opt2"}
]'::jsonb
WHERE name = 'field_name_here';
```

### Issue 3: Fields Still Locked
**Symptom**: Can't type in mandatory fields

**Check Browser Console**: Look for JavaScript errors

**Solution**: Clear browser cache and reload

### Issue 4: Multiple Images Not Working
**Symptom**: Can only select one image

**Check**: Ensure field name is exactly `product_images`

---

## 5. Test Checklist

Before marking as complete, verify:

- [ ] Product creation form opens without errors
- [ ] All mandatory fields are editable (not locked)
- [ ] Vendor dropdown shows active vendors
- [ ] Select fields show their options
- [ ] Multiselect fields show checkboxes
- [ ] Product images field accepts multiple files
- [ ] Number fields have proper controls
- [ ] Validation works (required fields, min/max)
- [ ] Can successfully create a product
- [ ] Attribute configuration shows inheritance correctly
- [ ] No console errors in browser
- [ ] No SQL errors in Supabase logs

---

## 6. Expected Console Output

When opening product form, you should see in browser console:

```
📋 Loaded fields: 15 fields
🔍 Sample field: {attribute_name: "product_name", label: "Product/Offering Name", ...}
🔍 Enhancing vendor_name field, vendors count: 5
```

---

## 7. Rollback If Needed

If something goes wrong:

```sql
-- Restore database
DROP TABLE attribute_registry;
ALTER TABLE attribute_registry_backup_20250119 RENAME TO attribute_registry;

-- Restore function
DROP FUNCTION IF EXISTS public.get_product_form_attributes_v2;
-- Then run the original migration
```

---

## Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **Can create product successfully**
✅ **Dropdowns populated**
✅ **Multiple images work**
✅ **Validation works**

---

**Status:** Ready for Testing
**Date:** January 19, 2025

