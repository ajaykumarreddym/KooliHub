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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
    AlertCircle,
    Edit,
    Eye,
    GripVertical,
    Lock,
    Plus,
    RefreshCw,
    Save,
    Search,
    Tags,
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

interface Category {
    id: string;
    name: string;
    service_type: string;
    parent_id: string | null;
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Category[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
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

    // Load categories when service changes
    useEffect(() => {
        if (selectedService) {
            fetchCategories(selectedService);
            fetchConfiguredAttributes(selectedService);
            setSelectedCategory(null);
            setSelectedSubcategory(null);
        }
    }, [selectedService]);

    // Load subcategories when category changes
    useEffect(() => {
        if (selectedCategory) {
            fetchSubcategories(selectedCategory);
            setSelectedSubcategory(null);
        } else {
            // Clear subcategories if no category selected
            setSubcategories([]);
            setSelectedSubcategory(null);
        }
    }, [selectedCategory]);

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

    // Fetch categories for selected service
    const fetchCategories = async (serviceId: string) => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name, service_type, parent_id, is_active")
                .eq("service_type", serviceId)
                .is("parent_id", null)
                .eq("is_active", true)
                .order("sort_order");

            if (error) throw error;
            console.log('Loaded categories for service:', serviceId, data);
            setCategories(data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast({
                title: "Error",
                description: "Failed to load categories",
                variant: "destructive",
            });
        }
    };

    // Fetch subcategories for selected category
    const fetchSubcategories = async (categoryId: string) => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name, service_type, parent_id, is_active")
                .eq("parent_id", categoryId)
                .eq("is_active", true)
                .order("sort_order");

            if (error) throw error;
            console.log('Loaded subcategories for category:', categoryId, data);
            setSubcategories(data || []);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            toast({
                title: "Error",
                description: "Failed to load subcategories",
                variant: "destructive",
            });
        }
    };

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

    // Drag and drop handlers
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, attrId: string) => {
        setDraggedItem(attrId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, attrId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverItem(attrId);
    };

    const handleDragLeave = () => {
        setDragOverItem(null);
    };

    const handleDrop = async (e: React.DragEvent, targetAttrId: string) => {
        e.preventDefault();
        setDragOverItem(null);

        if (!draggedItem || draggedItem === targetAttrId) {
            setDraggedItem(null);
            return;
        }

        const draggedIndex = configuredAttributes.findIndex(a => a.attribute_id === draggedItem);
        const targetIndex = configuredAttributes.findIndex(a => a.attribute_id === targetAttrId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Create new order
        const newOrder = [...configuredAttributes];
        const [movedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, movedItem);

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
                description: "✓ Attribute order updated",
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
            setDraggedItem(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);
    };

    // Generate preview fields
    const generatePreviewFields = useCallback((): PreviewField[] => {
        console.log('🔍 Generating preview fields, configured attributes:', configuredAttributes.length);
        
        // Log first attribute to debug structure
        if (configuredAttributes.length > 0) {
            console.log('📋 Sample attribute structure:', JSON.stringify(configuredAttributes[0], null, 2));
        }
        
        const mandatoryFields: PreviewField[] = [
            { name: 'product_name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name', help_text: 'The name of your product', locked: true },
            { name: 'product_description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the product...', help_text: 'Detailed description', locked: true },
            { name: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', help_text: 'Product price', locked: true },
            { name: 'vendor', label: 'Vendor', type: 'select', required: true, placeholder: 'Select vendor', help_text: 'Choose a vendor', locked: true },
        ];

        const customFields: PreviewField[] = configuredAttributes
            .filter(attr => attr.attribute_registry) // Only process if registry exists
            .map(attr => {
                // Access the nested attribute_registry data
                const registry = attr.attribute_registry!;
                
                // Build label with fallback chain
                const displayLabel = attr.override_label || registry.label || registry.name || 'Unnamed Field';
                
                // Build placeholder with fallback
                const displayPlaceholder = attr.override_placeholder || 
                                           registry.placeholder || 
                                           `Enter ${registry.label || registry.name || 'value'}`;
                
                const field: PreviewField = {
                    name: registry.name || attr.attribute_id || 'unknown',
                    label: displayLabel,
                    type: registry.input_type || registry.data_type || 'text',
                    required: attr.is_required || false,
                    placeholder: displayPlaceholder,
                    help_text: attr.override_help_text || registry.help_text || '',
                    locked: false,
                };
                
                console.log('✅ Preview field generated:', {
                    name: field.name,
                    label: field.label,
                    type: field.type,
                    registryLabel: registry.label,
                    registryName: registry.name
                });
                
                return field;
            });

        console.log(`📊 Preview fields: ${mandatoryFields.length} mandatory + ${customFields.length} custom = ${mandatoryFields.length + customFields.length} total`);
        
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

            {/* Hierarchical Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Entity</CardTitle>
                    <CardDescription>Choose service, category, or subcategory to configure attributes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Service Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="service-select">1. Service Type</Label>
                            <Select value={selectedService || ""} onValueChange={setSelectedService}>
                                <SelectTrigger id="service-select" className="w-full">
                                    <SelectValue placeholder="Select service" />
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

                        {/* Category Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="category-select">2. Category (Optional)</Label>
                            <Select 
                                value={selectedCategory || ""} 
                                onValueChange={setSelectedCategory}
                                disabled={!selectedService || categories.length === 0}
                            >
                                <SelectTrigger id="category-select" className="w-full">
                                    <SelectValue placeholder={categories.length === 0 ? "No categories" : "Select category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None (Service Level)</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subcategory Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="subcategory-select">3. Subcategory (Optional)</Label>
                            <Select 
                                value={selectedSubcategory || ""} 
                                onValueChange={setSelectedSubcategory}
                                disabled={!selectedCategory}
                            >
                                <SelectTrigger id="subcategory-select" className="w-full">
                                    <SelectValue placeholder={
                                        !selectedCategory 
                                            ? "Select category first" 
                                            : subcategories.length === 0 
                                                ? "No subcategories available" 
                                                : "Select subcategory"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None (Category Level)</SelectItem>
                                    {selectedCategory && subcategories
                                        .filter(sub => sub.parent_id === selectedCategory)
                                        .map(subcategory => (
                                            <SelectItem key={subcategory.id} value={subcategory.id}>
                                                {subcategory.name}
                                            </SelectItem>
                                        ))}
                                    {selectedCategory && subcategories.filter(sub => sub.parent_id === selectedCategory).length === 0 && (
                                        <SelectItem value="_no_subcats" disabled>
                                            No subcategories defined for this category
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {selectedCategory && subcategories.filter(sub => sub.parent_id === selectedCategory).length > 0
                                    ? `${subcategories.filter(sub => sub.parent_id === selectedCategory).length} subcategories available`
                                    : selectedCategory 
                                        ? "Create subcategories in Entity Management"
                                        : "Select a category to view subcategories"
                                }
                            </p>
                        </div>
                    </div>
                    
                    {/* Selection Info */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Current Level:</strong>{' '}
                            {selectedSubcategory ? 'Subcategory' : selectedCategory ? 'Category' : 'Service'} →{' '}
                            {selectedService && serviceTypes.find(s => s.id === selectedService)?.title}
                            {selectedCategory && ` → ${categories.find(c => c.id === selectedCategory)?.name}`}
                            {selectedSubcategory && ` → ${subcategories.find(s => s.id === selectedSubcategory)?.name}`}
                        </p>
                    </div>
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
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-muted-foreground">
                                                Custom Attributes
                                            </h4>
                                            <div className="text-xs text-blue-600 flex items-center gap-1">
                                                <GripVertical className="h-3 w-3" />
                                                Drag to reorder
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {configuredAttributes.map((attr, idx) => (
                                                <div 
                                                    key={attr.id} 
                                                    draggable={!saving}
                                                    onDragStart={(e) => handleDragStart(e, attr.attribute_id)}
                                                    onDragOver={(e) => handleDragOver(e, attr.attribute_id)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, attr.attribute_id)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`flex items-center justify-between p-3 bg-white rounded-lg border-2 transition-all ${
                                                        draggedItem === attr.attribute_id
                                                            ? 'border-blue-500 opacity-50 scale-95'
                                                            : dragOverItem === attr.attribute_id
                                                                ? 'border-blue-400 bg-blue-50 scale-105'
                                                                : 'border-gray-200 hover:border-blue-300'
                                                    } ${!saving ? 'cursor-move' : 'cursor-not-allowed'}`}
                                                >
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <GripVertical className={`h-5 w-5 ${saving ? 'text-gray-300' : 'text-gray-400'}`} />
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
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingAttribute(attr);
                                                                setShowEditModal(true);
                                                            }}
                                                            title="Edit attribute"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {configuredAttributes.length === 0 && (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                No custom attributes configured. Click "Add Attributes" to get started.
                                            </div>
                                        )}
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
                        <DialogTitle>Remove Attributes from Service</DialogTitle>
                        <DialogDescription>
                            Select attributes to remove from this service configuration. This will NOT delete the attribute definitions from the registry - they can be re-added later.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Information Box */}
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-900 dark:text-blue-100">
                            <strong>ℹ️ Context-Safe Deletion:</strong> Removing attributes here only removes them from this specific service configuration. The attribute definitions remain in the Attribute Registry and can be used by other services or re-added to this service later.
                        </p>
                    </div>

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
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-900">
                                {selectedAttributes.length} attribute(s) selected for removal from this service
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
                            Remove {selectedAttributes.length} Attribute(s)
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
                        <div className="space-y-6 p-4">
                            {/* Info Banner */}
                            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                    👁️ Product Form Preview
                                </h3>
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    This is how the product creation form will appear with your current attribute configuration. All fields are read-only in this preview.
                                </p>
                            </div>
                            
                            {/* Mandatory Fields Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-gray-500" />
                                    <h4 className="text-sm font-semibold uppercase text-gray-600">Mandatory Fields</h4>
                                    <Separator className="flex-1" />
                                </div>
                                {generatePreviewFields().filter(f => f.locked).map((field, idx) => (
                                    <div key={`mandatory-${idx}`} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-semibold text-sm">{field.label}</Label>
                                            <div className="flex items-center gap-2">
                                                {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                                <Badge variant="secondary" className="text-xs gap-1">
                                                    <Lock className="h-3 w-3" />
                                                    System
                                                </Badge>
                                            </div>
                                        </div>
                                        {field.type === 'textarea' ? (
                                            <Textarea 
                                                placeholder={field.placeholder}
                                                rows={3}
                                                disabled
                                                readOnly
                                                className="bg-white dark:bg-gray-800 cursor-not-allowed"
                                            />
                                        ) : field.type === 'select' || field.type === 'multiselect' ? (
                                            <Select disabled>
                                                <SelectTrigger className="bg-white dark:bg-gray-800 cursor-not-allowed">
                                                    <SelectValue placeholder={field.placeholder} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="placeholder">{field.placeholder}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : field.type === 'number' ? (
                                            <Input 
                                                type="number" 
                                                placeholder={field.placeholder}
                                                disabled
                                                readOnly
                                                className="bg-white dark:bg-gray-800 cursor-not-allowed"
                                            />
                                        ) : (
                                            <Input 
                                                type="text" 
                                                placeholder={field.placeholder}
                                                disabled
                                                readOnly
                                                className="bg-white dark:bg-gray-800 cursor-not-allowed"
                                            />
                                        )}
                                        {field.help_text && (
                                            <p className="text-xs text-muted-foreground italic">{field.help_text}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Custom Fields Section */}
                            {generatePreviewFields().filter(f => !f.locked).length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Tags className="h-4 w-4 text-blue-500" />
                                        <h4 className="text-sm font-semibold uppercase text-blue-600">Custom Attributes</h4>
                                        <Separator className="flex-1" />
                                    </div>
                                    {generatePreviewFields().filter(f => !f.locked).map((field, idx) => (
                                        <div key={`custom-${idx}`} className="space-y-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-medium text-sm">{field.label}</Label>
                                                <div className="flex items-center gap-2">
                                                    {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                                    <Badge variant="outline" className="text-xs">Custom</Badge>
                                                </div>
                                            </div>
                                            {field.type === 'textarea' ? (
                                                <Textarea 
                                                    placeholder={field.placeholder}
                                                    rows={3}
                                                    disabled
                                                    readOnly
                                                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                                />
                                            ) : field.type === 'select' || field.type === 'multiselect' ? (
                                                <Select disabled>
                                                    <SelectTrigger className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed">
                                                        <SelectValue placeholder={field.placeholder} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="placeholder">{field.placeholder}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : field.type === 'boolean' || field.type === 'checkbox' ? (
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox disabled className="cursor-not-allowed" />
                                                    <Label className="text-sm cursor-not-allowed opacity-70">{field.placeholder || 'Enable this option'}</Label>
                                                </div>
                                            ) : field.type === 'number' ? (
                                                <Input 
                                                    type="number" 
                                                    placeholder={field.placeholder}
                                                    disabled
                                                    readOnly
                                                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                                />
                                            ) : field.type === 'date' ? (
                                                <Input 
                                                    type="date" 
                                                    disabled
                                                    readOnly
                                                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                                />
                                            ) : (
                                                <Input 
                                                    type="text" 
                                                    placeholder={field.placeholder}
                                                    disabled
                                                    readOnly
                                                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                                />
                                            )}
                                            {field.help_text && (
                                                <p className="text-xs text-muted-foreground italic">{field.help_text}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Summary */}
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <strong>Total Fields:</strong> {generatePreviewFields().length} 
                                    ({generatePreviewFields().filter(f => f.locked).length} mandatory + {generatePreviewFields().filter(f => !f.locked).length} custom)
                                </p>
                            </div>
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

