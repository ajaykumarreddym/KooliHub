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
    is_active: boolean;
}

interface Subcategory {
    id: string;
    name: string;
    service_type_id: string;
    category_id: string;
    icon?: string | null;
    color?: string | null;
    image_url?: string | null;
    is_active: boolean;
    sort_order: number;
}

interface PreviewField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder: string;
    help_text: string;
    locked: boolean;
    visible?: boolean;
}

const ComprehensiveAttributeManager: React.FC = () => {
    // State
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [availableAttributes, setAvailableAttributes] = useState<AttributeRegistry[]>([]);
    const [configuredAttributes, setConfiguredAttributes] = useState<ServiceAttributeConfig[]>([]);
    const [defaultMandatoryFields, setDefaultMandatoryFields] = useState<any[]>([]);
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
        fetchDefaultMandatoryFields();
    }, []);

    // Load categories when service changes
    useEffect(() => {
        console.log('🔄 [Attribute Manager] Service changed:', selectedService);
        
        if (selectedService) {
            console.log('📥 [Attribute Manager] Loading categories for service:', selectedService);
            fetchCategories(selectedService);
            fetchConfiguredAttributes(selectedService, null, null);
            
            // Reset category and subcategory when service changes
            setSelectedCategory(null);
            setSelectedSubcategory(null);
            setCategories([]);
            setSubcategories([]);
        } else {
            console.log('🚫 [Attribute Manager] No service selected, clearing all');
            setCategories([]);
            setSubcategories([]);
            setSelectedCategory(null);
            setSelectedSubcategory(null);
        }
    }, [selectedService]);

    // Load subcategories when category changes
    useEffect(() => {
        console.log('🔄 [Attribute Manager] Category changed:', {
            selectedCategory,
            selectedService,
            willFetch: !!(selectedCategory && selectedService)
        });
        
        if (selectedCategory && selectedService) {
            console.log('📥 [Attribute Manager] Loading subcategories for category:', selectedCategory);
            fetchSubcategories(selectedCategory);
            // Reset subcategory selection when category changes
            setSelectedSubcategory(null);
        } else {
            console.log('🚫 [Attribute Manager] Clearing subcategories - missing category or service');
            setSubcategories([]);
            setSelectedSubcategory(null);
        }
    }, [selectedCategory]); // Only depend on selectedCategory, not selectedService

    // Refresh attributes when hierarchy selection changes
    useEffect(() => {
        if (selectedService) {
            if (selectedSubcategory) {
                // Fetch subcategory attributes (includes inherited)
                fetchConfiguredAttributes(selectedService, selectedCategory, selectedSubcategory);
            } else if (selectedCategory) {
                // Fetch category attributes
                fetchConfiguredAttributes(selectedService, selectedCategory, null);
            } else {
                // Fetch service attributes
                fetchConfiguredAttributes(selectedService, null, null);
            }
        }
    }, [selectedService, selectedCategory, selectedSubcategory]);

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
            console.log('🔍 [Attribute Manager] Fetching categories for service:', serviceId);
            
            const { data, error } = await supabase
                .from("categories")
                .select("id, name, service_type, parent_id, is_active")
                .eq("service_type", serviceId)
                .is("parent_id", null)
                .eq("is_active", true)
                .order("sort_order");

            if (error) {
                console.error('❌ [Attribute Manager] Error loading categories:', error);
                throw error;
            }
            
            console.log(`✅ [Attribute Manager] Loaded ${data?.length || 0} categories for service ${serviceId}:`, data);
            setCategories(data || []);
            
            // If no categories found, clear subcategories too
            if (!data || data.length === 0) {
                console.log('⚠️ [Attribute Manager] No categories found, clearing subcategories');
                setSubcategories([]);
            }
        } catch (error) {
            console.error("❌ [Attribute Manager] Error fetching categories:", error);
            toast({
                title: "Error",
                description: "Failed to load categories",
                variant: "destructive",
            });
            setCategories([]);
            setSubcategories([]);
        }
    };

    // Fetch subcategories for selected category (from subcategories table)
    const fetchSubcategories = async (categoryId: string) => {
        try {
            if (!selectedService) {
                console.log('⚠️ [Attribute Manager] No service selected, cannot fetch subcategories');
                setSubcategories([]);
                return;
            }

            console.log('🔍 [Attribute Manager] Fetching subcategories from subcategories table with hierarchical filter:', {
                categoryId,
                selectedService,
                hierarchy: `${selectedService} → ${categoryId}`
            });

            // Fetch from subcategories table with hierarchical filtering
            // Filters: service_type_id = selected service AND category_id = selected category
            const { data, error } = await supabase
                .from("subcategories")
                .select("id, name, service_type_id, category_id, icon, color, image_url, is_active, sort_order")
                .eq("category_id", categoryId)
                .eq("service_type_id", selectedService)
                .eq("is_active", true)
                .order("sort_order");

            if (error) {
                console.error('❌ [Attribute Manager] Error loading subcategories:', error);
                throw error;
            }

            console.log(`✅ [Attribute Manager] Loaded ${data?.length || 0} subcategories from hierarchical path:`, {
                path: `${serviceTypes.find(s => s.id === selectedService)?.title} → ${categories.find(c => c.id === categoryId)?.name}`,
                categoryId,
                serviceId: selectedService,
                count: data?.length || 0,
                subcategories: data?.map(s => s.name)
            });
            
            if (!data || data.length === 0) {
                console.log('⚠️ [Attribute Manager] No subcategories found - they may not be created or mapped to this hierarchy');
            }
            
            setSubcategories(data || []);
        } catch (error) {
            console.error("❌ [Attribute Manager] Error fetching subcategories:", error);
            toast({
                title: "Error",
                description: "Failed to load subcategories from database",
                variant: "destructive",
            });
            setSubcategories([]);
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

    // Fetch default fields from attribute_registry (replacing default_mandatory_fields)
    const fetchDefaultMandatoryFields = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("attribute_registry")
                .select("*")
                .eq("is_default_field", true)
                .eq("is_active", true)
                .order("display_order");

            if (error) {
                console.warn("Error fetching default fields from attribute_registry, using hardcoded fields");
                // Fallback to hardcoded defaults
                setDefaultMandatoryFields([
                    { field_name: 'product_name', field_label: 'Product Name', field_type: 'text', input_type: 'text', placeholder: 'Enter product name', help_text: 'The name of your product', display_order: 0 },
                    { field_name: 'product_description', field_label: 'Description', field_type: 'textarea', input_type: 'textarea', placeholder: 'Describe the product...', help_text: 'Detailed description', display_order: 1 },
                    { field_name: 'price', field_label: 'Price', field_type: 'number', input_type: 'number', placeholder: 'Enter price', help_text: 'Product price', display_order: 2 },
                    { field_name: 'vendor', field_label: 'Vendor', field_type: 'select', input_type: 'select', placeholder: 'Select vendor', help_text: 'Choose a vendor', display_order: 3 },
                ]);
                return;
            }
            
            // Map to expected format
            const mapped = (data || []).map(attr => ({
                field_name: attr.name,
                field_label: attr.label,
                field_type: attr.data_type,
                input_type: attr.input_type || attr.data_type,
                placeholder: attr.placeholder,
                help_text: attr.help_text,
                display_order: attr.display_order || 0,
                is_system_field: attr.is_system_field || false
            }));
            
            setDefaultMandatoryFields(mapped);
        } catch (error) {
            console.error("Error fetching default fields:", error);
        }
    }, []);

    // Fetch configured attributes based on current selection level
    const fetchConfiguredAttributes = useCallback(async (serviceId: string, categoryId?: string | null, subcategoryId?: string | null) => {
        try {
            setLoading(true);
            
            // Determine which level to fetch from
            if (subcategoryId) {
                // Subcategory level - use RPC function to get inherited attributes
                console.log('📊 Fetching attributes for subcategory:', subcategoryId);
                const { data, error } = await supabase.rpc('get_subcategory_attributes', {
                    p_subcategory_id: subcategoryId
                });

                if (error) throw error;
                
                // Transform the data to match our interface
                const transformedData = (data || []).map((attr: any) => ({
                    id: attr.config_id,
                    service_type_id: serviceId,
                    attribute_id: attr.attribute_id,
                    is_required: attr.is_required,
                    is_visible: attr.is_visible,
                    display_order: attr.display_order,
                    field_group: attr.field_group,
                    override_label: attr.override_label,
                    override_placeholder: attr.override_placeholder,
                    override_help_text: attr.override_help_text,
                    source_level: attr.source_level, // 'service', 'category', or 'subcategory'
                    attribute_registry: {
                        id: attr.attribute_id,
                        name: attr.attribute_name,
                        label: attr.attribute_label,
                        data_type: attr.data_type,
                        input_type: attr.input_type,
                    }
                }));
                
                console.log(`✅ Loaded ${transformedData.length} attributes (inherited + direct) for subcategory`);
                setConfiguredAttributes(transformedData);
                
            } else if (categoryId) {
                // Category level
                console.log('📊 Fetching attributes for category:', categoryId);
                const { data, error } = await supabase
                    .from("category_attribute_config")
                    .select(`
                        *,
                        attribute_registry (*)
                    `)
                    .eq("category_id", categoryId)
                    .eq("is_visible", true)
                    .order("display_order");

                if (error) throw error;
                console.log(`✅ Loaded ${data?.length || 0} attributes for category`);
                setConfiguredAttributes(data || []);
                
            } else {
                // Service level
                console.log('📊 Fetching attributes for service:', serviceId);
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
                console.log(`✅ Loaded ${data?.length || 0} attributes for service`);
                setConfiguredAttributes(data || []);
            }
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

    // Add attributes to current entity level
    const handleAddAttributes = useCallback(async () => {
        if (!selectedService || selectedAttributes.length === 0) return;
        
        setSaving(true);
        try {
            // Get max display order
            const maxOrder = Math.max(...configuredAttributes.map(c => c.display_order), 0);
            
            // Determine which table to insert into based on selection level
            let table: string;
            let configData: any[];
            let entityName: string;
            
            if (selectedSubcategory) {
                // Insert into subcategory_attribute_config
                table = "subcategory_attribute_config";
                entityName = `subcategory: ${subcategories.find(s => s.id === selectedSubcategory)?.name}`;
                configData = selectedAttributes.map((attrId, idx) => ({
                    subcategory_id: selectedSubcategory,
                    attribute_id: attrId,
                    display_order: maxOrder + idx + 1,
                    is_required: false,
                    is_visible: true,
                    field_group: 'custom',
                    inherit_from_category: false, // Direct attribute, not inherited
                    inherit_from_service: false,
                }));
            } else if (selectedCategory) {
                // Insert into category_attribute_config
                table = "category_attribute_config";
                entityName = `category: ${categories.find(c => c.id === selectedCategory)?.name}`;
                configData = selectedAttributes.map((attrId, idx) => ({
                    category_id: selectedCategory,
                    attribute_id: attrId,
                    display_order: maxOrder + idx + 1,
                    is_required: false,
                    is_visible: true,
                    field_group: 'custom',
                    inherit_from_service: false, // Direct attribute, not inherited
                }));
            } else {
                // Insert into service_attribute_config
                table = "service_attribute_config";
                entityName = `service: ${serviceTypes.find(s => s.id === selectedService)?.title}`;
                configData = selectedAttributes.map((attrId, idx) => ({
                    service_type_id: selectedService,
                    attribute_id: attrId,
                    display_order: maxOrder + idx + 1,
                    is_required: false,
                    is_visible: true,
                    field_group: 'custom',
                }));
            }

            const { error } = await supabase
                .from(table)
                .insert(configData);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Added ${selectedAttributes.length} attribute(s) to ${entityName}`,
            });

            setSelectedAttributes([]);
            setShowAddModal(false);
            
            // Refresh attributes for current level
            fetchConfiguredAttributes(selectedService, selectedCategory, selectedSubcategory);
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
    }, [selectedService, selectedCategory, selectedSubcategory, selectedAttributes, configuredAttributes, serviceTypes, categories, subcategories]);

    // Update attribute configuration
    const handleUpdateAttribute = useCallback(async () => {
        if (!editingAttribute) return;

        setSaving(true);
        try {
            // Determine which table to update based on current selection level
            let table: string;
            if (selectedSubcategory) {
                table = "subcategory_attribute_config";
            } else if (selectedCategory) {
                table = "category_attribute_config";
            } else {
                table = "service_attribute_config";
            }

            const { error } = await supabase
                .from(table)
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
                fetchConfiguredAttributes(selectedService, selectedCategory, selectedSubcategory);
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
    }, [editingAttribute, selectedService, selectedCategory, selectedSubcategory]);

    // Delete attributes
    const handleDeleteAttributes = useCallback(async () => {
        if (!selectedService || selectedAttributes.length === 0) return;

        setSaving(true);
        try {
            // Determine which table to delete from based on current selection level
            let table: string;
            let filterColumn: string;
            let filterValue: string;
            
            if (selectedSubcategory) {
                table = "subcategory_attribute_config";
                filterColumn = "subcategory_id";
                filterValue = selectedSubcategory;
            } else if (selectedCategory) {
                table = "category_attribute_config";
                filterColumn = "category_id";
                filterValue = selectedCategory;
            } else {
                table = "service_attribute_config";
                filterColumn = "service_type_id";
                filterValue = selectedService;
            }

            const { error } = await supabase
                .from(table)
                .delete()
                .in("attribute_id", selectedAttributes)
                .eq(filterColumn, filterValue);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Removed ${selectedAttributes.length} attribute(s)`,
            });

            setSelectedAttributes([]);
            setShowDeleteModal(false);
            fetchConfiguredAttributes(selectedService, selectedCategory, selectedSubcategory);
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
    }, [selectedService, selectedCategory, selectedSubcategory, selectedAttributes]);

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
            // Determine which table to update
            let table: string;
            if (selectedSubcategory) {
                table = "subcategory_attribute_config";
            } else if (selectedCategory) {
                table = "category_attribute_config";
            } else {
                table = "service_attribute_config";
            }

            for (const update of updates) {
                await supabase
                    .from(table)
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
    }, [configuredAttributes, selectedSubcategory, selectedCategory]);

    // Toggle required status
    const handleToggleRequired = useCallback(async (attrId: string, currentStatus: boolean) => {
        setSaving(true);
        try {
            // Determine which table to update based on current selection level
            let table: string;
            let filterColumn: string;
            let filterValue: string;
            
            if (selectedSubcategory) {
                table = "subcategory_attribute_config";
                filterColumn = "subcategory_id";
                filterValue = selectedSubcategory;
            } else if (selectedCategory) {
                table = "category_attribute_config";
                filterColumn = "category_id";
                filterValue = selectedCategory;
            } else {
                table = "service_attribute_config";
                filterColumn = "service_type_id";
                filterValue = selectedService!;
            }

            const { error } = await supabase
                .from(table)
                .update({ is_required: !currentStatus })
                .eq(filterColumn, filterValue)
                .eq("attribute_id", attrId);

            if (error) throw error;

            if (selectedService) {
                fetchConfiguredAttributes(selectedService, selectedCategory, selectedSubcategory);
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
    }, [selectedService, selectedCategory, selectedSubcategory]);

    // Toggle field visibility (hide/show in form)
    const handleToggleFieldVisibility = useCallback(async (attrId: string, isVisible: boolean) => {
        if (!selectedService) return;
        
        setSaving(true);
        try {
            // Determine which table to update based on current selection level
            let table: string;
            let filterColumn: string;
            let filterValue: string;
            
            if (selectedSubcategory) {
                table = "subcategory_attribute_config";
                filterColumn = "subcategory_id";
                filterValue = selectedSubcategory;
            } else if (selectedCategory) {
                table = "category_attribute_config";
                filterColumn = "category_id";
                filterValue = selectedCategory;
            } else {
                table = "service_attribute_config";
                filterColumn = "service_type_id";
                filterValue = selectedService;
            }

            console.log(`🔄 Toggling visibility for ${attrId} to ${isVisible} in ${table}`);

            const { error } = await supabase
                .from(table)
                .update({ is_visible: isVisible })
                .eq(filterColumn, filterValue)
                .eq("attribute_id", attrId);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Field ${isVisible ? 'shown' : 'hidden'} in form`,
            });

            // Refresh to update UI
            fetchConfiguredAttributes(selectedService, selectedCategory, selectedSubcategory);
        } catch (error: any) {
            console.error("Error toggling visibility:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update field visibility",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [selectedService, selectedCategory, selectedSubcategory]);

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
            // Determine which table to update
            let table: string;
            if (selectedSubcategory) {
                table = "subcategory_attribute_config";
            } else if (selectedCategory) {
                table = "category_attribute_config";
            } else {
                table = "service_attribute_config";
            }

            for (const update of updates) {
                await supabase
                    .from(table)
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
        
        // Generate default fields from attribute_registry
        // ONLY include fields that are visible (is_visible = true)
        const mandatoryFields: PreviewField[] = defaultMandatoryFields
            .filter(field => field.is_system_field)
            .map(field => {
                // Check if this field is configured at current level
                const configuredAttr = configuredAttributes.find(
                    attr => attr.attribute_registry?.name?.toLowerCase().includes(field.field_name.toLowerCase())
                );
                
                // Only include if field is visible (or not configured yet, so show as recommendation)
                const isVisible = configuredAttr?.is_visible ?? true;
                
                return {
                    name: field.field_name,
                    label: configuredAttr?.override_label || field.field_label,
                    type: field.input_type || field.field_type,
                    required: configuredAttr?.is_required ?? true,
                    placeholder: configuredAttr?.override_placeholder || field.placeholder || '',
                    help_text: configuredAttr?.override_help_text || field.help_text || '',
                    locked: false,
                    visible: isVisible, // Add visibility flag
                };
            })
            .filter(field => field.visible); // FILTER OUT HIDDEN FIELDS

        const customFields: PreviewField[] = configuredAttributes
            .filter(attr => attr.attribute_registry && attr.is_visible) // Only visible fields
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
    }, [configuredAttributes, defaultMandatoryFields]);

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
                                onValueChange={(value) => {
                                    console.log('📌 [Attribute Manager] Category selected:', value);
                                    setSelectedCategory(value || null);
                                }}
                                disabled={!selectedService}
                            >
                                <SelectTrigger id="category-select" className="w-full">
                                    <SelectValue placeholder={
                                        !selectedService 
                                            ? "Select service first" 
                                            : categories.length === 0 
                                                ? "⚠️ No categories created or mapped to this service" 
                                                : "Select category (or keep at service level)"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None (Service Level)</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                    {selectedService && categories.length === 0 && (
                                        <SelectItem value="_no_cats" disabled>
                                            ⚠️ No categories created or mapped to this service
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {selectedService && categories.length > 0
                                    ? `✓ ${categories.length} category(ies) mapped to this service`
                                    : selectedService
                                        ? "⚠️ No categories created or mapped - Create in Entity Management"
                                        : "Select a service first to view mapped categories"
                                }
                            </p>
                        </div>

                        {/* Subcategory Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="subcategory-select">3. Subcategory (Optional)</Label>
                            <Select 
                                value={selectedSubcategory || ""} 
                                onValueChange={(value) => {
                                    console.log('📌 [Attribute Manager] Subcategory selected:', value);
                                    setSelectedSubcategory(value || null);
                                }}
                                disabled={!selectedCategory}
                            >
                                <SelectTrigger id="subcategory-select" className="w-full">
                                    <SelectValue placeholder={
                                        !selectedService
                                            ? "Select service first"
                                            : !selectedCategory 
                                                ? "Select category first" 
                                                : subcategories.length === 0 
                                                    ? "⚠️ No subcategories created or mapped to this category" 
                                                    : "Select subcategory (or keep at category level)"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None (Category Level)</SelectItem>
                                    {subcategories.map(subcategory => (
                                        <SelectItem key={subcategory.id} value={subcategory.id}>
                                            {subcategory.name}
                                        </SelectItem>
                                    ))}
                                    {selectedCategory && subcategories.length === 0 && (
                                        <SelectItem value="_no_subcats" disabled>
                                            ⚠️ No subcategories created or mapped to this category
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {!selectedService
                                    ? "Select a service to begin hierarchical selection"
                                    : !selectedCategory
                                        ? "Select a category to view its mapped subcategories"
                                        : subcategories.length > 0
                                            ? `✓ ${subcategories.length} subcategory(ies) mapped to this service → category`
                                            : "⚠️ No subcategories created or mapped - Create in Entity Management"
                                }
                            </p>
                            {/* Hierarchical Path Display */}
                            {selectedService && (
                                <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                                    <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">📍 Current Hierarchy:</div>
                                    <div className="text-blue-800 dark:text-blue-200 space-y-1">
                                        <div>
                                            Service: <span className="font-semibold">{serviceTypes.find(s => s.id === selectedService)?.title || selectedService}</span>
                                        </div>
                                        {selectedCategory && (
                                            <div className="ml-3">
                                                ↳ Category: <span className="font-semibold">{categories.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
                                            </div>
                                        )}
                                        {selectedSubcategory && (
                                            <div className="ml-6">
                                                ↳ Subcategory: <span className="font-semibold">{subcategories.find(s => s.id === selectedSubcategory)?.name || selectedSubcategory}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* Debug Info */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700">
                                    <div className="font-semibold mb-1">🔍 Debug Info:</div>
                                    <div>Service: <span className="text-blue-600">{selectedService || 'none'}</span></div>
                                    <div>Category: <span className="text-green-600">{selectedCategory || 'none'}</span></div>
                                    <div>Subcategory: <span className="text-purple-600">{selectedSubcategory || 'none'}</span></div>
                                    <div className="mt-1 pt-1 border-t border-gray-300 dark:border-gray-600">
                                        <div>Categories loaded: <span className="font-semibold">{categories.length}</span></div>
                                        <div>Subcategories loaded: <span className="font-semibold">{subcategories.length}</span></div>
                                    </div>
                                    {subcategories.length > 0 && (
                                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                            IDs: {subcategories.map(s => s.id.substring(0, 8)).join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    {/* Default Mandatory Fields (Editable) */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-muted-foreground">
                                                Default System Fields
                                            </h4>
                                            <div className="text-xs text-blue-600">
                                                These are recommended system fields - you can edit or remove them
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {defaultMandatoryFields
                                                .filter(field => field.is_system_field)
                                                .map((field, idx) => {
                                                    // Check if this field is configured at current level
                                                    const configuredAttr = configuredAttributes.find(
                                                        attr => attr.attribute_registry?.name?.toLowerCase().includes(field.field_name.toLowerCase())
                                                    );
                                                    const isConfigured = !!configuredAttr;
                                                    const isVisible = configuredAttr?.is_visible ?? true;
                                                    
                                                    return (
                                                        <div 
                                                            key={field.id || idx} 
                                                            className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                                                                isConfigured && isVisible
                                                                    ? 'bg-green-50 border-green-200' 
                                                                    : isConfigured && !isVisible
                                                                        ? 'bg-gray-50 border-gray-200'
                                                                        : 'bg-yellow-50 border-yellow-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center space-x-3 flex-1">
                                                                <Lock className={`h-4 w-4 ${
                                                                    isConfigured && isVisible ? 'text-green-500' : 
                                                                    isConfigured && !isVisible ? 'text-gray-400' :
                                                                    'text-yellow-500'
                                                                }`} />
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-sm flex items-center gap-2">
                                                                        {field.field_label}
                                                                        {isConfigured && !isVisible && (
                                                                            <span title="Hidden from form">
                                                                                <Eye className="h-3 w-3 text-gray-400 line-through" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {isConfigured && isVisible
                                                                            ? '✓ Configured and visible' 
                                                                            : isConfigured && !isVisible
                                                                                ? '👁️ Hidden from form preview'
                                                                                : '⚠️ Not configured - add from attributes'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isConfigured ? (
                                                                    <>
                                                                        <Switch
                                                                            checked={isVisible}
                                                                            onCheckedChange={async (checked) => {
                                                                                await handleToggleFieldVisibility(
                                                                                    configuredAttr!.attribute_id,
                                                                                    checked
                                                                                );
                                                                            }}
                                                                            disabled={saving}
                                                                            title={isVisible ? "Click to hide from form" : "Click to show in form"}
                                                                        />
                                                                        <Badge variant={isVisible ? "default" : "outline"}>
                                                                            {isVisible ? "Visible" : "Hidden"}
                                                                        </Badge>
                                                                    </>
                                                                ) : (
                                                                    <Badge variant="secondary">Recommended</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                            <p className="text-xs text-blue-800">
                                                💡 <strong>Tip:</strong> Default system fields are recommendations. You can add them as regular attributes from the "Add Attributes" button, 
                                                configure their settings, mark as required/optional, or remove them if not needed for this {selectedSubcategory ? 'subcategory' : selectedCategory ? 'category' : 'service'}.
                                            </p>
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
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-medium text-sm">
                                                                    {attr.override_label || attr.attribute_registry?.label || attr.attribute_registry?.name}
                                                                </div>
                                                                {/* Show inheritance source if at category/subcategory level */}
                                                                {(attr as any).source_level && (attr as any).source_level !== 'service' && !selectedCategory && (
                                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                                        {(attr as any).source_level === 'service' ? '📁 Service' : 
                                                                         (attr as any).source_level === 'category' ? '📂 Category' : 
                                                                         '📄 Subcategory'}
                                                                    </Badge>
                                                                )}
                                                                {(attr as any).source_level && selectedCategory && !selectedSubcategory && (attr as any).source_level === 'service' && (
                                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                                        ⬆️ Inherited from Service
                                                                    </Badge>
                                                                )}
                                                                {(attr as any).source_level && selectedSubcategory && (
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={`text-xs ${
                                                                            (attr as any).source_level === 'service' ? 'bg-blue-50 text-blue-700' :
                                                                            (attr as any).source_level === 'category' ? 'bg-green-50 text-green-700' :
                                                                            'bg-purple-50 text-purple-700'
                                                                        }`}
                                                                    >
                                                                        {(attr as any).source_level === 'service' ? '⬆️⬆️ Service' : 
                                                                         (attr as any).source_level === 'category' ? '⬆️ Category' : 
                                                                         '📄 Direct'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {attr.attribute_registry?.data_type} • {attr.field_group}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {/* Visibility Toggle */}
                                                        <div className="flex items-center gap-1">
                                                            <Switch
                                                                checked={attr.is_visible}
                                                                onCheckedChange={(checked) => handleToggleFieldVisibility(attr.attribute_id, checked)}
                                                                disabled={saving}
                                                                title={attr.is_visible ? "Hide from form" : "Show in form"}
                                                            />
                                                            <Eye className={`h-3 w-3 ${attr.is_visible ? 'text-green-500' : 'text-gray-300'}`} />
                                                        </div>
                                                        
                                                        {/* Required Toggle */}
                                                        <div className="flex items-center gap-1">
                                                            <Switch
                                                                checked={attr.is_required}
                                                                onCheckedChange={() => handleToggleRequired(attr.attribute_id, attr.is_required)}
                                                                disabled={saving}
                                                            />
                                                            <Badge variant={attr.is_required ? "default" : "secondary"}>
                                                                {attr.is_required ? "Required" : "Optional"}
                                                            </Badge>
                                                        </div>
                                                        
                                                        {/* Edit Button */}
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
                            
                            {/* System Recommended Fields Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-blue-500" />
                                    <h4 className="text-sm font-semibold uppercase text-blue-600">System Recommended Fields</h4>
                                    <Separator className="flex-1" />
                                </div>
                                {generatePreviewFields().slice(0, defaultMandatoryFields.filter(f => f.is_system_field).length).map((field, idx) => (
                                    <div key={`mandatory-${idx}`} className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-semibold text-sm">{field.label}</Label>
                                            <div className="flex items-center gap-2">
                                                {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                                {!field.required && <Badge variant="outline" className="text-xs">Optional</Badge>}
                                                <Badge variant="outline" className="text-xs gap-1 bg-blue-100 text-blue-700">
                                                    <Lock className="h-3 w-3" />
                                                    Recommended
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
                            
                            {/* Custom Attributes Section */}
                            {generatePreviewFields().slice(defaultMandatoryFields.filter(f => f.is_system_field).length).length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Tags className="h-4 w-4 text-blue-500" />
                                        <h4 className="text-sm font-semibold uppercase text-blue-600">Custom Attributes</h4>
                                        <Separator className="flex-1" />
                                    </div>
                                    {generatePreviewFields().slice(defaultMandatoryFields.filter(f => f.is_system_field).length).map((field, idx) => (
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
                                    ({defaultMandatoryFields.filter(f => f.is_system_field).length} system recommended + {generatePreviewFields().slice(defaultMandatoryFields.filter(f => f.is_system_field).length).length} custom)
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    💡 System recommended fields can be marked as required/optional or removed based on your needs
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

