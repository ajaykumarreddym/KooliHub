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
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    is_editable: boolean; // NEW: Can this attribute's settings be edited?
    is_deletable: boolean; // NEW: Can this attribute be removed from the service?
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

// Sortable Row Component for Drag and Drop
interface SortableAttributeRowProps {
    attribute: AttributeConfig;
    index: number;
    onToggleRequired: (id: string, current: boolean) => void;
    onToggleVisibility: (id: string, current: boolean) => void;
    onEdit: (attr: AttributeConfig) => void;
    onDelete: (attr: AttributeConfig) => void;
}

const SortableAttributeRow: React.FC<SortableAttributeRowProps> = ({
    attribute,
    index,
    onToggleRequired,
    onToggleVisibility,
    onEdit,
    onDelete
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: attribute.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
    };

    const isInherited = attribute.inherit_from_service !== false;

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell className="w-10">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                >
                    <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
            </TableCell>
            <TableCell>{index + 1}</TableCell>
            <TableCell>
                <div className="space-y-1">
                    <div className="font-medium">{attribute.attribute_label || attribute.attribute_name}</div>
                    <div className="text-xs text-muted-foreground">{attribute.attribute_name}</div>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline">{attribute.data_type}</Badge>
            </TableCell>
            <TableCell>
                <Badge variant="secondary">{attribute.input_type}</Badge>
            </TableCell>
            <TableCell>
                <Switch
                    checked={attribute.is_required}
                    onCheckedChange={() => onToggleRequired(attribute.attribute_id, attribute.is_required)}
                    disabled={isInherited}
                />
            </TableCell>
            <TableCell>
                <Switch
                    checked={attribute.is_visible}
                    onCheckedChange={() => onToggleVisibility(attribute.attribute_id, attribute.is_visible)}
                />
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    {isInherited ? (
                        <Badge variant="outline" className="text-xs">Inherited</Badge>
                    ) : (
                        <>
                            {/* NEW: Edit button - disable if not editable */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(attribute)}
                                disabled={attribute.is_editable === false}
                                title={attribute.is_editable === false ? "System-locked attribute" : "Edit attribute"}
                            >
                                {attribute.is_editable === false ? (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Edit className="h-4 w-4" />
                                )}
                            </Button>
                            {/* NEW: Delete button - only show if deletable */}
                            {attribute.is_deletable !== false ? (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDelete(attribute)}
                                    title="Delete attribute"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            ) : (
                                <div className="px-2 text-xs text-muted-foreground" title="System-required">
                                    Required
                                </div>
                            )}
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
};

// Sortable Default Field Item Component
interface SortableDefaultFieldItemProps {
    field: MandatoryField;
    configuredAttr: AttributeConfig | undefined;
    isRequired: boolean;
    isVisible: boolean;
    onToggleRequired: (id: string, fieldName: string, fieldLabel: string, fieldType: string, inputType: string, toggleType: 'required', currentValue: boolean) => void;
    onToggleVisibility: (id: string, fieldName: string, fieldLabel: string, fieldType: string, inputType: string, toggleType: 'visible', currentValue: boolean) => void;
    onEdit: (attr: AttributeConfig) => void;
    saving: boolean;
}

const SortableDefaultFieldItem: React.FC<SortableDefaultFieldItemProps> = ({
    field,
    configuredAttr,
    isRequired,
    isVisible,
    onToggleRequired,
    onToggleVisibility,
    onEdit,
    saving
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                isDragging ? 'shadow-lg z-50 scale-105' : ''
            } bg-blue-50 border-blue-200 hover:border-blue-400`}
        >
            <div className="flex items-center space-x-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-blue-100 rounded"
                >
                    <GripVertical className="h-4 w-4 text-blue-600" />
                </div>
                <Database className="h-4 w-4 text-blue-600" />
                <div>
                    <div className="font-medium text-sm">{field.field_label}</div>
                    <div className="text-xs text-muted-foreground">
                        {field.field_name} • {field.input_type}
                        {field.is_system_field ? ' • System field' : ' • Default field'}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {/* Visible Toggle */}
                <div className="flex flex-col items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Visible</Label>
                    <Switch
                        checked={isVisible}
                        onCheckedChange={() => onToggleVisibility(
                            field.id,
                            field.field_name,
                            field.field_label,
                            field.field_type,
                            field.input_type,
                            'visible',
                            isVisible
                        )}
                        disabled={saving}
                    />
                </div>
                {/* Required Toggle */}
                <div className="flex flex-col items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Required</Label>
                    <Switch
                        checked={isRequired}
                        onCheckedChange={() => onToggleRequired(
                            field.id,
                            field.field_name,
                            field.field_label,
                            field.field_type,
                            field.input_type,
                            'required',
                            isRequired
                        )}
                        disabled={saving}
                    />
                </div>
                {/* Edit Button */}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        if (configuredAttr) {
                            onEdit(configuredAttr);
                        }
                    }}
                    disabled={!configuredAttr || saving}
                    title={configuredAttr ? "Edit attribute" : "Add to config first by toggling a switch"}
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

// Sortable Attribute Item Component (for card-style layout)
interface SortableAttributeItemProps {
    attribute: AttributeConfig;
    isDirect: boolean;
    inheritedFrom?: string;
    onToggleRequired: (id: string, current: boolean) => void;
    onToggleVisibility: (id: string, current: boolean) => void;
    onEdit: (attr: AttributeConfig) => void;
    saving: boolean;
}

const SortableAttributeItem: React.FC<SortableAttributeItemProps> = ({
    attribute,
    isDirect,
    inheritedFrom,
    onToggleRequired,
    onToggleVisibility,
    onEdit,
    saving
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: attribute.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                isDragging ? 'shadow-lg z-50 scale-105' : ''
            } ${
                isDirect 
                    ? 'bg-white border-gray-200 hover:border-blue-300' 
                    : 'bg-blue-50 border-blue-200'
            }`}
        >
            <div className="flex items-center space-x-3 flex-1">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">
                            {attribute.attribute_label}
                        </div>
                        {!isDirect && inheritedFrom && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                Inherited from {inheritedFrom}
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {attribute.data_type} • {attribute.field_group}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Visible Toggle */}
                <div className="flex flex-col items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Visible</Label>
                    <Switch
                        checked={attribute.is_visible}
                        onCheckedChange={() => onToggleVisibility(attribute.attribute_id, attribute.is_visible)}
                        disabled={saving || !isDirect}
                    />
                </div>
                
                {/* Required Toggle */}
                <div className="flex flex-col items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Required</Label>
                    <Switch
                        checked={attribute.is_required}
                        onCheckedChange={() => onToggleRequired(attribute.attribute_id, attribute.is_required)}
                        disabled={saving || !isDirect}
                    />
                </div>
                
                {/* Edit Button */}
                {isDirect && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(attribute)}
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export const ComprehensiveAttributeManagement: React.FC = () => {
    const { serviceTypes, categories } = useAdminData();

    // Drag and Drop Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    // Reset category and subcategory when service type changes
    useEffect(() => {
        setSelectedCategory("");
        setSelectedSubcategory("");
        setSubcategories([]);
    }, [selectedServiceType]);

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

    // Fetch subcategories whenever category changes (for subcategory tab)
    useEffect(() => {
        if (selectedCategory) {
            fetchSubcategories();
        } else {
            setSubcategories([]);
            setSelectedSubcategory(""); // Reset subcategory when category is cleared
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedSubcategory && activeTab === "subcategory") {
            fetchSubcategoryAttributes();
        }
    }, [selectedSubcategory, activeTab]);

    // Fetch default fields from attribute_registry (replacing default_mandatory_fields)
    const fetchMandatoryFields = async () => {
        try {
            const { data, error } = await supabase
                .from("attribute_registry")
                .select("*")
                .eq("is_default_field", true)
                .eq("is_active", true)
                .order("display_order");

            if (error) throw error;
            
            // Map to MandatoryField format
            const mapped = (data || []).map(attr => ({
                id: attr.id,
                field_name: attr.name,
                field_label: attr.label,
                field_type: attr.data_type,
                input_type: attr.input_type || attr.data_type,
                placeholder: attr.placeholder,
                help_text: attr.help_text,
                display_order: attr.display_order || 0,
                is_system_field: attr.is_system_field || false,
                applicable_to_all_services: attr.applicable_to_all_services || false
            }));
            
            setMandatoryFields(mapped);
        } catch (error) {
            console.error("Error fetching default fields:", error);
            toast({
                title: "Error",
                description: "Failed to load default fields",
                variant: "destructive",
            });
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
                    is_editable: item.is_editable !== false, // NEW: Default to true if not specified
                    is_deletable: item.is_deletable !== false, // NEW: Default to true if not specified
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
                is_editable: item.is_editable !== false, // NEW: Default to true if not specified
                is_deletable: item.is_deletable !== false, // NEW: Default to true if not specified
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
                    is_editable: item.is_editable !== false, // NEW
                    is_deletable: item.is_deletable !== false, // NEW
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
                is_editable: item.is_editable !== false, // NEW
                is_deletable: item.is_deletable !== false, // NEW
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

    // Fetch subcategories - FIXED
    const fetchSubcategories = async () => {
        if (!selectedCategory) {
            setSubcategories([]);
            return;
        }

        try {
            console.log('🔍 Fetching subcategories for category:', selectedCategory);
            
            const { data, error } = await supabase
                .from("subcategories")
                .select(`
                    id,
                    name,
                    description,
                    service_type_id,
                    category_id,
                    icon,
                    color,
                    image_url,
                    is_active,
                    sort_order,
                    created_at
                `)
                .eq("category_id", selectedCategory)
                .eq("is_active", true)
                .order("sort_order");

            if (error) {
                console.error('❌ Error fetching subcategories:', error);
                throw error;
            }

            console.log('✅ Loaded subcategories:', data?.length || 0, data);
            setSubcategories(data || []);

            if (!data || data.length === 0) {
                console.log('⚠️ No subcategories found for category:', selectedCategory);
            }
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            toast({
                title: "Error",
                description: "Failed to load subcategories. Check console for details.",
                variant: "destructive",
            });
            setSubcategories([]);
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
                console.warn("RPC function error, using fallback query:", error);
                
                // Get subcategory's own attributes
                const { data: subcatData, error: subcatError } = await supabase
                    .from("subcategory_attribute_config")
                    .select(`
                        id,
                        attribute_id,
                        inherit_from_category,
                        inherit_from_service,
                        is_required,
                        is_visible,
                        is_editable,
                        is_deletable,
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
                    .eq("subcategory_id", selectedSubcategory)
                    .order("display_order");

                if (subcatError) throw subcatError;

                const formatted = (subcatData || []).map((item: any) => ({
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
                    is_editable: item.is_editable !== false,
                    is_deletable: item.is_deletable !== false,
                    display_order: item.display_order,
                    field_group: item.field_group || "custom",
                    inherit_from_service: item.inherit_from_service,
                    inherit_from_category: item.inherit_from_category,
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
                is_editable: item.is_editable !== false, // NEW
                is_deletable: item.is_deletable !== false, // NEW
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
            
            // NEW: Filter out non-deletable attributes
            const deletableAttrs = currentAttrs.filter(attr => 
                selectedAttributes.includes(attr.attribute_id) && 
                attr.is_deletable !== false
            );
            
            const nonDeletableAttrs = currentAttrs.filter(attr => 
                selectedAttributes.includes(attr.attribute_id) && 
                attr.is_deletable === false
            );
            
            // Warn about non-deletable attributes
            if (nonDeletableAttrs.length > 0) {
                const names = nonDeletableAttrs.map(attr => attr.attribute_label).join(', ');
                toast({
                    title: "Some Attributes Cannot Be Deleted",
                    description: `The following system-required attributes cannot be deleted: ${names}`,
                    variant: "destructive",
                });
                
                // If all selected attributes are non-deletable, stop here
                if (deletableAttrs.length === 0) {
                    setSaving(false);
                    return;
                }
            }
            
            const idsToDelete = deletableAttrs.map(attr => attr.id);

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

            let tableName;
            if (activeTab === "service") tableName = "service_attribute_config";
            else if (activeTab === "category") tableName = "category_attribute_config";
            else tableName = "subcategory_attribute_config";

            const { error } = await supabase
                .from(tableName)
                .update({ is_required: !currentStatus })
                .eq("id", attr.id);

            if (error) throw error;

            // Refresh
            if (activeTab === "service") fetchServiceAttributes();
            else if (activeTab === "category") fetchCategoryAttributes();
            else fetchSubcategoryAttributes();
            
            toast({
                title: "Success",
                description: `Attribute ${!currentStatus ? 'required' : 'optional'}`,
            });
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
    }, [activeTab, getCurrentAttributes, fetchServiceAttributes, fetchCategoryAttributes, fetchSubcategoryAttributes]);

    // Toggle visibility
    const handleToggleVisibility = useCallback(async (attrId: string, currentStatus: boolean) => {
        setSaving(true);
        try {
            const currentAttrs = getCurrentAttributes();
            const attr = currentAttrs.find(a => a.attribute_id === attrId);
            if (!attr) return;

            let tableName;
            if (activeTab === "service") tableName = "service_attribute_config";
            else if (activeTab === "category") tableName = "category_attribute_config";
            else tableName = "subcategory_attribute_config";

            const { error } = await supabase
                .from(tableName)
                .update({ is_visible: !currentStatus })
                .eq("id", attr.id);

            if (error) throw error;

            // Refresh
            if (activeTab === "service") fetchServiceAttributes();
            else if (activeTab === "category") fetchCategoryAttributes();
            else fetchSubcategoryAttributes();
            
            toast({
                title: "Success",
                description: `Attribute ${!currentStatus ? 'visible' : 'hidden'}`,
            });
        } catch (error: any) {
            console.error("Error toggling visibility:", error);
            toast({
                title: "Error",
                description: "Failed to update visibility status",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [activeTab, getCurrentAttributes, fetchServiceAttributes, fetchCategoryAttributes, fetchSubcategoryAttributes]);

    // Handle default field actions (add to config if not exists, then toggle)
    const handleDefaultFieldToggle = useCallback(async (
        defaultFieldId: string,
        fieldName: string,
        fieldLabel: string,
        fieldType: string,
        inputType: string,
        toggleType: 'required' | 'visible',
        currentValue: boolean
    ) => {
        if (!selectedServiceType && activeTab !== "defaults") return;

        setSaving(true);
        try {
            // First, ensure the field exists in attribute_registry (or find existing)
            let attributeId: string;
            
            const { data: existingAttr } = await supabase
                .from("attribute_registry")
                .select("id")
                .eq("name", fieldName)
                .single();

            if (existingAttr) {
                attributeId = existingAttr.id;
            } else {
                // Create in attribute_registry
                const { data: newAttr, error: createError } = await supabase
                    .from("attribute_registry")
                    .insert({
                        name: fieldName,
                        label: fieldLabel,
                        data_type: fieldType,
                        input_type: inputType,
                        is_active: true
                    })
                    .select("id")
                    .single();

                if (createError) throw createError;
                attributeId = newAttr.id;
            }

            // Now work with the config table
            let tableName, contextField, contextValue;
            
            if (activeTab === "service") {
                tableName = "service_attribute_config";
                contextField = "service_type_id";
                contextValue = selectedServiceType;
            } else if (activeTab === "category") {
                tableName = "category_attribute_config";
                contextField = "category_id";
                contextValue = selectedCategory;
            } else if (activeTab === "subcategory") {
                tableName = "subcategory_attribute_config";
                contextField = "subcategory_id";
                contextValue = selectedSubcategory;
            } else {
                return; // Defaults tab doesn't support this
            }

            // Check if attribute exists in config
            // @ts-ignore - Dynamic table name causes deep type instantiation
            const checkResult = await supabase
                .from(tableName)
                .select("id, is_required, is_visible")
                .eq(contextField, contextValue)
                .eq("attribute_id", attributeId)
                .maybeSingle();
            const existing = checkResult.data;

            if (!existing) {
                // Add to config first with default values
                // @ts-ignore - Dynamic table name causes deep type instantiation
                const insertResult = await supabase
                    .from(tableName)
                    .insert({
                        [contextField]: contextValue,
                        attribute_id: attributeId,
                        is_required: toggleType === 'required' ? !currentValue : true,
                        is_visible: toggleType === 'visible' ? !currentValue : true,
                        is_editable: true,
                        is_deletable: true,
                        display_order: 999,
                        field_group: 'default'
                    })
                    .select()
                    .single();

                if (insertResult.error) throw insertResult.error;
            } else {
                // Update existing
                // @ts-ignore - Dynamic table name causes deep type instantiation
                const updateResult = await supabase
                    .from(tableName)
                    .update({
                        [toggleType === 'required' ? 'is_required' : 'is_visible']: !currentValue
                    })
                    .eq("id", existing.id);

                if (updateResult.error) throw updateResult.error;
            }

            // Refresh
            if (activeTab === "service") fetchServiceAttributes();
            else if (activeTab === "category") fetchCategoryAttributes();
            else fetchSubcategoryAttributes();
            
            toast({
                title: "Success",
                description: `Default field ${toggleType} updated`,
            });
        } catch (error: any) {
            console.error(`Error toggling default field ${toggleType}:`, error);
            toast({
                title: "Error",
                description: `Failed to update ${toggleType} status: ${error.message || 'Unknown error'}`,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [activeTab, selectedServiceType, selectedCategory, selectedSubcategory, fetchServiceAttributes, fetchCategoryAttributes, fetchSubcategoryAttributes]);

    // Drag end handler for default fields reordering
    const handleDefaultFieldDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = mandatoryFields.findIndex(field => field.id === active.id);
        const newIndex = mandatoryFields.findIndex(field => field.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const newOrder = arrayMove(mandatoryFields, oldIndex, newIndex);
        
        // Update display order (start from 1 for default fields)
        const updates = newOrder.map((field, index) => ({
            field_name: field.field_name,
            new_display_order: index + 1
        }));

        // Optimistically update UI
        setMandatoryFields(newOrder);

        // Save to database
        setSaving(true);
        try {
            // Update display_order in attribute_registry for default fields
            for (const update of updates) {
                await supabase
                    .from("attribute_registry")
                    .update({ display_order: update.new_display_order })
                    .eq("name", update.field_name)
                    .eq("is_default_field", true);
            }

            toast({
                title: "Success",
                description: "Default field order updated",
            });
        } catch (error: any) {
            console.error("Error reordering default fields:", error);
            toast({
                title: "Error",
                description: "Failed to reorder default fields",
                variant: "destructive",
            });
            // Revert on error
            fetchMandatoryFields();
        } finally {
            setSaving(false);
        }
    }, [mandatoryFields, fetchMandatoryFields]);

    // Drag end handler for custom attributes reordering
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const currentAttrs = getCurrentAttributes();
        const oldIndex = currentAttrs.findIndex(attr => attr.id === active.id);
        const newIndex = currentAttrs.findIndex(attr => attr.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const newOrder = arrayMove(currentAttrs, oldIndex, newIndex);
        
        // Update display order (start from 1000 for custom fields to come after defaults)
        const updates = newOrder.map((attr, index) => ({
            ...attr,
            display_order: 1000 + index
        }));

        // Optimistically update UI
        setCurrentAttributes(updates);

        // Save to database
        setSaving(true);
        try {
            const tableName = activeTab === "service" ? "service_attribute_config" : 
                            activeTab === "category" ? "category_attribute_config" :
                            "subcategory_attribute_config";

            for (const update of updates) {
                await supabase
                    .from(tableName)
                    .update({ display_order: update.display_order })
                    .eq("id", update.id);
            }

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
            // Revert on error
            if (activeTab === "service") fetchServiceAttributes();
            else if (activeTab === "category") fetchCategoryAttributes();
            else fetchSubcategoryAttributes();
        } finally {
            setSaving(false);
        }
    }, [activeTab, getCurrentAttributes, setCurrentAttributes, fetchServiceAttributes, fetchCategoryAttributes, fetchSubcategoryAttributes]);

    // Update preview - FIXED to ensure labels are included
    const updatePreview = async () => {
        try {
            const params: any = {
                p_service_type_id: selectedServiceType || null,
                p_category_id: activeTab === "category" ? selectedCategory : 
                               activeTab === "subcategory" ? selectedCategory : null,
                p_subcategory_id: activeTab === "subcategory" ? selectedSubcategory : null,
            };

            console.log('🔍 Fetching preview with params:', params);

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
                console.error("❌ Preview RPC error:", error);
                toast({
                    title: "Preview Error",
                    description: error.message || "Failed to load preview",
                    variant: "destructive",
                });
                return;
            }

            console.log("✅ Preview data received:", data);
            
            // Ensure all fields have proper labels
            const fieldsWithLabels = (data || []).map((field: any) => ({
                ...field,
                attribute_label: field.attribute_label || field.field_label || field.label || field.attribute_name || field.field_name || 'Untitled Field',
            }));
            
            // ✅ FILTER: Only show visible fields in preview
            const visibleFields = fieldsWithLabels.filter((field: any) => field.is_visible !== false);
            
            console.log("📋 Filtered visible fields for preview:", visibleFields.length, 'of', fieldsWithLabels.length);
            setPreviewFields(visibleFields);
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
        
        // Filter out default fields to prevent double counting
        const defaultFieldNames = mandatoryFields.map(f => f.field_name);
        const customAttrsOnly = currentAttrs.filter(
            attr => !defaultFieldNames.includes(attr.attribute_name)
        );
        
        const directAttrs = customAttrsOnly.filter((a: any) => a.is_direct !== false);
        const inheritedAttrs = customAttrsOnly.filter((a: any) => a.is_direct === false);
        
        return {
            custom: directAttrs.length,
            inherited: inheritedAttrs.length,
            required: currentAttrs.filter(a => a.is_required).length,
            mandatory: mandatoryFields.length,
            total: customAttrsOnly.length + mandatoryFields.length,
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
                                        <p className="text-xs text-muted-foreground">Custom Attributes</p>
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
                                        <p className="text-xs text-muted-foreground">Default Fields</p>
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
                                {/* <Button 
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
                                </Button> */}
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
                                            {/* Default Fields with Drag and Drop */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                                                    <Database className="h-4 w-4" />
                                                    Default Fields ({mandatoryFields.length}) - Drag to Reorder
                                                </h4>
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDefaultFieldDragEnd}
                                                >
                                                    <SortableContext
                                                        items={mandatoryFields.map(f => f.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="space-y-2">
                                                            {mandatoryFields.map((field) => {
                                                                // Find if this default field is configured for current context
                                                                const configuredAttr = currentAttrs.find(
                                                                    attr => attr.attribute_name === field.field_name
                                                                );
                                                                console.log(`Default field "${field.field_name}":`, { configured: !!configuredAttr, isRequired: configuredAttr?.is_required, isVisible: configuredAttr?.is_visible });
                                                                // If not configured, show defaults (not required, but visible)
                                                                const isRequired = configuredAttr?.is_required ?? false;
                                                                const isVisible = configuredAttr?.is_visible ?? true;
                                                                
                                                                return (
                                                                    <SortableDefaultFieldItem
                                                                        key={field.id}
                                                                        field={field}
                                                                        configuredAttr={configuredAttr}
                                                                        isRequired={isRequired}
                                                                        isVisible={isVisible}
                                                                        onToggleRequired={handleDefaultFieldToggle}
                                                                        onToggleVisibility={handleDefaultFieldToggle}
                                                                        onEdit={(attr) => {
                                                                            setEditingAttribute(attr);
                                                                            setShowEditModal(true);
                                                                        }}
                                                                        saving={saving}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
                                                <p className="text-xs text-muted-foreground mt-2 italic">
                                                    💡 Drag to reorder, toggle to customize default fields for this {activeTab}. They're optional and can be shown/hidden.
                                                </p>
                                            </div>

                                            <Separator />

                                            {/* Custom Attributes with Drag and Drop */}
                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                                    Custom Attributes (Drag to Reorder)
                                                </h4>
                                                {(() => {
                                                    // Filter out default fields from custom attributes to prevent duplicates
                                                    const defaultFieldNames = mandatoryFields.map(f => f.field_name);
                                                    const customAttrsOnly = currentAttrs.filter(
                                                        attr => !defaultFieldNames.includes(attr.attribute_name)
                                                    );
                                                    
                                                    if (customAttrsOnly.length === 0) {
                                                        return (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                                                <p>No custom attributes configured</p>
                                                                <Button 
                                                                    variant="link" 
                                                                    onClick={() => setShowAddModal(true)}
                                                                    className="mt-2"
                                                                >
                                                                    Add your first attribute
                                                                </Button>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <DndContext
                                                            sensors={sensors}
                                                            collisionDetection={closestCenter}
                                                            onDragEnd={handleDragEnd}
                                                        >
                                                            <SortableContext
                                                                items={customAttrsOnly.map(attr => attr.id)}
                                                                strategy={verticalListSortingStrategy}
                                                            >
                                                                <div className="space-y-2">
                                                                    {customAttrsOnly.map((attr, idx) => {
                                                                        const isDirect = (attr as any).is_direct !== false;
                                                                        const inheritedFrom = (attr as any).inherited_from;
                                                                        
                                                                        return (
                                                                            <SortableAttributeItem
                                                                                key={attr.id}
                                                                                attribute={attr}
                                                                                isDirect={isDirect}
                                                                                inheritedFrom={inheritedFrom}
                                                                                onToggleRequired={handleToggleRequired}
                                                                                onToggleVisibility={handleToggleVisibility}
                                                                                onEdit={(attr) => {
                                                                                    setEditingAttribute(attr);
                                                                                    setShowEditModal(true);
                                                                                }}
                                                                                saving={saving}
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                            </SortableContext>
                                                        </DndContext>
                                                    );
                                                })()}
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
                                        <p className="text-xs text-muted-foreground">Default Fields</p>
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
                                {/* <Button 
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
                                </Button> */}
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
                                                    <Database className="h-4 w-4" />
                                                    Default Fields ({mandatoryFields.length}) - Drag to Reorder
                                                </h4>
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDefaultFieldDragEnd}
                                                >
                                                    <SortableContext
                                                        items={mandatoryFields.map(f => f.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="space-y-2">
                                                            {mandatoryFields.map((field) => {
                                                                // Find if this default field is configured for current context
                                                                const configuredAttr = currentAttrs.find(
                                                                    attr => attr.attribute_name === field.field_name
                                                                );
                                                                console.log(`[${activeTab}] Default field "${field.field_name}":`, { configured: !!configuredAttr, isRequired: configuredAttr?.is_required, isVisible: configuredAttr?.is_visible });
                                                                const isRequired = configuredAttr?.is_required ?? false;
                                                                const isVisible = configuredAttr?.is_visible ?? true;
                                                        
                                                                return (
                                                                    <SortableDefaultFieldItem
                                                                        key={field.id}
                                                                        field={field}
                                                                        configuredAttr={configuredAttr}
                                                                        isRequired={isRequired}
                                                                        isVisible={isVisible}
                                                                        onToggleRequired={handleDefaultFieldToggle}
                                                                        onToggleVisibility={handleDefaultFieldToggle}
                                                                        onEdit={(attr) => {
                                                                            setEditingAttribute(attr);
                                                                            setShowEditModal(true);
                                                                        }}
                                                                        saving={saving}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
                                                <p className="text-xs text-muted-foreground mt-2 italic">
                                                    💡 Drag to reorder, toggle to customize default fields for this {activeTab}. They're optional and can be shown/hidden.
                                                </p>
                                            </div>

                                            <Separator />

                                            {/* Custom Attributes with Drag and Drop */}
                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                                    Custom Attributes (Drag to Reorder)
                                                </h4>
                                                {(() => {
                                                    // Filter out default fields from custom attributes to prevent duplicates
                                                    const defaultFieldNames = mandatoryFields.map(f => f.field_name);
                                                    const customAttrsOnly = currentAttrs.filter(
                                                        attr => !defaultFieldNames.includes(attr.attribute_name)
                                                    );
                                                    
                                                    if (customAttrsOnly.length === 0) {
                                                        return (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                                                <p>No custom attributes configured</p>
                                                                <Button 
                                                                    variant="link" 
                                                                    onClick={() => setShowAddModal(true)}
                                                                    className="mt-2"
                                                                >
                                                                    Add your first attribute
                                                                </Button>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <DndContext
                                                            sensors={sensors}
                                                            collisionDetection={closestCenter}
                                                            onDragEnd={handleDragEnd}
                                                        >
                                                            <SortableContext
                                                                items={customAttrsOnly.map(attr => attr.id)}
                                                                strategy={verticalListSortingStrategy}
                                                            >
                                                                <div className="space-y-2">
                                                                    {customAttrsOnly.map((attr, idx) => {
                                                                        const isDirect = (attr as any).is_direct !== false;
                                                                        const inheritedFrom = (attr as any).inherited_from;
                                                                        
                                                                        return (
                                                                            <SortableAttributeItem
                                                                                key={attr.id}
                                                                                attribute={attr}
                                                                                isDirect={isDirect}
                                                                                inheritedFrom={inheritedFrom}
                                                                                onToggleRequired={handleToggleRequired}
                                                                                onToggleVisibility={handleToggleVisibility}
                                                                                onEdit={(attr) => {
                                                                                    setEditingAttribute(attr);
                                                                                    setShowEditModal(true);
                                                                                }}
                                                                                saving={saving}
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                            </SortableContext>
                                                        </DndContext>
                                                    );
                                                })()}
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
                                        <p className="text-xs text-muted-foreground">Default Fields</p>
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
                                {/* <Button 
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
                                </Button> */}
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
                                                    <Database className="h-4 w-4" />
                                                    Default Fields ({mandatoryFields.length}) - Drag to Reorder
                                                </h4>
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDefaultFieldDragEnd}
                                                >
                                                    <SortableContext
                                                        items={mandatoryFields.map(f => f.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="space-y-2">
                                                            {mandatoryFields.map((field) => {
                                                                // Find if this default field is configured for current context
                                                                const configuredAttr = currentAttrs.find(
                                                                    attr => attr.attribute_name === field.field_name
                                                                );
                                                                console.log(`[${activeTab}] Default field "${field.field_name}":`, { configured: !!configuredAttr, isRequired: configuredAttr?.is_required, isVisible: configuredAttr?.is_visible });
                                                                const isRequired = configuredAttr?.is_required ?? false;
                                                                const isVisible = configuredAttr?.is_visible ?? true;
                                                        
                                                                return (
                                                                    <SortableDefaultFieldItem
                                                                        key={field.id}
                                                                        field={field}
                                                                        configuredAttr={configuredAttr}
                                                                        isRequired={isRequired}
                                                                        isVisible={isVisible}
                                                                        onToggleRequired={handleDefaultFieldToggle}
                                                                        onToggleVisibility={handleDefaultFieldToggle}
                                                                        onEdit={(attr) => {
                                                                            setEditingAttribute(attr);
                                                                            setShowEditModal(true);
                                                                        }}
                                                                        saving={saving}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
                                                <p className="text-xs text-muted-foreground mt-2 italic">
                                                    💡 Drag to reorder, toggle to customize default fields for this {activeTab}. They're optional and can be shown/hidden.
                                                </p>
                                            </div>

                                            <Separator />

                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                                    Custom Attributes
                                                </h4>
                                                {(() => {
                                                    // Filter out default fields from custom attributes to prevent duplicates
                                                    const defaultFieldNames = mandatoryFields.map(f => f.field_name);
                                                    const customAttrsOnly = currentAttrs.filter(
                                                        attr => !defaultFieldNames.includes(attr.attribute_name)
                                                    );
                                                    
                                                    if (customAttrsOnly.length === 0) {
                                                        return (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                                                <p>No custom attributes configured</p>
                                                                <Button 
                                                                    variant="link" 
                                                                    onClick={() => setShowAddModal(true)}
                                                                    className="mt-2"
                                                                >
                                                                    Add your first attribute
                                                                </Button>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <div className="space-y-2">
                                                            {customAttrsOnly.map((attr, idx) => {
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
                                                                                        disabled={idx === customAttrsOnly.length - 1 || saving}
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
                                                    );
                                                })()}
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
                                Default System Fields
                            </CardTitle>
                            <CardDescription>
                                Standard fields available in all offerings. These are optional and can be customized per service/category with required/optional toggle and show/hide controls in Service, Category, and Subcategory tabs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-blue-900 mb-1">How to Customize Default Fields</h4>
                                        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                                            <li>Go to Service, Category, or Subcategory tabs to add these fields</li>
                                            <li>Use the <strong>Required/Optional toggle</strong> to control if the field is mandatory</li>
                                            <li>Use the <strong>Show/Hide toggle</strong> to control if the field appears in forms</li>
                                            <li>System fields are pre-configured but can be customized at any level</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
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
                                        {mandatoryFields.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No default fields defined. These are optional system-wide fields.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            mandatoryFields.map((field) => (
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
                                                        {field.is_system_field ? (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Lock className="h-3 w-3 mr-1" />
                                                                System
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs">Custom</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {field.applicable_to_all_services ? (
                                                            <Badge className="bg-green-100 text-green-800 text-xs">All Services</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">Specific</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
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
