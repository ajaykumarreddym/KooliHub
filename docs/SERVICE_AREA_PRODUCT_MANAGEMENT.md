# Service Area Product Management System

## Overview

The Service Area Product Management system enables location-based product availability control in KooliHub. This feature allows administrators to:

- Assign specific products to service areas (cities/pincodes)
- Set location-specific pricing and inventory
- Control product availability by location
- Feature products in specific areas
- Manage delivery times per product per location

## Database Architecture

### Tables

#### `service_area_products`
Maps products (offerings) to service areas with location-specific overrides.

**Key Fields:**
- `service_area_id` - Links to serviceable_areas table
- `offering_id` - Links to offerings (products) table
- `is_available` - Toggle product availability for this location
- `price_override` - Override base price for this location
- `stock_quantity` - Location-specific stock levels
- `is_featured` - Feature this product in this location
- `priority_order` - Display order in this location
- `delivery_time_override` - Custom delivery time for this product
- `available_from/available_until` - Scheduling availability

#### `service_area_categories`
Enables category-level product management for service areas.

**Key Fields:**
- `service_area_id` - Service area reference
- `category_id` - Category reference
- `auto_include_new_products` - Automatically add new products from this category
- `display_order` - Category ordering for this location

### Database Functions

#### `get_products_by_service_area()`
Retrieves all available products for a specific service area with location-specific overrides.

**Parameters:**
- `p_service_area_id` (uuid) - Service area ID
- `p_service_type` (text, optional) - Filter by service type
- `p_category_id` (uuid, optional) - Filter by category
- `p_search_term` (text, optional) - Search products
- `p_limit` (integer, default: 50) - Results limit
- `p_offset` (integer, default: 0) - Pagination offset

**Returns:** Table with product details including location-specific pricing and availability

#### `bulk_assign_products_to_service_area()`
Bulk assigns multiple products to a service area.

**Parameters:**
- `p_service_area_id` (uuid) - Target service area
- `p_offering_ids` (uuid[]) - Array of product IDs to assign
- `p_user_id` (uuid, optional) - User performing the action

**Returns:** Success status with inserted/skipped counts

#### `is_product_available_in_pincode()`
Checks if a specific product is available in a given pincode.

**Parameters:**
- `p_offering_id` (uuid) - Product ID
- `p_pincode` (text) - Pincode to check

**Returns:** Boolean indicating availability

### Views

#### `service_area_product_summary`
Provides summary statistics for each service area.

**Columns:**
- `service_area_id`, `pincode`, `city`, `state`
- `total_products` - Total products assigned
- `available_products` - Currently available products
- `featured_products` - Featured product count
- `total_categories` - Unique categories represented
- `is_serviceable` - Service area status
- `service_types` - Available service types

## User Interface

### Navigation Path
**Admin Panel → Services → Quick Actions → Service Areas**

Route: `/admin/services/service-areas`

### Components

#### 1. **ServiceAreaManagement** (`client/pages/admin/ServiceAreaManagement.tsx`)
Main component that displays all service areas in a grid layout.

**Features:**
- Search and filter service areas
- View service area statistics (active areas, pincodes, delivery times)
- Click on a service area to manage its products
- Visual cards showing location details

#### 2. **ServiceAreaProductManagement** (`client/components/admin/ServiceAreaProductManagement.tsx`)
Product assignment and management interface for a specific service area.

**Features:**
- **Product Assignment Dialog:**
  - Search and filter available products
  - Bulk select products
  - Visual product cards with images and pricing
  - Filter by service type and category

- **Assigned Products View:**
  - Grid and list view modes
  - Product availability toggle
  - Featured product marking
  - Location-specific stock and pricing display
  - Bulk operations support

- **Statistics Cards:**
  - Total products assigned
  - Available products count
  - Featured products count
  - Categories represented

- **Product Management Actions:**
  - Toggle availability (enable/disable)
  - Mark as featured/unfeatured
  - Remove from location
  - Quick access to product details

## Custom Hooks

### `useServiceAreaProducts()`
Fetches products for a specific service area with filtering.

```typescript
const { products, loading, error, refetch, totalCount } = useServiceAreaProducts({
  serviceAreaId: 'uuid-here',
  serviceType: 'grocery', // optional
  categoryId: 'uuid-here', // optional
  searchTerm: 'milk', // optional
  limit: 50,
  offset: 0
});
```

### `useProductAvailabilityByPincode()`
Checks product availability in a specific pincode.

```typescript
const { isAvailable, loading, recheckAvailability } = useProductAvailabilityByPincode(
  productId,
  pincode
);
```

### `useServiceAreaSummary()`
Fetches summary statistics for all service areas.

```typescript
const { summaries, loading, error } = useServiceAreaSummary();
```

### `useBulkProductAssignment()`
Handles bulk product assignment operations.

```typescript
const { assignProducts, loading } = useBulkProductAssignment();

await assignProducts(serviceAreaId, [productId1, productId2], userId);
```

## Usage Workflow

### Admin Workflow

1. **Navigate to Service Areas:**
   - Admin Dashboard → Services → Service Areas

2. **Select a Service Area:**
   - Browse available service areas
   - Use search to find specific city/pincode
   - Click on a service area card

3. **Assign Products:**
   - Click "Add Products" button
   - Search and filter products
   - Select products using checkboxes
   - Click "Add X Product(s)" to assign

4. **Manage Products:**
   - Toggle product availability with enable/disable button
   - Mark products as featured using star button
   - Remove products using delete button
   - View location-specific pricing and stock

5. **Monitor Statistics:**
   - View total assigned products
   - Track available vs unavailable products
   - Monitor featured products
   - Check category distribution

### Customer Experience

When a customer enters their pincode during shopping:

1. System queries `serviceable_areas` table
2. Finds matching service area by pincode
3. Retrieves only products assigned to that area via `service_area_products`
4. Applies location-specific pricing if `price_override` is set
5. Shows delivery time from `delivery_time_override` or area default
6. Respects `is_available` flag for real-time availability

## Business Benefits

### 1. **Location-Specific Inventory**
- Different products for different cities
- Regional product preferences
- Seasonal product availability by location

### 2. **Dynamic Pricing**
- Location-based pricing strategies
- Market-specific pricing
- Competitive pricing per region

### 3. **Delivery Optimization**
- Product-specific delivery times per location
- Better customer expectations
- Improved delivery planning

### 4. **Marketing Control**
- Feature different products in different regions
- Location-specific promotions
- Regional marketing campaigns

### 5. **Operational Efficiency**
- Reduce logistics complexity
- Better inventory management
- Focused product catalog per location

## API Integration

### Fetch Products by Service Area

```typescript
const { data, error } = await supabase.rpc('get_products_by_service_area', {
  p_service_area_id: serviceAreaId,
  p_service_type: 'grocery',
  p_search_term: 'milk',
  p_limit: 50,
  p_offset: 0
});
```

### Check Product Availability

```typescript
const { data: isAvailable } = await supabase.rpc('is_product_available_in_pincode', {
  p_offering_id: productId,
  p_pincode: '110001'
});
```

### Bulk Assign Products

```typescript
const { data } = await supabase.rpc('bulk_assign_products_to_service_area', {
  p_service_area_id: serviceAreaId,
  p_offering_ids: [productId1, productId2, productId3],
  p_user_id: currentUserId
});
```

### Direct Table Operations

```typescript
// Assign a single product
const { error } = await supabase
  .from('service_area_products')
  .insert({
    service_area_id: areaId,
    offering_id: productId,
    is_available: true,
    price_override: 150.00,
    is_featured: true
  });

// Update product settings
const { error } = await supabase
  .from('service_area_products')
  .update({
    is_available: false,
    stock_quantity: 0
  })
  .eq('id', assignmentId);

// Remove product from area
const { error } = await supabase
  .from('service_area_products')
  .delete()
  .eq('id', assignmentId);
```

## Security & Permissions

### Row Level Security (RLS)

**Public Access:**
- Read only available products (`is_available = true`)
- Cannot see internal notes or overrides

**Authenticated Users:**
- Full CRUD operations on service area products
- Can manage assignments and configurations
- Audit trail with `created_by` and `updated_by`

### Admin Protection
All admin UI routes are protected by `AdminRoute` component and require admin role.

## Performance Considerations

### Indexing
The system includes optimized indexes on:
- `service_area_id` - Fast lookups by location
- `offering_id` - Fast product queries
- `is_available` - Quick availability checks
- `is_featured` - Featured product queries
- Scheduling fields - Time-based availability

### Query Optimization
- Uses database functions for complex queries
- Materialized view for summary statistics
- Proper JOIN optimization
- Pagination support for large datasets

## Future Enhancements

### Planned Features
1. **Automated Product Assignment:**
   - Auto-assign based on category rules
   - Bulk import from CSV
   - Copy products from one area to another

2. **Advanced Scheduling:**
   - Time-of-day availability
   - Day-of-week restrictions
   - Seasonal product rotation

3. **Analytics Dashboard:**
   - Product performance by location
   - Sales trends per area
   - Inventory turnover rates

4. **Vendor Integration:**
   - Vendor-specific service areas
   - Multi-vendor product availability
   - Vendor performance by location

5. **Smart Recommendations:**
   - Suggest products based on area demographics
   - Auto-suggest pricing based on competition
   - Predict demand by location

## Troubleshooting

### Common Issues

**Products not showing in location:**
1. Check if product is assigned to service area
2. Verify `is_available` is true
3. Check scheduling dates (available_from/until)
4. Ensure service area `is_serviceable` is true

**Pricing not updating:**
1. Verify `price_override` is set correctly
2. Clear browser cache
3. Check if base price changed
4. Ensure proper permissions

**Bulk assignment fails:**
1. Check for duplicate assignments
2. Verify all product IDs are valid
3. Ensure service area exists
4. Check database connection

## Support & Resources

- **Database Schema:** `/supabase/migrations/20250119_service_area_product_mapping.sql`
- **Components:** `/client/components/admin/ServiceAreaProductManagement.tsx`
- **Hooks:** `/client/hooks/use-service-area-products.ts`
- **Types:** `/shared/api.ts` - ServiceAreaProduct interfaces

## Migration

To apply the service area product management system to a new environment:

```bash
# Apply the migration
psql -d your_database < supabase/migrations/20250119_service_area_product_mapping.sql

# Or use Supabase CLI
supabase db push
```

---

**Created:** January 19, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

