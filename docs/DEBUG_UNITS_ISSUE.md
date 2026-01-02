# Debug Guide: Units Not Showing Correctly

## 🔍 How to Debug Your Issue

### Step 1: Open Browser Console
1. Open the **Add Product** modal
2. Press **F12** (or Cmd+Option+I on Mac)
3. Go to **Console** tab

### Step 2: Check What Service is Actually Selected

When you select a service, look for these console logs:

```
🔍 EnhancedProductModal - selectedServiceType: "car-rental"
📊 MEASUREMENT UNIT FIELD: {
  name: "measurement_unit",
  label: "Rental Billing Period",
  options: [{label: "Per Hour", value: "hour"}, ...],
  optionsCount: 10
}
```

**Key Information**:
- `selectedServiceType`: Which service ID is actually selected
- `label`: The field label for that service
- `options`: The array of units for that service
- `optionsCount`: How many units are configured

---

## 📊 Expected Results Per Service

### If you selected "Car Rental":
```javascript
selectedServiceType: "car-rental"
label: "Rental Billing Period"
options: [
  {label: "Per Hour", value: "hour"},
  {label: "Per 3 Hours", value: "3_hours"},
  {label: "Per 6 Hours", value: "6_hours"},
  {label: "Per 12 Hours", value: "12_hours"},
  {label: "Per Day", value: "day"},
  {label: "Per Week", value: "week"},
  {label: "Per Month", value: "month"},
  {label: "Per Year", value: "year"},
  {label: "Per Kilometer", value: "km"},
  {label: "Per Mile", value: "mile"}
]
optionsCount: 10
```

### If you selected "Electronics" (or Fashion, Home & Kitchen):
```javascript
selectedServiceType: "electronics"
label: "Sale Unit"
options: [
  {label: "Piece", value: "piece"},
  {label: "Unit", value: "unit"},
  {label: "Item", value: "item"},
  {label: "Set", value: "set"},
  {label: "Pack", value: "pack"},
  {label: "Pair", value: "pair"},
  {label: "Box", value: "box"},
  {label: "Carton", value: "carton"},
  {label: "Bundle", value: "bundle"}
]
optionsCount: 9
```

**Note**: Piece, Unit, Item, Set, Pack **ARE THE CORRECT** units for retail services like Electronics!

### If you selected "Handyman Services":
```javascript
selectedServiceType: "handyman"
label: "Service Billing Unit"
options: [
  {label: "Per Hour", value: "hour"},
  {label: "Per Day", value: "day"},
  {label: "Per Half Day (4 hours)", value: "half_day"},
  {label: "Per Project", value: "project"},
  {label: "Per Square Foot", value: "sqft"},
  {label: "Per Room", value: "room"},
  {label: "Per Visit", value: "visit"},
  {label: "Per Item", value: "item"},
  {label: "Per Unit", value: "unit"},
  {label: "Flat Rate", value: "flat"},
  {label: "Custom Quote", value: "custom"}
]
optionsCount: 11
```

### If you selected "Liquor Delivery":
```javascript
selectedServiceType: "liquor"
label: "Bottle/Package Size"
options: [
  {label: "Milliliters (ml)", value: "ml"},
  {label: "Liters (L)", value: "liter"},
  {label: "Bottle (180ml)", value: "bottle_180ml"},
  {label: "Bottle (375ml)", value: "bottle_375ml"},
  {label: "Bottle (750ml)", value: "bottle_750ml"},
  {label: "Bottle (1L)", value: "bottle_1l"},
  {label: "Bottle (1.75L)", value: "bottle_1750ml"},
  {label: "Can (330ml)", value: "can_330ml"},
  {label: "Pack of 6", value: "pack_6"},
  {label: "Pack of 12", value: "pack_12"},
  {label: "Case", value: "case"}
]
optionsCount: 11
```

---

## 🐛 Common Issues

### Issue 1: Seeing "Sale Unit" with Piece/Unit/Item
**This is CORRECT** if you selected:
- Electronics
- Fashion
- Home & Kitchen
- Commercial Vehicles
- Earth Movers

These are retail/product services that sell items by piece, unit, set, etc.

**Action**: If you want different units, you need to:
1. Go to **Attribute Registry** → **Units Manager**
2. Select the service
3. **Modify the units** for that service

### Issue 2: Label Changes but Units Don't
**Problem**: The service selection isn't refreshing the form fields

**Check**:
1. Look at console: Does `selectedServiceType` match what you selected?
2. Look at `options` array: Does it match the service?

**If mismatch**:
- The form state might not be clearing properly
- Try refreshing the page
- Check if there are any JavaScript errors in console

### Issue 3: Options Array is Empty
**Check console**:
```javascript
options: []
optionsCount: 0
```

**Causes**:
1. Service doesn't have units configured in database
2. Units are disabled for that service (`is_visible: false`)
3. API request failed

**Fix**:
1. Go to **Attribute Registry** → **Units Manager**
2. Select the service
3. **Toggle "Enable Measurement Units"** to ON
4. **Add units** if none exist
5. Click **Save Configuration**

### Issue 4: Generic Base Units Showing
If you see exactly these 5 units:
- Piece
- Unit
- Item
- Set
- Pack

**AND the service should have different units**, it means:
1. `custom_validation_rules.options` is null/empty in database
2. API is falling back to `attribute_registry.options` (base units)

**Fix**: Configure service-specific units in Attribute Registry

---

## 🔧 Diagnostic SQL Query

Run this in Supabase SQL Editor to check your service configuration:

```sql
-- Replace 'car-rental' with your service ID
SELECT 
    st.title,
    sac.override_label,
    sac.is_visible,
    jsonb_array_length(sac.custom_validation_rules->'options') as num_units,
    sac.custom_validation_rules->'options' as configured_units
FROM service_types st
LEFT JOIN service_attribute_config sac 
    ON st.id = sac.service_type_id
WHERE st.id = 'car-rental'
AND sac.attribute_id = (SELECT id FROM attribute_registry WHERE name = 'measurement_unit');
```

**Expected for Car Rental**:
- `is_visible`: true
- `num_units`: 10
- `configured_units`: Array of 10 rental period options

---

## ✅ Verification Steps

1. **Clear browser cache** and refresh
2. **Open console** (F12)
3. **Click "Add Product"**
4. **Select Service**: Choose "Car Rental"
5. **Watch Console**: Check the logs
6. **Verify in Console**:
   ```
   selectedServiceType: "car-rental"
   label: "Rental Billing Period"
   optionsCount: 10
   ```
7. **Check Dropdown**: Should show "Per Hour", "Per Day", etc.

---

## 📞 Report Issue Format

If units are still wrong, provide:

1. **Service Selected**: "Car Rental" / "Electronics" / etc.
2. **Console Log Output**: Copy the `📊 MEASUREMENT UNIT FIELD` log
3. **Screenshot**: The dropdown showing wrong units
4. **Expected Units**: What units you expect to see
5. **Actual Units**: What you're currently seeing

Example:
```
Service: Car Rental
Console Log: 
  selectedServiceType: "car-rental"
  label: "Rental Billing Period"
  options: [{label: "Piece", value: "piece"}, ...]  ← WRONG!
  optionsCount: 5

Expected: Per Hour, Per Day, Per Week...
Actual: Piece, Unit, Item, Set, Pack
```

---

## 🎯 Quick Test Matrix

| Service | Field Label | First Unit | Unit Count |
|---------|-------------|------------|------------|
| Car Rental | Rental Billing Period | Per Hour | 10 |
| Handyman | Service Billing Unit | Per Hour | 11 |
| Electronics | Sale Unit | Piece | 9 |
| Fashion | Sale Unit | Piece | 9 |
| Liquor | Bottle/Package Size | Milliliters (ml) | 11 |
| Fruits & Veggies | Measurement Unit | Kilogram (kg) | 11 |
| Trip Booking | Trip Billing Unit | Per Kilometer | 8 |

---

**Last Updated**: January 22, 2025

