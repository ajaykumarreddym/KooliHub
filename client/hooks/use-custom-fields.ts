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
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching custom fields for service type:', serviceType);

      const response = await authenticatedFetch(`/api/admin/custom-fields/${serviceType}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch custom fields');
      }

      const data = await response.json();
      console.log('✅ Custom fields fetched:', data);
      setCustomFields(data || []);
    } catch (err) {
      console.error('❌ Error fetching custom fields:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch custom fields');
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  useEffect(() => {
    console.log('🔄 useCustomFields useEffect triggered:', { serviceType });
    if (!serviceType) {
      console.log('❌ No service type, clearing fields');
      setCustomFields([]);
      setLoading(false);
      return;
    }

    console.log('✅ Service type provided, fetching fields');
    fetchCustomFields();
  }, [serviceType, fetchCustomFields]);

  // Convert database custom fields to FormField format
  const convertToFormFields = (fields: CustomField[]): FormField[] => {
    console.log('🔄 Converting custom fields to form fields:', { fieldsCount: fields.length, fields });
    const formFields = fields.map(field => ({
      name: field.field_name,
      label: field.field_label,
      type: field.field_type as any,
      required: field.is_required,
      placeholder: field.help_text || `Enter ${field.field_label.toLowerCase()}`,
      options: field.field_options?.options || undefined,
      min: field.validation_rules?.min?.toString() || undefined,
      max: field.validation_rules?.max?.toString() || undefined,
      step: field.validation_rules?.step?.toString() || undefined,
      rows: field.field_type === 'textarea' ? 3 : undefined,
      description: field.help_text || undefined,
    }));
    console.log('✅ Converted form fields:', { formFieldsCount: formFields.length, formFields });
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
