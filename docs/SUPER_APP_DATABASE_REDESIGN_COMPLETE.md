# KooliHub Super App Database Redesign - Complete Implementation

## Executive Summary

The KooliHub database has been completely redesigned to support a multi-service, multi-tenant, multi-vendor super app architecture. This redesign transforms the platform from a product-centric model to a unified offering model that can handle any type of service or product across unlimited categories and vendors.

## 🎯 Objectives Achieved

✅ **Unified Offering Model**: Single table architecture for all service types  
✅ **Hierarchical Categories**: Unlimited depth category structure using ltree  
✅ **Flexible Attributes**: Dynamic attribute system without schema changes  
✅ **Service Availability**: Per-pincode service toggles with scheduling  
✅ **Multi-Location Support**: Merchants/outlets with inventory tracking  
✅ **Multi-Tenant Ready**: Complete tenant isolation with RLS  
✅ **Workflow Preservation**: Existing functionality maintained  

## 🗄️ Schema Architecture Overview

### Core Philosophy: "Everything is an Offering"

The new architecture treats all business items (products, services, rides, rentals, bookings, subscriptions) as "offerings" in a unified model.

### Key Design Principles

1. **Scalability**: Supports unlimited service types and categories
2. **Flexibility**: Dynamic attributes without schema changes
3. **Performance**: Optimized indexes and materialized views
4. **Security**: Multi-tenant RLS with complete data isolation
5. **Extensibility**: Future-proof for new business models

## 📊 Database Schema Changes

### New Core Tables

#### 1. Multi-Tenancy Foundation
```sql
-- Supports marketplace, vendor stores, franchises, white-label
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    type tenant_type, -- marketplace, vendor, franchise, white_label
    domain TEXT,
    settings JSONB,
    is_active BOOLEAN
);
```

#### 2. Unified Offerings Model
```sql
-- Replaces the products table with universal offering support
CREATE TABLE offerings (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    vendor_id UUID REFERENCES vendors(id),
    name TEXT NOT NULL,
    type offering_type, -- product, service, ride, delivery, booking, rental, subscription, digital
    status offering_status, -- draft, pending_approval, active, inactive, out_of_stock, discontinued
    category_path LTREE, -- Hierarchical path
    base_price DECIMAL(15,4),
    pricing_type TEXT, -- fixed, dynamic, tiered, negotiable
    search_vector TSVECTOR, -- Full-text search
    availability_type availability_type, -- always, scheduled, on_demand, appointment_only
    custom_attributes JSONB, -- Flexible attributes
    metadata JSONB -- Additional metadata
);
```

#### 3. Dynamic Attribute Registry
```sql
-- Centralized attribute definitions
CREATE TABLE attribute_registry (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    data_type TEXT, -- text, number, boolean, select, multiselect, date, etc.
    scope TEXT, -- offering, variant, category, vendor, tenant
    applicable_types offering_type[],
    validation_rules JSONB,
    options JSONB,
    is_searchable BOOLEAN,
    is_filterable BOOLEAN
);

-- Polymorphic attribute values
CREATE TABLE offering_attributes (
    id UUID PRIMARY KEY,
    offering_id UUID REFERENCES offerings(id),
    variant_id UUID REFERENCES offering_variants(id),
    attribute_id UUID REFERENCES attribute_registry(id),
    value_text TEXT,
    value_number DECIMAL(15,4),
    value_boolean BOOLEAN,
    value_json JSONB,
    value_date DATE,
    value_datetime TIMESTAMP WITH TIME ZONE
);
```

#### 4. Multi-Location Merchants
```sql
-- Physical locations/outlets for vendors
CREATE TABLE merchants (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    vendor_id UUID REFERENCES vendors(id),
    name TEXT NOT NULL,
    type TEXT, -- store, warehouse, distribution_center, pickup_point, service_center
    location GEOMETRY(POINT, 4326),
    business_hours JSONB,
    delivery_zones UUID[],
    settings JSONB
);

-- Location-specific inventory and pricing
CREATE TABLE merchant_inventory (
    id UUID PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id),
    offering_id UUID REFERENCES offerings(id),
    variant_id UUID REFERENCES offering_variants(id),
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    price_override DECIMAL(15,4),
    is_available BOOLEAN
);
```

#### 5. Enhanced Service Zones
```sql
-- Per-pincode service availability with scheduling
CREATE TABLE zone_service_availability (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    zone_id UUID REFERENCES service_zones(id),
    pincode TEXT,
    service_types TEXT[],
    offering_types offering_type[],
    availability_schedule JSONB, -- Business hours, special dates
    is_active BOOLEAN,
    delivery_time_hours INTEGER,
    delivery_charge DECIMAL(10,2),
    coordinates GEOMETRY(POINT, 4326)
);
```

### Enhanced Existing Tables

#### Categories with Hierarchical Support
```sql
-- Added ltree support for unlimited depth
ALTER TABLE categories ADD COLUMN category_path LTREE;
ALTER TABLE categories ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Example paths: "electronics", "electronics.laptops", "electronics.laptops.gaming"
```

#### Service Zones with PostGIS
```sql
-- Added spatial support
ALTER TABLE service_zones ADD COLUMN geometry GEOMETRY(POLYGON, 4326);
ALTER TABLE service_zones ADD COLUMN center_point GEOMETRY(POINT, 4326);
```

## 🔧 Migration Strategy

### Phase 1: Schema Creation ✅
- Created new tables with proper constraints and indexes
- Enabled PostGIS and ltree extensions
- Set up ENUM types for data integrity

### Phase 2: Data Migration ✅
- Migrated existing products to offerings table
- Created default merchants for existing vendors
- Migrated inventory data to merchant_inventory
- Populated category paths using ltree
- Set up service availability zones

### Phase 3: Compatibility Layer ✅
- Created `products_view` for backward compatibility
- Implemented helper functions for stock and pricing
- Maintained existing API endpoint functionality

### Phase 4: Enhanced Features ✅
- Added full-text search capabilities
- Created business logic functions
- Set up performance optimizations
- Implemented audit logging

## 🛡️ Security & Access Control

### Multi-Tenant RLS Policies

#### Helper Functions
```sql
-- Get user's tenant context
CREATE FUNCTION get_user_tenant_id() RETURNS UUID;

-- Check admin privileges  
CREATE FUNCTION is_admin() RETURNS BOOLEAN;

-- Check vendor access
CREATE FUNCTION is_vendor_user(vendor_uuid UUID) RETURNS BOOLEAN;
```

#### Policy Examples
```sql
-- Public can view active offerings
CREATE POLICY "Public can view active offerings" ON offerings
    FOR SELECT TO anon, authenticated
    USING (
        is_active = true 
        AND status = 'active' 
        AND (tenant_id = get_user_tenant_id() OR tenant_id IS NULL)
    );

-- Vendors can manage their offerings
CREATE POLICY "Vendors can manage their offerings" ON offerings
    FOR ALL TO authenticated
    USING (
        vendor_id IS NOT NULL 
        AND is_vendor_user(vendor_id)
        AND (tenant_id = get_user_tenant_id() OR tenant_id IS NULL)
    );
```

## 📈 Performance Optimizations

### Indexes Created
```sql
-- Offering-specific indexes
CREATE INDEX idx_offerings_tenant_type_status ON offerings(tenant_id, type, status);
CREATE INDEX idx_offerings_search_vector ON offerings USING GIN(search_vector);
CREATE INDEX idx_offerings_category_path ON offerings USING GIST(category_path);

-- Spatial indexes
CREATE INDEX idx_merchants_location ON merchants USING GIST(location);
CREATE INDEX idx_zone_availability_coordinates ON zone_service_availability USING GIST(coordinates);

-- Category hierarchy indexes
CREATE INDEX idx_categories_path_gist ON categories USING GIST(category_path);
```

### Business Logic Functions
```sql
-- Intelligent search across offerings
CREATE FUNCTION search_offerings(
    search_query TEXT,
    offering_types offering_type[],
    price_min DECIMAL,
    price_max DECIMAL,
    tenant_uuid UUID,
    limit_count INTEGER
) RETURNS TABLE (...);

-- Service availability checking
CREATE FUNCTION check_service_availability(
    pincode_input TEXT,
    offering_type_input offering_type,
    check_time TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (...);
```

## 🔄 Backward Compatibility

### Products View
```sql
-- Maintains compatibility with existing product queries
CREATE VIEW products_view AS
SELECT 
    o.id,
    o.name,
    o.description,
    o.base_price as price,
    -- ... all original product fields mapped from offerings
FROM offerings o
LEFT JOIN merchant_inventory mi ON mi.offering_id = o.id
WHERE o.type IN ('product', 'service');
```

### API Compatibility
- Existing API endpoints continue to work
- Product CRUD operations transparently use offerings table
- Inventory management works through merchant_inventory
- Search and filtering maintain same interface

## 🚀 New Capabilities

### 1. Universal Service Support
- **Products**: Physical goods with inventory tracking
- **Services**: Professional services with scheduling
- **Rides**: Transportation services with routes
- **Rentals**: Equipment/vehicle rentals with availability
- **Bookings**: Event/appointment reservations
- **Subscriptions**: Recurring services
- **Digital**: Digital products and services

### 2. Dynamic Attribute System
```typescript
// Define new attributes without schema changes
const carAttribute = {
  name: 'engine_type',
  label: 'Engine Type',
  data_type: 'select',
  options: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
  applicable_types: ['rental', 'ride']
};

// Apply to offerings
await supabase.from('attribute_registry').insert(carAttribute);
```

### 3. Flexible Pricing
- Base pricing at offering level
- Zone-specific pricing overrides
- Merchant-specific pricing
- Dynamic pricing support
- Tier-based pricing for bulk orders

### 4. Multi-Location Inventory
- Real-time stock tracking across locations
- Location-specific pricing
- Delivery zone management
- Pickup point support

### 5. Advanced Service Availability
```typescript
// Check service availability with scheduling
const availability = await supabase.rpc('check_service_availability', {
  pincode_input: '110001',
  offering_type_input: 'service'
});
// Returns: availability, delivery time, charges, zone info
```

## 📱 Frontend Integration

### Updated API Patterns

#### Fetching Offerings
```typescript
// Modern approach - unified offerings
const { data: offerings } = await supabase
  .from('offerings')
  .select(`
    *,
    vendor:vendors(name, logo_url),
    category:categories(name, category_path),
    merchant_inventory(quantity, price_override)
  `)
  .eq('type', 'product')
  .eq('is_active', true);

// Legacy approach - still works through products_view
const { data: products } = await supabase
  .from('products_view')
  .select('*')
  .eq('is_active', true);
```

#### Dynamic Attributes
```typescript
// Fetch offering with all attributes
const { data: offeringWithAttrs } = await supabase
  .from('offerings')
  .select(`
    *,
    offering_attributes(
      attribute_registry(name, label, data_type, options),
      value_text, value_number, value_boolean, value_json
    )
  `)
  .eq('id', offeringId)
  .single();
```

#### Search and Filtering
```typescript
// Advanced search with full-text search
const { data: searchResults } = await supabase.rpc('search_offerings', {
  search_query: 'laptop gaming',
  offering_types: ['product'],
  price_min: 500,
  price_max: 2000,
  limit_count: 20
});
```

## 🏗️ Implementation Status

### ✅ Completed
1. **Core Schema Design**: All tables and relationships created
2. **Data Migration**: Existing products migrated to offerings
3. **RLS Policies**: Multi-tenant security implemented
4. **Performance Optimization**: Indexes and functions created
5. **Backward Compatibility**: Products view and helper functions
6. **Documentation**: Cursor rules and guides updated

### 🔄 Ongoing/Next Steps
1. **Frontend Migration**: Gradual transition to new offering model
2. **API Enhancement**: Update endpoints to leverage new capabilities
3. **Advanced Features**: Implement subscription and booking flows
4. **Analytics**: Enhanced reporting with new data structure
5. **Mobile App**: Update mobile app to use new endpoints

## 🎛️ Configuration Examples

### Setting Up a New Service Type
```sql
-- 1. Add new offering type (if needed)
-- Already supported: product, service, ride, delivery, booking, rental, subscription, digital

-- 2. Create attribute definitions
INSERT INTO attribute_registry (
    tenant_id, name, label, data_type, applicable_types, options
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'consultation_duration',
    'Consultation Duration',
    'select',
    ARRAY['service'],
    '{"options": ["30 min", "1 hour", "2 hours", "Half day", "Full day"]}'
);

-- 3. Create categories
INSERT INTO categories (name, service_type, parent_id) VALUES
('Medical Services', 'service', NULL),
('Consultations', 'service', (SELECT id FROM categories WHERE name = 'Medical Services'));

-- 4. Create offerings
INSERT INTO offerings (
    tenant_id, vendor_id, name, type, category_id, base_price, availability_type
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'vendor-uuid',
    'General Health Consultation',
    'service',
    (SELECT id FROM categories WHERE name = 'Consultations'),
    150.00,
    'appointment_only'
);
```

### Configuring Service Availability
```sql
-- Set up service availability for a new area
INSERT INTO zone_service_availability (
    tenant_id, pincode, offering_types, availability_schedule, delivery_time_hours
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '560001',
    ARRAY['product', 'service'],
    '{
        "business_hours": {
            "monday": {"open": "09:00", "close": "21:00", "enabled": true},
            "tuesday": {"open": "09:00", "close": "21:00", "enabled": true},
            "wednesday": {"open": "09:00", "close": "21:00", "enabled": true},
            "thursday": {"open": "09:00", "close": "21:00", "enabled": true},
            "friday": {"open": "09:00", "close": "21:00", "enabled": true},
            "saturday": {"open": "09:00", "close": "21:00", "enabled": true},
            "sunday": {"open": "10:00", "close": "20:00", "enabled": true}
        }
    }',
    2
);
```

## 📊 Impact Assessment

### Positive Impacts
1. **Scalability**: Can now support unlimited service types
2. **Flexibility**: Dynamic attributes without schema changes  
3. **Performance**: Optimized queries and indexes
4. **Maintainability**: Unified model reduces complexity
5. **Future-Proof**: Easily extensible for new business models

### Risk Mitigation
1. **Backward Compatibility**: Maintained through views and functions
2. **Data Integrity**: Comprehensive constraints and validation
3. **Performance**: Extensive indexing and optimization
4. **Security**: Enhanced RLS with multi-tenant support
5. **Testing**: Phased migration with rollback capabilities

## 🎯 Conclusion

The KooliHub database redesign successfully transforms the platform into a true multi-service super app while maintaining complete backward compatibility. The new architecture provides:

- **Unlimited scalability** for new service types
- **Complete tenant isolation** for multi-tenant operations  
- **Flexible attribute system** for diverse business models
- **Enhanced performance** through optimized queries
- **Future-proof design** for ongoing business evolution

The implementation preserves all existing workflows while enabling powerful new capabilities that position KooliHub for sustained growth across multiple service verticals.

---

**Implementation Date**: September 2025  
**Migration Status**: ✅ Complete  
**Backward Compatibility**: ✅ Maintained  
**Performance Impact**: ✅ Optimized  
**Security**: ✅ Enhanced Multi-tenant RLS  

For technical support or questions about the new schema, refer to the updated Cursor rules in `.cursor/rules/database-supabase.mdc`.

