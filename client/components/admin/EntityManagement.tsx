import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Check,
    Edit,
    FolderTree,
    ImageIcon,
    Layers,
    Loader2,
    Plus,
    Power,
    Search,
    Tags,
    Trash2,
    TrendingUp,
    Upload,
    X
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// Types
interface ServiceType {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    features: any;
    image_url: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface Category {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    service_type: string;
    parent_id: string | null;
    level: number;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    service_types?: { title: string };
    parent_category?: { name: string };
}

interface FormData {
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    image_url?: string;
    service_type?: string;
    parent_id?: string | null;
    is_active?: boolean;
    sort_order?: number;
}

export const EntityManagement: React.FC = () => {
    // State
    const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'subcategories'>('services');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Data states
    const [services, setServices] = useState<ServiceType[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Category[]>([]);
    
    // Modal states
    const [showDialog, setShowDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [selectedEntity, setSelectedEntity] = useState<FormData | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [entityToDelete, setEntityToDelete] = useState<string | null>(null);
    
    // Image upload states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load data on mount
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadServices(),
                loadCategories(),
                loadSubcategories()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const loadServices = async () => {
        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .order('sort_order');
        
        if (error) throw error;
        setServices(data || []);
    };

    const loadCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .is('parent_id', null)
            .order('sort_order');
        
        if (error) {
            console.error('Error loading categories:', error);
            throw error;
        }
        console.log('Loaded categories:', data);
        setCategories(data || []);
    };

    const loadSubcategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .not('parent_id', 'is', null)
            .order('sort_order');
        
        if (error) {
            console.error('Error loading subcategories:', error);
            throw error;
        }
        
        console.log('Loaded subcategories:', data);
        setSubcategories(data || []);
    };

    // Image upload handler
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "Error", description: "Image size must be less than 5MB", variant: "destructive" });
            return;
        }

        setUploadingImage(true);
        try {
            // Create a unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `entity-images/${fileName}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath);

            setImagePreview(publicUrl);
            if (selectedEntity) {
                setSelectedEntity({ ...selectedEntity, image_url: publicUrl });
            }

            toast({ title: "Success", description: "✓ Image uploaded successfully" });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast({ title: "Error", description: error.message || "Failed to upload image", variant: "destructive" });
        } finally {
            setUploadingImage(false);
        }
    };

    const clearImage = () => {
        setImagePreview(null);
        if (selectedEntity) {
            setSelectedEntity({ ...selectedEntity, image_url: '' });
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Create/Edit handlers
    const handleCreate = (type: 'service' | 'category' | 'subcategory') => {
        setDialogMode('create');
        setImagePreview(null);
        setSelectedEntity({
            title: '',
            name: '',
            description: '',
            icon: '📦',
            color: 'from-blue-500 to-blue-600',
            image_url: '',
            service_type: services[0]?.id || '',
            parent_id: type === 'subcategory' ? (categories[0]?.id || null) : null,
            is_active: true,
            sort_order: type === 'service' ? services.length : (type === 'category' ? categories.length : subcategories.length)
        });
        setShowDialog(true);
    };

    const handleEdit = (entity: ServiceType | Category) => {
        setDialogMode('edit');
        const imgUrl = entity.image_url || '';
        setImagePreview(imgUrl);
        
        if ('title' in entity) {
            // Service
            setSelectedEntity({
                id: entity.id,
                title: entity.title,
                description: entity.description || '',
                icon: entity.icon || '📦',
                color: entity.color || 'from-gray-500 to-gray-600',
                image_url: imgUrl,
                is_active: entity.is_active,
                sort_order: entity.sort_order
            });
        } else {
            // Category/Subcategory
            setSelectedEntity({
                id: entity.id,
                name: entity.name,
                description: entity.description || '',
                image_url: imgUrl,
                service_type: entity.service_type,
                parent_id: entity.parent_id,
                is_active: entity.is_active,
                sort_order: entity.sort_order
            });
        }
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!selectedEntity) return;

        // Validation
        if (activeTab === 'services' && !selectedEntity.title?.trim()) {
            toast({ title: "Validation Error", description: "Service title is required", variant: "destructive" });
            return;
        }
        if (activeTab !== 'services' && !selectedEntity.name?.trim()) {
            toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
            return;
        }
        if (activeTab !== 'services' && !selectedEntity.service_type) {
            toast({ title: "Validation Error", description: "Service type is required", variant: "destructive" });
            return;
        }
        if (activeTab === 'subcategories' && !selectedEntity.parent_id) {
            toast({ title: "Validation Error", description: "Parent category is required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            if (activeTab === 'services') {
                // Save service
                const serviceData = {
                    title: selectedEntity.title,
                    description: selectedEntity.description,
                    icon: selectedEntity.icon,
                    color: selectedEntity.color,
                    image_url: selectedEntity.image_url,
                    is_active: selectedEntity.is_active,
                    sort_order: selectedEntity.sort_order,
                    updated_at: new Date().toISOString()
                };

                if (dialogMode === 'edit' && selectedEntity.id) {
                    const { error } = await supabase
                        .from('service_types')
                        .update(serviceData)
                        .eq('id', selectedEntity.id);
                    
                    if (error) throw error;
                    toast({ title: "Success", description: "✓ Service updated successfully" });
                } else {
                    const { error } = await supabase
                        .from('service_types')
                        .insert({
                            ...serviceData,
                            id: selectedEntity.title?.toLowerCase().replace(/\s+/g, '-') || '',
                            created_at: new Date().toISOString()
                        });
                    
                    if (error) throw error;
                    toast({ title: "Success", description: "✓ Service created successfully" });
                }

                await loadServices();
            } else {
                // Save category/subcategory
                const categoryData = {
                    name: selectedEntity.name,
                    description: selectedEntity.description,
                    image_url: selectedEntity.image_url,
                    service_type: selectedEntity.service_type,
                    parent_id: selectedEntity.parent_id,
                    level: selectedEntity.parent_id ? 1 : 0,
                    is_active: selectedEntity.is_active,
                    sort_order: selectedEntity.sort_order,
                    updated_at: new Date().toISOString()
                };

                if (dialogMode === 'edit' && selectedEntity.id) {
                    const { error } = await supabase
                        .from('categories')
                        .update(categoryData)
                        .eq('id', selectedEntity.id);
                    
                    if (error) throw error;
                    toast({ title: "Success", description: `✓ ${activeTab === 'categories' ? 'Category' : 'Subcategory'} updated successfully` });
                } else {
                    const { error } = await supabase
                        .from('categories')
                        .insert({
                            ...categoryData,
                            created_at: new Date().toISOString()
                        });
                    
                    if (error) throw error;
                    toast({ title: "Success", description: `✓ ${activeTab === 'categories' ? 'Category' : 'Subcategory'} created successfully` });
                }

                await loadCategories();
                await loadSubcategories();
            }

            setShowDialog(false);
            setSelectedEntity(null);
        } catch (error: any) {
            console.error('Error saving:', error);
            toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const table = activeTab === 'services' ? 'service_types' : 'categories';
            const { error } = await supabase
                .from(table)
                .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
                .eq('id', id);
            
            if (error) throw error;
            
            toast({ title: "Success", description: `${currentStatus ? '✓ Deactivated' : '✓ Activated'} successfully` });
            await loadAllData();
        } catch (error: any) {
            console.error('Error toggling status:', error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!entityToDelete) return;

        try {
            const table = activeTab === 'services' ? 'service_types' : 'categories';
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', entityToDelete);
            
            if (error) throw error;
            
            toast({ title: "Success", description: "✓ Deleted successfully" });
            setShowDeleteDialog(false);
            setEntityToDelete(null);
            await loadAllData();
        } catch (error: any) {
            console.error('Error deleting:', error);
            toast({ title: "Error", description: error.message || "Failed to delete. May have dependencies.", variant: "destructive" });
        }
    };

    const handleReorder = async (id: string, direction: 'up' | 'down') => {
        try {
            const table = activeTab === 'services' ? 'service_types' : 'categories';
            const currentData = activeTab === 'services' ? services : (activeTab === 'categories' ? categories : subcategories);
            const currentIndex = currentData.findIndex(item => item.id === id);
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            
            if (targetIndex < 0 || targetIndex >= currentData.length) return;

            const currentItem = currentData[currentIndex];
            const targetItem = currentData[targetIndex];

            // Swap sort_order
            await supabase.from(table).update({ sort_order: targetItem.sort_order }).eq('id', currentItem.id);
            await supabase.from(table).update({ sort_order: currentItem.sort_order }).eq('id', targetItem.id);

            await loadAllData();
            toast({ title: "Success", description: "✓ Reordered successfully" });
        } catch (error: any) {
            console.error('Error reordering:', error);
            toast({ title: "Error", description: "Failed to reorder", variant: "destructive" });
        }
    };

    // Filter data based on search
    const getFilteredData = () => {
        const data = activeTab === 'services' ? services : (activeTab === 'categories' ? categories : subcategories);
        if (!searchTerm) return data;

        return data.filter(item => {
            const searchLower = searchTerm.toLowerCase();
            if ('title' in item) {
                return item.title.toLowerCase().includes(searchLower) ||
                       item.description?.toLowerCase().includes(searchLower);
            } else {
                return item.name.toLowerCase().includes(searchLower) ||
                       item.description?.toLowerCase().includes(searchLower);
            }
        });
    };

    const getStats = () => {
        return {
            services: services.length,
            activeServices: services.filter(s => s.is_active).length,
            categories: categories.length,
            activeCategories: categories.filter(c => c.is_active).length,
            subcategories: subcategories.length,
            activeSubcategories: subcategories.filter(c => c.is_active).length,
        };
    };

    const stats = getStats();

    const renderTable = () => {
        const filteredData = getFilteredData();

        if (activeTab === 'services') {
            const servicesData = filteredData as ServiceType[];
            return (
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-16 font-semibold">#</TableHead>
                            <TableHead className="w-16 font-semibold">Icon</TableHead>
                            <TableHead className="font-semibold">Title</TableHead>
                            <TableHead className="font-semibold">Description</TableHead>
                            <TableHead className="w-24 font-semibold">Status</TableHead>
                            <TableHead className="text-right w-56 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {servicesData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No services found</p>
                                    <Button variant="link" onClick={() => handleCreate('service')} className="mt-2">
                                        Create your first service
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : (
                            servicesData.map((service, index) => (
                                <TableRow key={service.id} className="hover:bg-muted/30">
                                    <TableCell className="font-mono text-xs text-muted-foreground">{service.sort_order}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                                            <span className="text-2xl">{service.icon}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">{service.title}</TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground">{service.description || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={service.is_active ? 'default' : 'secondary'} className="gap-1">
                                            {service.is_active ? <Check className="h-3 w-3" /> : null}
                                            {service.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => handleReorder(service.id, 'up')} disabled={index === 0} title="Move up">
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleReorder(service.id, 'down')} disabled={index === servicesData.length - 1} title="Move down">
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <Separator orientation="vertical" className="h-6 mx-1" />
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(service)} title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleToggleActive(service.id, service.is_active)} title={service.is_active ? 'Deactivate' : 'Activate'}>
                                                <Power className={`h-4 w-4 ${service.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setEntityToDelete(service.id); setShowDeleteDialog(true); }} title="Delete">
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            );
        } else {
            const categoriesData = filteredData as Category[];
            return (
                <Table className="min-w-[900px]">
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-16 font-semibold">#</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Service</TableHead>
                            {activeTab === 'subcategories' && <TableHead className="font-semibold">Parent Category</TableHead>}
                            <TableHead className="font-semibold">Description</TableHead>
                            <TableHead className="w-24 font-semibold">Status</TableHead>
                            <TableHead className="text-right w-56 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categoriesData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={activeTab === 'subcategories' ? 7 : 6} className="text-center text-muted-foreground py-12">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No {activeTab} found</p>
                                    <Button variant="link" onClick={() => handleCreate(activeTab === 'categories' ? 'category' : 'subcategory')} className="mt-2">
                                        Create your first {activeTab === 'categories' ? 'category' : 'subcategory'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : (
                            categoriesData.map((category, index) => (
                                <TableRow key={category.id} className="hover:bg-muted/30">
                                    <TableCell className="font-mono text-xs text-muted-foreground">{category.sort_order}</TableCell>
                                    <TableCell className="font-semibold">{category.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="gap-1">
                                            <Layers className="h-3 w-3" />
                                            {services.find(s => s.id === category.service_type)?.title || category.service_type}
                                        </Badge>
                                    </TableCell>
                                    {activeTab === 'subcategories' && (
                                        <TableCell>
                                            <Badge variant="secondary" className="gap-1">
                                                <FolderTree className="h-3 w-3" />
                                                {category.parent_id ? (
                                                    categories.find(c => c.id === category.parent_id)?.name ||
                                                    subcategories.find(c => c.id === category.parent_id)?.name ||
                                                    'N/A'
                                                ) : 'N/A'}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    <TableCell className="max-w-xs truncate text-muted-foreground">{category.description || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={category.is_active ? 'default' : 'secondary'} className="gap-1">
                                            {category.is_active ? <Check className="h-3 w-3" /> : null}
                                            {category.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => handleReorder(category.id, 'up')} disabled={index === 0} title="Move up">
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleReorder(category.id, 'down')} disabled={index === categoriesData.length - 1} title="Move down">
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <Separator orientation="vertical" className="h-6 mx-1" />
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(category)} title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleToggleActive(category.id, category.is_active)} title={category.is_active ? 'Deactivate' : 'Activate'}>
                                                <Power className={`h-4 w-4 ${category.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setEntityToDelete(category.id); setShowDeleteDialog(true); }} title="Delete">
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            );
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Entity Management</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage services, categories, and subcategories with hierarchical structure
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Services</p>
                                <p className="text-2xl font-bold">{stats.activeServices}/{stats.services}</p>
                                <p className="text-xs text-muted-foreground mt-1">Active services</p>
                            </div>
                            <Layers className="h-10 w-10 text-purple-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                                <p className="text-2xl font-bold">{stats.activeCategories}/{stats.categories}</p>
                                <p className="text-xs text-muted-foreground mt-1">Active categories</p>
                            </div>
                            <Tags className="h-10 w-10 text-blue-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Subcategories</p>
                                <p className="text-2xl font-bold">{stats.activeSubcategories}/{stats.subcategories}</p>
                                <p className="text-xs text-muted-foreground mt-1">Active subcategories</p>
                            </div>
                            <FolderTree className="h-10 w-10 text-green-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Card */}
            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Manage Entities
                            </CardTitle>
                            <CardDescription>Create, edit, and organize your service structure</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-9 w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button onClick={() => handleCreate(activeTab === 'services' ? 'service' : (activeTab === 'categories' ? 'category' : 'subcategory'))} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create {activeTab === 'services' ? 'Service' : (activeTab === 'categories' ? 'Category' : 'Subcategory')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                        <div className="px-6 pt-6">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="services" className="gap-2">
                                    <Layers className="h-4 w-4" />
                                    Services ({services.length})
                                </TabsTrigger>
                                <TabsTrigger value="categories" className="gap-2">
                                    <Tags className="h-4 w-4" />
                                    Categories ({categories.length})
                                </TabsTrigger>
                                <TabsTrigger value="subcategories" className="gap-2">
                                    <FolderTree className="h-4 w-4" />
                                    Subcategories ({subcategories.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="services" className="mt-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
                                    <p className="text-sm text-muted-foreground">Loading services...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <ScrollArea className="h-[600px]">
                                        {renderTable()}
                                    </ScrollArea>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="categories" className="mt-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                                    <p className="text-sm text-muted-foreground">Loading categories...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <ScrollArea className="h-[600px]">
                                        {renderTable()}
                                    </ScrollArea>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="subcategories" className="mt-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="h-10 w-10 animate-spin text-green-500 mb-4" />
                                    <p className="text-sm text-muted-foreground">Loading subcategories...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <ScrollArea className="h-[600px]">
                                        {renderTable()}
                                    </ScrollArea>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {dialogMode === 'create' ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                            {dialogMode === 'create' ? 'Create' : 'Edit'} {activeTab === 'services' ? 'Service' : (activeTab === 'categories' ? 'Category' : 'Subcategory')}
                        </DialogTitle>
                        <DialogDescription>
                            {activeTab === 'subcategories' && dialogMode === 'create' && 
                                <span className="text-blue-600">Hierarchical: Service → Category → Subcategory</span>
                            }
                            {activeTab === 'categories' && dialogMode === 'create' && 
                                <span className="text-blue-600">Hierarchical: Service → Category</span>
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[500px] pr-4">
                        <div className="space-y-4">
                            {activeTab === 'services' ? (
                                <>
                                    <div>
                                        <Label htmlFor="title" className="text-base font-semibold">Title *</Label>
                                        <Input
                                            id="title"
                                            value={selectedEntity?.title || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, title: e.target.value })}
                                            placeholder="Enter service title"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={selectedEntity?.description || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, description: e.target.value })}
                                            placeholder="Enter service description"
                                            rows={3}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="icon" className="text-base font-semibold">Icon (Emoji)</Label>
                                            <Input
                                                id="icon"
                                                value={selectedEntity?.icon || ''}
                                                onChange={(e) => setSelectedEntity({ ...selectedEntity, icon: e.target.value })}
                                                placeholder="📦"
                                                className="mt-1.5 text-2xl"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="color" className="text-base font-semibold">Color (Tailwind)</Label>
                                            <Input
                                                id="color"
                                                value={selectedEntity?.color || ''}
                                                onChange={(e) => setSelectedEntity({ ...selectedEntity, color: e.target.value })}
                                                placeholder="from-blue-500 to-blue-600"
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-base font-semibold">Service Icon/Image</Label>
                                        <div className="mt-1.5 space-y-3">
                                            {/* Image Preview */}
                                            {imagePreview && (
                                                <div className="relative w-full h-40 border-2 border-dashed rounded-lg overflow-hidden">
                                                    <img 
                                                        src={imagePreview} 
                                                        alt="Preview" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        className="absolute top-2 right-2"
                                                        onClick={clearImage}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            {/* Upload Button */}
                                            {!imagePreview && (
                                                <div className="flex items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                                                    <label htmlFor="service-image-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                                        <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                                                        <input
                                                            ref={fileInputRef}
                                                            id="service-image-upload"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            disabled={uploadingImage}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                            
                                            {uploadingImage && (
                                                <div className="flex items-center justify-center py-2">
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                    <span className="text-sm text-gray-600">Uploading image...</span>
                                                </div>
                                            )}
                                            
                                            {/* Manual URL Input */}
                                            <div className="relative">
                                                <Label htmlFor="image_url" className="text-sm">Or enter image URL manually</Label>
                                                <Input
                                                    id="image_url"
                                                    value={selectedEntity?.image_url || ''}
                                                    onChange={(e) => {
                                                        setSelectedEntity({ ...selectedEntity, image_url: e.target.value });
                                                        setImagePreview(e.target.value);
                                                    }}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Hierarchical Selection */}
                                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Hierarchical Structure</p>
                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="service_type" className="text-sm font-medium">1. Service Type *</Label>
                                                <Select
                                                    value={selectedEntity?.service_type || ''}
                                                    onValueChange={(value) => setSelectedEntity({ ...selectedEntity, service_type: value, parent_id: null })}
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select service" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {services.map(service => (
                                                            <SelectItem key={service.id} value={service.id}>
                                                                <span className="flex items-center gap-2">
                                                                    <span>{service.icon}</span>
                                                                    <span>{service.title}</span>
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {activeTab === 'subcategories' && (
                                                <div>
                                                    <Label htmlFor="parent_id" className="text-sm font-medium">2. Parent Category *</Label>
                                                    <Select
                                                        value={selectedEntity?.parent_id || ''}
                                                        onValueChange={(value) => setSelectedEntity({ ...selectedEntity, parent_id: value })}
                                                        disabled={!selectedEntity?.service_type}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder={selectedEntity?.service_type ? "Select parent category" : "Select service first"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories
                                                                .filter(cat => cat.service_type === selectedEntity?.service_type)
                                                                .map(category => (
                                                                    <SelectItem key={category.id} value={category.id}>
                                                                        {category.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <Label htmlFor="name" className="text-base font-semibold">{activeTab === 'categories' ? '2. Category' : '3. Subcategory'} Name *</Label>
                                        <Input
                                            id="name"
                                            value={selectedEntity?.name || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, name: e.target.value })}
                                            placeholder="Enter name"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={selectedEntity?.description || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, description: e.target.value })}
                                            placeholder="Enter description"
                                            rows={3}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-base font-semibold">Category/Subcategory Image</Label>
                                        <div className="mt-1.5 space-y-3">
                                            {/* Image Preview */}
                                            {imagePreview && (
                                                <div className="relative w-full h-40 border-2 border-dashed rounded-lg overflow-hidden">
                                                    <img 
                                                        src={imagePreview} 
                                                        alt="Preview" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        className="absolute top-2 right-2"
                                                        onClick={clearImage}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            {/* Upload Button */}
                                            {!imagePreview && (
                                                <div className="flex items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                                                    <label htmlFor="category-image-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                                        <Upload className="h-12 w-12 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-600 font-medium">Upload category image</p>
                                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                                                        <input
                                                            ref={fileInputRef}
                                                            id="category-image-upload"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            disabled={uploadingImage}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                            
                                            {uploadingImage && (
                                                <div className="flex items-center justify-center py-2">
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                    <span className="text-sm text-gray-600">Uploading image...</span>
                                                </div>
                                            )}
                                            
                                            {/* Manual URL Input */}
                                            <div className="relative">
                                                <Label htmlFor="cat_image_url" className="text-sm">Or enter image URL manually</Label>
                                                <Input
                                                    id="cat_image_url"
                                                    value={selectedEntity?.image_url || ''}
                                                    onChange={(e) => {
                                                        setSelectedEntity({ ...selectedEntity, image_url: e.target.value });
                                                        setImagePreview(e.target.value);
                                                    }}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="sort_order" className="text-base font-semibold">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={selectedEntity?.sort_order || 0}
                                        onChange={(e) => setSelectedEntity({ ...selectedEntity, sort_order: parseInt(e.target.value) || 0 })}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div className="flex items-end space-x-2 pb-2">
                                    <Switch
                                        checked={selectedEntity?.is_active || false}
                                        onCheckedChange={(checked) => setSelectedEntity({ ...selectedEntity, is_active: checked })}
                                        id="active-switch"
                                    />
                                    <Label htmlFor="active-switch" className="text-base font-semibold">Active Status</Label>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {saving ? 'Saving...' : (dialogMode === 'create' ? 'Create' : 'Update')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this? This action cannot be undone and may fail if there are dependencies.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EntityManagement;
