# Testing Guide: Measurement Units Fix

## Quick Test Steps

### Test 1: Verify Grocery Measurement Units in Product Management

1. **Navigate to Product Management**
   - Go to Admin Panel → Product Management

2. **Add New Product**
   - Click "Add Product" button
   - You'll see the service/category selection step

3. **Select Grocery Category**
   - Choose a category with `service_type = 'grocery'`
   - Click "Next" or the category will auto-advance to details

4. **Check Measurement Unit Field**
   - Look for the field labeled **"Product Unit"** (not just "Unit")
   - Click on the dropdown

5. **Expected Result** ✅
   - The dropdown should show **9 options**:
     - per kg
     - per 100g
     - per piece
     - per liter
     - per ml
     - per packet
     - per box
     - per dozen
     - per bundle

6. **Previous Behavior** ❌
   - Would show only base/default units (5 options)
   - OR no options at all

---

### Test 2: Verify Service Management Still Works

1. **Navigate to Service Management**
   - Go to Admin Panel → Service Management
   - Click on "Grocery Delivery" service

2. **Add Offering**
   - Go to "Offerings" tab
   - Click "Add New Offering"

3. **Check Measurement Unit Field**
   - Should also show "Product Unit" with the same 9 options

4. **Expected Result** ✅
   - Works the same as before (this was already working)

---

### Test 3: Verify Other Service Types

Try the same with different service types:

#### Electronics
- Field label: "Sale Unit"
- Should show 9 options including piece, box, unit, etc.

#### Handyman
- Field label: "Service Billing Unit"
- Should show 11 options including per hour, per day, per job, etc.

#### Car Rental
- Field label: "Rental Billing Period"
- Should show 10 options including per hour, per day, per week, etc.

---

## Console Debugging

### Check Browser Console

When you open the Add Product modal and select a category, you should see these logs:

```
🔍 EnhancedProductModal - selectedServiceType: grocery
🔍 EnhancedProductModal - customFields: [...]
🔍 EnhancedProductModal - dynamicFormFields: [...]

getAllFields - adding dynamic fields: X
getAllFields - dynamic fields: ["measurement_unit", ...]
getAllFields - merged fields count: Y
getAllFields - final field names: [...]

✅ measurement_unit field in final fields: {
  name: "measurement_unit",
  label: "Product Unit",
  type: "select",
  optionsCount: 9,
  options: [...]
}
```

### Check for Errors

**No errors should appear like:**
- ❌ "No options found for measurement_unit"
- ❌ "measurement_unit has NO valid options"
- ❌ "Falling back to base options"

---

## API Endpoint Test

### Test the Custom Fields API Directly

You can test the API endpoint directly in browser DevTools Console:

```javascript
// Test grocery custom fields
fetch('/api/admin/custom-fields/grocery')
  .then(r => r.json())
  .then(data => {
    console.log('Grocery custom fields:', data);
    const measurementUnit = data.find(f => f.field_name === 'measurement_unit');
    console.log('Measurement unit field:', measurementUnit);
    console.log('Options count:', measurementUnit?.field_options?.length);
    console.log('Options:', measurementUnit?.field_options);
  });
```

**Expected output:**
```javascript
{
  field_name: "measurement_unit",
  field_label: "Product Unit",
  field_type: "select",
  field_options: [
    {label: "per kg", value: "kg"},
    {label: "per 100g", value: "gram"},
    // ... 7 more options
  ],
  is_required: false,
  is_visible: true
}
```

---

## Database Verification

### Check service_attribute_config

Run this query in Supabase SQL Editor:

```sql
SELECT 
  sac.service_type_id,
  st.title as service_name,
  sac.override_label,
  sac.is_visible,
  jsonb_array_length(sac.custom_validation_rules->'options') as options_count,
  sac.custom_validation_rules->'options' as options
FROM service_attribute_config sac
JOIN service_types st ON st.id = sac.service_type_id
JOIN attribute_registry ar ON ar.id = sac.attribute_id
WHERE ar.name = 'measurement_unit'
  AND sac.service_type_id = 'grocery';
```

**Expected result:**
```
service_type_id: grocery
service_name: Grocery Delivery
override_label: Product Unit
is_visible: true
options_count: 9
options: [{"label": "per kg", "value": "kg"}, ...]
```

---

## Troubleshooting

### Issue: Field Not Showing
**Check:**
1. Is the category's `service_type` field set correctly?
2. Run the database query above to verify configuration
3. Check browser console for errors

### Issue: Wrong Options Showing
**Check:**
1. Verify the service type is being detected correctly (console logs)
2. Check if static config is interfering (look for `unit` field vs `measurement_unit`)
3. Clear browser cache and reload

### Issue: "Measurement Unit" vs "Product Unit"
- "Measurement Unit" = base label from attribute_registry
- "Product Unit" = service-specific override label
- You should see **"Product Unit"** for grocery

---

## Success Criteria

✅ **Fix is successful if:**
1. Grocery products show "Product Unit" field with 9 options
2. Other service types show their custom measurement units
3. No console errors related to measurement units
4. Product creation works end-to-end with selected unit
5. Both Product Management and Service Management work consistently

❌ **Fix needs revision if:**
1. Still showing only 5 base options
2. No options appear in dropdown
3. Console shows "falling back to base options"
4. Field label is "Measurement Unit" instead of "Product Unit"
5. API returns empty field_options array

---

## Rollback Plan

If issues occur, rollback steps:

1. **Revert database change:**
```sql
UPDATE service_attribute_config
SET is_visible = false
WHERE service_type_id = 'grocery'
  AND attribute_id = (SELECT id FROM attribute_registry WHERE name = 'measurement_unit');
```

2. **Revert code change:**
```bash
git checkout HEAD -- client/components/admin/EnhancedProductModal.tsx
```

---

## Additional Notes

- The fix doesn't affect existing products
- Only impacts the Add/Edit product forms
- Service Management functionality remains unchanged
- All other service types continue to work as before



