# Default Fields Foreign Key Error Fix

## Problem
When toggling default fields (visible/required switches), the application was encountering two errors:

1. **406 (Not Acceptable)** - Query using `.single()` was failing
2. **409 (Conflict) - Foreign Key Violation** 
   ```
   Error: insert or update on table "service_attribute_config" violates 
   foreign key constraint "service_attribute_config_attribute_id_fkey"
   Key is not present in table "attribute_registry"
   ```

## Root Cause
The `handleDefaultFieldToggle` function was attempting to use IDs from the `default_mandatory_fields` table directly as `attribute_id` values in the config tables (`service_attribute_config`, `category_attribute_config`, `subcategory_attribute_config`).

However, these config tables have a foreign key constraint requiring `attribute_id` to reference the `attribute_registry` table, not `default_mandatory_fields`.

## Solution

### 1. Updated `handleDefaultFieldToggle` Function
The function now follows this workflow:

```typescript
// Step 1: Find or create attribute in attribute_registry
const { data: existingAttr } = await supabase
    .from("attribute_registry")
    .select("id")
    .eq("name", fieldName)
    .single();

if (existingAttr) {
    attributeId = existingAttr.id;
} else {
    // Create new entry in attribute_registry
    const { data: newAttr } = await supabase
        .from("attribute_registry")
        .insert({
            name: fieldName,
            label: fieldLabel,
            data_type: fieldType,
            input_type: inputType,
            is_active: true
        })
        .select("id")
        .single();
    attributeId = newAttr.id;
}

// Step 2: Use the attribute_registry ID for config tables
// ... proceed with insert/update using attributeId
```

### 2. Updated Function Signature
Added additional parameters to capture full field information:

```typescript
const handleDefaultFieldToggle = useCallback(async (
    defaultFieldId: string,      // From default_mandatory_fields
    fieldName: string,            // Unique field name
    fieldLabel: string,           // Display label
    fieldType: string,            // Data type (text, number, etc.)
    inputType: string,            // Input type (text, textarea, etc.)
    toggleType: 'required' | 'visible',
    currentValue: boolean
) => { ... }, [...]);
```

### 3. Updated Function Calls
All calls to `handleDefaultFieldToggle` now pass the complete field information:

```typescript
onCheckedChange={() => handleDefaultFieldToggle(
    field.id,           // default_mandatory_fields ID
    field.field_name,   // e.g., "product_name"
    field.field_label,  // e.g., "Product Name"
    field.field_type,   // e.g., "text"
    field.input_type,   // e.g., "text"
    'visible',          // Toggle type
    isVisible           // Current value
)}
```

### 4. Updated Attribute Matching Logic
Changed from ID-based matching to name-based matching:

```typescript
// OLD (incorrect):
const configuredAttr = currentAttrs.find(
    attr => attr.attribute_id === field.id
);

// NEW (correct):
const configuredAttr = currentAttrs.find(
    attr => attr.attribute_name === field.field_name
);
```

### 5. Changed Query Method
Changed from `.single()` to `.maybeSingle()` to handle cases where no config exists yet:

```typescript
// This won't throw a 406 error if no rows found
const checkResult = await supabase
    .from(tableName)
    .select("id, is_required, is_visible")
    .eq(contextField, contextValue)
    .eq("attribute_id", attributeId)
    .maybeSingle();  // Returns null instead of error
```

## Benefits

1. ✅ **Automatic Attribute Registry Creation**: Default fields are automatically added to `attribute_registry` if they don't exist
2. ✅ **Proper Foreign Key References**: All config table entries now correctly reference `attribute_registry`
3. ✅ **No Duplicate Entries**: Checks for existing attributes before creating new ones
4. ✅ **Error Handling**: Gracefully handles missing attributes and provides clear error messages
5. ✅ **Cross-Level Consistency**: Same attribute can be configured differently at service, category, and subcategory levels

## Database Flow

```
default_mandatory_fields
  └─> Lookup/Create in attribute_registry (by field_name)
       └─> Use attribute_registry.id for config tables
            ├─> service_attribute_config (FK: attribute_id)
            ├─> category_attribute_config (FK: attribute_id)
            └─> subcategory_attribute_config (FK: attribute_id)
```

## Testing
After this fix:
1. Toggle any default field's visibility or required status
2. The field should be automatically added to `attribute_registry` (if not exists)
3. The config entry should be created in the appropriate table
4. No foreign key violations should occur
5. Edit button becomes enabled after first toggle

## Files Modified
- `/Users/ajayreddy/koolihub/client/components/admin/ComprehensiveAttributeManagement.tsx`
  - Updated `handleDefaultFieldToggle` function (lines 1146-1268)
  - Updated default field toggle handlers (lines 1595-1626)
  - Updated attribute matching logic (lines 1574-1580)

