import { AttributePreviewPanel } from "@/components/admin/AttributePreviewPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminData } from "@/contexts/AdminDataContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { EnhancedFormField } from "@shared/api";
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Database,
    Edit,
    Eye,
    GripVertical,
    Layers,
    Lock,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Types
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
    inherit_from_service?: boolean;
    override_label: string | null;
    override_placeholder: string | null;
    override_help_text: string | null;
}

interface MandatoryField {
    id: string;
    field_name: string;
    field_label: string;
    field_type: string;
    input_type: string;
    placeholder: string | null;
    help_text: string | null;
    display_order: number;
    is_system_field: boolean;
    applicable_to_all_services: boolean;
}

export const ComprehensiveAttributeManagement: React.FC = () => {
    const { serviceTypes, categories } = useAdminData();

    // State
    const [activeTab, setActiveTab] = useState<"service" | "category" | "subcategory" | "defaults">("service");
    const [selectedServiceType, setSelectedServiceType] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

    const [serviceAttributes, setServiceAttributes] = useState<AttributeConfig[]>([]);
    const [categoryAttributes, setCategoryAttributes] = useState<AttributeConfig[]>([]);
    const [subcategoryAttributes, setSubcategoryAttributes] = useState<AttributeConfig[]>([]);
    const [mandatoryFields, setMandatoryFields] = useState<MandatoryField[]>([]);
    const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Selection states
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
    const [editingAttribute, setEditingAttribute] = useState<AttributeConfig | null>(null);
    const [previewFields, setPreviewFields] = useState<EnhancedFormField[]>([]);

    // Filtered categories
    const filteredCategories = selectedServiceType
        ? categories.filter(cat => cat.service_type === selectedServiceType && !(cat as any).parent_id)
        : [];

    // Load data on mount
    useEffect(() => {
        fetchMandatoryFields();
        fetchAvailableAttributes();
    }, []);

    // Load attributes when selections change
    useEffect(() => {
        if (selectedServiceType && activeTab === "service") {
            fetchServiceAttributes();
        }
    }, [selectedServiceType, activeTab]);

    useEffect(() => {
        if (selectedCategory && activeTab === "category") {
            fetchCategoryAttributes();
            fetchSubcategories();
        }
    }, [selectedCategory, activeTab]);

    useEffect(() => {
        if (selectedSubcategory && activeTab === "subcategory") {
            fetchSubcategoryAttributes();
        }
    }, [selectedSubcategory, activeTab]);

    // Fetch mandatory fields
    const fetchMandatoryFields = async () => {
        try {
            const { data, error } = await supabase
                .from("default_mandatory_fields")
                .select("*")
                .order("display_order");

            if (error) throw error;
            setMandatoryFields(data || []);
        } catch (error) {
            console.error("Error fetching mandatory fields:", error);
        }
    };

    // Fetch available attributes
    const fetchAvailableAttributes = async () => {
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
    };

    // Fetch service attributes (direct only, not inherited)
    const fetchServiceAttributes = useCallback(async () => {
        if (!selectedServiceType) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc("get_attributes_with_inheritance", {
                p_service_type_id: selectedServiceType,
                p_category_id: null,
                p_subcategory_id: null,
            });

            if (error) {
                // Fallback to direct query if function doesn't exist
                console.warn("RPC function not found, using direct query");
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from("service_attribute_config")
                    .select(`
                        id,
                        attribute_id,
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
                    .eq("service_type_id", selectedServiceType)
                    .eq("is_visible", true)
                    .order("display_order");

                if (fallbackError) throw fallbackError;

                const formatted = (fallbackData || []).map((item: any) => ({
                    id: item.id,
                    attribute_id: item.attribute_id,
                    attribute_name: item.attribute_registry?.name || "",
                    attribute_label: item.override_label || item.attribute_registry?.label || "",
                    data_type: item.attribute_registry?.data_type || "text",
                    input_type: item.attribute_registry?.input_type || "text",
                    placeholder: item.override_placeholder || item.attribute_registry?.placeholder,
                    help_text: item.override_help_text || item.attribute_registry?.help_text,
                    is_required: item.is_required,
                    is_visible: item.is_visible,
                    display_order: item.display_order,
                    field_group: item.field_group || "custom",
                    inherited_from: "service",
                    is_direct: true,
                    override_label: item.override_label,
                    override_placeholder: item.override_placeholder,
                    override_help_text: item.override_help_text,
                }));

                setServiceAttributes(formatted);
                return;
            }

            const formatted = (data || []).map((item: any) => ({
                id: item.id,
                attribute_id: item.attribute_id,
                attribute_name: item.attribute_name || "",
                attribute_label: item.attribute_label || "",
                data_type: item.data_type || "text",
                input_type: item.input_type || "text",
                placeholder: item.override_placeholder,
                help_text: item.override_help_text,
                is_required: item.is_required,
                is_visible: item.is_visible,
                display_order: item.display_order,
                field_group: item.field_group || "custom",
                inherited_from: item.inherited_from,
                is_direct: item.is_direct,
                override_label: item.override_label,
                override_placeholder: item.override_placeholder,
                override_help_text: item.override_help_text,
            }));

            setServiceAttributes(formatted);
        } catch (error) {
            console.error("Error fetching service attributes:", error);
            toast({
                title: "Error",
                description: "Failed to load service attributes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [selectedServiceType]);

    // Fetch category attributes (including inherited from service)
    const fetchCategoryAttributes = useCallback(async () => {
        if (!selectedCategory) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc("get_attributes_with_inheritance", {
                p_service_type_id: selectedServiceType,
                p_category_id: selectedCategory,
                p_subcategory_id: null,
            });

            if (error) {
                // Fallback to direct query if function doesn't exist
                console.warn("RPC function not found, using direct query");
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from("category_attribute_config")
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
                    .eq("category_id", selectedCategory)
                    .eq("is_visible", true)
                    .order("display_order");

                if (fallbackError) throw fallbackError;

                const formatted = (fallbackData || []).map((item: any) => ({
                    id: item.id,
                    attribute_id: item.attribute_id,
                    attribute_name: item.attribute_registry?.name || "",
                    attribute_label: item.override_label || item.attribute_registry?.label || "",
                    data_type: item.attribute_registry?.data_type || "text",
                    input_type: item.attribute_registry?.input_type || "text",
                    placeholder: item.override_placeholder || item.attribute_registry?.placeholder,
                    help_text: item.override_help_text || item.attribute_registry?.help_text,
                    is_required: item.is_required,
                    is_visible: item.is_visible,
                    display_order: item.display_order,
                    field_group: item.field_group || "custom",
                    inherit_from_service: item.inherit_from_service,
                    inherited_from: "category",
                    is_direct: true,
                    override_label: item.override_label,
                    override_placeholder: item.override_placeholder,
                    override_help_text: item.override_help_text,
                }));

                setCategoryAttributes(formatted);
                return;
            }

            const formatted = (data || []).map((item: any) => ({
                id: item.id,
                attribute_id: item.attribute_id,
                attribute_name: item.attribute_name || "",
                attribute_label: item.attribute_label || "",
                data_type: item.data_type || "text",
                input_type: item.input_type || "text",
                placeholder: item.override_placeholder,
                help_text: item.override_help_text,
                is_required: item.is_required,
                is_visible: item.is_visible,
                display_order: item.display_order,
                field_group: item.field_group || "custom",
                inherited_from: item.inherited_from,
                is_direct: item.is_direct,
                inherit_from_service: !item.is_direct,
                override_label: item.override_label,
                override_placeholder: item.override_placeholder,
                override_help_text: item.override_help_text,
            }));

            setCategoryAttributes(formatted);
        } catch (error) {
            console.error("Error fetching category attributes:", error);
            toast({
                title: "Error",
                description: "Failed to load category attributes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, selectedServiceType]);

    // Fetch subcategories
    const fetchSubcategories = async () => {
        if (!selectedCategory) return;

        try {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .eq("parent_id", selectedCategory)
                .eq("is_active", true)
                .order("sort_order");

            if (error) throw error;
            setSubcategories(data || []);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        }
    };

    // Fetch subcategory attributes (including inherited from service and category)
    const fetchSubcategoryAttributes = useCallback(async () => {
        if (!selectedSubcategory) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc("get_attributes_with_inheritance", {
                p_service_type_id: selectedServiceType,
                p_category_id: selectedCategory,
                p_subcategory_id: selectedSubcategory,
            });

            if (error) {
                // Fallback to direct query if function doesn't exist
                console.warn("RPC function not found, using direct query");
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from("category_attribute_config")
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
                    .eq("category_id", selectedSubcategory)
                    .eq("is_visible", true)
                    .order("display_order");

                if (fallbackError) throw fallbackError;

                const formatted = (fallbackData || []).map((item: any) => ({
                    id: item.id,
                    attribute_id: item.attribute_id,
                    attribute_name: item.attribute_registry?.name || "",
                    attribute_label: item.override_label || item.attribute_registry?.label || "",
                    data_type: item.attribute_registry?.data_type || "text",
                    input_type: item.attribute_registry?.input_type || "text",
                    placeholder: item.override_placeholder || item.attribute_registry?.placeholder,
                    help_text: item.override_help_text || item.attribute_registry?.help_text,
                    is_required: item.is_required,
                    is_visible: item.is_visible,
                    display_order: item.display_order,
                    field_group: item.field_group || "custom",
                    inherit_from_service: item.inherit_from_service,
                    inherited_from: "subcategory",
                    is_direct: true,
                    override_label: item.override_label,
                    override_placeholder: item.override_placeholder,
                    override_help_text: item.override_help_text,
                }));

                setSubcategoryAttributes(formatted);
                return;
            }

            const formatted = (data || []).map((item: any) => ({
                id: item.id,
                attribute_id: item.attribute_id,
                attribute_name: item.attribute_name || "",
                attribute_label: item.attribute_label || "",
                data_type: item.data_type || "text",
                input_type: item.input_type || "text",
                placeholder: item.override_placeholder,
                help_text: item.override_help_text,
                is_required: item.is_required,
                is_visible: item.is_visible,
                display_order: item.display_order,
                field_group: item.field_group || "custom",
                inherited_from: item.inherited_from,
                is_direct: item.is_direct,
                inherit_from_service: !item.is_direct,
                override_label: item.override_label,
                override_placeholder: item.override_placeholder,
                override_help_text: item.override_help_text,
            }));

            setSubcategoryAttributes(formatted);
        } catch (error) {
            console.error("Error fetching subcategory attributes:", error);
            toast({
                title: "Error",
                description: "Failed to load subcategory attributes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [selectedSubcategory, selectedCategory, selectedServiceType]);

    // Get current attributes based on active tab
    const getCurrentAttributes = () => {
        switch (activeTab) {
            case "service":
                return serviceAttributes;
            case "category":
                return categoryAttributes;
            case "subcategory":
                return subcategoryAttributes;
            default:
                return [];
        }
    };

    const setCurrentAttributes = (attrs: AttributeConfig[]) => {
        switch (activeTab) {
            case "service":
                setServiceAttributes(attrs);
                break;
            case "category":
                setCategoryAttributes(attrs);
                break;
            case "subcategory":
                setSubcategoryAttributes(attrs);
                break;
        }
    };

    // Add attributes
    const handleAddAttributes = useCallback(async () => {
        if (selectedAttributes.length === 0) return;

        const entityId = activeTab === "service" ? selectedServiceType : 
                        activeTab === "category" ? selectedCategory : selectedSubcategory;

        if (!entityId) {
            toast({
                title: "Error",
                description: `Please select a ${activeTab} first`,
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const currentAttrs = getCurrentAttributes();
            const maxOrder = Math.max(...currentAttrs.map(a => a.display_order), -1);

            const newConfigs = selectedAttributes.map((attrId, idx) => {
                const base: any = {
                    attribute_id: attrId,
                    is_required: false,
                    is_visible: true,
                    display_order: maxOrder + idx + 1,
                    field_group: "custom",
                };

                if (activeTab === "service") {
                    base.service_type_id = entityId;
                } else {
                    base.category_id = entityId;
                    base.inherit_from_service = false;
                }

                return base;
            });

            const tableName = activeTab === "service" ? "service_attribute_config" : "category_attribute_config";

            const { error } = await supabase
                .from(tableName)
                .insert(newConfigs);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Added ${selectedAttributes.length} attribute(s)`,
            });

            setSelectedAttributes([]);
            setShowAddModal(false);
            setSearchTerm("");

            // Refresh
            if (activeTab === "service") fetchServiceAttributes();
            else if (activeTab === "category") fetchCategoryAttributes();
            else fetchSubcategoryAttributes();
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
    }, [selectedAttributes, activeTab, selectedServiceType, selectedCategory, selectedSubcategory]);

    // Update attribute
    const handleUpdateAttribute = useCallback(async () => {
        if (!editingAttribute) return;

        setSaving(true);
        try {
            const tableName = activeTab === "service" ? "service_attribute_config" : "category_attribute_config";

            const { error } = await supabase
                .from(tableName)
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

            // Refresh
            if (activeTab === "service") fetchServiceAttributes();
            else if (activeTab === "category") fetchCategoryAttributes();
            else fetchSubcategoryAttributes();
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
    }, [editingAttribute, activeTab]);

    // Delete attributes
    const handleDeleteAttributes = useCallback(async () => {
        if (selectedAttributes.length === 0) return;

        setSaving(true);
        try {
            const currentAttrs = getCurrentAttributes();
            const idsToDelete = currentAttrs
                .filter(attr => selectedAttributes.includes(attr.attribute_id))
                .map(attr => attr.id);

            const tableName = activeTab === "service" ? "service_attribute_config" : "category_attribute_config";

            const { error } = await supabase
                .from(tableName)
                .delete()
                .in("id", idsToDelete);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Removed ${selectedAttributes.length} attribute(s)`,
            });

            setSelectedAttributes([]);
            setShowDeleteModal(false);

            // Refresh
            if (activeTab === "service") fetchServiceAttributes();
            else if (activeTab === "category") fetchCategoryAttributes();
            else fetchSubcategoryAttributes();
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
    }, [selectedAttributes, activeTab]);

    // Reorder attribute
    const handleReorder = useCallback(async (attrId: string, direction: 'up' | 'down') => {
        const currentAttrs = getCurrentAttributes();
        const currentIndex = currentAttrs.findIndex(a => a.attribute_id === attrId);
        if (currentIndex === -1) return;
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === currentAttrs.length - 1) return;

        const newOrder = [...currentAttrs];
        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        [newOrder[currentIndex], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[currentIndex]];

        // Update display orders
        const updates = newOrder.map((attr, idx) => ({
            id: attr.id,
            display_order: idx,
        }));

        setSaving(true);
        try {
            const tableName = activeTab === "service" ? "service_attribute_config" : "category_attribute_config";

            for (const update of updates) {
                await supabase
                    .from(tableName)
                    .update({ display_order: update.display_order })
                    .eq("id", update.id);
            }

            setCurrentAttributes(newOrder);
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
    }, [activeTab, getCurrentAttributes]);

    // Toggle required
    const handleToggleRequired = useCallback(async (attrId: string, currentStatus: boolean) => {
        setSaving(true);
        try {
            const currentAttrs = getCurrentAttributes();
            const attr = currentAttrs.find(a => a.attribute_id === attrId);
            if (!attr) return;

            const tableName = activeTab === "service" ? "service_attribute_config" : "category_attribute_config";

            const { error } = await supabase
                .from(tableName)
                .update({ is_required: !currentStatus })
                .eq("id", attr.id);

            if (error) throw error;

            // Refresh
            if (activeTab === "service") fetchServiceAttributes();
            else if (activeTab === "category") fetchCategoryAttributes();
            else fetchSubcategoryAttributes();
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
    }, [activeTab, getCurrentAttributes]);

    // Update preview
    const updatePreview = async () => {
        try {
            const params: any = {
                p_service_type_id: selectedServiceType || null,
                p_category_id: activeTab === "category" ? selectedCategory : 
                               activeTab === "subcategory" ? selectedCategory : null,
                p_subcategory_id: activeTab === "subcategory" ? selectedSubcategory : null,
            };

            // Try v2 function first, fallback to v1 if not available
            let { data, error } = await supabase.rpc("get_product_form_attributes_v2", params);

            // Fallback to v1 function if v2 doesn't exist
            if (error && error.code === 'PGRST202') {
                console.warn("Function v2 not found, falling back to v1 (without subcategory support)");
                const v1Params = {
                    p_service_type_id: selectedServiceType || null,
                    p_category_id: activeTab === "subcategory" ? selectedCategory : selectedCategory || null,
                };
                const fallback = await supabase.rpc("get_product_form_attributes", v1Params);
                data = fallback.data;
                error = fallback.error;
                
                if (!error) {
                    toast({
                        title: "Preview Loaded (Limited)",
                        description: "Using fallback mode. Run the SQL script to enable full preview with subcategories.",
                        variant: "default",
                    });
                }
            }

            if (error) {
                console.error("Preview RPC error:", error);
                toast({
                    title: "Preview Error",
                    description: error.message || "Failed to load preview",
                    variant: "destructive",
                });
                return;
            }

            console.log("Preview data received:", data);
            setPreviewFields(data || []);
        } catch (error: any) {
            console.error("Error updating preview:", error);
            toast({
                title: "Preview Error",
                description: error.message || "Failed to load preview",
                variant: "destructive",
            });
        }
    };

    // Filter available attributes
    const filteredAvailableAttributes = availableAttributes.filter(attr => {
        const matchesSearch = attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             attr.label?.toLowerCase().includes(searchTerm.toLowerCase());
        const currentAttrs = getCurrentAttributes();
        const notConfigured = !currentAttrs.some(c => c.attribute_id === attr.id);
        return matchesSearch && notConfigured;
    });

    // Get current stats
    const getCurrentStats = () => {
        const currentAttrs = getCurrentAttributes();
        const directAttrs = currentAttrs.filter((a: any) => a.is_direct !== false);
        const inheritedAttrs = currentAttrs.filter((a: any) => a.is_direct === false);
        
        return {
            custom: directAttrs.length,
            inherited: inheritedAttrs.length,
            required: currentAttrs.filter(a => a.is_required).length,
            mandatory: mandatoryFields.length,
            total: currentAttrs.length + mandatoryFields.length,
        };
    };

    const stats = getCurrentStats();
    const currentAttrs = getCurrentAttributes();

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        <Layers className="h-8 w-8 text-blue-600" />
                        Attribute Configuration
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Configure attributes for services, categories, and subcategories
                    </p>
                </div>
                <Button onClick={async () => {
                    await updatePreview();
                    setShowPreview(true);
                }} variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Form
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="service">Service</TabsTrigger>
                    <TabsTrigger value="category">Category</TabsTrigger>
                    <TabsTrigger value="subcategory">Subcategory</TabsTrigger>
                    <TabsTrigger value="defaults">
                        <Lock className="h-3 w-3 mr-1" />
                        Defaults
                    </TabsTrigger>
                </TabsList>

                {/* Service Tab */}
                <TabsContent value="service" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Service Type</CardTitle>
                            <CardDescription>Choose a service to configure its attributes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {serviceTypes.map((service) => (
                                        <SelectItem key={service.id} value={service.id}>
                                            {service.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {selectedServiceType && (
                        <>
                            {/* Statistics */}
                            <div className="grid gap-4 md:grid-cols-5">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.custom}</div>
                                        <p className="text-xs text-muted-foreground">Direct Attributes</p>
                                    </CardContent>
                                </Card>
                                {stats.inherited > 0 && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-2xl font-bold text-blue-600">{stats.inherited}</div>
                                            <p className="text-xs text-muted-foreground">Inherited</p>
                                        </CardContent>
                                    </Card>
                                )}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.required}</div>
                                        <p className="text-xs text-muted-foreground">Required Fields</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.mandatory}</div>
                                        <p className="text-xs text-muted-foreground">Mandatory Fields</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.total}</div>
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
                                        if (currentAttrs.length === 0) {
                                            toast({ title: "Info", description: "No attributes to edit" });
                                            return;
                                        }
                                        setEditingAttribute(currentAttrs[0]);
                                        setShowEditModal(true);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Attributes
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        if (currentAttrs.length === 0) {
                                            toast({ title: "Info", description: "No attributes to delete" });
                                            return;
                                        }
                                        setShowDeleteModal(true);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Attributes
                                </Button>
                            </div>

                            {/* Configured Attributes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configured Attributes ({currentAttrs.length})</CardTitle>
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
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Mandatory Fields */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                                                    <Lock className="h-4 w-4" />
                                                    Mandatory Fields ({mandatoryFields.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {mandatoryFields.map((field) => (
                                                        <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                                            <div className="flex items-center space-x-3">
                                                                <Lock className="h-4 w-4 text-gray-400" />
                                                                <div>
                                                                    <div className="font-medium text-sm">{field.field_label}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {field.field_name} • {field.input_type}
                                                                        {field.is_system_field ? ' • System field' : ' • Custom field'}
                                                                    </div>
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
                                                {currentAttrs.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                                        <p>No attributes configured</p>
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
                                                        {currentAttrs.map((attr, idx) => {
                                                            const isDirect = (attr as any).is_direct !== false;
                                                            const inheritedFrom = (attr as any).inherited_from;
                                                            
                                                            return (
                                                                <div 
                                                                    key={attr.id} 
                                                                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                                                                        isDirect 
                                                                            ? 'bg-white border-gray-200 hover:border-blue-300' 
                                                                            : 'bg-blue-50 border-blue-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center space-x-3 flex-1">
                                                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="font-medium text-sm">
                                                                                    {attr.attribute_label}
                                                                                </div>
                                                                                {!isDirect && inheritedFrom && (
                                                                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                                                                        Inherited from {inheritedFrom}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {attr.data_type} • {attr.field_group}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Switch
                                                                            checked={attr.is_required}
                                                                            onCheckedChange={() => handleToggleRequired(attr.attribute_id, attr.is_required)}
                                                                            disabled={saving || !isDirect}
                                                                        />
                                                                        <Badge variant={attr.is_required ? "default" : "secondary"}>
                                                                            {attr.is_required ? "Required" : "Optional"}
                                                                        </Badge>
                                                                        {isDirect && (
                                                                            <>
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
                                                                                        disabled={idx === currentAttrs.length - 1 || saving}
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
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* Category Tab - Same UI structure */}
                <TabsContent value="category" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Service & Category</CardTitle>
                            <CardDescription>Choose service and category to configure attributes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Service Type</Label>
                                <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select service type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceTypes.map((service) => (
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
                                        {filteredCategories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedCategory && (
                        <>
                            {/* Statistics with inheritance info */}
                            <div className="grid gap-4 md:grid-cols-5">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.custom}</div>
                                        <p className="text-xs text-muted-foreground">Direct Attributes</p>
                                    </CardContent>
                                </Card>
                                {stats.inherited > 0 && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-2xl font-bold text-blue-600">{stats.inherited}</div>
                                            <p className="text-xs text-muted-foreground">Inherited from Service</p>
                                        </CardContent>
                                    </Card>
                                )}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.required}</div>
                                        <p className="text-xs text-muted-foreground">Required Fields</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.mandatory}</div>
                                        <p className="text-xs text-muted-foreground">Mandatory Fields</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.total}</div>
                                        <p className="text-xs text-muted-foreground">Total Form Fields</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex items-center space-x-4">
                                <Button onClick={() => setShowAddModal(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Attributes
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        if (currentAttrs.length === 0) {
                                            toast({ title: "Info", description: "No attributes to edit" });
                                            return;
                                        }
                                        setEditingAttribute(currentAttrs[0]);
                                        setShowEditModal(true);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Attributes
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        if (currentAttrs.length === 0) {
                                            toast({ title: "Info", description: "No attributes to delete" });
                                            return;
                                        }
                                        setShowDeleteModal(true);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Attributes
                                </Button>
                            </div>

                            {/* Same attribute list structure */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configured Attributes ({currentAttrs.length})</CardTitle>
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
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                                                    <Lock className="h-4 w-4" />
                                                    Mandatory Fields ({mandatoryFields.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {mandatoryFields.map((field) => (
                                                        <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                                            <div className="flex items-center space-x-3">
                                                                <Lock className="h-4 w-4 text-gray-400" />
                                                                <div>
                                                                    <div className="font-medium text-sm">{field.field_label}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {field.field_name} • {field.input_type}
                                                                        {field.is_system_field ? ' • System field' : ' • Custom field'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary">Required</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                                    Custom Attributes
                                                </h4>
                                                {currentAttrs.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                                        <p>No attributes configured</p>
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
                                                        {currentAttrs.map((attr, idx) => (
                                                            <div 
                                                                key={attr.id} 
                                                                className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                                                            >
                                                                <div className="flex items-center space-x-3 flex-1">
                                                                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="font-medium text-sm">
                                                                                {attr.attribute_label}
                                                                            </div>
                                                                            {attr.inherit_from_service && (
                                                                                <Badge variant="outline" className="text-xs">Inherited</Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {attr.data_type} • {attr.field_group}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={attr.is_required}
                                                                        onCheckedChange={() => handleToggleRequired(attr.attribute_id, attr.is_required)}
                                                                        disabled={saving || attr.inherit_from_service}
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
                                                                            disabled={idx === currentAttrs.length - 1 || saving}
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
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* Subcategory Tab - Same structure */}
                <TabsContent value="subcategory" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Service, Category & Subcategory</CardTitle>
                            <CardDescription>Choose hierarchy to configure subcategory attributes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Service Type</Label>
                                <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select service type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceTypes.map((service) => (
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
                                        {filteredCategories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Subcategory</Label>
                                <Select
                                    value={selectedSubcategory}
                                    onValueChange={setSelectedSubcategory}
                                    disabled={!selectedCategory}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subcategory" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subcategories.map((subcat) => (
                                            <SelectItem key={subcat.id} value={subcat.id}>
                                                {subcat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedSubcategory && (
                        <>
                            {/* Statistics with full inheritance hierarchy */}
                            <div className="grid gap-4 md:grid-cols-5">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.custom}</div>
                                        <p className="text-xs text-muted-foreground">Direct Attributes</p>
                                    </CardContent>
                                </Card>
                                {stats.inherited > 0 && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-2xl font-bold text-blue-600">{stats.inherited}</div>
                                            <p className="text-xs text-muted-foreground">Inherited (Service + Category)</p>
                                        </CardContent>
                                    </Card>
                                )}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.required}</div>
                                        <p className="text-xs text-muted-foreground">Required Fields</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.mandatory}</div>
                                        <p className="text-xs text-muted-foreground">Mandatory Fields</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{stats.total}</div>
                                        <p className="text-xs text-muted-foreground">Total Form Fields</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex items-center space-x-4">
                                <Button onClick={() => setShowAddModal(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Attributes
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        if (currentAttrs.length === 0) {
                                            toast({ title: "Info", description: "No attributes to edit" });
                                            return;
                                        }
                                        setEditingAttribute(currentAttrs[0]);
                                        setShowEditModal(true);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Attributes
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        if (currentAttrs.length === 0) {
                                            toast({ title: "Info", description: "No attributes to delete" });
                                            return;
                                        }
                                        setShowDeleteModal(true);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Attributes
                                </Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Configured Attributes ({currentAttrs.length})</CardTitle>
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
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                                                    <Lock className="h-4 w-4" />
                                                    Mandatory Fields ({mandatoryFields.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {mandatoryFields.map((field) => (
                                                        <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                                            <div className="flex items-center space-x-3">
                                                                <Lock className="h-4 w-4 text-gray-400" />
                                                                <div>
                                                                    <div className="font-medium text-sm">{field.field_label}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {field.field_name} • {field.input_type}
                                                                        {field.is_system_field ? ' • System field' : ' • Custom field'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary">Required</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                                    Custom Attributes
                                                </h4>
                                                {currentAttrs.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                                        <p>No attributes configured</p>
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
                                                        {currentAttrs.map((attr, idx) => {
                                                            const isDirect = (attr as any).is_direct !== false;
                                                            const inheritedFrom = (attr as any).inherited_from;
                                                            
                                                            return (
                                                                <div 
                                                                    key={attr.id} 
                                                                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                                                                        isDirect 
                                                                            ? 'bg-white border-gray-200 hover:border-blue-300' 
                                                                            : 'bg-blue-50 border-blue-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center space-x-3 flex-1">
                                                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="font-medium text-sm">
                                                                                    {attr.attribute_label}
                                                                                </div>
                                                                                {!isDirect && inheritedFrom && (
                                                                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                                                                        Inherited from {inheritedFrom}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {attr.data_type} • {attr.field_group}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Switch
                                                                            checked={attr.is_required}
                                                                            onCheckedChange={() => handleToggleRequired(attr.attribute_id, attr.is_required)}
                                                                            disabled={saving || !isDirect}
                                                                        />
                                                                        <Badge variant={attr.is_required ? "default" : "secondary"}>
                                                                            {attr.is_required ? "Required" : "Optional"}
                                                                        </Badge>
                                                                        {isDirect && (
                                                                            <>
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
                                                                                        disabled={idx === currentAttrs.length - 1 || saving}
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
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* Defaults Tab */}
                <TabsContent value="defaults">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Default Mandatory Fields
                            </CardTitle>
                            <CardDescription>
                                System-defined fields available in all offerings (Read-only)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Field Label</TableHead>
                                            <TableHead>Field Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>System Field</TableHead>
                                            <TableHead>Applies To All</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mandatoryFields.map((field) => (
                                            <TableRow key={field.id}>
                                                <TableCell>{field.display_order}</TableCell>
                                                <TableCell className="font-medium">
                                                    {field.field_label}
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {field.field_name}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{field.input_type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {field.is_system_field && (
                                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {field.applicable_to_all_services ? (
                                                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">No</Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Attributes Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Add Attributes</DialogTitle>
                        <DialogDescription>
                            Select attributes from the registry to add
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search attributes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>

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
                                                    {attr.data_type} • {attr.group_name || 'General'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        {selectedAttributes.length > 0 && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-blue-900">
                                    {selectedAttributes.length} attribute(s) selected
                                </p>
                            </div>
                        )}

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
                            Customize the attribute settings
                        </DialogDescription>
                    </DialogHeader>

                    {editingAttribute && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Original Label</Label>
                                <Input 
                                    value={editingAttribute.attribute_label} 
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
                            Select attributes to remove. System fields cannot be deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {currentAttrs.map(attr => (
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
                                            {attr.attribute_label}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {attr.data_type}
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

                    <DialogFooter>
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Form Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Form Preview</DialogTitle>
                        <DialogDescription>
                            Preview how the form will look with current configuration
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[600px]">
                        <AttributePreviewPanel
                            fields={previewFields}
                            title="Product Form Preview"
                            mode="admin"
                        />
                    </ScrollArea>

                    <DialogFooter>
                        <Button onClick={() => setShowPreview(false)}>
                            Close Preview
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
