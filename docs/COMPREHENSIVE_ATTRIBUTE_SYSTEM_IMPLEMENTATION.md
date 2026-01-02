# Comprehensive Multi-Service Dynamic Product/Offering Management System

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Core Components](#core-components)
- [Implementation Details](#implementation-details)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

This document describes the comprehensive, hierarchical product/offering management system implemented for KooliHub. The system supports multiple dynamic services, categories, and subcategories with configurable custom attributes while maintaining data inheritance and form consistency.

### Key Features

✅ **Centralized Attribute Registry** - Master configuration for all possible field types
✅ **Service-Level Configuration** - Admin can select and configure attributes per service
✅ **Category-Level Overrides** - Categories can inherit or override service attributes
✅ **Dynamic Form Generation** - Forms automatically generated based on configuration
✅ **Drag-and-Drop Ordering** - Visual field reordering interface
✅ **Required/Optional Toggles** - Flexible field requirement configuration
✅ **Live Preview** - Real-time form preview before saving
✅ **Mandatory Field Protection** - System fields cannot be deleted
✅ **Attribute Inheritance** - Hierarchical attribute resolution (Service → Category)

---

## 🏗️ System Architecture

### Data Flow

```
┌─────────────────────┐
│ Attribute Registry  │  ← Master list of all possible attributes
│  (All Attributes)   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Service Config     │  ← Service selects and orders attributes
│  (Service Level)    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Category Config    │  ← Category inherits or overrides
│ (Category Level)    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Dynamic Form       │  ← Final merged form with all fields
│  (Product Create)   │
└─────────────────────┘
```

### Component Hierarchy

```
ServiceManagement
├── ComprehensiveAttributeManager
│   ├── Service Selector
│   ├── Add Attributes Modal
│   ├── Edit Attributes Modal
│   ├── Delete Attributes Modal
│   └── Preview Form Modal
│
├── DynamicFormGenerator
│   ├── Mandatory Fields (Locked)
│   ├── Service Attributes
│   └── Category Attributes (Inherited/Overridden)
│
└── CategoryAttributeManager (Future)
    └── Category-specific overrides
```

---

## 💾 Database Schema

### Core Tables

#### 1. `attribute_registry`
Master registry of all possible attributes.

```sql
CREATE TABLE attribute_registry (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    data_type TEXT NOT NULL,
    input_type TEXT DEFAULT 'text',
    placeholder TEXT,
    help_text TEXT,
    group_name TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    applicable_types TEXT[],
    validation_rules JSONB DEFAULT '{}',
    options JSONB,
    default_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields:**
- `data_type`: text, number, boolean, select, multiselect, date, datetime, url, email, tel, textarea, file, image
- `input_type`: Defines how the field is rendered in the UI
- `applicable_types`: Array of offering types this attribute applies to (product, service, rental, etc.)
- `validation_rules`: JSONB containing min, max, minLength, maxLength, pattern, etc.

#### 2. `service_attribute_config`
Service-level attribute configuration.

```sql
CREATE TABLE service_attribute_config (
    id UUID PRIMARY KEY,
    service_type_id TEXT REFERENCES service_types(id),
    attribute_id UUID REFERENCES attribute_registry(id),
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    field_group TEXT DEFAULT 'general',
    override_label TEXT,
    override_placeholder TEXT,
    override_help_text TEXT,
    custom_validation_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_type_id, attribute_id)
);
```

**Purpose:**
- Stores which attributes are selected for each service
- Defines display order and required status
- Allows overriding labels, placeholders, and help text

#### 3. `category_attribute_config`
Category-level attribute overrides.

```sql
CREATE TABLE category_attribute_config (
    id UUID PRIMARY KEY,
    category_id UUID REFERENCES categories(id),
    attribute_id UUID REFERENCES attribute_registry(id),
    inherit_from_service BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    field_group TEXT DEFAULT 'general',
    override_label TEXT,
    override_placeholder TEXT,
    override_help_text TEXT,
    custom_validation_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, attribute_id)
);
```

**Purpose:**
- Categories can inherit from service configuration
- Categories can add new attributes
- Categories can override service-level settings

#### 4. `default_mandatory_fields`
System-defined mandatory fields.

```sql
CREATE TABLE default_mandatory_fields (
    id UUID PRIMARY KEY,
    field_name TEXT NOT NULL UNIQUE,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    input_type TEXT NOT NULL,
    placeholder TEXT,
    help_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_system_field BOOLEAN DEFAULT true,
    applicable_to_all_services BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Fields:**
1. Product Name (required, locked)
2. Product Description (required, locked)
3. Product Specification (required, locked)
4. Product Images (required, locked)
5. Price (required, locked)
6. Units/Quantity (required, locked)
7. Discount (optional, locked)
8. Vendor (required, locked)
9. SEO Meta Title (optional)
10. SEO Meta Tags (optional)
11. SEO Meta Description (optional)

---

## 🧩 Core Components

### 1. ComprehensiveAttributeManager

**Location:** `client/components/admin/ComprehensiveAttributeManager.tsx`

**Purpose:** Main interface for configuring service-level attributes

**Features:**
- Service type selector
- View configured attributes
- Add new attributes from registry
- Edit attribute settings (labels, placeholders, required status)
- Delete custom attributes (system fields protected)
- Drag-and-drop reordering
- Live form preview

**Key Functions:**
```typescript
fetchConfiguredAttributes(serviceId: string)
handleAddAttributes()
handleUpdateAttribute()
handleDeleteAttributes()
handleReorder(attrId: string, direction: 'up' | 'down')
handleToggleRequired(attrId: string, currentStatus: boolean)
generatePreviewFields(): PreviewField[]
```

### 2. DynamicFormGenerator

**Location:** `client/components/admin/DynamicFormGenerator.tsx`

**Purpose:** Generates dynamic forms based on attribute configuration

**Features:**
- Automatically fetches merged attributes (service + category)
- Renders fields based on input type
- Validates required fields
- Supports all field types (text, number, select, multiselect, checkbox, file, date, etc.)
- Groups fields by field_group
- Shows inheritance indicators
- Handles form submission with validation

**Props:**
```typescript
interface DynamicFormGeneratorProps {
    serviceTypeId?: string | null;
    categoryId?: string | null;
    initialValues?: Record<string, any>;
    onSubmit: (values: Record<string, any>) => Promise<void>;
    onCancel?: () => void;
    submitButtonText?: string;
}
```

**Key Functions:**
```typescript
fetchFormFields()
handleFieldChange(fieldName: string, value: any)
validateForm(): boolean
renderField(field: FormField)
handleSubmit(e: React.FormEvent)
```

### 3. CategoryAttributeManager (To be implemented)

**Purpose:** Manage category-specific attribute overrides

**Planned Features:**
- View inherited attributes from service
- Add category-specific attributes
- Override service-level settings
- Preview category-specific forms

---

## 🛠️ Implementation Details

### Database Functions

#### `get_product_form_attributes(p_service_type_id, p_category_id)`

Returns the complete merged attribute list for product form including:
1. Default mandatory fields (always shown first, locked)
2. Category-specific attributes (if category provided)
3. Service-level attributes (as fallback)

**Return Type:**
```sql
TABLE (
    attribute_id UUID,
    attribute_name TEXT,
    attribute_label TEXT,
    data_type TEXT,
    input_type TEXT,
    placeholder TEXT,
    help_text TEXT,
    is_required BOOLEAN,
    is_visible BOOLEAN,
    display_order INTEGER,
    field_group TEXT,
    validation_rules JSONB,
    options JSONB,
    default_value TEXT,
    is_system_field BOOLEAN,
    is_mandatory BOOLEAN,
    inherited_from TEXT
)
```

#### `get_service_attributes(p_service_type_id)`

Returns service-level configured attributes with overrides applied.

#### `get_category_attributes(p_category_id)`

Returns category attributes with inheritance resolution:
1. Category-specific overrides first
2. Service-level defaults (where not overridden)

#### `reorder_service_attributes(p_service_type_id, p_attribute_orders)`

Bulk updates display order of attributes for a service.

#### `add_attributes_to_service(p_service_type_id, p_attribute_ids, p_created_by)`

Bulk adds attributes to service configuration.

### Inheritance Logic

```
FOR category_id:
    1. Query category_attribute_config WHERE category_id = ?
    2. For attributes with inherit_from_service = false → Use category settings
    3. For other attributes → Query service_attribute_config WHERE service_type_id = (category's service_type)
    4. Merge results with category overrides taking precedence
    5. Sort by display_order
```

### Validation System

**Client-Side Validation:**
- Required field checking
- Data type validation (number, email, url)
- Custom validation rules (min, max, minLength, maxLength, pattern)

**Server-Side Validation:**
- RLS policies ensure only authorized users can modify configurations
- Foreign key constraints ensure data integrity
- Unique constraints prevent duplicate configurations

---

## 📚 Usage Guide

### Admin Workflow

#### Step 1: Configure Service Attributes

1. Navigate to **Admin → Service Management → Attributes**
2. Select a service type from the dropdown
3. Click **"Add Attributes"**
4. Search and select attributes from the registry
5. Click **"Add X Attribute(s)"**

#### Step 2: Customize Attributes

1. View the configured attributes list
2. Use **drag handles** or **up/down arrows** to reorder
3. Toggle the **Required/Optional** switch
4. Click **Edit** button to:
   - Override label
   - Override placeholder
   - Override help text
   - Change field group
5. Click **"Save Changes"**

#### Step 3: Preview Form

1. Click **"Preview Form"** button
2. Review how the product form will appear
3. Verify field ordering and grouping
4. Check mandatory vs. custom fields
5. Close preview when satisfied

#### Step 4: Delete Unwanted Attributes

1. Click **"Delete Attributes"** button
2. Select attributes to remove (system fields not shown)
3. Click **"Delete X Attribute(s)"**
4. Confirm deletion

#### Step 5: Create Product with Dynamic Form

1. Navigate to **Product Management**
2. Click **"Add Product"**
3. Select **Service Type** and **Category**
4. Dynamic form automatically loads with configured attributes
5. Fill in all required fields
6. Submit form

### Category-Level Configuration (Future)

1. Navigate to **Category Management**
2. Select a category
3. Click **"Configure Attributes"**
4. View inherited attributes from service
5. Add category-specific attributes
6. Override service-level settings
7. Save configuration

---

## 🔌 API Reference

### REST Endpoints

All operations use Supabase's auto-generated REST API:

**Get Attribute Registry:**
```
GET /rest/v1/attribute_registry?is_active=eq.true&order=name.asc
```

**Get Service Configuration:**
```
GET /rest/v1/service_attribute_config?service_type_id=eq.{id}&select=*,attribute_registry(*)&order=display_order.asc
```

**Create Service Configuration:**
```
POST /rest/v1/service_attribute_config
Body: {
  service_type_id: string,
  attribute_id: uuid,
  display_order: number,
  is_required: boolean,
  is_visible: boolean,
  field_group: string
}
```

**Update Service Configuration:**
```
PATCH /rest/v1/service_attribute_config?id=eq.{id}
Body: {
  is_required: boolean,
  override_label: string,
  ...
}
```

**Delete Service Configuration:**
```
DELETE /rest/v1/service_attribute_config?service_type_id=eq.{service}&attribute_id=eq.{attr}
```

### Database Functions (RPC)

**Get Product Form Attributes:**
```typescript
const { data, error } = await supabase.rpc('get_product_form_attributes', {
    p_service_type_id: 'grocery',
    p_category_id: 'uuid-here'
});
```

**Reorder Attributes:**
```typescript
const { data, error } = await supabase.rpc('reorder_service_attributes', {
    p_service_type_id: 'grocery',
    p_attribute_orders: [
        { attribute_id: 'uuid1', display_order: 0 },
        { attribute_id: 'uuid2', display_order: 1 }
    ]
});
```

**Bulk Add Attributes:**
```typescript
const { data, error } = await supabase.rpc('add_attributes_to_service', {
    p_service_type_id: 'grocery',
    p_attribute_ids: ['uuid1', 'uuid2', 'uuid3'],
    p_created_by: currentUserId
});
```

---

## 🚀 Future Enhancements

### Short Term (1-2 weeks)

1. **Category Attribute Manager**
   - UI for category-level overrides
   - Category-specific attribute additions
   - Visual inheritance indicators

2. **Subcategory Support**
   - Extend hierarchy to support subcategories
   - Subcategory attribute configurations
   - Three-level inheritance resolution

3. **Attribute Templates**
   - Save common attribute sets as templates
   - Apply templates to multiple services
   - Version control for templates

4. **Bulk Operations**
   - Bulk edit attributes across multiple services
   - Copy attribute configuration between services
   - Export/import configurations

### Medium Term (1-2 months)

1. **Conditional Fields**
   - Show/hide fields based on other field values
   - Dynamic validation rules
   - Field dependencies

2. **Advanced Validation**
   - Custom validation functions
   - Cross-field validation
   - Async validation (e.g., unique SKU check)

3. **Multi-Language Support**
   - Translate attribute labels
   - Translate help text
   - Translate field options

4. **Attribute Usage Analytics**
   - Track which attributes are most used
   - Identify unused attributes
   - Attribute completion rates

### Long Term (3-6 months)

1. **AI-Powered Suggestions**
   - Suggest attributes based on service type
   - Auto-fill product data
   - Smart categorization

2. **Version History**
   - Track configuration changes over time
   - Rollback to previous configurations
   - Audit trail for compliance

3. **Advanced Field Types**
   - Rich text editor
   - Location picker
   - Color picker
   - Image gallery manager
   - Video uploader

4. **Data Migration Tools**
   - Handle existing products when schema changes
   - Bulk update product attributes
   - Data quality checks

---

## 📊 Performance Considerations

### Database Optimization

1. **Indexes:**
   - `idx_service_attribute_config_service` - Fast lookup by service
   - `idx_category_attribute_config_category` - Fast lookup by category
   - `idx_attribute_registry_active` - Filter active attributes

2. **Query Optimization:**
   - Use `select=*,attribute_registry(*)` for efficient joins
   - Implement pagination for large attribute lists
   - Cache frequently accessed configurations

3. **RLS Policies:**
   - Minimal overhead with proper indexing
   - Separate read/write policies for performance

### Frontend Optimization

1. **State Management:**
   - Use React Query for server state caching
   - Implement optimistic updates
   - Debounce search inputs

2. **Component Optimization:**
   - Memo expensive computations
   - Virtualize long attribute lists
   - Lazy load modals

3. **Form Performance:**
   - Debounce form validation
   - Use controlled components efficiently
   - Implement field-level validation

---

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

1. **Public Read Access:**
   - Anyone can view active attributes
   - Anyone can view configured attributes

2. **Admin Write Access:**
   - Only admins can create/update/delete configurations
   - Only admins can modify attribute registry

3. **Vendor Restrictions:**
   - Vendors can only manage their own products
   - Vendors cannot modify service/category configurations

### Data Validation

1. **Server-Side:**
   - Foreign key constraints
   - Check constraints on data types
   - Unique constraints prevent duplicates

2. **Client-Side:**
   - TypeScript type checking
   - Zod schema validation
   - Real-time validation feedback

---

## 🧪 Testing Strategy

### Unit Tests (To be implemented)

```typescript
describe('DynamicFormGenerator', () => {
    test('renders mandatory fields first', () => {...});
    test('validates required fields', () => {...});
    test('handles field inheritance correctly', () => {...});
});

describe('ComprehensiveAttributeManager', () => {
    test('adds attributes to service', () => {...});
    test('reorders attributes correctly', () => {...});
    test('prevents deletion of system fields', () => {...});
});
```

### Integration Tests

1. **Service Configuration Flow:**
   - Select service → Add attributes → Reorder → Preview → Save
   
2. **Product Creation Flow:**
   - Select service → Select category → Fill form → Validate → Submit

3. **Category Override Flow:**
   - Configure service → Create category → Override attributes → Create product

### End-to-End Tests

```typescript
test('Complete attribute management workflow', async () => {
    // 1. Admin configures service attributes
    // 2. Admin reorders and sets required status
    // 3. Admin previews form
    // 4. Vendor creates product using dynamic form
    // 5. Verify product has correct attributes
});
```

---

## 📝 Migration Guide

### Applying the Database Migration

1. **Backup Database:**
   ```bash
   # Create backup before migration
   supabase db dump > backup-$(date +%Y%m%d).sql
   ```

2. **Run Migration:**
   ```bash
   # Apply the migration
   psql -U postgres -d koolihub -f database-comprehensive-attribute-system.sql
   ```

3. **Verify Migration:**
   ```sql
   -- Check tables created
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
       'service_attribute_config',
       'category_attribute_config',
       'default_mandatory_fields'
   );
   
   -- Check functions created
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%attribute%';
   ```

4. **Populate Initial Data:**
   ```sql
   -- Mandatory fields are auto-populated by migration
   -- Verify:
   SELECT * FROM default_mandatory_fields ORDER BY display_order;
   ```

### Migrating Existing Data

If you have existing products with custom fields:

```sql
-- Example: Migrate existing product fields to new system
-- This is service-specific and should be customized

-- 1. Create attribute definitions for existing fields
INSERT INTO attribute_registry (name, label, data_type, applicable_types)
SELECT DISTINCT 
    'legacy_' || field_name,
    field_name,
    'text',
    ARRAY['product']::text[]
FROM existing_product_fields;

-- 2. Create service configurations
INSERT INTO service_attribute_config (service_type_id, attribute_id)
SELECT 
    p.service_type,
    ar.id
FROM products p
JOIN attribute_registry ar ON ar.name LIKE 'legacy_%'
GROUP BY p.service_type, ar.id;

-- 3. Migrate product attribute values
INSERT INTO offering_attributes (offering_id, attribute_id, value_text)
SELECT 
    p.id,
    ar.id,
    p.field_value
FROM products p
JOIN attribute_registry ar ON ar.name = 'legacy_' || p.field_name;
```

---

## 🤝 Contributing

### Code Style

- Follow existing TypeScript/React patterns
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive comments for complex logic
- Write self-documenting code with clear variable names

### Adding New Field Types

1. **Update Database Enum:**
   ```sql
   ALTER TYPE field_data_type ADD VALUE 'your_new_type';
   ```

2. **Add to AttributeRegistry Interface:**
   ```typescript
   data_type: 'text' | 'number' | ... | 'your_new_type'
   ```

3. **Implement Renderer in DynamicFormGenerator:**
   ```typescript
   case 'your_new_type':
       return <YourCustomInput {...commonProps} />;
   ```

4. **Add Validation Logic:**
   ```typescript
   if (field.data_type === 'your_new_type') {
       // Custom validation
   }
   ```

### Pull Request Guidelines

1. Create feature branch from `dev`
2. Write descriptive commit messages
3. Update documentation
4. Add tests for new functionality
5. Ensure all tests pass
6. Request review from team lead

---

## 📞 Support

For questions or issues:
- Check this documentation first
- Review code comments in implementation files
- Contact: [Your Contact Info]
- Create issue in project tracker

---

## 📄 License

[Your License Information]

---

**Last Updated:** October 1, 2025
**Version:** 1.0.0
**Author:** KooliHub Development Team

