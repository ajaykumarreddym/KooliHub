import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomFields } from '@/hooks/use-custom-fields';
import { useState } from 'react';

const SERVICE_TYPES = [
  { id: 'fashion', name: 'Fashion' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'grocery', name: 'Grocery' },
  { id: 'music-litter', name: 'Music & Audio' },
  { id: 'car-rental', name: 'Car Rental' },
  { id: 'handyman', name: 'Handyman' },
];

export function CustomFieldsTest() {
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const { customFields, formFields, loading, error } = useCustomFields(selectedServiceType);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Fields Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Service Type:</label>
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose a service type" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedServiceType && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Debug Info:</h3>
                <p><strong>Service Type:</strong> {selectedServiceType}</p>
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Error:</strong> {error || 'None'}</p>
                <p><strong>Custom Fields Count:</strong> {customFields.length}</p>
                <p><strong>Form Fields Count:</strong> {formFields.length}</p>
              </div>

              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2">Loading custom fields...</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700"><strong>Error:</strong> {error}</p>
                </div>
              )}

              {!loading && !error && customFields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Custom Fields ({customFields.length}):</h3>
                  <div className="grid gap-4">
                    {customFields.map((field) => (
                      <Card key={field.id} className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p><strong>Field Name:</strong> {field.field_name}</p>
                            <p><strong>Label:</strong> {field.field_label}</p>
                            <p><strong>Type:</strong> {field.field_type}</p>
                          </div>
                          <div>
                            <p><strong>Required:</strong> {field.is_required ? 'Yes' : 'No'}</p>
                            <p><strong>Searchable:</strong> {field.is_searchable ? 'Yes' : 'No'}</p>
                            <p><strong>Help Text:</strong> {field.help_text || 'None'}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {!loading && !error && customFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No custom fields found for this service type.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
