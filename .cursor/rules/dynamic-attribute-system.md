# Dynamic Attribute System Guidelines

## Overview
KooliHub implements a comprehensive hierarchical attribute management system for dynamic product/offering forms across multiple services. This rule provides guidelines for working with this system.

## Architecture

### Core Concept
The system uses a **three-tier hierarchy**:
1. **Attribute Registry** - Master list of all possible attributes
2. **Service Configuration** - Service-specific attribute selection and ordering
3. **Category Configuration** - Category-level overrides and additions

### Key Principle
**Attributes flow down the hierarchy with each level able to override or extend the previous level.**

## Database Tables

### `attribute_registry`
Master registry of all possible attributes. Think of this as a "library" of fields that can be used across services.

**Key Fields:**
- `name`: Unique identifier (e.g., 'organic', 'fuel_type')
- `label`: Human-readable label
- `data_type`: text, number, boolean, select, multiselect, date, etc.
- `input_type`: How field is rendered (text, textarea, select, checkbox, etc.)
- `applicable_types`: Array of offering types (product, service, rental, etc.)
- `validation_rules`: JSONB with min, max, pattern, etc.
- `options`: JSONB array for select/multiselect fields

**Usage:**
- Add new attributes here first
- Mark `is_active=true` for available attributes
- Use descriptive names and labels

### `service_attribute_config`
Defines which attributes are used for each service and their configuration.

**Key Fields:**
- `service_type_id`: Reference to service_types.id
- `attribute_id`: Reference to attribute_registry.id
- `is_required`: Whether field is mandatory for this service
- `display_order`: Sort order in forms
- `override_label`, `override_placeholder`, `override_help_text`: Service-specific customization

**Usage:**
- Configure through ComprehensiveAttributeManager component
- Each service can have different attributes
- Order matters - lower display_order appears first

### `category_attribute_config`
Category-level attribute customization and overrides.

**Key Fields:**
- `category_id`: Reference to categories.id
- `attribute_id`: Reference to attribute_registry.id
- `inherit_from_service`: If true, uses service config; if false, uses category config
- `is_required`, `display_order`: Category-specific overrides

**Usage:**
- Categories inherit service attributes by default
- Set `inherit_from_service=false` to override
- Add category-specific attributes as needed

### `default_mandatory_fields`
System-defined fields that appear in ALL forms and cannot be deleted.

**Fields Include:**
- product_name, product_description, price, vendor_name, etc.
- These are LOCKED and appear first in all forms
- Admins cannot delete these fields

## Components

### ComprehensiveAttributeManager
**Location:** `client/components/admin/ComprehensiveAttributeManager.tsx`

**Purpose:** Main UI for configuring service-level attributes

**When to Use:**
- Admin wants to configure which attributes a service uses
- Need to reorder service attributes
- Need to mark attributes as required/optional

**Key Features:**
- Add attributes from registry to service
- Drag-and-drop reordering
- Toggle required/optional status
- Edit labels, placeholders, help text
- Delete custom attributes (system fields protected)
- Live form preview

**Example Usage:**
```typescript
import ComprehensiveAttributeManager from '@/components/admin/ComprehensiveAttributeManager';

// In your admin service management page
<ComprehensiveAttributeManager />
```

### DynamicFormGenerator
**Location:** `client/components/admin/DynamicFormGenerator.tsx`

**Purpose:** Generates dynamic product forms based on attribute configuration

**When to Use:**
- Creating new products/offerings
- Editing existing products
- Any form that needs service-specific fields

**Key Features:**
- Automatically loads correct attributes for service/category
- Shows mandatory fields first (locked)
- Renders fields based on input_type
- Validates required fields
- Groups fields by field_group
- Shows inheritance indicators

**Example Usage:**
```typescript
import DynamicFormGenerator from '@/components/admin/DynamicFormGenerator';

<DynamicFormGenerator
    serviceTypeId="grocery"
    categoryId="category-uuid"
    initialValues={existingProduct}
    onSubmit={async (values) => {
        // Save product with dynamic attributes
        await saveProduct(values);
    }}
    submitButtonText="Create Product"
/>
```

## Database Functions

### `get_product_form_attributes(service_type_id, category_id)`
Returns merged attribute list for product form.

**Returns:**
1. Mandatory fields (always first, locked)
2. Category-specific attributes (if category provided)
3. Service-level attributes (if no category or as fallback)

**Usage:**
```typescript
const { data, error } = await supabase.rpc('get_product_form_attributes', {
    p_service_type_id: 'grocery',
    p_category_id: categoryUuid
});
```

### `get_service_attributes(service_type_id)`
Returns service-level configured attributes.

### `get_category_attributes(category_id)`
Returns category attributes with inheritance resolution.

### `reorder_service_attributes(service_type_id, attribute_orders)`
Bulk updates attribute display order.

### `add_attributes_to_service(service_type_id, attribute_ids, created_by)`
Bulk adds attributes to service configuration.

## Development Guidelines

### Adding New Attributes

1. **Create in Attribute Registry:**
```typescript
const newAttribute = {
    name: 'your_field_name',
    label: 'Your Field Label',
    data_type: 'text', // or number, boolean, select, etc.
    input_type: 'text', // or textarea, select, checkbox, etc.
    applicable_types: ['product', 'service'], // which offering types
    validation_rules: { 
        required: false,
        minLength: 3 
    },
    options: null, // For select fields: [{"label": "X", "value": "x"}]
    is_active: true
};

await supabase.from('attribute_registry').insert([newAttribute]);
```

2. **Add to Service Configuration:**
Use the ComprehensiveAttributeManager UI or:
```typescript
await supabase.from('service_attribute_config').insert([{
    service_type_id: 'grocery',
    attribute_id: newAttribute.id,
    display_order: 10,
    is_required: false
}]);
```

### Adding New Field Types

To add a new input type to DynamicFormGenerator:

1. Update the `renderField` function in DynamicFormGenerator.tsx
2. Add a new case statement for your type:
```typescript
case 'your_new_type':
    return (
        <YourCustomInput
            {...commonProps}
            // custom props
        />
    );
```

### Attribute Inheritance Logic

**Resolution Order:**
1. Check category_attribute_config WHERE category_id = X AND inherit_from_service = false
2. If found, use category settings
3. If not found, check service_attribute_config WHERE service_type_id = (category's service)
4. Always prepend mandatory fields at the start

**Implementation:**
Handled automatically by `get_product_form_attributes()` function.

## Common Patterns

### Pattern 1: Service-Specific Attributes
```typescript
// Example: Grocery needs 'organic' field, Electronics needs 'warranty'
// Add both to attribute_registry with appropriate applicable_types
// Configure in service_attribute_config for each service
```

### Pattern 2: Required vs Optional
```typescript
// Mark field as required at service level
await supabase
    .from('service_attribute_config')
    .update({ is_required: true })
    .eq('service_type_id', 'grocery')
    .eq('attribute_id', organicAttributeId);
```

### Pattern 3: Category Overrides
```typescript
// Category wants to make 'brand' required even though service says optional
await supabase
    .from('category_attribute_config')
    .insert({
        category_id: electronicsCategory,
        attribute_id: brandAttributeId,
        inherit_from_service: false,
        is_required: true
    });
```

### Pattern 4: Dynamic Form with Validation
```typescript
<DynamicFormGenerator
    serviceTypeId={selectedService}
    categoryId={selectedCategory}
    onSubmit={async (values) => {
        // Values contains all field data
        // System handles validation automatically
        
        // Separate mandatory vs custom attributes
        const mandatoryData = {
            name: values.product_name,
            description: values.product_description,
            price: values.price,
            vendor_id: values.vendor_name
        };
        
        // Custom attributes go to offering_attributes table
        const customAttributes = Object.entries(values)
            .filter(([key]) => !['product_name', 'product_description', 'price', 'vendor_name'].includes(key))
            .map(([key, value]) => ({
                attribute_name: key,
                value
            }));
        
        // Save to database
        const { data: offering } = await supabase
            .from('offerings')
            .insert([mandatoryData])
            .select()
            .single();
        
        // Save custom attributes
        await supabase
            .from('offering_attributes')
            .insert(customAttributes.map(attr => ({
                offering_id: offering.id,
                attribute_id: getAttributeId(attr.attribute_name),
                value_text: attr.value
            })));
    }}
/>
```

## Best Practices

### DO:
✅ Use ComprehensiveAttributeManager for all service attribute configuration
✅ Use DynamicFormGenerator for all product creation/editing forms
✅ Store reusable attributes in attribute_registry
✅ Group related attributes using field_group
✅ Provide helpful placeholder and help_text
✅ Use appropriate data_type and input_type combinations
✅ Test forms in preview mode before deploying
✅ Protect mandatory fields from deletion
✅ Use validation_rules for data quality

### DON'T:
❌ Hardcode product form fields
❌ Create service-specific attribute tables
❌ Delete or modify system mandatory fields
❌ Bypass the attribute registry
❌ Skip validation on custom attributes
❌ Ignore inheritance hierarchy
❌ Create duplicate attributes in registry
❌ Forget to set applicable_types correctly

## Performance Considerations

### Database
- Indexes on `service_type_id`, `category_id`, `attribute_id`
- Use `display_order` for sorting instead of ORDER BY in queries
- Cache attribute configurations in React Query
- Use RPC functions for complex queries

### Frontend
- Memo DynamicFormGenerator if parent re-renders frequently
- Debounce search in attribute selector
- Use virtual scrolling for long attribute lists
- Lazy load modals

## Testing

### Unit Tests
```typescript
describe('DynamicFormGenerator', () => {
    it('should render mandatory fields first', () => {});
    it('should validate required fields', () => {});
    it('should handle different input types', () => {});
});
```

### Integration Tests
```typescript
describe('Attribute Management Flow', () => {
    it('should add attribute to service', async () => {});
    it('should reorder attributes', async () => {});
    it('should create product with dynamic attributes', async () => {});
});
```

## Troubleshooting

### Problem: Attributes not showing in form
**Solution:** 
1. Check `is_active=true` in attribute_registry
2. Check `is_visible=true` in service_attribute_config
3. Verify service_type_id matches

### Problem: Mandatory fields missing
**Solution:**
- Check default_mandatory_fields table populated
- Verify get_product_form_attributes() function exists
- Check RLS policies allow access

### Problem: Inheritance not working
**Solution:**
- Verify category has correct service_type
- Check `inherit_from_service` flag
- Review get_category_attributes() function logic

### Problem: Cannot delete attribute
**Solution:**
- System fields (mandatory) cannot be deleted by design
- Check if attribute is marked as is_system_field
- Use Edit instead to hide field

## Migration Notes

When migrating from old system:
1. Run `database-comprehensive-attribute-system.sql`
2. Verify all tables created
3. Check mandatory fields populated
4. Migrate existing custom fields to attribute_registry
5. Create service_attribute_config entries
6. Update product creation forms to use DynamicFormGenerator

## Related Documentation
- [COMPREHENSIVE_ATTRIBUTE_SYSTEM_IMPLEMENTATION.md](../COMPREHENSIVE_ATTRIBUTE_SYSTEM_IMPLEMENTATION.md) - Full implementation guide
- [Database Schema](../database-comprehensive-attribute-system.sql) - Complete schema
- [Supabase RLS Policies](../database-comprehensive-attribute-system.sql#L8-RLS) - Security rules

## Questions?
If you encounter issues or need clarification:
1. Review this guide
2. Check implementation documentation
3. Examine component code comments
4. Contact team lead

---

**Version:** 1.0.0  
**Last Updated:** October 1, 2025  
**Maintained By:** KooliHub Dev Team

