import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
    ChevronDown,
    ChevronRight,
    Database,
    Edit,
    Eye,
    Filter,
    Minus,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    X
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Types
interface AttributeRegistry {
    id: string;
    name: string;
    label: string | null;
    data_type: string;
    input_type: string | null;
    placeholder: string | null;
    help_text: string | null;
    group_name: string | null;
    sort_order: number | null;
    is_required: boolean;
    is_active: boolean;
    applicable_types: string[] | null;
    validation_rules: any;
    options: any;
    default_value: string | null;
    created_at?: string;
    updated_at?: string;
}

interface NewAttribute {
    name: string;
    label: string;
    data_type: string;
    input_type: string;
    placeholder: string;
    help_text: string;
    group_name: string;
    is_required: boolean;
    is_active: boolean;
    applicable_types: string[];
    validation_rules: Record<string, any>;
    options: any[];
    default_value: string;
}

interface OptionItem {
    label: string;
    value: string;
}

interface ValidationRule {
    rule: string;
    value: string;
    message: string;
}

const AttributeRegistryManager: React.FC = () => {
    // State
    const [attributes, setAttributes] = useState<AttributeRegistry[]>([]);
    const [filteredAttributes, setFilteredAttributes] = useState<AttributeRegistry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDataType, setFilterDataType] = useState<string>("all");
    const [filterGroup, setFilterGroup] = useState<string>("all");
    const [filterActive, setFilterActive] = useState<boolean | "all">("all");

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    
    // Selected items
    const [selectedAttribute, setSelectedAttribute] = useState<AttributeRegistry | null>(null);
    const [deleteAttributeId, setDeleteAttributeId] = useState<string | null>(null);
    
    // Expandable rows
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // New attribute form
    const [newAttribute, setNewAttribute] = useState<NewAttribute>({
        name: "",
        label: "",
        data_type: "text",
        input_type: "text",
        placeholder: "",
        help_text: "",
        group_name: "general",
        is_required: false,
        is_active: true,
        applicable_types: [],
        validation_rules: {},
        options: [],
        default_value: "",
    });

    // Options management for select/multiselect
    const [optionsList, setOptionsList] = useState<OptionItem[]>([{ label: "", value: "" }]);
    const [editOptionsList, setEditOptionsList] = useState<OptionItem[]>([{ label: "", value: "" }]);

    // Validation rules management
    const [validationRulesList, setValidationRulesList] = useState<ValidationRule[]>([]);
    const [editValidationRulesList, setEditValidationRulesList] = useState<ValidationRule[]>([]);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        byDataType: {} as Record<string, number>,
        byGroup: {} as Record<string, number>,
    });

    // Load attributes on mount
    useEffect(() => {
        fetchAttributes();
    }, []);

    // Apply filters whenever they change
    useEffect(() => {
        applyFilters();
    }, [searchTerm, filterDataType, filterGroup, filterActive, attributes]);

    // Fetch all attributes from the database
    const fetchAttributes = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("attribute_registry")
                .select("*")
                .order("name");

            if (error) throw error;

            setAttributes(data || []);
            calculateStats(data || []);
        } catch (error: any) {
            console.error("Error fetching attributes:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load attribute registry",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate statistics
    const calculateStats = (data: AttributeRegistry[]) => {
        const newStats = {
            total: data.length,
            active: data.filter(a => a.is_active).length,
            inactive: data.filter(a => !a.is_active).length,
            byDataType: {} as Record<string, number>,
            byGroup: {} as Record<string, number>,
        };

        data.forEach(attr => {
            // Count by data type
            if (attr.data_type) {
                newStats.byDataType[attr.data_type] = (newStats.byDataType[attr.data_type] || 0) + 1;
            }
            // Count by group
            const group = attr.group_name || "ungrouped";
            newStats.byGroup[group] = (newStats.byGroup[group] || 0) + 1;
        });

        setStats(newStats);
    };

    // Apply filters to attributes
    const applyFilters = () => {
        let filtered = [...attributes];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(attr =>
                attr.name?.toLowerCase().includes(term) ||
                attr.label?.toLowerCase().includes(term) ||
                attr.group_name?.toLowerCase().includes(term)
            );
        }

        // Data type filter
        if (filterDataType !== "all") {
            filtered = filtered.filter(attr => attr.data_type === filterDataType);
        }

        // Group filter
        if (filterGroup !== "all") {
            filtered = filtered.filter(attr => 
                (filterGroup === "ungrouped" && !attr.group_name) ||
                attr.group_name === filterGroup
            );
        }

        // Active status filter
        if (filterActive !== "all") {
            filtered = filtered.filter(attr => attr.is_active === filterActive);
        }

        setFilteredAttributes(filtered);
    };

    // Check if name is unique
    const checkNameUniqueness = async (name: string, excludeId?: string): Promise<boolean> => {
        try {
            let query = supabase
                .from("attribute_registry")
                .select("id")
                .eq("name", name);

            if (excludeId) {
                query = query.neq("id", excludeId);
            }

            const { data, error } = await query;

            if (error) throw error;

            return (data || []).length === 0;
        } catch (error) {
            console.error("Error checking name uniqueness:", error);
            return true; // Allow if check fails
        }
    };

    // Add new attribute
    const handleAddAttribute = useCallback(async () => {
        // Validation
        if (!newAttribute.name || !newAttribute.label) {
            toast({
                title: "Validation Error",
                description: "Name and Label are required fields",
                variant: "destructive",
            });
            return;
        }

        // Validate name format (snake_case)
        const nameRegex = /^[a-z][a-z0-9_]*$/;
        if (!nameRegex.test(newAttribute.name)) {
            toast({
                title: "Validation Error",
                description: "Name must be in snake_case format (lowercase, underscores only)",
                variant: "destructive",
            });
            return;
        }

        // Check uniqueness
        const isUnique = await checkNameUniqueness(newAttribute.name);
        if (!isUnique) {
            toast({
                title: "Duplicate Name",
                description: "An attribute with this name already exists. Please use a unique name.",
                variant: "destructive",
            });
            return;
        }

        // Validate options for select/multiselect types
        const needsOptions = ['select', 'multiselect'].includes(newAttribute.data_type);
        if (needsOptions) {
            const validOptions = optionsList.filter(opt => opt.label && opt.value);
            if (validOptions.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "Please add at least one option for select/multiselect fields",
                    variant: "destructive",
                });
                return;
            }
        }

        setSaving(true);
        try {
            // Prepare options
            const needsOptions = ['select', 'multiselect'].includes(newAttribute.data_type);
            const validOptions = needsOptions 
                ? optionsList.filter(opt => opt.label && opt.value)
                : [];

            // Prepare validation rules
            const validRules = validationRulesList.filter(rule => rule.rule && rule.value);
            const rulesObject = validRules.reduce((acc, rule) => {
                acc[rule.rule] = {
                    value: rule.value,
                    message: rule.message || `Validation failed for ${rule.rule}`
                };
                return acc;
            }, {} as Record<string, any>);

            const { error } = await supabase
                .from("attribute_registry")
                .insert([{
                    name: newAttribute.name,
                    label: newAttribute.label,
                    data_type: newAttribute.data_type,
                    input_type: newAttribute.input_type,
                    placeholder: newAttribute.placeholder || null,
                    help_text: newAttribute.help_text || null,
                    group_name: newAttribute.group_name || null,
                    is_required: newAttribute.is_required,
                    is_active: newAttribute.is_active,
                    applicable_types: newAttribute.applicable_types.length > 0 ? newAttribute.applicable_types : null,
                    validation_rules: validRules.length > 0 ? rulesObject : null,
                    options: validOptions.length > 0 ? validOptions : null,
                    default_value: newAttribute.default_value || null,
                }]);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Attribute "${newAttribute.label}" created successfully`,
            });

            // Reset form
            setNewAttribute({
                name: "",
                label: "",
                data_type: "text",
                input_type: "text",
                placeholder: "",
                help_text: "",
                group_name: "general",
                is_required: false,
                is_active: true,
                applicable_types: [],
                validation_rules: {},
                options: [],
                default_value: "",
            });
            setOptionsList([{ label: "", value: "" }]);
            setValidationRulesList([]);

            setShowAddModal(false);
            fetchAttributes();
        } catch (error: any) {
            console.error("Error adding attribute:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create attribute",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [newAttribute, optionsList, validationRulesList]);

    // Update existing attribute
    const handleUpdateAttribute = useCallback(async () => {
        if (!selectedAttribute) return;

        // Validate options for select/multiselect types
        const needsOptions = ['select', 'multiselect'].includes(selectedAttribute.data_type);
        if (needsOptions) {
            const validOptions = editOptionsList.filter(opt => opt.label && opt.value);
            if (validOptions.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "Please add at least one option for select/multiselect fields",
                    variant: "destructive",
                });
                return;
            }
        }

        setSaving(true);
        try {
            // Prepare options
            const needsOptions = ['select', 'multiselect'].includes(selectedAttribute.data_type);
            const validOptions = needsOptions 
                ? editOptionsList.filter(opt => opt.label && opt.value)
                : [];

            // Prepare validation rules
            const validRules = editValidationRulesList.filter(rule => rule.rule && rule.value);
            const rulesObject = validRules.reduce((acc, rule) => {
                acc[rule.rule] = {
                    value: rule.value,
                    message: rule.message || `Validation failed for ${rule.rule}`
                };
                return acc;
            }, {} as Record<string, any>);

            const { error } = await supabase
                .from("attribute_registry")
                .update({
                    label: selectedAttribute.label,
                    data_type: selectedAttribute.data_type,
                    input_type: selectedAttribute.input_type,
                    placeholder: selectedAttribute.placeholder,
                    help_text: selectedAttribute.help_text,
                    group_name: selectedAttribute.group_name,
                    is_required: selectedAttribute.is_required,
                    is_active: selectedAttribute.is_active,
                    applicable_types: selectedAttribute.applicable_types,
                    validation_rules: validRules.length > 0 ? rulesObject : null,
                    options: validOptions.length > 0 ? validOptions : null,
                    default_value: selectedAttribute.default_value,
                })
                .eq("id", selectedAttribute.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Attribute updated successfully",
            });

            setShowEditModal(false);
            setSelectedAttribute(null);
            setEditOptionsList([{ label: "", value: "" }]);
            setEditValidationRulesList([]);
            fetchAttributes();
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
    }, [selectedAttribute, editOptionsList, editValidationRulesList]);

    // Delete attribute
    const handleDeleteAttribute = useCallback(async () => {
        if (!deleteAttributeId) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("attribute_registry")
                .delete()
                .eq("id", deleteAttributeId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Attribute deleted successfully",
            });

            setShowDeleteModal(false);
            setDeleteAttributeId(null);
            fetchAttributes();
        } catch (error: any) {
            console.error("Error deleting attribute:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete attribute. It may be in use.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [deleteAttributeId]);

    // Toggle row expansion
    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Get unique data types
    const dataTypes = Array.from(new Set(attributes.map(a => a.data_type).filter(Boolean)));
    
    // Get unique groups
    const groups = Array.from(new Set(attributes.map(a => a.group_name || "ungrouped").filter(Boolean)));

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Database className="h-8 w-8 text-blue-600" />
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Attribute Registry</h2>
                            <p className="text-muted-foreground mt-1">
                                Manage all available attributes in the system
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={fetchAttributes} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Attribute
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total Attributes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">Active Attributes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
                        <p className="text-xs text-muted-foreground">Inactive Attributes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byGroup).length}</div>
                        <p className="text-xs text-muted-foreground">Attribute Groups</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters & Search
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
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

                        {/* Data Type Filter */}
                        <Select value={filterDataType} onValueChange={setFilterDataType}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Data Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Data Types</SelectItem>
                                {dataTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type} ({stats.byDataType[type] || 0})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Group Filter */}
                        <Select value={filterGroup} onValueChange={setFilterGroup}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Groups" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Groups</SelectItem>
                                {groups.map(group => (
                                    <SelectItem key={group} value={group}>
                                        {group} ({stats.byGroup[group] || 0})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Active Status Filter */}
                        <Select 
                            value={filterActive === "all" ? "all" : filterActive ? "active" : "inactive"} 
                            onValueChange={(val) => setFilterActive(val === "all" ? "all" : val === "active")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active Only</SelectItem>
                                <SelectItem value="inactive">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Clear Filters */}
                    {(searchTerm || filterDataType !== "all" || filterGroup !== "all" || filterActive !== "all") && (
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredAttributes.length} of {attributes.length} attributes
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterDataType("all");
                                    setFilterGroup("all");
                                    setFilterActive("all");
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attributes Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Attribute List ({filteredAttributes.length})</CardTitle>
                    <CardDescription>
                        Click on a row to view details, or use actions to edit/delete
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            <span className="text-muted-foreground">Loading attributes...</span>
                        </div>
                    ) : filteredAttributes.length === 0 ? (
                        <div className="text-center py-12">
                            <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-muted-foreground mb-2">No attributes found</p>
                            <Button onClick={() => setShowAddModal(true)} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Attribute
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full overflow-auto max-h-[600px]">
                            <Table className="w-full relative">
                                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="w-[50px] bg-gray-50"></TableHead>
                                        <TableHead className="min-w-[180px] bg-gray-50">Name</TableHead>
                                        <TableHead className="min-w-[180px] bg-gray-50">Label</TableHead>
                                        <TableHead className="min-w-[130px] bg-gray-50">Data Type</TableHead>
                                        <TableHead className="min-w-[130px] bg-gray-50">Input Type</TableHead>
                                        <TableHead className="min-w-[130px] bg-gray-50">Group</TableHead>
                                        <TableHead className="min-w-[100px] bg-gray-50">Status</TableHead>
                                        <TableHead className="min-w-[160px] bg-gray-50 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAttributes.map((attr) => (
                                        <React.Fragment key={attr.id}>
                                            <TableRow className="hover:bg-gray-50 cursor-pointer">
                                                <TableCell onClick={() => toggleRow(attr.id)}>
                                                    {expandedRows.has(attr.id) ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{attr.name}</code>
                                                </TableCell>
                                                <TableCell>{attr.label || <span className="text-muted-foreground">-</span>}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{attr.data_type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{attr.input_type || "text"}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge>{attr.group_name || "ungrouped"}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {attr.is_active ? (
                                                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                    ) : (
                                                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedAttribute(attr);
                                                                setShowDetailsModal(true);
                                                            }}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                
                                                                console.log('📝 Editing attribute:', attr.name);
                                                                console.log('Options data:', attr.options);
                                                                console.log('Validation rules data:', attr.validation_rules);
                                                                
                                                                setSelectedAttribute(attr);
                                                                
                                                                // Populate options list
                                                                if (attr.options && Array.isArray(attr.options) && attr.options.length > 0) {
                                                                    console.log('✓ Setting options:', attr.options);
                                                                    setEditOptionsList(attr.options);
                                                                } else {
                                                                    console.log('⚠️ No options found, using empty template');
                                                                    setEditOptionsList([{ label: "", value: "" }]);
                                                                }

                                                                // Populate validation rules
                                                                if (attr.validation_rules && typeof attr.validation_rules === 'object') {
                                                                    const rules = Object.entries(attr.validation_rules).map(([key, val]: [string, any]) => ({
                                                                        rule: key,
                                                                        value: typeof val === 'object' ? (val.value || '') : String(val),
                                                                        message: typeof val === 'object' ? (val.message || '') : ''
                                                                    }));
                                                                    console.log('✓ Setting validation rules:', rules);
                                                                    setEditValidationRulesList(rules);
                                                                } else {
                                                                    console.log('⚠️ No validation rules found');
                                                                    setEditValidationRulesList([]);
                                                                }
                                                                
                                                                setShowEditModal(true);
                                                            }}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteAttributeId(attr.id);
                                                                setShowDeleteModal(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {/* Expanded Details */}
                                            {expandedRows.has(attr.id) && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="bg-gray-50">
                                                        <div className="p-4 grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Placeholder</p>
                                                                <p className="text-sm">{attr.placeholder || <span className="text-muted-foreground">-</span>}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Help Text</p>
                                                                <p className="text-sm">{attr.help_text || <span className="text-muted-foreground">-</span>}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Default Value</p>
                                                                <p className="text-sm">{attr.default_value || <span className="text-muted-foreground">-</span>}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Required</p>
                                                                <p className="text-sm">{attr.is_required ? "Yes" : "No"}</p>
                                                            </div>
                                                            {attr.applicable_types && attr.applicable_types.length > 0 && (
                                                                <div className="col-span-2">
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Applicable Types</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {attr.applicable_types.map((type, idx) => (
                                                                            <Badge key={idx} variant="outline">{type}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {attr.options && (
                                                                <div className="col-span-2">
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Options</p>
                                                                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-20">
                                                                        {JSON.stringify(attr.options, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {attr.validation_rules && (
                                                                <div className="col-span-2">
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Validation Rules</p>
                                                                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-20">
                                                                        {JSON.stringify(attr.validation_rules, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Attribute Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Attribute</DialogTitle>
                        <DialogDescription>
                            Create a new attribute in the registry that can be used across services
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="attr-name">Name (System Field) *</Label>
                                <Input
                                    id="attr-name"
                                    placeholder="e.g., product_weight"
                                    value={newAttribute.name}
                                    onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Use snake_case, no spaces</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="attr-label">Label (Display Name) *</Label>
                                <Input
                                    id="attr-label"
                                    placeholder="e.g., Product Weight"
                                    value={newAttribute.label}
                                    onChange={(e) => setNewAttribute({ ...newAttribute, label: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">User-friendly name</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="attr-data-type">Data Type</Label>
                                <Select 
                                    value={newAttribute.data_type} 
                                    onValueChange={(val) => setNewAttribute({ ...newAttribute, data_type: val })}
                                >
                                    <SelectTrigger id="attr-data-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="boolean">Boolean</SelectItem>
                                        <SelectItem value="select">Select (Dropdown)</SelectItem>
                                        <SelectItem value="multiselect">Multi-Select</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="datetime">Date & Time</SelectItem>
                                        <SelectItem value="file">File</SelectItem>
                                        <SelectItem value="json">JSON</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="attr-input-type">Input Type</Label>
                                <Select 
                                    value={newAttribute.input_type} 
                                    onValueChange={(val) => setNewAttribute({ ...newAttribute, input_type: val })}
                                >
                                    <SelectTrigger id="attr-input-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text Input</SelectItem>
                                        <SelectItem value="textarea">Text Area</SelectItem>
                                        <SelectItem value="number">Number Input</SelectItem>
                                        <SelectItem value="email">Email Input</SelectItem>
                                        <SelectItem value="tel">Phone Input</SelectItem>
                                        <SelectItem value="url">URL Input</SelectItem>
                                        <SelectItem value="select">Dropdown</SelectItem>
                                        <SelectItem value="multiselect">Multi-Select</SelectItem>
                                        <SelectItem value="checkbox">Checkbox</SelectItem>
                                        <SelectItem value="switch">Toggle Switch</SelectItem>
                                        <SelectItem value="date">Date Picker</SelectItem>
                                        <SelectItem value="datetime">Date Time Picker</SelectItem>
                                        <SelectItem value="file">File Upload</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="attr-group">Group</Label>
                            <Input
                                id="attr-group"
                                placeholder="e.g., specifications, pricing, features"
                                value={newAttribute.group_name}
                                onChange={(e) => setNewAttribute({ ...newAttribute, group_name: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Organize attributes into logical groups</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="attr-placeholder">Placeholder Text</Label>
                                <Input
                                    id="attr-placeholder"
                                    placeholder="e.g., Enter weight in kg"
                                    value={newAttribute.placeholder}
                                    onChange={(e) => setNewAttribute({ ...newAttribute, placeholder: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="attr-default">Default Value</Label>
                                <Input
                                    id="attr-default"
                                    placeholder="Optional default value"
                                    value={newAttribute.default_value}
                                    onChange={(e) => setNewAttribute({ ...newAttribute, default_value: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="attr-help">Help Text</Label>
                            <Textarea
                                id="attr-help"
                                placeholder="Provide helpful information about this field..."
                                value={newAttribute.help_text}
                                onChange={(e) => setNewAttribute({ ...newAttribute, help_text: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="attr-required"
                                    checked={newAttribute.is_required}
                                    onCheckedChange={(checked) => setNewAttribute({ ...newAttribute, is_required: checked })}
                                />
                                <Label htmlFor="attr-required">Required by default</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="attr-active"
                                    checked={newAttribute.is_active}
                                    onCheckedChange={(checked) => setNewAttribute({ ...newAttribute, is_active: checked })}
                                />
                                <Label htmlFor="attr-active">Active</Label>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Applicable Types (Optional)</Label>
                            <p className="text-xs text-muted-foreground mb-2">Select which offering types can use this attribute</p>
                            <div className="grid grid-cols-3 gap-2">
                                {['product', 'service', 'rental', 'booking', 'digital', 'subscription'].map(type => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={newAttribute.applicable_types.includes(type)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setNewAttribute({
                                                        ...newAttribute,
                                                        applicable_types: [...newAttribute.applicable_types, type]
                                                    });
                                                } else {
                                                    setNewAttribute({
                                                        ...newAttribute,
                                                        applicable_types: newAttribute.applicable_types.filter(t => t !== type)
                                                    });
                                                }
                                            }}
                                        />
                                        <Label className="text-sm capitalize">{type}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Options Editor for Select/Multiselect */}
                        {['select', 'multiselect'].includes(newAttribute.data_type) && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Options (Required)</Label>
                                            <p className="text-xs text-muted-foreground">Define the available options for this field</p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setOptionsList([...optionsList, { label: "", value: "" }])}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Option
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {optionsList.map((option, idx) => (
                                            <div key={idx} className="flex items-center space-x-2">
                                                <Input
                                                    placeholder="Label (e.g., Small)"
                                                    value={option.label}
                                                    onChange={(e) => {
                                                        const newList = [...optionsList];
                                                        newList[idx].label = e.target.value;
                                                        setOptionsList(newList);
                                                    }}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    placeholder="Value (e.g., sm)"
                                                    value={option.value}
                                                    onChange={(e) => {
                                                        const newList = [...optionsList];
                                                        newList[idx].value = e.target.value;
                                                        setOptionsList(newList);
                                                    }}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const newList = optionsList.filter((_, i) => i !== idx);
                                                        setOptionsList(newList.length > 0 ? newList : [{ label: "", value: "" }]);
                                                    }}
                                                >
                                                    <Minus className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">
                                        💡 Tip: Label is what users see, Value is what gets stored in the database
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Validation Rules Editor */}
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Validation Rules (Optional)</Label>
                                    <p className="text-xs text-muted-foreground">Add validation constraints for this field</p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setValidationRulesList([...validationRulesList, { rule: "", value: "", message: "" }])}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Rule
                                </Button>
                            </div>
                            {validationRulesList.length > 0 && (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {validationRulesList.map((rule, idx) => (
                                        <div key={idx} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <Select
                                                    value={rule.rule}
                                                    onValueChange={(val) => {
                                                        const newList = [...validationRulesList];
                                                        newList[idx].rule = val;
                                                        setValidationRulesList(newList);
                                                    }}
                                                >
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue placeholder="Select rule type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="min">Minimum Value/Length</SelectItem>
                                                        <SelectItem value="max">Maximum Value/Length</SelectItem>
                                                        <SelectItem value="minLength">Min Length</SelectItem>
                                                        <SelectItem value="maxLength">Max Length</SelectItem>
                                                        <SelectItem value="pattern">Regex Pattern</SelectItem>
                                                        <SelectItem value="email">Email Format</SelectItem>
                                                        <SelectItem value="url">URL Format</SelectItem>
                                                        <SelectItem value="required">Required</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Value"
                                                    value={rule.value}
                                                    onChange={(e) => {
                                                        const newList = [...validationRulesList];
                                                        newList[idx].value = e.target.value;
                                                        setValidationRulesList(newList);
                                                    }}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const newList = validationRulesList.filter((_, i) => i !== idx);
                                                        setValidationRulesList(newList);
                                                    }}
                                                >
                                                    <Minus className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                            <Input
                                                placeholder="Error message (optional)"
                                                value={rule.message}
                                                onChange={(e) => {
                                                    const newList = [...validationRulesList];
                                                    newList[idx].message = e.target.value;
                                                    setValidationRulesList(newList);
                                                }}
                                                className="text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground italic">
                                💡 Tip: Validation rules help ensure data quality
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddAttribute} disabled={saving || !newAttribute.name || !newAttribute.label}>
                            {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Create Attribute
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Attribute Modal */}
            <Dialog open={showEditModal && selectedAttribute !== null} onOpenChange={(open) => {
                if (!open) {
                    setShowEditModal(false);
                    setSelectedAttribute(null);
                    setEditOptionsList([{ label: "", value: "" }]);
                    setEditValidationRulesList([]);
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Attribute</DialogTitle>
                        <DialogDescription>
                            Update attribute configuration - All saved properties are displayed below
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAttribute && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm font-medium">System Name: <code>{selectedAttribute.name}</code></p>
                                <p className="text-xs text-muted-foreground mt-1">System name cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Label (Display Name) *</Label>
                                <Input
                                    value={selectedAttribute.label || ""}
                                    onChange={(e) => setSelectedAttribute({ ...selectedAttribute, label: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data Type *</Label>
                                    <Select 
                                        value={selectedAttribute.data_type} 
                                        onValueChange={(val) => setSelectedAttribute({ ...selectedAttribute, data_type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="select">Select</SelectItem>
                                            <SelectItem value="multiselect">Multi-Select</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="datetime">Date & Time</SelectItem>
                                            <SelectItem value="file">File</SelectItem>
                                            <SelectItem value="json">JSON</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Input Type</Label>
                                    <Select 
                                        value={selectedAttribute.input_type || "text"} 
                                        onValueChange={(val) => setSelectedAttribute({ ...selectedAttribute, input_type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="textarea">Textarea</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="tel">Phone</SelectItem>
                                            <SelectItem value="url">URL</SelectItem>
                                            <SelectItem value="select">Select</SelectItem>
                                            <SelectItem value="multiselect">Multi-Select</SelectItem>
                                            <SelectItem value="checkbox">Checkbox</SelectItem>
                                            <SelectItem value="switch">Switch</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="datetime">Date Time</SelectItem>
                                            <SelectItem value="file">File Upload</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Group</Label>
                                <Input
                                    value={selectedAttribute.group_name || ""}
                                    onChange={(e) => setSelectedAttribute({ ...selectedAttribute, group_name: e.target.value })}
                                    placeholder="e.g., specifications, pricing, features"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Placeholder</Label>
                                    <Input
                                        value={selectedAttribute.placeholder || ""}
                                        onChange={(e) => setSelectedAttribute({ ...selectedAttribute, placeholder: e.target.value })}
                                        placeholder="Enter placeholder text"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Value</Label>
                                    <Input
                                        value={selectedAttribute.default_value || ""}
                                        onChange={(e) => setSelectedAttribute({ ...selectedAttribute, default_value: e.target.value })}
                                        placeholder="Optional default value"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Help Text</Label>
                                <Textarea
                                    value={selectedAttribute.help_text || ""}
                                    onChange={(e) => setSelectedAttribute({ ...selectedAttribute, help_text: e.target.value })}
                                    rows={2}
                                    placeholder="Helpful information about this field..."
                                />
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="edit-required"
                                        checked={selectedAttribute.is_required}
                                        onCheckedChange={(checked) => setSelectedAttribute({ ...selectedAttribute, is_required: checked })}
                                    />
                                    <Label htmlFor="edit-required">Required by default</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="edit-active"
                                        checked={selectedAttribute.is_active}
                                        onCheckedChange={(checked) => setSelectedAttribute({ ...selectedAttribute, is_active: checked })}
                                    />
                                    <Label htmlFor="edit-active">Active</Label>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label>Applicable Types (Optional)</Label>
                                <p className="text-xs text-muted-foreground mb-2">Select which offering types can use this attribute</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {['product', 'service', 'rental', 'booking', 'digital', 'subscription'].map(type => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={selectedAttribute.applicable_types?.includes(type) || false}
                                                onCheckedChange={(checked) => {
                                                    const currentTypes = selectedAttribute.applicable_types || [];
                                                    if (checked) {
                                                        setSelectedAttribute({
                                                            ...selectedAttribute,
                                                            applicable_types: [...currentTypes, type]
                                                        });
                                                    } else {
                                                        setSelectedAttribute({
                                                            ...selectedAttribute,
                                                            applicable_types: currentTypes.filter(t => t !== type)
                                                        });
                                                    }
                                                }}
                                            />
                                            <Label className="text-sm capitalize">{type}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Options Editor for Select/Multiselect */}
                            {['select', 'multiselect'].includes(selectedAttribute.data_type) && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Options (Required)</Label>
                                                <p className="text-xs text-muted-foreground">Define the available options for this field</p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditOptionsList([...editOptionsList, { label: "", value: "" }])}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Option
                                            </Button>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {editOptionsList.map((option, idx) => (
                                                <div key={idx} className="flex items-center space-x-2">
                                                    <Input
                                                        placeholder="Label (e.g., Small)"
                                                        value={option.label}
                                                        onChange={(e) => {
                                                            const newList = [...editOptionsList];
                                                            newList[idx].label = e.target.value;
                                                            setEditOptionsList(newList);
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Input
                                                        placeholder="Value (e.g., sm)"
                                                        value={option.value}
                                                        onChange={(e) => {
                                                            const newList = [...editOptionsList];
                                                            newList[idx].value = e.target.value;
                                                            setEditOptionsList(newList);
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            const newList = editOptionsList.filter((_, i) => i !== idx);
                                                            setEditOptionsList(newList.length > 0 ? newList : [{ label: "", value: "" }]);
                                                        }}
                                                    >
                                                        <Minus className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">
                                            💡 Tip: Label is what users see, Value is what gets stored in the database
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Validation Rules Editor */}
                            <Separator />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Validation Rules (Optional)</Label>
                                        <p className="text-xs text-muted-foreground">Add validation constraints for this field</p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditValidationRulesList([...editValidationRulesList, { rule: "", value: "", message: "" }])}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Rule
                                    </Button>
                                </div>
                                {editValidationRulesList.length > 0 && (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {editValidationRulesList.map((rule, idx) => (
                                            <div key={idx} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-2">
                                                    <Select
                                                        value={rule.rule}
                                                        onValueChange={(val) => {
                                                            const newList = [...editValidationRulesList];
                                                            newList[idx].rule = val;
                                                            setEditValidationRulesList(newList);
                                                        }}
                                                    >
                                                        <SelectTrigger className="flex-1">
                                                            <SelectValue placeholder="Select rule type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="min">Minimum Value/Length</SelectItem>
                                                            <SelectItem value="max">Maximum Value/Length</SelectItem>
                                                            <SelectItem value="minLength">Min Length</SelectItem>
                                                            <SelectItem value="maxLength">Max Length</SelectItem>
                                                            <SelectItem value="pattern">Regex Pattern</SelectItem>
                                                            <SelectItem value="email">Email Format</SelectItem>
                                                            <SelectItem value="url">URL Format</SelectItem>
                                                            <SelectItem value="required">Required</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder="Value"
                                                        value={rule.value}
                                                        onChange={(e) => {
                                                            const newList = [...editValidationRulesList];
                                                            newList[idx].value = e.target.value;
                                                            setEditValidationRulesList(newList);
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            const newList = editValidationRulesList.filter((_, i) => i !== idx);
                                                            setEditValidationRulesList(newList);
                                                        }}
                                                    >
                                                        <Minus className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                                <Input
                                                    placeholder="Error message (optional)"
                                                    value={rule.message}
                                                    onChange={(e) => {
                                                        const newList = [...editValidationRulesList];
                                                        newList[idx].message = e.target.value;
                                                        setEditValidationRulesList(newList);
                                                    }}
                                                    className="text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground italic">
                                    💡 Tip: Validation rules help ensure data quality
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowEditModal(false);
                            setSelectedAttribute(null);
                            setEditOptionsList([{ label: "", value: "" }]);
                            setEditValidationRulesList([]);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateAttribute} disabled={saving}>
                            {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Attribute</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this attribute? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-800">
                            ⚠️ Warning: If this attribute is currently in use by any service configurations,
                            the deletion will fail. Please remove it from all service configurations first.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowDeleteModal(false);
                            setDeleteAttributeId(null);
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAttribute} disabled={saving}>
                            {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Attribute
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={showDetailsModal && selectedAttribute !== null} onOpenChange={(open) => {
                setShowDetailsModal(open);
                if (!open) setSelectedAttribute(null);
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Attribute Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this attribute
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAttribute && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">System Name</p>
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded block">{selectedAttribute.name}</code>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Display Label</p>
                                    <p className="text-sm">{selectedAttribute.label || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Data Type</p>
                                    <Badge variant="outline">{selectedAttribute.data_type}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Input Type</p>
                                    <Badge variant="secondary">{selectedAttribute.input_type || "text"}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Group</p>
                                    <Badge>{selectedAttribute.group_name || "ungrouped"}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Status</p>
                                    {selectedAttribute.is_active ? (
                                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                                    ) : (
                                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Placeholder</p>
                                    <p className="text-sm">{selectedAttribute.placeholder || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Help Text</p>
                                    <p className="text-sm">{selectedAttribute.help_text || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Default Value</p>
                                    <p className="text-sm">{selectedAttribute.default_value || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Required</p>
                                    <p className="text-sm">{selectedAttribute.is_required ? "Yes" : "No"}</p>
                                </div>
                            </div>

                            {selectedAttribute.applicable_types && selectedAttribute.applicable_types.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">Applicable Types</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAttribute.applicable_types.map((type, idx) => (
                                                <Badge key={idx} variant="outline" className="capitalize">{type}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedAttribute.options && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">Options (JSON)</p>
                                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                                            {JSON.stringify(selectedAttribute.options, null, 2)}
                                        </pre>
                                    </div>
                                </>
                            )}

                            {selectedAttribute.validation_rules && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">Validation Rules (JSON)</p>
                                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                                            {JSON.stringify(selectedAttribute.validation_rules, null, 2)}
                                        </pre>
                                    </div>
                                </>
                            )}

                            {selectedAttribute.created_at && (
                                <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground mb-1">Created At</p>
                                            <p className="text-sm">{new Date(selectedAttribute.created_at).toLocaleString()}</p>
                                        </div>
                                        {selectedAttribute.updated_at && (
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Updated At</p>
                                                <p className="text-sm">{new Date(selectedAttribute.updated_at).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => {
                            setShowDetailsModal(false);
                            setSelectedAttribute(null);
                        }}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AttributeRegistryManager;

