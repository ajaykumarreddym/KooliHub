# Testing Guide: Units/Quantity System

## Quick Start Testing

### 1. Restart Development Server
```bash
# Stop current server (Ctrl+C or Command+C)
pnpm dev
```

Wait for server to fully start, then proceed.

---

## Test Scenario 1: Grocery Products

### Steps:
1. Open browser → Navigate to admin panel
2. Go to **Products** → Click **"Add Product"**
3. **Select Category**: Choose any grocery category
4. **Scroll to Units field**

### ✅ Expected Result:
Field label: "Unit of Measurement" or "Units / Quantity Measure"
Dropdown options:
- Kilogram (kg)
- Grams (g)
- Liters (L)
- Milliliters (ml)
- Pieces
- Dozen
- Bundle
- Packet
- Box
- Bottle
- Can
- Jar

### ❌ If you see:
- Only "Piece, Unit, Item, Set, Pack" → API not loading service-specific units
- No units field → Service not configured
- Text input instead of dropdown → Field type issue

---

## Test Scenario 2: Car Rental

### Steps:
1. Go back or refresh
2. **Select Category**: Car Rental category
3. **Check Units field**

### ✅ Expected Result:
Field label: "Rental Period" or "Units"
Dropdown options:
- Per Hour
- Per Day
- Per Week
- Per Month
- Per Year
- Per Unit

---

## Test Scenario 3: Electronics

### Steps:
1. Go back
2. **Select Category**: Electronics category
3. **Check Units field**

### ✅ Expected Result:
Field label: "Unit of Sale" or "Units"
Dropdown options:
- Piece
- Unit
- Item
- Set
- Pack

*(These are generic units, which is correct for electronics)*

---

## Test Scenario 4: Travel/Transport

### Steps:
1. Go back
2. **Select Category**: Travel or Trips category
3. **Check Units field**

### ✅ Expected Result:
Field label: "Trip/Distance Unit" or "Units"
Dropdown options:
- Kilometers
- Miles
- Hours
- Days
- Per Trip
- Per Ride

---

## Test Scenario 5: Handyman Services

### Steps:
1. Go back
2. **Select Category**: Handyman or service category
3. **Check Units field**

### ✅ Expected Result:
Field label: "Service Unit" or "Units"
Dropdown options:
- Per Hour
- Per Day
- Per Job
- Per Square Foot
- Per Room
- Per Visit
- Per Session

---

## Full Service Verification Table

| Service Type | Expected Units | Test Status |
|--------------|---------------|-------------|
| Grocery | kg, grams, liters, ml, pieces, dozen, bundle, packet, box, bottle, can, jar | ☐ |
| Car Rental | hour, day, week, month, year, unit | ☐ |
| Bike Rental | hour, day, week, month, year, unit | ☐ |
| Equipment Rental | hour, day, week, month, year, unit | ☐ |
| Trips/Travel | km, miles, hours, days, trip, ride | ☐ |
| Taxi/Delivery | km, miles, hours, days, trip, ride | ☐ |
| Handyman | hour, day, job, sqft, room, visit, session | ☐ |
| Plumbing | hour, day, job, sqft, room, visit, session | ☐ |
| Electrical | hour, day, job, sqft, room, visit, session | ☐ |
| Cleaning | hour, day, job, sqft, room, visit, session | ☐ |
| Electronics | piece, unit, item, set, pack | ☐ |
| Fashion | piece, unit, item, set, pack | ☐ |
| Home & Kitchen | piece, unit, item, set, pack | ☐ |
| Digital Services | license, user, download, access, subscription, course, ebook | ☐ |

---

## Debugging Checklist

### If Units Don't Appear:

**Step 1:** Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for errors mentioning "custom-fields" or "units"

**Step 2:** Check Network Tab
- Open DevTools → Network tab
- Filter by "custom-fields"
- Look for request: `GET /api/admin/custom-fields/{service-type}`
- Click on it → Preview tab
- Verify field_options contains the unit array

**Step 3:** Check Server Console
- Look at terminal where `pnpm dev` is running
- Check for errors or warnings

**Step 4:** Verify Service Type Detection
Add console.log in browser console:
```javascript
// When on product form, check:
console.log('Selected service type:', selectedServiceType);
```

---

## Common Issues & Fixes

### Issue 1: All Services Show Generic Units

**Symptom:** Every service shows "Piece, Unit, Item, Set, Pack"

**Cause:** API not prioritizing `custom_validation_rules.options`

**Fix:** 
1. Verify server restarted with new code
2. Check `server/routes/custom-fields.ts` line 45:
   ```typescript
   const fieldOptions = config.custom_validation_rules?.options || attr?.options;
   ```

### Issue 2: Units Field Not Showing

**Symptom:** No units field in the form

**Cause:** Service not configured in `service_attribute_config`

**Fix:** Run SQL to add units to service:
```sql
-- Check if service has units attribute
SELECT * FROM service_attribute_config 
WHERE service_type_id = 'YOUR_SERVICE_ID'
AND attribute_id = (SELECT id FROM attribute_registry WHERE name = 'units');

-- If empty, need to add it (contact admin)
```

### Issue 3: Wrong Label/Placeholder

**Symptom:** Field shows but label is incorrect

**Cause:** `override_label` in `service_attribute_config`

**Check:** 
```sql
SELECT override_label, override_help_text 
FROM service_attribute_config 
WHERE service_type_id = 'grocery'
AND attribute_id = (SELECT id FROM attribute_registry WHERE name = 'units');
```

---

## API Response Verification

### Manual API Test

In browser console while on product form:
```javascript
fetch('/api/admin/custom-fields/grocery')
  .then(r => r.json())
  .then(data => {
    const unitsField = data.find(f => f.field_name === 'units');
    console.log('Units field:', unitsField);
    console.log('Field options:', unitsField?.field_options);
  });
```

### Expected Console Output:
```javascript
{
  field_name: "units",
  field_label: "Unit of Measurement",
  field_type: "select",
  input_type: "select",
  field_options: [
    {label: "Kilogram (kg)", value: "kg"},
    {label: "Grams (g)", value: "grams"},
    // ... more options
  ],
  is_required: true,
  // ... other fields
}
```

---

## Success Criteria

### ✅ All Tests Pass If:

1. Each service shows **different** unit options
2. Units field is **required** (shows asterisk)
3. Units field is **dropdown/select** (not text input)
4. Grocery shows food units (kg, liters, etc.)
5. Rentals show time periods (hour, day, week, etc.)
6. Transport shows distance/time (km, miles, etc.)
7. Generic services show generic units (piece, set, etc.)
8. Field label changes based on service (Unit of Measurement, Rental Period, etc.)
9. Selected unit saves with product
10. Editing product shows previously selected unit

---

## Report Issues

If tests fail, provide:
1. **Service type** you were testing
2. **Expected units** (from table above)
3. **Actual units** displayed (or none)
4. **Screenshot** of the form
5. **Browser console errors** (if any)
6. **Network tab** showing API response for custom-fields

---

## Clean Test Environment

For a fresh test:

```bash
# Clear browser cache
# In Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)

# Clear server cache
rm -rf node_modules/.vite

# Restart
pnpm dev
```

---

## Completion Status

Test completed on: ______________

Total services tested: _____ / 19+

Pass rate: _____ %

Issues found: _____

Notes:
_______________________________________________________
_______________________________________________________
_______________________________________________________

