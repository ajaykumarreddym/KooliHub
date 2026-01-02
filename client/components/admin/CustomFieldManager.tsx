import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import {
    Copy,
    Edit,
    GripVertical,
    Plus,
    Save,
    Search,
    Settings,
    Trash2,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
// Define the interface locally since @/shared/api might not be available
interface ServiceFieldDefinition {
  id: string;
  service_type_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_group?: string;
  validation_rules?: Record<string, any>;
  field_options?: any[] | null;
  default_value?: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_translatable: boolean;
  sort_order: number;
  help_text?: string;
  created_at?: string;
  updated_at?: string;
}

interface CustomFieldManagerProps {
  serviceTypeId: string;
  serviceTypeName: string;
  onFieldsChange?: (fields: ServiceFieldDefinition[]) => void;
}

interface FieldFormData {
  field_name: string;
  field_label: string;
  field_type: string;
  field_group: string;
  validation_rules: Record<string, any>;
  field_options: any[] | null;
  default_value: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_translatable: boolean;
  sort_order: number;
  help_text: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'textarea', label: 'Text Area', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Yes/No', icon: '✅' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'datetime', label: 'Date & Time', icon: '🕐' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'tel', label: 'Phone', icon: '📞' },
];

const FIELD_GROUPS = [
  { value: 'basic', label: 'Basic Information', color: 'bg-blue-100 text-blue-800' },
  { value: 'pricing', label: 'Pricing', color: 'bg-green-100 text-green-800' },
  { value: 'specifications', label: 'Specifications', color: 'bg-purple-100 text-purple-800' },
  { value: 'location', label: 'Location', color: 'bg-orange-100 text-orange-800' },
  { value: 'features', label: 'Features', color: 'bg-pink-100 text-pink-800' },
  { value: 'services', label: 'Services', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'details', label: 'Additional Details', color: 'bg-gray-100 text-gray-800' },
];

const VALIDATION_RULES = {
  text: [
    { key: 'minLength', label: 'Minimum Length', type: 'number' },
    { key: 'maxLength', label: 'Maximum Length', type: 'number' },
    { key: 'pattern', label: 'Pattern (Regex)', type: 'text' },
  ],
  number: [
    { key: 'min', label: 'Minimum Value', type: 'number' },
    { key: 'max', label: 'Maximum Value', type: 'number' },
    { key: 'step', label: 'Step Value', type: 'number' },
  ],
  select: [
    { key: 'minSelections', label: 'Minimum Selections', type: 'number' },
    { key: 'maxSelections', label: 'Maximum Selections', type: 'number' },
  ],
  multiselect: [
    { key: 'minSelections', label: 'Minimum Selections', type: 'number' },
    { key: 'maxSelections', label: 'Maximum Selections', type: 'number' },
  ],
};

export function CustomFieldManager({ serviceTypeId, serviceTypeName, onFieldsChange }: CustomFieldManagerProps) {
  const { toast } = useToast();
  const [fields, setFields] = useState<ServiceFieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingField, setEditingField] = useState<ServiceFieldDefinition | null>(null);
  const [formData, setFormData] = useState<FieldFormData>({
    field_name: '',
    field_label: '',
    field_type: 'text',
    field_group: 'basic',
    validation_rules: {},
    field_options: null,
    default_value: '',
    is_required: false,
    is_searchable: false,
    is_filterable: false,
    is_translatable: false,
    sort_order: 0,
    help_text: '',
  });
  const [fieldOptions, setFieldOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [newOption, setNewOption] = useState({ label: '', value: '' });
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Load fields
  const loadFields = useCallback(async () => {
    if (!serviceTypeId) {
      setFields([]);
      onFieldsChange?.([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/admin/custom-fields/${serviceTypeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load custom fields');
      }
      
      const data = await response.json();
      setFields(data || []);
      onFieldsChange?.(data || []);
    } catch (error) {
      console.error('Error loading fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom fields',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [serviceTypeId, onFieldsChange, toast]);

  useEffect(() => {
    loadFields();
    loadTemplates();
  }, [loadFields]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/admin/custom-fields/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  // Apply template
  const applyTemplate = async (template: any) => {
    try {
      const response = await authenticatedFetch(`/api/admin/custom-fields/${serviceTypeId}/apply-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateName: template.name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply template');
      }

      toast({
        title: 'Success',
        description: `Template "${template.name}" applied successfully`,
      });

      setShowTemplates(false);
      loadFields();
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to apply template',
        variant: 'destructive',
      });
    }
  };

  // Filter fields
  const filteredFields = fields.filter(field => {
    const matchesSearch = field.field_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.field_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === 'all' || field.field_group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      field_group: 'basic',
      validation_rules: {},
      field_options: null,
      default_value: '',
      is_required: false,
      is_searchable: false,
      is_filterable: false,
      is_translatable: false,
      sort_order: fields.length,
      help_text: '',
    });
    setFieldOptions([]);
    setNewOption({ label: '', value: '' });
  };

  // Validate form data
  const validateFormData = (): string[] => {
    const errors: string[] = [];

    // Required field validation
    if (!formData.field_name.trim()) {
      errors.push('Field name is required');
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.field_name)) {
      errors.push('Field name must start with a letter and contain only lowercase letters, numbers, and underscores');
    }

    if (!formData.field_label.trim()) {
      errors.push('Field label is required');
    }

    if (!formData.field_type) {
      errors.push('Field type is required');
    }

    // Field-specific validation
    if ((formData.field_type === 'select' || formData.field_type === 'multiselect') && fieldOptions.length === 0) {
      errors.push(`${formData.field_type} fields require at least one option`);
    }

    // Validation rules validation
    if (formData.field_type === 'number') {
      const min = formData.validation_rules?.min;
      const max = formData.validation_rules?.max;
      if (min !== undefined && max !== undefined && min >= max) {
        errors.push('Minimum value must be less than maximum value');
      }
    }

    if (formData.field_type === 'text' || formData.field_type === 'textarea') {
      const minLength = formData.validation_rules?.minLength;
      const maxLength = formData.validation_rules?.maxLength;
      if (minLength !== undefined && maxLength !== undefined && minLength >= maxLength) {
        errors.push('Minimum length must be less than maximum length');
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join(', '),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const fieldData = {
        ...formData,
        field_options: fieldOptions.length > 0 ? fieldOptions : null,
        validation_rules: formData.validation_rules,
      };

      if (editingField) {
        // Update existing field
        const response = await authenticatedFetch(`/api/admin/custom-fields/${editingField.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fieldData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update field');
        }
        
        toast({
          title: 'Success',
          description: 'Field updated successfully',
        });
      } else {
        // Create new field
        const response = await authenticatedFetch('/api/admin/custom-fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...fieldData,
            service_type_id: serviceTypeId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create field');
        }
        
        toast({
          title: 'Success',
          description: 'Field created successfully',
        });
      }

      setShowAddDialog(false);
      setEditingField(null);
      resetForm();
      loadFields();
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save field',
        variant: 'destructive',
      });
    }
  };

  // Handle edit
  const handleEdit = (field: ServiceFieldDefinition) => {
    setEditingField(field);
    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_group: field.field_group || 'basic',
      validation_rules: field.validation_rules || {},
      field_options: field.field_options || null,
      default_value: field.default_value || '',
      is_required: field.is_required,
      is_searchable: field.is_searchable,
      is_filterable: field.is_filterable,
      is_translatable: field.is_translatable,
      sort_order: field.sort_order,
      help_text: field.help_text || '',
    });
    setFieldOptions(Array.isArray(field.field_options) ? field.field_options : []);
    setShowAddDialog(true);
  };

  // Handle delete
  const handleDelete = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/custom-fields/${fieldId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete field');
      }
      
      toast({
        title: 'Success',
        description: 'Field deleted successfully',
      });
      
      loadFields();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete field',
        variant: 'destructive',
      });
    }
  };

  // Add option for select/multiselect fields
  const addOption = () => {
    if (newOption.label && newOption.value) {
      setFieldOptions([...fieldOptions, newOption]);
      setNewOption({ label: '', value: '' });
    }
  };

  // Remove option
  const removeOption = (index: number) => {
    setFieldOptions(fieldOptions.filter((_, i) => i !== index));
  };

  // Update validation rules
  const updateValidationRule = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      validation_rules: {
        ...prev.validation_rules,
        [key]: value,
      },
    }));
  };

  // Don't render if no service type is selected
  if (!serviceTypeId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a Service Type
            </h3>
            <p className="text-gray-500">
              Choose a service type from the dropdown above to start managing its custom fields.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Fields for {serviceTypeName}</h3>
          <p className="text-sm text-muted-foreground">
            Manage custom fields that will appear in product forms for this service type
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => {
            resetForm();
            setEditingField(null);
            setShowAddDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {FIELD_GROUPS.map(group => (
              <SelectItem key={group.value} value={group.value}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fields List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading fields...</p>
          </div>
        ) : filteredFields.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm || filterGroup !== 'all' 
                ? 'No fields match your search criteria'
                : 'No custom fields defined yet. Click "Add Field" to create your first field.'
              }
            </AlertDescription>
          </Alert>
        ) : (
          filteredFields.map((field) => (
            <Card key={field.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{field.field_label}</CardTitle>
                      <CardDescription className="text-sm">
                        {field.field_name} • {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={FIELD_GROUPS.find(g => g.value === field.field_group)?.color}>
                      {FIELD_GROUPS.find(g => g.value === field.field_group)?.label}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {field.is_required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      {field.is_searchable && <Badge variant="secondary" className="text-xs">Searchable</Badge>}
                      {field.is_filterable && <Badge variant="outline" className="text-xs">Filterable</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(field.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {field.help_text && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{field.help_text}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Field Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Edit Field' : 'Add New Field'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field_name">Field Name *</Label>
                    <Input
                      id="field_name"
                      value={formData.field_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                      placeholder="e.g., product_size"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Internal name (snake_case, no spaces)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="field_label">Display Label *</Label>
                    <Input
                      id="field_label"
                      value={formData.field_label}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))}
                      placeholder="e.g., Product Size"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field_type">Field Type *</Label>
                    <Select
                      value={formData.field_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, field_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="field_group">Field Group</Label>
                    <Select
                      value={formData.field_group}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, field_group: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_GROUPS.map(group => (
                          <SelectItem key={group.value} value={group.value}>
                            {group.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="help_text">Help Text</Label>
                  <Textarea
                    id="help_text"
                    value={formData.help_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, help_text: e.target.value }))}
                    placeholder="Additional information to help users fill this field"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default_value">Default Value</Label>
                    <Input
                      id="default_value"
                      value={formData.default_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_value: e.target.value }))}
                      placeholder="Default value for this field"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      placeholder="Display order"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_required"
                        checked={formData.is_required}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                      />
                      <Label htmlFor="is_required">Required Field</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_searchable"
                        checked={formData.is_searchable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_searchable: checked }))}
                      />
                      <Label htmlFor="is_searchable">Searchable</Label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_filterable"
                        checked={formData.is_filterable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_filterable: checked }))}
                      />
                      <Label htmlFor="is_filterable">Filterable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_translatable"
                        checked={formData.is_translatable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_translatable: checked }))}
                      />
                      <Label htmlFor="is_translatable">Translatable</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <div className="space-y-4">
                  {VALIDATION_RULES[formData.field_type as keyof typeof VALIDATION_RULES]?.map(rule => (
                    <div key={rule.key}>
                      <Label htmlFor={rule.key}>{rule.label}</Label>
                      <Input
                        id={rule.key}
                        type={rule.type}
                        value={formData.validation_rules[rule.key] || ''}
                        onChange={(e) => updateValidationRule(rule.key, rule.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                        placeholder={`Enter ${rule.label.toLowerCase()}`}
                      />
                    </div>
                  )) || (
                    <Alert>
                      <AlertDescription>
                        No validation rules available for {formData.field_type} fields.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                {(formData.field_type === 'select' || formData.field_type === 'multiselect') ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Field Options</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add options for dropdown/multiselect fields
                      </p>
                      
                      <div className="space-y-2">
                        {fieldOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [...fieldOptions];
                                newOptions[index].label = e.target.value;
                                setFieldOptions(newOptions);
                              }}
                              placeholder="Display Label"
                              className="flex-1"
                            />
                            <Input
                              value={option.value}
                              onChange={(e) => {
                                const newOptions = [...fieldOptions];
                                newOptions[index].value = e.target.value;
                                setFieldOptions(newOptions);
                              }}
                              placeholder="Value"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Input
                          value={newOption.label}
                          onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="Display Label"
                          className="flex-1"
                        />
                        <Input
                          value={newOption.value}
                          onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addOption}
                          disabled={!newOption.label || !newOption.value}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Options are only available for select and multiselect field types.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingField(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingField ? 'Update Field' : 'Create Field'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Field Templates</DialogTitle>
            <DialogDescription>
              Choose from pre-built field templates to quickly add common fields
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {templates.map((template) => (
              <Card key={template.name} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {template.field_label} • {FIELD_TYPES.find(t => t.value === template.field_type)?.label}
                      </p>
                      {template.help_text && (
                        <p className="text-xs text-muted-foreground mt-1">{template.help_text}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                    >
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
