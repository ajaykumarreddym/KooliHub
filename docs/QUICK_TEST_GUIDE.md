# Quick Test Guide - Dynamic Service Routing

## How to Test All Service Routes

### 1. Start the Application
```bash
pnpm dev
```

### 2. Test Each Service Type URL

Open your browser and test these URLs:

#### ✅ Main Services (Custom Pages)
- http://localhost:8080/grocery
- http://localhost:8080/trips
- http://localhost:8080/car-rental
- http://localhost:8080/handyman
- http://localhost:8080/electronics
- http://localhost:8080/fashion
- http://localhost:8080/beauty
- http://localhost:8080/home-kitchen

#### ✅ New Services (Dynamic Pages)
- http://localhost:8080/fruits-and-vegitables
- http://localhost:8080/commercial-vehicles
- http://localhost:8080/liquor
- http://localhost:8080/pharmacy
- http://localhost:8080/pet-care
- http://localhost:8080/laundry
- http://localhost:8080/food-delivery
- http://localhost:8080/books-stationery
- http://localhost:8080/fitness
- http://localhost:8080/jewelry

#### ✅ Fallback Route
- http://localhost:8080/service/grocery
- http://localhost:8080/service/pharmacy

### 3. Expected Behavior

For each URL, you should see:

1. **Service Header** with:
   - Service icon from database
   - Service title
   - Service description
   - Location indicator

2. **Location Prompt** (if no location selected):
   - Alert asking to select location
   - Categories may be empty

3. **With Location Selected**:
   - Products filtered by service type
   - Categories for that service
   - Search and filter options
   - Product grid/list view

4. **If No Products**:
   - Empty state message
   - "No products found" with clear filters button

5. **If Service Not Available in Area**:
   - "Service Not Available" message
   - Suggestions to change location

### 4. Test Location Features

1. **Select a Location** from header
2. **Navigate to any service page**
3. **Verify**:
   - Products load for that location
   - Categories show available items
   - Product counts are correct

### 5. Test Error Cases

#### Non-existent Service:
- http://localhost:8080/invalid-service
- Should show: "Service Not Found" message with "Go to Home" button

#### Inactive Service:
- Disable a service in admin panel
- Try to access it
- Should show: "Service Not Found"

### 6. Test Navigation Flow

1. Go to Home (`/`)
2. Click on any service icon in CategoryGrid
3. Verify correct service page loads
4. Check URL matches service type ID
5. Verify products and categories are correct

### 7. Mobile Testing

Test on mobile viewport:
- Service header responsive
- Category grid scrollable
- Product cards display properly
- Search and filters accessible

## Common Issues & Solutions

### Issue: Service page shows "Service Not Found"
**Solution**: 
- Check service type ID in database matches URL
- Verify `is_active = true` in `service_types` table

### Issue: No products showing
**Solution**:
- Check products have correct `categories.service_type`
- Verify products are marked `is_active = true`
- Check location has products for this service

### Issue: Categories not showing
**Solution**:
- Verify categories exist for this service type
- Check `service_area_categories` has entries for selected location
- Ensure categories are marked `is_available = true`

### Issue: 404 error on service page
**Solution**:
- Verify route is added in `client/App.tsx`
- Check service type ID matches database exactly (including hyphens)
- Clear browser cache and restart dev server

## Database Verification Queries

Run these in Supabase SQL Editor:

```sql
-- Check all active service types
SELECT id, title, is_active FROM service_types WHERE is_active = true ORDER BY sort_order;

-- Check products count per service
SELECT 
  c.service_type,
  COUNT(p.id) as product_count
FROM products p
INNER JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
GROUP BY c.service_type
ORDER BY product_count DESC;

-- Check categories per service
SELECT 
  service_type,
  COUNT(*) as category_count
FROM categories
WHERE is_active = true
GROUP BY service_type
ORDER BY category_count DESC;
```

## Success Criteria

✅ All 18 service URLs load without 404 errors
✅ Service information displays correctly
✅ Products filter by service type
✅ Location-based filtering works
✅ Search and sort functions properly
✅ Mobile responsive
✅ Empty states show appropriately
✅ Loading states work correctly

## Performance Tips

1. **Check Network Tab**: 
   - Service info should load quickly
   - Products query should be optimized
   - No duplicate requests

2. **Check Console**:
   - No error messages
   - Successful RPC function calls
   - Proper data transformations

3. **User Experience**:
   - Page loads < 2 seconds
   - Smooth navigation
   - No layout shifts
   - Images load progressively

## Next Steps After Testing

If all tests pass:
1. ✅ Commit the changes
2. ✅ Deploy to staging
3. ✅ Run full QA testing
4. ✅ Deploy to production

If issues found:
1. Check database schema
2. Verify service type IDs
3. Check product-category relationships
4. Review console errors
5. Test in incognito mode

