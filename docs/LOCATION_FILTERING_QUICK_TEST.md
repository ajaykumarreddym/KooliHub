# Quick Testing Guide - Location-Based Filtering

## How to Test the Implementation

### 1. Test Location Selection

#### A. Test Input Typing (Fixed Issue #2)
1. Open the app in browser
2. Click "Deliver to" in the header
3. In the search box, type "Mumbai" or any city name
4. **✅ Expected**: You should be able to type continuously without the input losing focus after each character
5. **❌ Before**: Input would lose focus after typing each character

#### B. Test Popular Cities Selection (Fixed Issue #3)
1. Click "Deliver to" in the header
2. Expand "Popular Cities" section
3. Click on any city (e.g., "Mumbai")
4. **✅ Expected**: 
   - Search suggestions hide
   - "Available Areas in Mumbai" section appears
   - List of serviceable areas (pincodes) displays
   - Each area shows:
     - Pincode number
     - City, State
     - Delivery time badge (if configured)
     - Service types badges (e.g., grocery, handyman)
5. Click "Back" button
6. **✅ Expected**: Returns to city selection

#### C. Test Area Selection
1. Follow steps in B to see available areas
2. Click on any area (pincode)
3. **✅ Expected**:
   - Dialog closes
   - Header shows selected location (e.g., "Mumbai, Maharashtra")
   - Toast notification: "Location updated"

### 2. Test Location-Based Product Filtering (Fixed Issue #1)

#### A. Without Location Selected
1. Clear your browser's localStorage or open in incognito
2. Navigate to `/grocery` page
3. **✅ Expected**:
   - Blue alert banner shows: "Please select your location from the header to see products available in your area"
   - Location shows: "Select location to see available products"
   - Products shown are ALL products (not filtered)

#### B. With Location Selected
1. Select a location from header (follow Test 1C)
2. Navigate to `/grocery` page
3. **✅ Expected**:
   - No alert banner
   - Location shows: "Mumbai, Maharashtra" (or your selected city)
   - Delivery time shows: "30-minute delivery"
   - Products are filtered to only those available in selected service area
   - Categories are filtered to only those available in that area

#### C. Change Location
1. With location already selected
2. Click location in header again
3. Select a different area/city
4. **✅ Expected**:
   - Products automatically refresh
   - Only products available in new location are shown
   - Page doesn't require manual refresh

### 3. Test Location Persistence

1. Select a location
2. Navigate to different pages (`/grocery`, `/fashion`, etc.)
3. **✅ Expected**: Location persists across pages
4. Refresh the browser (F5)
5. **✅ Expected**: Selected location is still there (saved in localStorage)
6. Close browser and reopen
7. **✅ Expected**: Location persists (from localStorage)

### 4. Test Database Integration

**Prerequisites**: You need to have data in these tables:
- `serviceable_areas` - At least one area with `is_serviceable = true`
- `service_area_products` - Products assigned to the service area
- `service_area_categories` - Categories assigned to the service area

#### Check if you have the required data:
```sql
-- Check serviceable areas
SELECT * FROM serviceable_areas WHERE is_serviceable = true;

-- Check service area products
SELECT COUNT(*) FROM service_area_products;

-- Check service area categories  
SELECT COUNT(*) FROM service_area_categories;
```

If counts are 0, you need to:
1. Go to Admin Panel → Service Areas
2. Add service areas for different cities
3. Go to Admin Panel → Area Inventory
4. Assign products to service areas

#### Test the Database Function
```sql
-- Test if the function works
SELECT * FROM get_products_by_service_area(
  'your-service-area-id'::uuid,
  'grocery'::text,
  NULL::uuid,
  NULL::text,
  50,
  0
);
```

**✅ Expected**: Returns products assigned to that service area

### 5. Test Mobile Responsiveness

1. Open browser DevTools (F12)
2. Switch to mobile view (Toggle device toolbar)
3. Test location selection on mobile
4. **✅ Expected**:
   - Location dialog is responsive
   - Area cards stack properly
   - Touch interactions work
   - No horizontal scroll

### 6. Test Edge Cases

#### A. No Areas in Selected City
1. Search for a city that has no service areas in DB
2. **✅ Expected**: Shows message "No serviceable areas found in [City]"

#### B. No Products in Selected Area
1. Select an area that has no products assigned
2. Navigate to `/grocery`
3. **✅ Expected**: 
   - Shows location info
   - Shows empty state or no products
   - Categories may also be empty

#### C. Network Error Handling
1. Go offline (disable network in DevTools)
2. Try to select location
3. **✅ Expected**: Shows error toast, doesn't crash

## Common Issues & Solutions

### Issue: "Cannot find products for location"
**Solution**: 
1. Check if products are assigned to that service area in admin
2. Verify `get_products_by_service_area()` function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'get_products_by_service_area';
   ```

### Issue: "Areas not loading for city"
**Solution**:
1. Check database: `SELECT * FROM serviceable_areas WHERE city ILIKE '%CityName%'`
2. Ensure `is_serviceable = true`
3. Check browser console for errors

### Issue: "Location not persisting"
**Solution**:
1. Check if localStorage is enabled in browser
2. Open DevTools → Application → Local Storage
3. Look for key `userLocation`
4. If not there, check browser privacy settings

### Issue: "Input still losing focus"
**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check if `LocationPicker.tsx` has the inline search logic in useEffect

## Sample Test Data

If you need to create test data, use this SQL:

```sql
-- Create a test service area
INSERT INTO serviceable_areas (
  id, pincode, city, state, country, 
  is_serviceable, service_types, delivery_time_hours
) VALUES (
  gen_random_uuid(),
  '400001',
  'Mumbai',
  'Maharashtra',
  'India',
  true,
  ARRAY['grocery', 'fashion', 'electronics'],
  2
);

-- Assign a product to the service area
-- (Replace with actual offering_id from your offerings table)
INSERT INTO service_area_products (
  service_area_id,
  offering_id,
  is_available,
  price_override
) 
SELECT 
  (SELECT id FROM serviceable_areas WHERE pincode = '400001'),
  id,
  true,
  base_price * 0.95 -- 5% discount for this area
FROM offerings 
WHERE is_active = true 
LIMIT 10;
```

## Performance Testing

### Check Page Load Time
1. Open DevTools → Network tab
2. Select a location
3. Navigate to `/grocery`
4. **✅ Expected**: Page loads in < 2 seconds

### Check React DevTools
1. Install React DevTools extension
2. Open Profiler
3. Change location
4. **✅ Expected**: 
   - No excessive re-renders
   - Components update efficiently
   - No memory leaks

## Automated Testing Script

You can use this JavaScript snippet in browser console:

```javascript
// Test location selection flow
async function testLocationFlow() {
  console.log('🧪 Testing Location Flow...');
  
  // 1. Check if LocationContext is available
  const hasLocation = localStorage.getItem('userLocation');
  console.log('✅ Location in storage:', hasLocation ? 'Yes' : 'No');
  
  // 2. Check current page products
  const productCards = document.querySelectorAll('[data-testid="product-card"]');
  console.log('✅ Products on page:', productCards.length);
  
  // 3. Check location display in header
  const locationText = document.querySelector('[class*="location"]')?.textContent;
  console.log('✅ Header location:', locationText);
  
  console.log('🎉 Test complete!');
}

testLocationFlow();
```

## Report Issues

If you find any issues during testing:

1. **Check browser console** for errors
2. **Take screenshot** of the issue
3. **Note the steps** to reproduce
4. **Check** if it's in the "Common Issues" section above
5. **Document**:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (if any)

## Success Criteria

All tests pass when:
- ✅ Can type in search without losing focus
- ✅ Popular cities show available areas
- ✅ Selecting area updates header location
- ✅ Products filter by selected location
- ✅ Categories filter by selected location  
- ✅ Location persists across pages and refreshes
- ✅ Changing location refreshes products automatically
- ✅ Alert shows when no location selected
- ✅ Mobile responsive works perfectly
- ✅ No console errors during normal usage

## Next Steps After Testing

Once all tests pass:
1. ✅ Mark all features as verified
2. 📝 Document any issues found
3. 🚀 Ready for production deployment
4. 📊 Monitor analytics for location selection rates
5. 💡 Gather user feedback for improvements

---

**Happy Testing! 🎉**

