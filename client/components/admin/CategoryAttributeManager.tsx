import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAdminData } from "@/contexts/AdminDataContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Eye, EyeOff, Layers, Link2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface AttributeConfig {
  id: string;
  attribute_id: string;
  attribute_name: string;
  attribute_label: string;
  data_type: string;
  input_type: string;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  is_visible: boolean;
  display_order: number;
  field_group: string;
  inherit_from_service: boolean;
  override_label: string | null;
  override_placeholder: string | null;
  override_help_text: string | null;
}

interface ServiceAttribute {
  attribute_id: string;
  attribute_name: string;
  attribute_label: string;
  data_type: string;
  input_type: string;
  is_required: boolean;
  is_visible: boolean;
  display_order: number;
}

export function CategoryAttributeManager() {
  const { serviceTypes, categories, refreshCategories } = useAdminData();
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categoryAttributes, setCategoryAttributes] = useState<AttributeConfig[]>([]);
  const [serviceAttributes, setServiceAttributes] = useState<ServiceAttribute[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredCategories = selectedServiceType
    ? categories.filter(cat => cat.service_type === selectedServiceType)
    : [];

  useEffect(() => {
    if (selectedServiceType) {
      fetchServiceAttributes();
    }
  }, [selectedServiceType]);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryAttributes();
      fetchAvailableAttributes();
    }
  }, [selectedCategory]);

  const fetchServiceAttributes = async () => {
    if (!selectedServiceType) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_service_attributes', { p_service_type_id: selectedServiceType });

      if (error) throw error;
      setServiceAttributes(data || []);
    } catch (error) {
      console.error('Error fetching service attributes:', error);
      toast({
        title: "Error",
        description: "Failed to load service attributes",
        variant: "destructive",
      });
    }
  };

  const fetchCategoryAttributes = async () => {
    if (!selectedCategory) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('category_attribute_config')
        .select(`
          id,
          attribute_id,
          inherit_from_service,
          is_required,
          is_visible,
          display_order,
          field_group,
          override_label,
          override_placeholder,
          override_help_text,
          attribute_registry (
            name,
            label,
            data_type,
            input_type,
            placeholder,
            help_text
          )
        `)
        .eq('category_id', selectedCategory)
        .order('display_order');

      if (error) throw error;

      const formatted = (data || []).map(item => ({
        id: item.id,
        attribute_id: item.attribute_id,
        attribute_name: item.attribute_registry?.name || '',
        attribute_label: item.override_label || item.attribute_registry?.label || '',
        data_type: item.attribute_registry?.data_type || 'text',
        input_type: item.attribute_registry?.input_type || 'text',
        placeholder: item.override_placeholder || item.attribute_registry?.placeholder,
        help_text: item.override_help_text || item.attribute_registry?.help_text,
        is_required: item.is_required,
        is_visible: item.is_visible,
        display_order: item.display_order,
        field_group: item.field_group,
        inherit_from_service: item.inherit_from_service,
        override_label: item.override_label,
        override_placeholder: item.override_placeholder,
        override_help_text: item.override_help_text,
      }));

      setCategoryAttributes(formatted);
    } catch (error) {
      console.error('Error fetching category attributes:', error);
      toast({
        title: "Error",
        description: "Failed to load category attributes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAttributes = async () => {
    try {
      const { data, error } = await supabase
        .from('attribute_registry')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableAttributes(data || []);
    } catch (error) {
      console.error('Error fetching available attributes:', error);
    }
  };

  const handleAddAttribute = async (attributeId: string) => {
    if (!selectedCategory) return;

    try {
      const maxOrder = Math.max(...categoryAttributes.map(a => a.display_order), 0);
      
      const { error } = await supabase
        .from('category_attribute_config')
        .insert({
          category_id: selectedCategory,
          attribute_id: attributeId,
          inherit_from_service: false,
          is_required: false,
          is_visible: true,
          display_order: maxOrder + 1,
          field_group: 'custom',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attribute added successfully",
      });

      fetchCategoryAttributes();
    } catch (error) {
      console.error('Error adding attribute:', error);
      toast({
        title: "Error",
        description: "Failed to add attribute",
        variant: "destructive",
      });
    }
  };

  const handleToggleInheritance = async (configId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('category_attribute_config')
        .update({ inherit_from_service: !currentValue })
        .eq('id', configId);

      if (error) throw error;

      setCategoryAttributes(prev =>
        prev.map(attr =>
          attr.id === configId
            ? { ...attr, inherit_from_service: !currentValue }
            : attr
        )
      );

      toast({
        title: "Success",
        description: `Inheritance ${!currentValue ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling inheritance:', error);
      toast({
        title: "Error",
        description: "Failed to update inheritance",
        variant: "destructive",
      });
    }
  };

  const handleToggleRequired = async (configId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('category_attribute_config')
        .update({ is_required: !currentValue })
        .eq('id', configId);

      if (error) throw error;

      setCategoryAttributes(prev =>
        prev.map(attr =>
          attr.id === configId ? { ...attr, is_required: !currentValue } : attr
        )
      );
    } catch (error) {
      console.error('Error toggling required:', error);
      toast({
        title: "Error",
        description: "Failed to update required status",
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (configId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('category_attribute_config')
        .update({ is_visible: !currentValue })
        .eq('id', configId);

      if (error) throw error;

      setCategoryAttributes(prev =>
        prev.map(attr =>
          attr.id === configId ? { ...attr, is_visible: !currentValue } : attr
        )
      );
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      });
    }
  };

  const handleMoveAttribute = async (index: number, direction: 'up' | 'down') => {
    const newAttributes = [...categoryAttributes];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newAttributes.length) return;

    // Swap
    [newAttributes[index], newAttributes[swapIndex]] = 
    [newAttributes[swapIndex], newAttributes[index]];

    // Update display_order
    newAttributes.forEach((attr, idx) => {
      attr.display_order = idx;
    });

    setCategoryAttributes(newAttributes);

    // Save to database
    try {
      const updates = newAttributes.map(attr => ({
        id: attr.id,
        display_order: attr.display_order,
      }));

      for (const update of updates) {
        await supabase
          .from('category_attribute_config')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      toast({
        title: "Success",
        description: "Attribute order updated",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAttribute = async (configId: string) => {
    try {
      const { error } = await supabase
        .from('category_attribute_config')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      setCategoryAttributes(prev => prev.filter(attr => attr.id !== configId));

      toast({
        title: "Success",
        description: "Attribute removed from category",
      });
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast({
        title: "Error",
        description: "Failed to remove attribute",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="h-6 w-6" />
          Category Attribute Manager
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure category-specific attributes with inheritance from service-level configuration
        </p>
      </div>

      {/* Service & Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Service & Category</CardTitle>
          <CardDescription>
            Choose a service type and category to manage its attributes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                disabled={!selectedServiceType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedServiceType && selectedCategory && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Configuring attributes for{" "}
                <strong>
                  {filteredCategories.find(c => c.id === selectedCategory)?.name}
                </strong>{" "}
                in <strong>{serviceTypes.find(s => s.id === selectedServiceType)?.title}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCategory && (
        <>
          {/* Inherited Service Attributes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Inherited from Service
              </CardTitle>
              <CardDescription>
                These attributes are inherited from the service-level configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceAttributes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No service-level attributes configured</p>
                  <p className="text-sm">Configure attributes for this service type first</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceAttributes.map((attr, index) => (
                    <div
                      key={attr.attribute_id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          Service
                        </Badge>
                        <div>
                          <p className="font-medium">{attr.attribute_label}</p>
                          <p className="text-xs text-muted-foreground">
                            {attr.attribute_name} • {attr.input_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attr.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Order: {attr.display_order}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category-Specific Attributes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Category-Specific Attributes
                </span>
                <Select onValueChange={handleAddAttribute}>
                  <SelectTrigger className="w-64">
                    <Plus className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Add attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAttributes
                      .filter(attr => !categoryAttributes.some(ca => ca.attribute_id === attr.id))
                      .map(attr => (
                        <SelectItem key={attr.id} value={attr.id}>
                          {attr.label || attr.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardTitle>
              <CardDescription>
                Override service attributes or add category-specific ones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading attributes...</p>
                </div>
              ) : categoryAttributes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No category-specific attributes configured</p>
                  <p className="text-sm">Add attributes using the dropdown above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categoryAttributes.map((attr, index) => (
                    <div
                      key={attr.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveAttribute(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveAttribute(index, 'down')}
                            disabled={index === categoryAttributes.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{attr.attribute_label}</p>
                            {attr.inherit_from_service && (
                              <Badge variant="outline" className="text-xs">
                                <Link2 className="h-3 w-3 mr-1" />
                                Inherited
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {attr.attribute_name} • {attr.input_type} • Order: {attr.display_order}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Inherit</Label>
                          <Switch
                            checked={attr.inherit_from_service}
                            onCheckedChange={() => handleToggleInheritance(attr.id, attr.inherit_from_service)}
                          />
                        </div>
                        
                        <Separator orientation="vertical" className="h-8" />

                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Required</Label>
                          <Switch
                            checked={attr.is_required}
                            onCheckedChange={() => handleToggleRequired(attr.id, attr.is_required)}
                            disabled={attr.inherit_from_service}
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(attr.id, attr.is_visible)}
                        >
                          {attr.is_visible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttribute(attr.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

