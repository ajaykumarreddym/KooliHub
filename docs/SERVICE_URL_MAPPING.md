# Service URL Mapping Reference

## Complete URL to Service Type Mapping

This document shows all available service URLs and their corresponding database service type IDs.

## URL Format Patterns

### Pattern 1: Direct Service URL
```
/{service-type-id}
Example: /grocery, /pharmacy, /electronics
```

### Pattern 2: Fallback Generic URL
```
/service/{service-type-id}
Example: /service/grocery, /service/pharmacy
```

## All Service Routes (18 Total)

| # | Database ID | URL Path(s) | Page Type | Status |
|---|------------|-------------|-----------|---------|
| 1 | `grocery` | `/grocery` | Custom | ✅ Active |
| 2 | `fruits-and-vegitables` | `/fruits-and-vegitables` | Dynamic | ✅ Active |
| 3 | `commercial-vehicles` | `/commercial-vehicles` | Dynamic | ✅ Active |
| 4 | `trips` | `/trips` | Custom | ✅ Active |
| 5 | `liquor` | `/liquor` | Dynamic | ✅ Active |
| 6 | `car-rental` | `/car-rental` | Custom | ✅ Active |
| 7 | `handyman` | `/handyman` | Custom | ✅ Active |
| 8 | `beauty-wellness` | `/beauty-wellness`, `/beauty` | Custom | ✅ Active |
| 9 | `pharmacy` | `/pharmacy` | Dynamic | ✅ Active |
| 10 | `electronics` | `/electronics` | Custom | ✅ Active |
| 11 | `pet-care` | `/pet-care` | Dynamic | ✅ Active |
| 12 | `home-kitchen` | `/home-kitchen`, `/home` | Custom | ✅ Active |
| 13 | `laundry` | `/laundry` | Dynamic | ✅ Active |
| 14 | `fashion` | `/fashion` | Custom | ✅ Active |
| 15 | `food-delivery` | `/food-delivery` | Dynamic | ✅ Active |
| 16 | `books-stationery` | `/books-stationery` | Dynamic | ✅ Active |
| 17 | `fitness` | `/fitness` | Dynamic | ✅ Active |
| 18 | `jewelry` | `/jewelry` | Dynamic | ✅ Active |

## Service Type Details

### 1. Grocery Delivery
- **URL**: `/grocery`
- **DB ID**: `grocery`
- **Icon**: 🛒
- **Description**: Quick grocery delivery to your doorstep
- **Features**: Location-based, 30-min delivery, Real-time inventory

### 2. Fruits & Vegetables
- **URL**: `/fruits-and-vegitables`
- **DB ID**: `fruits-and-vegitables`
- **Icon**: 📦
- **Description**: Fresh fruits and vegetables delivery
- **Note**: Uses DynamicServicePage

### 3. Commercial Vehicles
- **URL**: `/commercial-vehicles`
- **DB ID**: `commercial-vehicles`
- **Icon**: 📦
- **Description**: Commercial vehicle rental and transportation services
- **Note**: Uses DynamicServicePage

### 4. Trip Booking
- **URL**: `/trips`
- **DB ID**: `trips`
- **Icon**: 🚌
- **Description**: Book your perfect travel experience
- **Features**: Route-based booking, Time selection, Multiple pickup points

### 5. Liquor Delivery
- **URL**: `/liquor`
- **DB ID**: `liquor`
- **Icon**: 🍾
- **Description**: Premium liquor delivery to your doorstep
- **Note**: Age verification required, Uses DynamicServicePage

### 6. Car Rental
- **URL**: `/car-rental`
- **DB ID**: `car-rental`
- **Icon**: 🚗
- **Description**: Rent a car for your convenience
- **Features**: Hourly/Daily rates, Multiple locations, Insurance included

### 7. Handyman Services
- **URL**: `/handyman`
- **DB ID**: `handyman`
- **Icon**: 🔧
- **Description**: Professional repair and maintenance services
- **Features**: Quote-based pricing, Emergency service, Multiple categories

### 8. Beauty & Wellness
- **URL**: `/beauty-wellness` or `/beauty`
- **DB ID**: `beauty-wellness`
- **Icon**: 💄
- **Description**: Beauty services and wellness treatments
- **Note**: Has two URL aliases for convenience

### 9. Pharmacy
- **URL**: `/pharmacy`
- **DB ID**: `pharmacy`
- **Icon**: 💊
- **Description**: Medicine and healthcare products delivery
- **Note**: Prescription upload support, Uses DynamicServicePage

### 10. Electronics
- **URL**: `/electronics`
- **DB ID**: `electronics`
- **Icon**: 📱
- **Description**: Latest gadgets and electronic devices
- **Features**: Official warranty, Latest models, Brand showcase

### 11. Pet Care
- **URL**: `/pet-care`
- **DB ID**: `pet-care`
- **Icon**: 🐾
- **Description**: Pet supplies and veterinary services
- **Note**: Uses DynamicServicePage

### 12. Home & Kitchen
- **URL**: `/home-kitchen` or `/home`
- **DB ID**: `home-kitchen`
- **Icon**: 🏠
- **Description**: Everything for your home and kitchen needs
- **Features**: Multiple categories, Featured collections

### 13. Laundry & Dry Cleaning
- **URL**: `/laundry`
- **DB ID**: `laundry`
- **Icon**: 🧺
- **Description**: Professional laundry and dry cleaning services
- **Note**: Uses DynamicServicePage

### 14. Fashion
- **URL**: `/fashion`
- **DB ID**: `fashion`
- **Icon**: 👗
- **Description**: Clothing and fashion accessories
- **Features**: Size filters, Brand collections, Fashion trends

### 15. Food Delivery
- **URL**: `/food-delivery`
- **DB ID**: `food-delivery`
- **Icon**: 🍕
- **Description**: Restaurant food and meal delivery
- **Note**: Uses DynamicServicePage

### 16. Books & Stationery
- **URL**: `/books-stationery`
- **DB ID**: `books-stationery`
- **Icon**: 📚
- **Description**: Books, stationery, and office supplies
- **Note**: Uses DynamicServicePage

### 17. Fitness & Sports
- **URL**: `/fitness`
- **DB ID**: `fitness`
- **Icon**: 🏋️
- **Description**: Fitness equipment and sports gear
- **Note**: Uses DynamicServicePage

### 18. Jewelry & Accessories
- **URL**: `/jewelry`
- **DB ID**: `jewelry`
- **Icon**: 💎
- **Description**: Fine jewelry and fashion accessories
- **Note**: Uses DynamicServicePage

## Page Types Explained

### Custom Pages
- **Location**: `client/pages/{ServiceName}.tsx`
- **Examples**: Grocery, Fashion, CarRental, Handyman
- **Features**: 
  - Tailored UI for specific service type
  - Custom functionality and interactions
  - Service-specific features
- **When to Use**: For main revenue-generating services with unique UX needs

### Dynamic Pages
- **Component**: `client/pages/DynamicServicePage.tsx`
- **Examples**: Pharmacy, Liquor, Pet Care, Laundry
- **Features**:
  - Generic, reusable UI
  - Automatically adapts to service type
  - Loads data dynamically from database
- **When to Use**: For new or less complex services

## Adding New Service Types

### Method 1: Use Dynamic Page (Recommended)
1. Add service type in database (`service_types` table)
2. Set `is_active = true`
3. Add route in `client/App.tsx`:
   ```tsx
   <Route path="/your-service-id" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
   ```
4. Service automatically works!

### Method 2: Create Custom Page
1. Create `client/pages/YourService.tsx`
2. Implement custom UI and logic
3. Add route in `client/App.tsx`:
   ```tsx
   <Route path="/your-service-id" element={<LocationGuard><YourService /></LocationGuard>} />
   ```
4. Add to imports in App.tsx

## URL Best Practices

### ✅ Good URL Patterns
- `/grocery` - Simple, clear
- `/car-rental` - Kebab-case for multi-word
- `/beauty-wellness` - Descriptive

### ❌ Bad URL Patterns
- `/grocery_store` - Underscores not SEO-friendly
- `/Grocery` - Uppercase not standard
- `/grocerydelivery` - Hard to read
- `/grocery-delivery-service` - Too long

## Database Service Type ID Requirements

1. **Format**: lowercase, kebab-case
2. **Characters**: alphanumeric and hyphens only
3. **Length**: 3-50 characters
4. **Unique**: Must be unique in `service_types` table
5. **Stable**: Don't change IDs after deployment (breaks URLs)

## SEO Considerations

- Each service URL is clean and descriptive
- No query parameters needed
- Can add dynamic meta tags per service
- Supports social sharing with service-specific data

## Analytics Tracking

Track service page views:
```javascript
// In service pages
useEffect(() => {
  analytics.track('Service Page Viewed', {
    serviceType: serviceType,
    serviceName: serviceInfo?.title,
    locationId: serviceAreaId
  });
}, [serviceType]);
```

## Future URL Patterns (Planned)

### Service + Category
```
/grocery/dairy
/electronics/smartphones
/fashion/sarees
```

### Service + Location
```
/grocery/bangalore
/car-rental/delhi
```

### Service + Action
```
/handyman/book
/trips/schedule
```

## Related Documentation

- [Dynamic Service Routing Complete](./DYNAMIC_SERVICE_ROUTING_COMPLETE.md)
- [Quick Test Guide](./QUICK_TEST_GUIDE.md)
- [Routing & Pages Rules](./.cursor/rules/routing-pages.mdc)
- [Business Domain Rules](./.cursor/rules/business-domain.mdc)

## Support

For issues with service routing:
1. Check database `service_types` table
2. Verify route in `client/App.tsx`
3. Check browser console for errors
4. Test URL directly in browser
5. Check location context is working

