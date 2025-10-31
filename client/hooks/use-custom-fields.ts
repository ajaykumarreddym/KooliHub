import { authenticatedFetch } from '@/lib/api';
import { FormField } from '@/lib/service-field-configs';
import { useCallback, useEffect, useState } from 'react';

export interface CustomField {
  id: string;
  service_type_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_group?: string;
  validation_rules?: any;
  field_options?: any;
  default_value?: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_translatable: boolean;
  sort_order?: number;
  help_text?: string;
}

export interface CustomFieldValue {
  id: string;
  product_id: string;
  field_definition_id: string;
  value_text?: string;
  value_number?: number;
  value_boolean?: boolean;
  value_json?: any;
}

export function useCustomFields(serviceType: string) {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomFields = useCallback(async () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [HOOK] useCustomFields.fetchCustomFields called');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Request parameters:');
      console.log('  ├─ Service Type:', serviceType);
      console.log('  └─ API Endpoint:', `/api/admin/custom-fields/${serviceType}`);

      const startTime = performance.now();
      const response = await authenticatedFetch(`/api/admin/custom-fields/${serviceType}`);
      const endTime = performance.now();
      
      console.log(`\n⏱️  API Response time: ${(endTime - startTime).toFixed(2)}ms`);
      console.log('📊 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('\n✅ API Response successful');
      console.log('📦 Data received:');
      console.log('  ├─ Fields count:', data?.length || 0);
      console.log('  └─ Data type:', Array.isArray(data) ? 'Array' : typeof data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('\n📋 Fields summary:');
        data.forEach((field: any, index: number) => {
          const hasOptions = !!field.field_options;
          const optionsCount = Array.isArray(field.field_options) ? field.field_options.length : 0;
          console.log(`  [${index + 1}] ${field.field_name}:`);
          console.log(`    ├─ Label: ${field.field_label}`);
          console.log(`    ├─ Type: ${field.field_type}`);
          console.log(`    ├─ Has options: ${hasOptions}`);
          console.log(`    └─ Options count: ${optionsCount}`);
          
          if (field.field_name === 'measurement_unit') {
            console.log('\n  🎯 MEASUREMENT_UNIT DETAILS:');
            console.log('    ├─ Field options:', field.field_options);
            console.log('    └─ Is required:', field.is_required);
          }
        });
      } else {
        console.warn('⚠️  No custom fields returned for service type:', serviceType);
        console.log('💡 The form will use base/static fields only');
      }
      
      setCustomFields(data || []);
      console.log('\n✅ Custom fields state updated successfully');
      
    } catch (err) {
      console.error('\n❌ Error fetching custom fields');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error details:', err);
      if (err instanceof Error) {
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch custom fields';
      setError(errorMessage);
      setCustomFields([]); // Clear fields on error
    } finally {
      setLoading(false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }, [serviceType]);

  useEffect(() => {
    console.log('\n🔄 [HOOK] useCustomFields useEffect triggered');
    console.log('  └─ Service Type:', serviceType || '(empty)');
    
    if (!serviceType) {
      console.log('  ❌ No service type provided - clearing fields');
      setCustomFields([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('  ✅ Valid service type - fetching fields\n');
    fetchCustomFields();
  }, [serviceType, fetchCustomFields]);

  // Convert database custom fields to FormField format
  const convertToFormFields = (fields: CustomField[]): FormField[] => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [CONVERSION] Converting custom fields to form fields');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 Input:', fields.length, 'custom fields');
    
    if (fields.length === 0) {
      console.log('⚠️  No fields to convert');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return [];
    }
    
    const formFields = fields.map((field, index) => {
      console.log(`\n[${index + 1}/${fields.length}] Converting: ${field.field_name}`);
      
      // field_options is already an array from the API, not an object with .options property
      const options = Array.isArray(field.field_options) 
        ? field.field_options 
        : (field.field_options?.options || undefined);
      
      console.log(`  ├─ Type: ${field.field_type}`);
      console.log(`  ├─ Has options: ${!!options}`);
      console.log(`  └─ Options count: ${options?.length || 0}`);
      
      // Special logging for measurement_unit
      if (field.field_name === 'measurement_unit') {
        console.log('\n  🎯 [MEASUREMENT_UNIT CONVERSION]');
        console.log('    ├─ Raw field_options:', field.field_options);
        console.log('    ├─ Parsed options:', options);
        console.log('    ├─ Options is Array:', Array.isArray(options));
        console.log('    └─ Options count:', options?.length || 0);
        
        if (options && Array.isArray(options) && options.length > 0) {
          console.log('    📋 First 3 options:');
          options.slice(0, 3).forEach((opt: any, i: number) => {
            console.log(`      [${i + 1}] ${opt.label} = ${opt.value}`);
          });
        } else {
          console.error('    ❌ CRITICAL: measurement_unit has NO valid options!');
          console.error('    💡 field_options value:', field.field_options);
          console.error('    💡 This will cause dropdown to be empty!');
        }
      }
      
      const formField: FormField = {
        name: field.field_name,
        label: field.field_label,
        type: field.field_type as any,
        required: field.is_required,
        placeholder: field.help_text || `Enter ${field.field_label.toLowerCase()}`,
        options: options,
        min: field.validation_rules?.min?.toString() || undefined,
        max: field.validation_rules?.max?.toString() || undefined,
        step: field.validation_rules?.step?.toString() || undefined,
        rows: field.field_type === 'textarea' ? 3 : undefined,
        description: field.help_text || undefined,
      };
      
      console.log(`  ✅ Converted successfully`);
      return formField;
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [CONVERSION COMPLETE]', formFields.length, 'form fields ready');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return formFields;
  };

  return {
    customFields,
    formFields: convertToFormFields(customFields),
    loading,
    error,
    refetch: fetchCustomFields,
  };
}

export async function saveCustomFieldValues(
  productId: string,
  fieldValues: Record<string, any>,
  customFields: CustomField[]
) {
  try {
    const response = await authenticatedFetch(`/api/admin/custom-field-values/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fieldValues,
        customFields,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save custom field values');
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving custom field values:', error);
    throw error;
  }
}

export async function getCustomFieldValues(productId: string): Promise<Record<string, any>> {
  try {
    const response = await authenticatedFetch(`/api/admin/custom-field-values/${productId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch custom field values');
    }

    const values = await response.json();
    return values;
  } catch (error) {
    console.error('Error fetching custom field values:', error);
    return {};
  }
}
