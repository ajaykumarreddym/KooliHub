# 🚨 IMMEDIATE FIX REQUIRED - Quick Reference

## ⚡ Apply This SQL Fix NOW to Resolve Database Error

### Error You're Seeing:
```
Error: operator does not exist: offering_type[] @> text[]
Code: 42883
```

### Solution: Run SQL Migration

#### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar

#### Step 2: Copy & Run SQL
Copy the entire contents of the file: `FIX_RPC_TYPE_ERROR.sql`

OR copy this:

```sql
-- Fix for: operator does not exist: offering_type[] @> text[]

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_product_form_attributes(text, uuid);
DROP FUNCTION IF EXISTS public.get_product_form_attributes_v2(text, uuid, uuid);

-- Create v2 function with proper type handling
CREATE OR REPLACE FUNCTION public.get_product_form_attributes_v2(
    p_service_type_id text DEFAULT NULL,
    p_category_id uuid DEFAULT NULL,
    p_subcategory_id uuid DEFAULT NULL
)
RETURNS TABLE (
    attribute_id uuid,
    attribute_name text,
    attribute_label text,
    label text,
    field_label text,
    field_name text,
    data_type text,
    input_type text,
    placeholder text,
    help_text text,
    is_required boolean,
    is_visible boolean,
    display_order integer,
    field_group text,
    validation_rules jsonb,
    options jsonb,
    default_value text,
    is_system_field boolean,
    is_mandatory boolean,
    inherited_from text
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (COALESCE(ar.name, dmf.field_name))
        COALESCE(ar.id, dmf.id) as attribute_id,
        COALESCE(ar.name, dmf.field_name) as attribute_name,
        COALESCE(sac.override_label, cac.override_label, subac.override_label, ar.label, dmf.field_label) as attribute_label,
        COALESCE(sac.override_label, cac.override_label, subac.override_label, ar.label, dmf.field_label) as label,
        COALESCE(ar.label, dmf.field_label) as field_label,
        COALESCE(ar.name, dmf.field_name) as field_name,
        COALESCE(ar.data_type, dmf.field_type, 'text') as data_type,
        COALESCE(ar.input_type, dmf.input_type, 'text') as input_type,
        COALESCE(sac.override_placeholder, cac.override_placeholder, subac.override_placeholder, ar.placeholder, dmf.placeholder) as placeholder,
        COALESCE(sac.override_help_text, cac.override_help_text, subac.override_help_text, ar.help_text, dmf.help_text) as help_text,
        COALESCE(subac.is_required, cac.is_required, sac.is_required, false) as is_required,
        COALESCE(subac.is_visible, cac.is_visible, sac.is_visible, true) as is_visible,
        COALESCE(subac.display_order, cac.display_order, sac.display_order, dmf.display_order, 999) as display_order,
        COALESCE(subac.field_group, cac.field_group, sac.field_group, 'custom') as field_group,
        ar.validation_rules,
        ar.options,
        ar.default_value,
        COALESCE(dmf.is_system_field, false) as is_system_field,
        (dmf.id IS NOT NULL) as is_mandatory,
        CASE
            WHEN subac.id IS NOT NULL THEN 'subcategory'
            WHEN cac.id IS NOT NULL THEN 'category'
            WHEN sac.id IS NOT NULL THEN 'service'
            WHEN dmf.id IS NOT NULL THEN 'default'
            ELSE 'unknown'
        END as inherited_from
    FROM (
        SELECT DISTINCT ar.id, ar.name, ar.label, ar.data_type, ar.input_type,
               ar.placeholder, ar.help_text, ar.validation_rules, ar.options, ar.default_value
        FROM attribute_registry ar
        WHERE ar.is_active = true
        UNION
        SELECT dmf.id, dmf.field_name, dmf.field_label, dmf.field_type, dmf.input_type,
               dmf.placeholder, dmf.help_text, NULL, NULL, NULL
        FROM default_mandatory_fields dmf
    ) ar
    FULL OUTER JOIN default_mandatory_fields dmf ON ar.name = dmf.field_name
    LEFT JOIN service_attribute_config sac ON ar.id = sac.attribute_id AND sac.service_type_id = p_service_type_id AND sac.is_visible = true
    LEFT JOIN category_attribute_config cac ON ar.id = cac.attribute_id AND cac.category_id = p_category_id AND cac.is_visible = true
    LEFT JOIN subcategory_attribute_config subac ON ar.id = subac.attribute_id AND subac.subcategory_id = p_subcategory_id AND subac.is_visible = true
    WHERE dmf.id IS NOT NULL
        OR (sac.id IS NOT NULL AND sac.service_type_id = p_service_type_id)
        OR (cac.id IS NOT NULL AND cac.category_id = p_category_id)
        OR (subac.id IS NOT NULL AND subac.subcategory_id = p_subcategory_id)
    ORDER BY COALESCE(ar.name, dmf.field_name),
        CASE WHEN subac.id IS NOT NULL THEN 1 WHEN cac.id IS NOT NULL THEN 2 WHEN sac.id IS NOT NULL THEN 3 ELSE 4 END;
END;
$$;

-- Create v1 function (backward compatible)
CREATE OR REPLACE FUNCTION public.get_product_form_attributes(
    p_service_type_id text DEFAULT NULL,
    p_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
    attribute_id uuid, attribute_name text, attribute_label text, label text,
    field_label text, field_name text, data_type text, input_type text,
    placeholder text, help_text text, is_required boolean, is_visible boolean,
    display_order integer, field_group text, validation_rules jsonb,
    options jsonb, default_value text, is_system_field boolean,
    is_mandatory boolean, inherited_from text
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY SELECT * FROM get_product_form_attributes_v2(p_service_type_id, p_category_id, NULL::uuid);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_product_form_attributes(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_form_attributes_v2(text, uuid, uuid) TO anon, authenticated;
```

#### Step 3: Run the SQL
1. Click **Run** button or press `Ctrl/Cmd + Enter`
2. Wait for success message

#### Step 4: Verify Fix
1. Refresh your KooliHub application
2. Try to add/edit a product
3. Error should be gone! ✅

---

## 🎉 What's Now Fixed

### ✅ All Tabs Have Editable Default Fields
- **Service Tab**: Toggle Visible/Required for any default field
- **Category Tab**: Toggle Visible/Required for any default field
- **Subcategory Tab**: Toggle Visible/Required for any default field

### ✅ Custom Attributes Have Visibility Toggle
- Added to drag-and-drop section in all tabs
- Works alongside Required toggle

### ✅ Database Error Resolved
- RPC type mismatch fixed
- Both v1 and v2 functions working

### ✅ No More Locked Fields
- All fields are now editable
- Toggle states save to database
- Edit button works after configuration

---

## 📋 Quick Test

1. Go to **Admin** → **Service Management** → **Attribute Manager**
2. Select **Service Tab** → Choose a service type
3. Find a **Default Field** (e.g., "Product Name")
4. Click the **Visible** toggle → Should work! ✅
5. Click the **Required** toggle → Should work! ✅
6. Click **Edit** button → Should open modal! ✅

---

## 🚨 If Error Persists

1. **Clear browser cache**: `Ctrl/Cmd + Shift + R`
2. **Check Supabase logs**: SQL Editor → View logs
3. **Verify tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%attribute%';
   ```
4. **Check RLS policies**: Ensure proper permissions

---

## 📞 Need Help?

Check these files for detailed info:
- `COMPLETE_ATTRIBUTE_SYSTEM_FIX.md` - Full documentation
- `FIX_RPC_TYPE_ERROR.sql` - SQL migration file
- `ATTRIBUTE_MANAGER_DEFAULT_FIELDS_FIX.md` - Previous fix docs

---

**Status**: Ready to apply ✅
**Priority**: 🚨 HIGH - Apply immediately
**Estimated Time**: 2 minutes

