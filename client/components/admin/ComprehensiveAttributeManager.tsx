import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Edit,
    Eye,
    GripVertical,
    Lock,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Types
interface AttributeRegistry {
    id: string;
    name: string;
    label: string;
    data_type: string;
    input_type: string;
    placeholder: string | null;
    help_text: string | null;
    group_name: string | null;
    is_required: boolean;
    is_active: boolean;
    applicable_types: string[];
    options: any;
    default_value: string | null;
}

interface ServiceAttributeConfig {
    id: string;
    service_type_id: string;
    attribute_id: string;
    is_required: boolean;
    is_visible: boolean;
    display_order: number;
    field_group: string;
    override_label: string | null;
    override_placeholder: string | null;
    override_help_text: string | null;
    attribute_registry?: AttributeRegistry;
}

interface ServiceType {
    id: string;
    title: string;
    is_active: boolean;
}

interface PreviewField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder: string;
    help_text: string;
    locked: boolean;
}

const ComprehensiveAttributeManager: React.FC = () => {
    // State
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [availableAttributes, setAvailableAttributes] = useState<AttributeRegistry[]>([]);
    const [configuredAttributes, setConfiguredAttributes] = useState<ServiceAttributeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    // Edit/Delete selection
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
    const [editingAttribute, setEditingAttribute] = useState<ServiceAttributeConfig | null>(null);
    
    // Search
    const [searchTerm, setSearchTerm] = useState("");

    // Load data on mount
    useEffect(() => {
        fetchServiceTypes();
        fetchAvailableAttributes();
    }, []);

    // Load configured attributes when service changes
    useEffect(() => {
        if (selectedService) {
            fetchConfiguredAttributes(selectedService);
        }
    }, [selectedService]);

    // Fetch service types
    const fetchServiceTypes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("service_types")
                .select("id, title, is_active")
                .eq("is_active", true)
                .order("sort_order");

            if (error) throw error;
            setServiceTypes(data || []);
            if (data && data.length > 0 && !selectedService) {
                setSelectedService(data[0].id);
            }
        } catch (error) {
            console.error("Error fetching service types:", error);
            toast({
                title: "Error",
                description: "Failed to load service types",
                variant: "destructive",
            });
        }
    }, [selectedService]);

    // Fetch all available attributes from registry
    const fetchAvailableAttributes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("attribute_registry")
                .select("*")
                .eq("is_active", true)
                .order("name");

            if (error) throw error;
            setAvailableAttributes(data || []);
        } catch (error) {
            console.error("Error fetching attributes:", error);
        }
    }, []);

    // Fetch configured attributes for a service
    const fetchConfiguredAttributes = useCallback(async (serviceId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("service_attribute_config")
                .select(`
                    *,
                    attribute_registry (*)
                `)
                .eq("service_type_id", serviceId)
                .eq("is_visible", true)
                .order("display_order");

            if (error) throw error;
            setConfiguredAttributes(data || []);
        } catch (error) {
            console.error("Error fetching configured attributes:", error);
            toast({
                title: "Error",
                description: "Failed to load attribute configuration",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Add attributes to service
    const handleAddAttributes = useCallback(async () => {
        if (!selectedService || selectedAttributes.length === 0) return;
        
        setSaving(true);
        try {
            // Get max display order
            const maxOrder = Math.max(...configuredAttributes.map(c => c.display_order), 0);
            
            // Create config entries
            const newConfigs = selectedAttributes.map((attrId, idx) => ({
                service_type_id: selectedService,
                attribute_id: attrId,
                display_order: maxOrder + idx + 1,
                is_required: false,
                is_visible: true,
                field_group: 'custom',
            }));

            const { error } = await supabase
                .from("service_attribute_config")
                .insert(newConfigs);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Added ${selectedAttributes.length} attribute(s) to ${serviceTypes.find(s => s.id === selectedService)?.title}`,
            });

            setSelectedAttributes([]);
            setShowAddModal(false);
            fetchConfiguredAttributes(selectedService);
        } catch (error: any) {
            console.error("Error adding attributes:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to add attributes",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [selectedService, selectedAttributes, configuredAttributes, serviceTypes]);

    // Update attribute configuration
    const handleUpdateAttribute = useCallback(async () => {
        if (!editingAttribute) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("service_attribute_config")
                .update({
                    is_required: editingAttribute.is_required,
                    override_label: editingAttribute.override_label,
                    override_placeholder: editingAttribute.override_placeholder,
                    override_help_text: editingAttribute.override_help_text,
                    field_group: editingAttribute.field_group,
                })
                .eq("id", editingAttribute.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Attribute updated successfully",
            });

            setShowEditModal(false);
            setEditingAttribute(null);
            if (selectedService) {
                fetchConfiguredAttributes(selectedService);
            }
        } catch (error: any) {
            console.error("Error updating attribute:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update attribute",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [editingAttribute, selectedService]);

    // Delete attributes
    const handleDeleteAttributes = useCallback(async () => {
        if (!selectedService || selectedAttributes.length === 0) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("service_attribute_config")
                .delete()
                .in("attribute_id", selectedAttributes)
                .eq("service_type_id", selectedService);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Removed ${selectedAttributes.length} attribute(s)`,
            });

            setSelectedAttributes([]);
            setShowDeleteModal(false);
            fetchConfiguredAttributes(selectedService);
        } catch (error: any) {
            console.error("Error deleting attributes:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete attributes",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [selectedService, selectedAttributes]);

    // Reorder attributes
    const handleReorder = useCallback(async (attrId: string, direction: 'up' | 'down') => {
        const currentIndex = configuredAttributes.findIndex(a => a.attribute_id === attrId);
        if (currentIndex === -1) return;
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === configuredAttributes.length - 1) return;

        const newOrder = [...configuredAttributes];
        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        [newOrder[currentIndex], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[currentIndex]];

        // Update display orders
        const updates = newOrder.map((attr, idx) => ({
            id: attr.id,
            display_order: idx,
        }));

        setSaving(true);
        try {
            for (const update of updates) {
                await supabase
                    .from("service_attribute_config")
                    .update({ display_order: update.display_order })
                    .eq("id", update.id);
            }

            setConfiguredAttributes(newOrder);
            toast({
                title: "Success",
                description: "Attribute order updated",
            });
        } catch (error: any) {
            console.error("Error reordering:", error);
            toast({
                title: "Error",
                description: "Failed to reorder attributes",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [configuredAttributes]);

    // Toggle required status
    const handleToggleRequired = useCallback(async (attrId: string, currentStatus: boolean) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("service_attribute_config")
                .update({ is_required: !currentStatus })
                .eq("service_type_id", selectedService)
                .eq("attribute_id", attrId);

            if (error) throw error;

            if (selectedService) {
                fetchConfiguredAttributes(selectedService);
            }
        } catch (error: any) {
            console.error("Error toggling required:", error);
            toast({
                title: "Error",
                description: "Failed to update required status",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [selectedService]);

    // Generate preview fields
    const generatePreviewFields = useCallback((): PreviewField[] => {
        const mandatoryFields: PreviewField[] = [
            { name: 'product_name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name', help_text: 'The name of your product', locked: true },
            { name: 'product_description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the product...', help_text: 'Detailed description', locked: true },
            { name: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', help_text: 'Product price', locked: true },
            { name: 'vendor', label: 'Vendor', type: 'select', required: true, placeholder: 'Select vendor', help_text: 'Choose a vendor', locked: true },
        ];

        const customFields: PreviewField[] = configuredAttributes.map(attr => ({
            name: attr.attribute_registry?.name || 'unknown',
            label: attr.override_label || attr.attribute_registry?.label || attr.attribute_registry?.name || 'Unknown',
            type: attr.attribute_registry?.input_type || 'text',
            required: attr.is_required,
            placeholder: attr.override_placeholder || attr.attribute_registry?.placeholder || '',
            help_text: attr.override_help_text || attr.attribute_registry?.help_text || '',
            locked: false,
        }));

        return [...mandatoryFields, ...customFields];
    }, [configuredAttributes]);

    // Filter available attributes
    const filteredAvailableAttributes = availableAttributes.filter(attr => {
        const matchesSearch = attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             attr.label?.toLowerCase().includes(searchTerm.toLowerCase());
        const notConfigured = !configuredAttributes.some(c => c.attribute_id === attr.id);
        return matchesSearch && notConfigured;
    });

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Attribute Configuration</h2>
                    <p className="text-muted-foreground mt-1">
                        Configure custom attributes for each service type
                    </p>
                </div>
                <Button onClick={() => setShowPreview(true)} variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Form
                </Button>
            </div>

            {/* Service Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Service Type</CardTitle>
                    <CardDescription>Choose a service to configure its attributes</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedService || ""} onValueChange={setSelectedService}>
                        <SelectTrigger className="w-full" aria-label="Select service type">
                            <SelectValue placeholder="Select a service type" />
                        </SelectTrigger>
                        <SelectContent>
                            {serviceTypes.map(service => (
                                <SelectItem key={service.id} value={service.id}>
                                    {service.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedService && (
                <>
                    {/* Statistics */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{configuredAttributes.length}</div>
                                <p className="text-xs text-muted-foreground">Custom Attributes</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">
                                    {configuredAttributes.filter(a => a.is_required).length}
                                </div>
                                <p className="text-xs text-muted-foreground">Required Fields</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">4</div>
                                <p className="text-xs text-muted-foreground">Mandatory Fields</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">
                                    {configuredAttributes.length + 4}
                                </div>
                                <p className="text-xs text-muted-foreground">Total Form Fields</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-4">
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Attributes
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                if (configuredAttributes.length === 0) {
                                    toast({
                                        title: "Info",
                                        description: "No attributes to edit",
                                    });
                                    return;
                                }
                                setShowEditModal(true);
                            }}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Attributes
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                if (configuredAttributes.length === 0) {
                                    toast({
                                        title: "Info",
                                        description: "No attributes to delete",
                                    });
                                    return;
                                }
                                setShowDeleteModal(true);
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Attributes
                        </Button>
                    </div>

                    {/* Configured Attributes List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configured Attributes ({configuredAttributes.length})</CardTitle>
                            <CardDescription>
                                Drag to reorder, toggle required status, or click to edit
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    Loading...
                                </div>
                            ) : configuredAttributes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                    <p>No attributes configured for this service</p>
                                    <Button 
                                        variant="link" 
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-2"
                                    >
                                        Add your first attribute
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Mandatory Fields (Locked) */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                            Mandatory Fields (Locked)
                                        </h4>
                                        <div className="space-y-2">
                                            {['Product Name', 'Description', 'Price', 'Vendor'].map((field, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                                    <div className="flex items-center space-x-3">
                                                        <Lock className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <div className="font-medium text-sm">{field}</div>
                                                            <div className="text-xs text-muted-foreground">System field - cannot be removed</div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary">Required</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Custom Attributes */}
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                            Custom Attributes
                                        </h4>
                                        <div className="space-y-2">
                                            {configuredAttributes.map((attr, idx) => (
                                                <div 
                                                    key={attr.id} 
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">
                                                                {attr.override_label || attr.attribute_registry?.label || attr.attribute_registry?.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {attr.attribute_registry?.data_type} • {attr.field_group}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={attr.is_required}
                                                            onCheckedChange={() => handleToggleRequired(attr.attribute_id, attr.is_required)}
                                                            disabled={saving}
                                                        />
                                                        <Badge variant={attr.is_required ? "default" : "secondary"}>
                                                            {attr.is_required ? "Required" : "Optional"}
                                                        </Badge>
                                                        <div className="flex flex-col space-y-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleReorder(attr.attribute_id, 'up')}
                                                                disabled={idx === 0 || saving}
                                                            >
                                                                <ArrowUp className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleReorder(attr.attribute_id, 'down')}
                                                                disabled={idx === configuredAttributes.length - 1 || saving}
                                                            >
                                                                <ArrowDown className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingAttribute(attr);
                                                                setShowEditModal(true);
                                                            }}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Add Attributes Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Add Attributes to {serviceTypes.find(s => s.id === selectedService)?.title}</DialogTitle>
                        <DialogDescription>
                            Select attributes from the registry to add to this service
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search attributes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        {/* Attribute List */}
                        <ScrollArea className="h-[400px] border rounded-lg p-4">
                            <div className="space-y-2">
                                {filteredAvailableAttributes.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                        <p>No available attributes found</p>
                                    </div>
                                ) : (
                                    filteredAvailableAttributes.map(attr => (
                                        <div 
                                            key={attr.id} 
                                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                                            onClick={() => {
                                                setSelectedAttributes(prev => 
                                                    prev.includes(attr.id) 
                                                        ? prev.filter(id => id !== attr.id)
                                                        : [...prev, attr.id]
                                                );
                                            }}
                                        >
                                            <Checkbox 
                                                checked={selectedAttributes.includes(attr.id)}
                                                onCheckedChange={() => {}}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{attr.label || attr.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {attr.data_type} • {attr.applicable_types?.join(', ')}
                                                </div>
                                            </div>
                                            <Badge variant="outline">{attr.group_name || 'General'}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        {/* Selected Count */}
                        {selectedAttributes.length > 0 && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-blue-900">
                                    {selectedAttributes.length} attribute(s) selected
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-2">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSelectedAttributes([]);
                                    setSearchTerm("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleAddAttributes}
                                disabled={selectedAttributes.length === 0 || saving}
                            >
                                {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                <Plus className="h-4 w-4 mr-2" />
                                Add {selectedAttributes.length} Attribute(s)
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Attribute Modal */}
            <Dialog open={showEditModal && editingAttribute !== null} onOpenChange={(open) => {
                setShowEditModal(open);
                if (!open) setEditingAttribute(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Attribute Configuration</DialogTitle>
                        <DialogDescription>
                            Customize the attribute settings for this service
                        </DialogDescription>
                    </DialogHeader>

                    {editingAttribute && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Original Label</Label>
                                <Input 
                                    value={editingAttribute.attribute_registry?.label || ''} 
                                    disabled 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Override Label</Label>
                                <Input
                                    value={editingAttribute.override_label || ''}
                                    onChange={(e) => setEditingAttribute({
                                        ...editingAttribute,
                                        override_label: e.target.value,
                                    })}
                                    placeholder="Leave empty to use original"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Override Placeholder</Label>
                                <Input
                                    value={editingAttribute.override_placeholder || ''}
                                    onChange={(e) => setEditingAttribute({
                                        ...editingAttribute,
                                        override_placeholder: e.target.value,
                                    })}
                                    placeholder="Leave empty to use original"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Field Group</Label>
                                <Select
                                    value={editingAttribute.field_group}
                                    onValueChange={(value) => setEditingAttribute({
                                        ...editingAttribute,
                                        field_group: value,
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                        <SelectItem value="specifications">Specifications</SelectItem>
                                        <SelectItem value="pricing">Pricing</SelectItem>
                                        <SelectItem value="features">Features</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={editingAttribute.is_required}
                                    onCheckedChange={(checked) => setEditingAttribute({
                                        ...editingAttribute,
                                        is_required: checked,
                                    })}
                                />
                                <Label>Required Field</Label>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingAttribute(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleUpdateAttribute} disabled={saving}>
                                    {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Attributes Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Delete Attributes</DialogTitle>
                        <DialogDescription>
                            Select attributes to remove from this service. System fields cannot be deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {configuredAttributes.map(attr => (
                                <div 
                                    key={attr.id}
                                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                                    onClick={() => {
                                        setSelectedAttributes(prev => 
                                            prev.includes(attr.attribute_id) 
                                                ? prev.filter(id => id !== attr.attribute_id)
                                                : [...prev, attr.attribute_id]
                                        );
                                    }}
                                >
                                    <Checkbox 
                                        checked={selectedAttributes.includes(attr.attribute_id)}
                                        onCheckedChange={() => {}}
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">
                                            {attr.override_label || attr.attribute_registry?.label || attr.attribute_registry?.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {attr.attribute_registry?.data_type}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {selectedAttributes.length > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-red-900">
                                {selectedAttributes.length} attribute(s) selected for deletion
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowDeleteModal(false);
                                setSelectedAttributes([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleDeleteAttributes}
                            disabled={selectedAttributes.length === 0 || saving}
                        >
                            {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete {selectedAttributes.length} Attribute(s)
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Form Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Form Preview</DialogTitle>
                        <DialogDescription>
                            Preview how the product form will look with current configuration
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[600px]">
                        <div className="space-y-4 p-4">
                            {generatePreviewFields().map((field, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Label>{field.label}</Label>
                                        {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                        {field.locked && <Lock className="h-3 w-3 text-gray-400" />}
                                    </div>
                                    {field.type === 'textarea' ? (
                                        <textarea 
                                            className="w-full p-2 border rounded-lg" 
                                            placeholder={field.placeholder}
                                            rows={3}
                                            disabled
                                        />
                                    ) : field.type === 'select' ? (
                                        <select 
                                            className="w-full p-2 border rounded-lg" 
                                            disabled
                                            aria-label={field.label}
                                            title={field.label}
                                        >
                                            <option>{field.placeholder}</option>
                                        </select>
                                    ) : (
                                        <Input 
                                            type={field.type} 
                                            placeholder={field.placeholder}
                                            disabled
                                        />
                                    )}
                                    {field.help_text && (
                                        <p className="text-xs text-muted-foreground">{field.help_text}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="flex justify-end">
                        <Button onClick={() => setShowPreview(false)}>
                            Close Preview
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ComprehensiveAttributeManager;

