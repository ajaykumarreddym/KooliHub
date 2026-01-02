import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    AlertCircle,
    Check,
    Copy,
    Edit,
    Eye,
    FolderTree,
    GripVertical,
    ImageIcon,
    Layers,
    Loader2,
    MoreVertical,
    Plus,
    Power,
    Search,
    Tags,
    Trash2,
    TrendingUp,
    Upload,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

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
    icon?: string | null;
    color?: string | null;
    image_url: string | null;
    service_type: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    service_types?: { title: string };
}

interface Subcategory {
    id: string;
    name: string;
    description: string | null;
    icon?: string | null;
    color?: string | null;
    image_url: string | null;
    category_id: string;
    service_type_id: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface FormData {
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    image_url?: string;
    service_type?: string;  // For categories
    service_type_id?: string;  // For subcategories
    category_id?: string | null;  // For subcategories
    is_active?: boolean;
    sort_order?: number;
}

// Color and Icon Options
const colorOptions = [
    { value: "from-gray-500 to-gray-600", label: "Gray", preview: "bg-gradient-to-r from-gray-500 to-gray-600" },
    { value: "from-red-500 to-red-600", label: "Red", preview: "bg-gradient-to-r from-red-500 to-red-600" },
    { value: "from-orange-500 to-orange-600", label: "Orange", preview: "bg-gradient-to-r from-orange-500 to-orange-600" },
    { value: "from-yellow-500 to-yellow-600", label: "Yellow", preview: "bg-gradient-to-r from-yellow-500 to-yellow-600" },
    { value: "from-green-500 to-green-600", label: "Green", preview: "bg-gradient-to-r from-green-500 to-green-600" },
    { value: "from-blue-500 to-blue-600", label: "Blue", preview: "bg-gradient-to-r from-blue-500 to-blue-600" },
    { value: "from-indigo-500 to-indigo-600", label: "Indigo", preview: "bg-gradient-to-r from-indigo-500 to-indigo-600" },
    { value: "from-purple-500 to-purple-600", label: "Purple", preview: "bg-gradient-to-r from-purple-500 to-purple-600" },
    { value: "from-pink-500 to-pink-600", label: "Pink", preview: "bg-gradient-to-r from-pink-500 to-pink-600" },
    { value: "from-rose-500 to-rose-600", label: "Rose", preview: "bg-gradient-to-r from-rose-500 to-rose-600" },
];

const iconOptions = [
    "🛒", "🚌", "🚗", "🔧", "📱", "🏠", "👗", "🍾", "🎤", "📦", "😄", "🍎", "🎯", "⚡", "🌟", "🏆", "🎪", "🎨", "🎭", "💼", "🍕", "🎮", "⚽", "🎬", "📚", "💎", "🌸", "🎵", "📷", "✨"
];

// Sortable Row Component
interface SortableRowProps {
    id: string;
    index: number;
    entity: ServiceType | Category | Subcategory;
    activeTab: 'services' | 'categories' | 'subcategories';
    services: ServiceType[];
    categories: Category[];
    subcategories: Subcategory[];
    onEdit: (entity: ServiceType | Category | Subcategory) => void;
    onToggleActive: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
    id,
    index,
    entity,
    activeTab,
    services,
    categories,
    subcategories,
    onEdit,
    onToggleActive,
    onDelete,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    if (activeTab === 'services') {
        const service = entity as ServiceType;
        return (
            <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/30">
                <TableCell className="w-10">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{service.sort_order}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-3">
                        {service.image_url ? (
                            <img 
                                src={service.image_url} 
                                alt={service.title}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 border border-gray-200">
                                <span className="text-2xl">{service.icon}</span>
                            </div>
                        )}
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(service)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(service.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleActive(service.id, service.is_active)}>
                                <Power className={`mr-2 h-4 w-4 ${service.is_active ? 'text-orange-600' : 'text-green-600'}`} />
                                {service.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onDelete(service.id)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        );
    } else if (activeTab === 'categories') {
        const category = entity as Category;
        return (
            <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/30">
                <TableCell className="w-10">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{category.sort_order}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-3">
                        {category.image_url ? (
                            <img 
                                src={category.image_url} 
                                alt={category.name}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 border border-gray-200">
                                <span className="text-lg">{category.icon || '📁'}</span>
                            </div>
                        )}
                        <span className="font-semibold">{category.name}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="gap-1">
                        <Layers className="h-3 w-3" />
                        {services.find(s => s.id === category.service_type)?.title || category.service_type}
                    </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{category.description || '—'}</TableCell>
                <TableCell>
                    <Badge variant={category.is_active ? 'default' : 'secondary'} className="gap-1">
                        {category.is_active ? <Check className="h-3 w-3" /> : null}
                        {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(category.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleActive(category.id, category.is_active)}>
                                <Power className={`mr-2 h-4 w-4 ${category.is_active ? 'text-orange-600' : 'text-green-600'}`} />
                                {category.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onDelete(category.id)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        );
    } else {
        // Subcategory
        const subcategory = entity as Subcategory;
        return (
            <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/30">
                <TableCell className="w-10">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{subcategory.sort_order}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-3">
                        {subcategory.image_url ? (
                            <img 
                                src={subcategory.image_url} 
                                alt={subcategory.name}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-teal-100 border border-gray-200">
                                <span className="text-lg">{subcategory.icon || '📂'}</span>
                            </div>
                        )}
                        <span className="font-semibold">{subcategory.name}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="gap-1">
                        <Layers className="h-3 w-3" />
                        {services.find(s => s.id === subcategory.service_type_id)?.title || subcategory.service_type_id}
                    </Badge>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary" className="gap-1">
                        <FolderTree className="h-3 w-3" />
                        {categories.find(c => c.id === subcategory.category_id)?.name || 'N/A'}
                    </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{subcategory.description || '—'}</TableCell>
                <TableCell>
                    <Badge variant={subcategory.is_active ? 'default' : 'secondary'} className="gap-1">
                        {subcategory.is_active ? <Check className="h-3 w-3" /> : null}
                        {subcategory.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(subcategory)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(subcategory.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleActive(subcategory.id, subcategory.is_active)}>
                                <Power className={`mr-2 h-4 w-4 ${subcategory.is_active ? 'text-orange-600' : 'text-green-600'}`} />
                                {subcategory.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onDelete(subcategory.id)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        );
    }
};

export const EntityManagement: React.FC = () => {
    // State
    const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'subcategories'>('services');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Data states
    const [services, setServices] = useState<ServiceType[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    
    // Modal states
    const [showDialog, setShowDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [selectedEntity, setSelectedEntity] = useState<FormData | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [entityToDelete, setEntityToDelete] = useState<string | null>(null);
    
    // Image upload states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
            .order('sort_order');
        
        if (error) {
            console.error('Error loading categories:', error);
            throw error;
        }
        setCategories(data || []);
    };

    const loadSubcategories = async () => {
        const { data, error } = await supabase
            .from('subcategories')
            .select('*')
            .order('sort_order');
        
        if (error) {
            console.error('Error loading subcategories:', error);
            throw error;
        }
        
        setSubcategories(data || []);
    };

    // Enhanced image validation
    const validateImage = (file: File): { valid: boolean; error?: string } => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)' };
        }

        if (file.size > maxSize) {
            return { valid: false, error: 'Image size must be less than 5MB' };
        }

        return { valid: true };
    };

    // Image compression utility
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                reject(new Error('Compression failed'));
                            }
                        },
                        'image/jpeg',
                        0.85
                    );
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    // Enhanced image upload handler
    const handleImageUpload = async (file: File) => {
        const validation = validateImage(file);
        if (!validation.valid) {
            toast({ title: "Error", description: validation.error, variant: "destructive" });
            return;
        }

        setUploadingImage(true);
        try {
            // Compress image if larger than 1MB
            const fileToUpload = file.size > 1024 * 1024 ? await compressImage(file) : file;

            // Create a unique filename
            const fileExt = fileToUpload.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `entity-images/${fileName}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('assets')
                .upload(filePath, fileToUpload);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('assets')
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

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    // Drag and drop handlers for image upload
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    }, []);

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
            service_type: type === 'category' ? (services[0]?.id || '') : undefined,
            service_type_id: type === 'subcategory' ? (services[0]?.id || '') : undefined,
            category_id: type === 'subcategory' ? (categories[0]?.id || null) : null,
            is_active: true,
            sort_order: type === 'service' ? services.length : (type === 'category' ? categories.length : subcategories.length)
        });
        setShowDialog(true);
    };

    const handleEdit = (entity: ServiceType | Category | Subcategory) => {
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
        } else if ('category_id' in entity) {
            // Subcategory
            setSelectedEntity({
                id: entity.id,
                name: entity.name,
                description: entity.description || '',
                icon: entity.icon || '📂',
                color: entity.color || 'from-green-500 to-green-600',
                image_url: imgUrl,
                service_type_id: entity.service_type_id,
                category_id: entity.category_id,
                is_active: entity.is_active,
                sort_order: entity.sort_order
            });
        } else {
            // Category
            setSelectedEntity({
                id: entity.id,
                name: entity.name,
                description: entity.description || '',
                icon: entity.icon || '📁',
                color: entity.color || 'from-blue-500 to-blue-600',
                image_url: imgUrl,
                service_type: entity.service_type,
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
        if (activeTab === 'subcategories' && !selectedEntity.category_id) {
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
            } else if (activeTab === 'categories') {
                // Save category
                const categoryData = {
                    name: selectedEntity.name,
                    description: selectedEntity.description,
                    icon: selectedEntity.icon,
                    color: selectedEntity.color,
                    image_url: selectedEntity.image_url,
                    service_type: selectedEntity.service_type,
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
                    toast({ title: "Success", description: "✓ Category updated successfully" });
                } else {
                    const { error } = await supabase
                        .from('categories')
                        .insert({
                            ...categoryData,
                            created_at: new Date().toISOString()
                        });
                    
                    if (error) throw error;
                    toast({ title: "Success", description: "✓ Category created successfully" });
                }

                await loadCategories();
            } else {
                // Save subcategory
                const subcategoryData = {
                    name: selectedEntity.name,
                    description: selectedEntity.description,
                    icon: selectedEntity.icon,
                    color: selectedEntity.color,
                    image_url: selectedEntity.image_url,
                    service_type_id: selectedEntity.service_type_id,
                    category_id: selectedEntity.category_id,
                    is_active: selectedEntity.is_active,
                    sort_order: selectedEntity.sort_order,
                    updated_at: new Date().toISOString()
                };

                if (dialogMode === 'edit' && selectedEntity.id) {
                    const { error } = await supabase
                        .from('subcategories')
                        .update(subcategoryData)
                        .eq('id', selectedEntity.id);
                    
                    if (error) throw error;
                    toast({ title: "Success", description: "✓ Subcategory updated successfully" });
                } else {
                    const { error } = await supabase
                        .from('subcategories')
                        .insert({
                            ...subcategoryData,
                            created_at: new Date().toISOString()
                        });
                    
                    if (error) throw error;
                    toast({ title: "Success", description: "✓ Subcategory created successfully" });
                }

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
            const table = activeTab === 'services' ? 'service_types' : (activeTab === 'categories' ? 'categories' : 'subcategories');
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
            const table = activeTab === 'services' ? 'service_types' : (activeTab === 'categories' ? 'categories' : 'subcategories');
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

    // Handle drag end for reordering
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Update sort_order in database
        try {
            const table = activeTab === 'services' ? 'service_types' : (activeTab === 'categories' ? 'categories' : 'subcategories');
            
            if (activeTab === 'services') {
                const oldIndex = services.findIndex((item) => item.id === active.id);
                const newIndex = services.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(services, oldIndex, newIndex);
                
                // Update local state immediately for better UX
                setServices(newOrder);
                
                // Update database
                const updates = newOrder.map((item, index) => ({
                    id: item.id,
                    sort_order: index,
                }));

                for (const update of updates) {
                    await supabase
                        .from(table)
                        .update({ sort_order: update.sort_order })
                        .eq('id', update.id);
                }
            } else if (activeTab === 'categories') {
                const oldIndex = categories.findIndex((item) => item.id === active.id);
                const newIndex = categories.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(categories, oldIndex, newIndex);
                
                // Update local state immediately for better UX
                setCategories(newOrder);
                
                // Update database
                const updates = newOrder.map((item, index) => ({
                    id: item.id,
                    sort_order: index,
                }));

                for (const update of updates) {
                    await supabase
                        .from(table)
                        .update({ sort_order: update.sort_order })
                        .eq('id', update.id);
                }
            } else {
                const oldIndex = subcategories.findIndex((item) => item.id === active.id);
                const newIndex = subcategories.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(subcategories, oldIndex, newIndex);
                
                // Update local state immediately for better UX
                setSubcategories(newOrder);
                
                // Update database
                const updates = newOrder.map((item, index) => ({
                    id: item.id,
                    sort_order: index,
                }));

                for (const update of updates) {
                    await supabase
                        .from(table)
                        .update({ sort_order: update.sort_order })
                        .eq('id', update.id);
                }
            }

            toast({ title: "Success", description: "✓ Order updated successfully" });
        } catch (error: any) {
            console.error('Error updating order:', error);
            toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
            await loadAllData(); // Reload to get correct order
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="w-16 font-semibold">#</TableHead>
                                <TableHead className="font-semibold">Image</TableHead>
                                <TableHead className="font-semibold">Title</TableHead>
                                <TableHead className="font-semibold">Description</TableHead>
                                <TableHead className="w-24 font-semibold">Status</TableHead>
                                <TableHead className="text-right w-20 font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {servicesData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No services found</p>
                                        <Button variant="link" onClick={() => handleCreate('service')} className="mt-2">
                                            Create your first service
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <SortableContext items={servicesData.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    {servicesData.map((service, index) => (
                                        <SortableRow
                                            key={service.id}
                                            id={service.id}
                                            index={index}
                                            entity={service}
                                            activeTab={activeTab}
                                            services={services}
                                            categories={categories}
                                            subcategories={subcategories}
                                            onEdit={handleEdit}
                                            onToggleActive={handleToggleActive}
                                            onDelete={(id) => { setEntityToDelete(id); setShowDeleteDialog(true); }}
                                        />
                                    ))}
                                </SortableContext>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            );
        } else {
            const categoriesData = filteredData as Category[];
            return (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table className="min-w-[1000px]">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="w-16 font-semibold">#</TableHead>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Service</TableHead>
                                {activeTab === 'subcategories' && <TableHead className="font-semibold">Parent Category</TableHead>}
                                <TableHead className="font-semibold">Description</TableHead>
                                <TableHead className="w-24 font-semibold">Status</TableHead>
                                <TableHead className="text-right w-20 font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categoriesData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={activeTab === 'subcategories' ? 8 : 7} className="text-center text-muted-foreground py-12">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No {activeTab} found</p>
                                        <Button variant="link" onClick={() => handleCreate(activeTab === 'categories' ? 'category' : 'subcategory')} className="mt-2">
                                            Create your first {activeTab === 'categories' ? 'category' : 'subcategory'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <SortableContext items={categoriesData.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    {categoriesData.map((category, index) => (
                                        <SortableRow
                                            key={category.id}
                                            id={category.id}
                                            index={index}
                                            entity={category}
                                            activeTab={activeTab}
                                            services={services}
                                            categories={categories}
                                            subcategories={subcategories}
                                            onEdit={handleEdit}
                                            onToggleActive={handleToggleActive}
                                            onDelete={(id) => { setEntityToDelete(id); setShowDeleteDialog(true); }}
                                        />
                                    ))}
                                </SortableContext>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
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
                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
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
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
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
                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
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
                            <CardDescription>Create, edit, and organize your service structure with drag-and-drop</CardDescription>
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
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {dialogMode === 'create' ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                            {dialogMode === 'create' ? 'Create' : 'Edit'} {activeTab === 'services' ? 'Service' : (activeTab === 'categories' ? 'Category' : 'Subcategory')}
                        </DialogTitle>
                        <DialogDescription>
                            {activeTab === 'subcategories' && dialogMode === 'create' && 
                                <span className="text-blue-600 font-medium">Hierarchical: Service → Category → Subcategory</span>
                            }
                            {activeTab === 'categories' && dialogMode === 'create' && 
                                <span className="text-blue-600 font-medium">Hierarchical: Service → Category</span>
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
                        <div className="space-y-6">
                            {activeTab === 'services' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-base font-semibold">Service Title *</Label>
                                        <Input
                                            id="title"
                                            value={selectedEntity?.title || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, title: e.target.value })}
                                            placeholder="Enter service title"
                                            className="text-base"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={selectedEntity?.description || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, description: e.target.value })}
                                            placeholder="Enter service description"
                                            rows={3}
                                            className="text-base resize-none"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold">Icon</Label>
                                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-md bg-gray-50">
                                                {iconOptions.map((icon) => (
                                                    <Button
                                                        key={icon}
                                                        type="button"
                                                        variant={selectedEntity?.icon === icon ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setSelectedEntity({ ...selectedEntity, icon })}
                                                        className="text-2xl w-12 h-12 p-0 hover:scale-110 transition-transform"
                                                    >
                                                        {icon}
                                                    </Button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500">Selected: {selectedEntity?.icon || '📦'}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold">Color Theme</Label>
                                            <ScrollArea className="h-40 border rounded-md p-2 bg-gray-50">
                                                <div className="space-y-2">
                                                    {colorOptions.map((color) => (
                                                        <div
                                                            key={color.value}
                                                            className={`flex items-center space-x-3 p-2 rounded cursor-pointer border transition-all ${
                                                                selectedEntity?.color === color.value 
                                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-105' 
                                                                    : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                                                            }`}
                                                            onClick={() => setSelectedEntity({ ...selectedEntity, color: color.value })}
                                                        >
                                                            <div className={`w-10 h-10 rounded-md ${color.preview} shadow-sm`}></div>
                                                            <span className="text-sm font-medium">{color.label}</span>
                                                            {selectedEntity?.color === color.value && (
                                                                <Check className="h-4 w-4 ml-auto text-primary" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-base font-semibold flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" />
                                            Service Image
                                        </Label>
                                        <div className="space-y-3">
                                            {/* Image Preview */}
                                            {imagePreview && (
                                                <div className="relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden group">
                                                    <img 
                                                        src={imagePreview} 
                                                        alt="Preview" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => window.open(imagePreview, '_blank')}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={clearImage}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Upload Area */}
                                            {!imagePreview && (
                                                <div 
                                                    className={`flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-all ${
                                                        dragActive 
                                                            ? 'border-primary bg-primary/5 scale-105' 
                                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                                    }`}
                                                    onDragEnter={handleDrag}
                                                    onDragLeave={handleDrag}
                                                    onDragOver={handleDrag}
                                                    onDrop={handleDrop}
                                                >
                                                    <label htmlFor="service-image-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                                                        <p className="text-base text-gray-600 font-medium">
                                                            {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-2">PNG, JPG, WebP or GIF up to 5MB</p>
                                                        <p className="text-xs text-gray-400 mt-1">Images will be automatically optimized</p>
                                                        <input
                                                            ref={fileInputRef}
                                                            id="service-image-upload"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileInputChange}
                                                            disabled={uploadingImage}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                            
                                            {uploadingImage && (
                                                <div className="flex items-center justify-center py-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                                                    <span className="text-sm text-blue-700 font-medium">Uploading and optimizing image...</span>
                                                </div>
                                            )}
                                            
                                            {/* Manual URL Input */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="image_url" className="text-sm text-muted-foreground">Or enter image URL manually</Label>
                                                <Input
                                                    id="image_url"
                                                    value={selectedEntity?.image_url || ''}
                                                    onChange={(e) => {
                                                        setSelectedEntity({ ...selectedEntity, image_url: e.target.value });
                                                        setImagePreview(e.target.value);
                                                    }}
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Hierarchical Selection */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                                            <Layers className="h-4 w-4" />
                                            Hierarchical Structure
                                        </p>
                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="service_type" className="text-sm font-medium">1. Service Type *</Label>
                                                <Select
                                                    value={activeTab === 'subcategories' ? (selectedEntity?.service_type_id || '') : (selectedEntity?.service_type || '')}
                                                    onValueChange={(value) => activeTab === 'subcategories' 
                                                        ? setSelectedEntity({ ...selectedEntity, service_type_id: value, category_id: null })
                                                        : setSelectedEntity({ ...selectedEntity, service_type: value, category_id: null })
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1.5">
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
                                                    <Label htmlFor="category_id" className="text-sm font-medium">2. Parent Category *</Label>
                                                    <Select
                                                        value={selectedEntity?.category_id || ''}
                                                        onValueChange={(value) => setSelectedEntity({ ...selectedEntity, category_id: value })}
                                                        disabled={!selectedEntity?.service_type_id}
                                                    >
                                                        <SelectTrigger className="mt-1.5">
                                                            <SelectValue placeholder={selectedEntity?.service_type_id ? "Select parent category" : "Select service first"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories
                                                                .filter(cat => cat.service_type === selectedEntity?.service_type_id)
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

                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-base font-semibold">
                                            {activeTab === 'categories' ? '2. Category' : '3. Subcategory'} Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            value={selectedEntity?.name || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, name: e.target.value })}
                                            placeholder="Enter name"
                                            className="text-base"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={selectedEntity?.description || ''}
                                            onChange={(e) => setSelectedEntity({ ...selectedEntity, description: e.target.value })}
                                            placeholder="Enter description"
                                            rows={3}
                                            className="text-base resize-none"
                                        />
                                    </div>

                                    {/* Icon and Color Selectors */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold">Icon</Label>
                                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-md bg-gray-50">
                                                {iconOptions.map((icon) => (
                                                    <Button
                                                        key={icon}
                                                        type="button"
                                                        variant={selectedEntity?.icon === icon ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setSelectedEntity({ ...selectedEntity, icon })}
                                                        className="text-2xl w-12 h-12 p-0 hover:scale-110 transition-transform"
                                                    >
                                                        {icon}
                                                    </Button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500">Selected: {selectedEntity?.icon || '📁'}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold">Color Theme</Label>
                                            <ScrollArea className="h-40 border rounded-md p-2 bg-gray-50">
                                                <div className="space-y-2">
                                                    {colorOptions.map((color) => (
                                                        <div
                                                            key={color.value}
                                                            className={`flex items-center space-x-3 p-2 rounded cursor-pointer border transition-all ${
                                                                selectedEntity?.color === color.value 
                                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-105' 
                                                                    : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                                                            }`}
                                                            onClick={() => setSelectedEntity({ ...selectedEntity, color: color.value })}
                                                        >
                                                            <div className={`w-10 h-10 rounded-md ${color.preview} shadow-sm`}></div>
                                                            <span className="text-sm font-medium">{color.label}</span>
                                                            {selectedEntity?.color === color.value && (
                                                                <Check className="h-4 w-4 ml-auto text-primary" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-base font-semibold flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" />
                                            Category Image
                                        </Label>
                                        <div className="space-y-3">
                                            {/* Image Preview */}
                                            {imagePreview && (
                                                <div className="relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden group">
                                                    <img 
                                                        src={imagePreview} 
                                                        alt="Preview" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => window.open(imagePreview, '_blank')}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={clearImage}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Upload Area */}
                                            {!imagePreview && (
                                                <div 
                                                    className={`flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-all ${
                                                        dragActive 
                                                            ? 'border-primary bg-primary/5 scale-105' 
                                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                                    }`}
                                                    onDragEnter={handleDrag}
                                                    onDragLeave={handleDrag}
                                                    onDragOver={handleDrag}
                                                    onDrop={handleDrop}
                                                >
                                                    <label htmlFor="category-image-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                                                        <p className="text-base text-gray-600 font-medium">
                                                            {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-2">PNG, JPG, WebP or GIF up to 5MB</p>
                                                        <p className="text-xs text-gray-400 mt-1">Images will be automatically optimized</p>
                                                        <input
                                                            ref={fileInputRef}
                                                            id="category-image-upload"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileInputChange}
                                                            disabled={uploadingImage}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                            
                                            {uploadingImage && (
                                                <div className="flex items-center justify-center py-3 bg-blue-50 rounded-lg border border-blue-200">
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                                                    <span className="text-sm text-blue-700 font-medium">Uploading and optimizing image...</span>
                                                </div>
                                            )}
                                            
                                            {/* Manual URL Input */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cat_image_url" className="text-sm text-muted-foreground">Or enter image URL manually</Label>
                                                <Input
                                                    id="cat_image_url"
                                                    value={selectedEntity?.image_url || ''}
                                                    onChange={(e) => {
                                                        setSelectedEntity({ ...selectedEntity, image_url: e.target.value });
                                                        setImagePreview(e.target.value);
                                                    }}
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sort_order" className="text-base font-semibold">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={selectedEntity?.sort_order || 0}
                                        onChange={(e) => setSelectedEntity({ ...selectedEntity, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                                </div>
                                <div className="flex flex-col justify-end space-y-2">
                                    <div className="flex items-center space-x-2 h-10">
                                        <Switch
                                            checked={selectedEntity?.is_active || false}
                                            onCheckedChange={(checked) => setSelectedEntity({ ...selectedEntity, is_active: checked })}
                                            id="active-switch"
                                        />
                                        <Label htmlFor="active-switch" className="text-base font-semibold cursor-pointer">Active Status</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Enable to make this visible to users</p>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving || uploadingImage} className="gap-2 min-w-[120px]">
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
                        <DialogDescription className="pt-2">
                            Are you sure you want to delete this? This action cannot be undone and may fail if there are dependencies.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
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
