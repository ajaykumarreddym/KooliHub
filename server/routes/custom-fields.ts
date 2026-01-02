import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

// Get custom fields for a service type
export const getCustomFields: RequestHandler = async (req, res) => {
  try {
    const { serviceTypeId } = req.params;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [CUSTOM FIELDS API] Request received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 Service Type ID:', serviceTypeId);

    if (!serviceTypeId) {
      console.error('❌ [VALIDATION ERROR] Service type ID is missing');
      return res.status(400).json({ error: "Service type ID is required" });
    }

    // Step 1: Verify service type exists in service_types table
    console.log('\n📋 [STEP 1] Verifying service type exists...');
    const { data: serviceTypeData, error: serviceTypeError } = await supabase
      .from("service_types")
      .select("id, title, is_active")
      .eq("id", serviceTypeId)
      .single();

    if (serviceTypeError) {
      console.error('❌ [SERVICE TYPE ERROR]', serviceTypeError);
      console.log('⚠️  Service type not found in service_types table');
      console.log('💡 Available service types should be checked in service_types table');
      return res.status(404).json({ 
        error: "Service type not found",
        details: serviceTypeError.message,
        serviceTypeId: serviceTypeId
      });
    }

    console.log('✅ [SERVICE TYPE] Found:', {
      id: serviceTypeData.id,
      title: serviceTypeData.title,
      is_active: serviceTypeData.is_active
    });

    // Step 2: Fetch service-specific attribute configuration
    console.log('\n📋 [STEP 2] Fetching service attribute configuration...');
    const { data, error } = await supabase
      .from("service_attribute_config")
      .select(`
        *,
        attribute_registry (
          id,
          name,
          label,
          data_type,
          input_type,
          placeholder,
          help_text,
          validation_rules,
          options,
          default_value
        )
      `)
      .eq("service_type_id", serviceTypeId)
      .eq("is_visible", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error('❌ [DATABASE ERROR] Failed to fetch service_attribute_config:', error);
      return res.status(500).json({ 
        error: "Failed to fetch custom fields",
        details: error.message
      });
    }

    console.log(`✅ [QUERY SUCCESS] Retrieved ${data?.length || 0} attribute configurations`);
    
    if (!data || data.length === 0) {
      console.warn('⚠️  [NO CONFIGURATIONS] No service_attribute_config entries found for:', serviceTypeId);
      console.log('💡 This service type may not have custom fields configured yet');
      console.log('💡 Returning empty array - form will use base fields only');
      return res.json([]);
    }

    // Step 3: Process and log each attribute
    console.log('\n📋 [STEP 3] Processing attributes...');
    data.forEach((config: any, index: number) => {
      const attrName = config.attribute_registry?.name || 'unknown';
      console.log(`\n  [${index + 1}/${data.length}] Processing: ${attrName}`);
      console.log(`    ├─ Has custom validation: ${!!config.custom_validation_rules}`);
      console.log(`    ├─ Has custom options: ${!!config.custom_validation_rules?.options}`);
      console.log(`    └─ Is visible: ${config.is_visible}`);
    });
    
    // Step 4: Special handling for measurement_unit
    console.log('\n📋 [STEP 4] Special check for measurement_unit...');
    const measurementConfig = data?.find((d: any) => d.attribute_registry?.name === 'measurement_unit');
    
    if (measurementConfig) {
      console.log('✅ [MEASUREMENT_UNIT FOUND]');
      console.log('  📊 Configuration details:');
      console.log('    ├─ Service Type ID:', measurementConfig.service_type_id);
      console.log('    ├─ Has custom validation rules:', !!measurementConfig.custom_validation_rules);
      console.log('    ├─ Has custom options:', !!measurementConfig.custom_validation_rules?.options);
      console.log('    ├─ Custom options count:', measurementConfig.custom_validation_rules?.options?.length || 0);
      console.log('    ├─ Base options count:', measurementConfig.attribute_registry?.options?.length || 0);
      
      if (measurementConfig.custom_validation_rules?.options) {
        console.log('  📋 Custom options preview:');
        measurementConfig.custom_validation_rules.options.slice(0, 3).forEach((opt: any) => {
          console.log(`    ├─ ${opt.label} (${opt.value})`);
        });
        if (measurementConfig.custom_validation_rules.options.length > 3) {
          console.log(`    └─ ... and ${measurementConfig.custom_validation_rules.options.length - 3} more`);
        }
      } else {
        console.warn('  ⚠️  No custom options found, will use base options');
      }
    } else {
      console.warn('⚠️  [MEASUREMENT_UNIT NOT FOUND] in service_attribute_config');
      console.log('💡 This service type may not have measurement_unit configured');
    }

    // Step 5: Transform data for frontend
    console.log('\n📋 [STEP 5] Transforming data for frontend...');
    
    const formattedFields = (data || []).map((config: any, index: number) => {
      const attr = config.attribute_registry;
      const fieldName = attr?.name || 'unknown';
      
      console.log(`\n  [${index + 1}/${data.length}] Transforming: ${fieldName}`);
      
      // CRITICAL: Extract custom options from custom_validation_rules first
      let fieldOptions;
      let optionsSource = 'none';
      
      if (config.custom_validation_rules && config.custom_validation_rules.options) {
        fieldOptions = config.custom_validation_rules.options;
        optionsSource = 'service-specific';
        console.log(`    ✅ Using service-specific options: ${fieldOptions.length} items`);
      } else if (attr?.options) {
        fieldOptions = attr.options;
        optionsSource = 'base';
        console.log(`    ⚠️  Falling back to base options: ${fieldOptions.length} items`);
      } else {
        fieldOptions = undefined;
        optionsSource = 'none';
        console.log(`    ❌ No options found`);
      }

      // Special logging for measurement_unit
      if (fieldName === 'measurement_unit') {
        console.log('\n  🎯 [MEASUREMENT_UNIT TRANSFORMATION]');
        console.log('    ├─ Options source:', optionsSource);
        console.log('    ├─ Options count:', fieldOptions?.length || 0);
        
        if (fieldOptions && fieldOptions.length > 0) {
          console.log('    ├─ First 3 options:');
          fieldOptions.slice(0, 3).forEach((opt: any) => {
            console.log(`    │  ├─ ${opt.label} = ${opt.value}`);
          });
        } else {
          console.error('    ❌ CRITICAL: measurement_unit has NO OPTIONS!');
          console.error('    💡 Check service_attribute_config.custom_validation_rules');
          console.error('    💡 Service Type ID:', serviceTypeId);
        }
      }
      
      const formattedField = {
        id: config.id,
        service_type_id: config.service_type_id,
        field_name: fieldName,
        field_label: config.override_label || attr?.label || '',
        field_type: attr?.data_type || 'text',
        input_type: attr?.input_type || 'text',
        field_group: config.field_group || 'basic',
        validation_rules: config.custom_validation_rules || attr?.validation_rules || {},
        field_options: fieldOptions,
        default_value: attr?.default_value,
        is_required: config.is_required || false,
        is_searchable: true,
        is_filterable: true,
        is_translatable: false,
        sort_order: config.display_order || 0,
        help_text: config.override_help_text || attr?.help_text || config.override_placeholder || attr?.placeholder,
      };
      
      console.log(`    └─ Transformed successfully`);
      return formattedField;
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [SUCCESS] Returning', formattedFields.length, 'formatted fields');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json(formattedFields);
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [FATAL ERROR] in getCustomFields');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create a new custom field
export const createCustomField: RequestHandler = async (req, res) => {
  try {
    const {
      service_type_id,
      field_name,
      field_label,
      field_type,
      field_group,
      validation_rules,
      field_options,
      default_value,
      is_required,
      is_searchable,
      is_filterable,
      is_translatable,
      sort_order,
      help_text,
    } = req.body;

    // Validate required fields
    if (!service_type_id || !field_name || !field_label || !field_type) {
      return res.status(400).json({ 
        error: "Missing required fields: service_type_id, field_name, field_label, field_type" 
      });
    }

    // Validate field name format
    if (!/^[a-z][a-z0-9_]*$/.test(field_name)) {
      return res.status(400).json({
        error: "Field name must start with a letter and contain only lowercase letters, numbers, and underscores"
      });
    }

    // Validate field type
    const validFieldTypes = ['text', 'number', 'boolean', 'select', 'multiselect', 'date', 'datetime', 'url', 'email', 'tel', 'textarea'];
    if (!validFieldTypes.includes(field_type)) {
      return res.status(400).json({
        error: `Invalid field type. Must be one of: ${validFieldTypes.join(', ')}`
      });
    }

    // Validate field options for select/multiselect fields
    if ((field_type === 'select' || field_type === 'multiselect') && (!field_options || field_options.length === 0)) {
      return res.status(400).json({
        error: `${field_type} fields require at least one option`
      });
    }

    // Validate validation rules
    if (validation_rules) {
      if (field_type === 'number') {
        const { min, max } = validation_rules;
        if (min !== undefined && max !== undefined && min >= max) {
          return res.status(400).json({
            error: "Minimum value must be less than maximum value"
          });
        }
      }
      
      if (field_type === 'text' || field_type === 'textarea') {
        const { minLength, maxLength } = validation_rules;
        if (minLength !== undefined && maxLength !== undefined && minLength >= maxLength) {
          return res.status(400).json({
            error: "Minimum length must be less than maximum length"
          });
        }
      }
    }

    // Check if field name already exists for this service type
    const { data: existingField } = await supabase
      .from("service_field_definitions")
      .select("id")
      .eq("service_type_id", service_type_id)
      .eq("field_name", field_name)
      .single();

    if (existingField) {
      return res.status(400).json({ 
        error: "Field name already exists for this service type" 
      });
    }

    const fieldData = {
      service_type_id,
      field_name,
      field_label,
      field_type,
      field_group: field_group || "basic",
      validation_rules: validation_rules || {},
      field_options: field_options || null,
      default_value: default_value || null,
      is_required: is_required || false,
      is_searchable: is_searchable || false,
      is_filterable: is_filterable || false,
      is_translatable: is_translatable || false,
      sort_order: sort_order || 0,
      help_text: help_text || null,
    };

    const { data, error } = await supabase
      .from("service_field_definitions")
      .insert([fieldData])
      .select()
      .single();

    if (error) {
      console.error("Error creating custom field:", error);
      return res.status(500).json({ error: "Failed to create custom field" });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Error in createCustomField:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a custom field
export const updateCustomField: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const updateData = req.body;

    if (!fieldId) {
      return res.status(400).json({ error: "Field ID is required" });
    }

    // Remove fields that shouldn't be updated
    const { service_type_id, id, created_at, updated_at, ...allowedUpdates } = updateData;

    const { data, error } = await supabase
      .from("service_field_definitions")
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fieldId)
      .select()
      .single();

    if (error) {
      console.error("Error updating custom field:", error);
      return res.status(500).json({ error: "Failed to update custom field" });
    }

    if (!data) {
      return res.status(404).json({ error: "Custom field not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error in updateCustomField:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a custom field
export const deleteCustomField: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!fieldId) {
      return res.status(400).json({ error: "Field ID is required" });
    }

    // First, delete all product service attributes that reference this field
    const { error: deleteAttributesError } = await supabase
      .from("product_service_attributes")
      .delete()
      .eq("field_definition_id", fieldId);

    if (deleteAttributesError) {
      console.error("Error deleting product attributes:", deleteAttributesError);
      return res.status(500).json({ error: "Failed to delete related product attributes" });
    }

    // Then delete the field definition
    const { error } = await supabase
      .from("service_field_definitions")
      .delete()
      .eq("id", fieldId);

    if (error) {
      console.error("Error deleting custom field:", error);
      return res.status(500).json({ error: "Failed to delete custom field" });
    }

    res.json({ message: "Custom field deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCustomField:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get field templates
export const getFieldTemplates: RequestHandler = async (req, res) => {
  try {
    const templates = [
      {
        name: "Product Size",
        field_name: "size",
        field_label: "Size",
        field_type: "select",
        field_group: "basic",
        field_options: [
          { label: "XS", value: "xs" },
          { label: "S", value: "s" },
          { label: "M", value: "m" },
          { label: "L", value: "l" },
          { label: "XL", value: "xl" },
          { label: "XXL", value: "xxl" },
        ],
        is_required: true,
        is_searchable: true,
        is_filterable: true,
        help_text: "Select the available size",
      },
      {
        name: "Product Color",
        field_name: "color",
        field_label: "Color",
        field_type: "text",
        field_group: "basic",
        is_required: true,
        is_searchable: true,
        is_filterable: true,
        help_text: "Enter available colors (comma-separated)",
      },
      {
        name: "Product Material",
        field_name: "material",
        field_label: "Material",
        field_type: "select",
        field_group: "details",
        field_options: [
          { label: "Cotton", value: "cotton" },
          { label: "Silk", value: "silk" },
          { label: "Polyester", value: "polyester" },
          { label: "Wool", value: "wool" },
          { label: "Leather", value: "leather" },
        ],
        is_searchable: true,
        is_filterable: true,
        help_text: "Select the primary material",
      },
      {
        name: "Warranty Information",
        field_name: "warranty",
        field_label: "Warranty",
        field_type: "text",
        field_group: "specifications",
        is_searchable: true,
        help_text: "Enter warranty details",
      },
      {
        name: "Model Number",
        field_name: "model_number",
        field_label: "Model Number",
        field_type: "text",
        field_group: "specifications",
        is_searchable: true,
        help_text: "Enter the product model number",
      },
      {
        name: "Price Range",
        field_name: "price_range",
        field_label: "Price Range",
        field_type: "select",
        field_group: "pricing",
        field_options: [
          { label: "Under $50", value: "under-50" },
          { label: "$50 - $100", value: "50-100" },
          { label: "$100 - $200", value: "100-200" },
          { label: "$200 - $500", value: "200-500" },
          { label: "Over $500", value: "over-500" },
        ],
        is_filterable: true,
        help_text: "Select the price range",
      },
      {
        name: "Availability Status",
        field_name: "is_available",
        field_label: "Available",
        field_type: "boolean",
        field_group: "basic",
        is_filterable: true,
        help_text: "Is this product currently available?",
      },
      {
        name: "Care Instructions",
        field_name: "care_instructions",
        field_label: "Care Instructions",
        field_type: "textarea",
        field_group: "details",
        help_text: "Washing and care instructions",
      },
    ];

    res.json(templates);
  } catch (error) {
    console.error("Error in getFieldTemplates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Apply field template
export const applyFieldTemplate: RequestHandler = async (req, res) => {
  try {
    const { serviceTypeId } = req.params;
    const { templateName } = req.body;

    if (!serviceTypeId || !templateName) {
      return res.status(400).json({ error: "Service type ID and template name are required" });
    }

    // Get the template
    const templates = [
      {
        name: "Product Size",
        field_name: "size",
        field_label: "Size",
        field_type: "select",
        field_group: "basic",
        field_options: [
          { label: "XS", value: "xs" },
          { label: "S", value: "s" },
          { label: "M", value: "m" },
          { label: "L", value: "l" },
          { label: "XL", value: "xl" },
          { label: "XXL", value: "xxl" },
        ],
        is_required: true,
        is_searchable: true,
        is_filterable: true,
        help_text: "Select the available size",
      },
      // Add other templates as needed
    ];

    const template = templates.find(t => t.name === templateName);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check if field already exists
    const { data: existingField } = await supabase
      .from("service_field_definitions")
      .select("id")
      .eq("service_type_id", serviceTypeId)
      .eq("field_name", template.field_name)
      .single();

    if (existingField) {
      return res.status(400).json({ error: "Field already exists for this service type" });
    }

    // Create the field
    const { data, error } = await supabase
      .from("service_field_definitions")
      .insert([{
        service_type_id: serviceTypeId,
        ...template,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error applying template:", error);
      return res.status(500).json({ error: "Failed to apply template" });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Error in applyFieldTemplate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Save custom field values for a product
export const saveCustomFieldValues: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const { fieldValues, customFields } = req.body;

    if (!productId || !fieldValues || !customFields) {
      return res.status(400).json({ error: "Product ID, field values, and custom fields are required" });
    }

    // Delete existing values for this product
    const { error: deleteError } = await supabase
      .from("product_service_attributes")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      console.error("Error deleting existing values:", deleteError);
      return res.status(500).json({ error: "Failed to clear existing values" });
    }

    // Insert new values
    const valuesToInsert = [];

    for (const [fieldName, value] of Object.entries(fieldValues)) {
      if (value === null || value === undefined || value === '') continue;

      const field = customFields.find((f: any) => f.field_name === fieldName);
      if (!field) continue;

      const valueData: any = {
        product_id: productId,
        field_definition_id: field.id,
      };

      // Determine which value column to use based on field type
      switch (field.field_type) {
        case 'number':
          valueData.value_number = parseFloat(value as string);
          break;
        case 'boolean':
        case 'switch':
          valueData.value_boolean = Boolean(value);
          break;
        case 'select':
        case 'multiselect':
          valueData.value_json = value;
          break;
        case 'text':
        case 'textarea':
        default:
          valueData.value_text = String(value);
          break;
      }

      valuesToInsert.push(valueData);
    }

    if (valuesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("product_service_attributes")
        .insert(valuesToInsert);

      if (insertError) {
        console.error("Error inserting values:", insertError);
        return res.status(500).json({ error: "Failed to save field values" });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error in saveCustomFieldValues:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get custom field values for a product
export const getCustomFieldValues: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const { data, error } = await supabase
      .from("product_service_attributes")
      .select(`
        *,
        field_definition:service_field_definitions(*)
      `)
      .eq("product_id", productId);

    if (error) {
      console.error("Error fetching field values:", error);
      return res.status(500).json({ error: "Failed to fetch field values" });
    }

    const values: Record<string, any> = {};

    data?.forEach((item: any) => {
      const fieldName = item.field_definition?.field_name;
      if (!fieldName) return;

      // Get the appropriate value based on field type
      let value = null;
      if (item.value_text !== null) value = item.value_text;
      else if (item.value_number !== null) value = item.value_number;
      else if (item.value_boolean !== null) value = item.value_boolean;
      else if (item.value_json !== null) value = item.value_json;

      values[fieldName] = value;
    });

    res.json(values);
  } catch (error) {
    console.error("Error in getCustomFieldValues:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
