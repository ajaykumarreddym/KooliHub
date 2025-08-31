import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "@/hooks/use-toast";
import { SERVICES } from "@/lib/constants";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Filter,
  Download,
  MoreHorizontal,
  Package,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  service_type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ServiceType {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  features: string[];
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
  service_type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const ServiceTypes: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypesLoading, setServiceTypesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddServiceTypeModalOpen, setIsAddServiceTypeModalOpen] =
    useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    totalServiceTypes: 0,
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    service_type: "",
    is_active: true,
    sort_order: 0,
    image_url: "",
  });

  const [serviceTypeFormData, setServiceTypeFormData] = useState({
    id: "",
    title: "",
    description: "",
    icon: "📦",
    color: "from-gray-500 to-gray-600",
    features: ["", "", ""],
    image_url: "",
    is_active: true,
    sort_order: 0,
  });

  const serviceTypeOptions = serviceTypes
    .filter((serviceType) => serviceType.is_active)
    .map((serviceType) => ({
      value: serviceType.id,
      label: serviceType.title,
      icon: serviceType.icon,
    }));

  useEffect(() => {
    fetchCategories();
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      setServiceTypesLoading(true);

      const { data, error } = await supabase
        .from("service_types")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(`Failed to fetch service types: ${error.message}`);
      }

      setServiceTypes(data || []);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error fetching service types:", errorMessage);
    } finally {
      setServiceTypesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("service_type", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      setCategories(data || []);

      // Calculate stats
      if (data) {
        const totalCategories = data.length;
        const activeCategories = data.filter((cat) => cat.is_active).length;
        const totalServiceTypes = serviceTypes.filter(
          (st) => st.is_active,
        ).length;

        setStats({
          totalCategories,
          activeCategories,
          totalServiceTypes,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error fetching categories:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        // Update existing category
        const { data, error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            description: formData.description || null,
            service_type: formData.service_type,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
            image_url: formData.image_url || null,
          })
          .eq("id", editingCategory.id)
          .select();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // Add new category
        const { data, error } = await supabase
          .from("categories")
          .insert([
            {
              name: formData.name,
              description: formData.description || null,
              service_type: formData.service_type,
              is_active: formData.is_active,
              sort_order: formData.sort_order,
              image_url: formData.image_url || null,
            },
          ])
          .select();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category added successfully",
        });
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        service_type: "",
        is_active: true,
        sort_order: 0,
        image_url: "",
      });

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      service_type: category.service_type,
      is_active: category.is_active,
      sort_order: category.sort_order,
      image_url: category.image_url || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setDeleteLoading(categoryId);

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleAddServiceType = async () => {
    if (!serviceTypeFormData.id || !serviceTypeFormData.title) {
      toast({
        title: "Error",
        description: "Please provide both ID and title for the service type",
        variant: "destructive",
      });
      return;
    }

    // Check if ID already exists
    const existingService = serviceTypes.find(
      (service) => service.id === serviceTypeFormData.id,
    );

    if (existingService) {
      toast({
        title: "Error",
        description: "A service type with this ID already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      setServiceTypesLoading(true);

      const { data, error } = await supabase
        .from("service_types")
        .insert([
          {
            id: serviceTypeFormData.id,
            title: serviceTypeFormData.title,
            description: serviceTypeFormData.description || null,
            icon: serviceTypeFormData.icon || "📦",
            color: serviceTypeFormData.color,
            features: serviceTypeFormData.features.filter(
              (f) => f.trim() !== "",
            ),
            image_url: serviceTypeFormData.image_url || null,
            is_active: serviceTypeFormData.is_active,
            sort_order: serviceTypeFormData.sort_order,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service type added successfully",
      });

      // Reset form
      setServiceTypeFormData({
        id: "",
        title: "",
        description: "",
        icon: "📦",
        color: "from-gray-500 to-gray-600",
        features: ["", "", ""],
        image_url: "",
        is_active: true,
        sort_order: 0,
      });

      setIsAddServiceTypeModalOpen(false);
      fetchServiceTypes();
    } catch (error: any) {
      console.error("Error saving service type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save service type",
        variant: "destructive",
      });
    } finally {
      setServiceTypesLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesServiceType =
      !selectedServiceType ||
      selectedServiceType === "all" ||
      category.service_type === selectedServiceType;
    return matchesSearch && matchesServiceType;
  });

  const getServiceTypeIcon = (serviceType: string) => {
    const option = serviceTypeOptions.find((opt) => opt.value === serviceType);
    return option?.icon || "📦";
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const option = serviceTypeOptions.find((opt) => opt.value === serviceType);
    return option?.label || serviceType;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Service Types & Categories
            </h1>
            <p className="text-gray-500 text-sm mt-1">Loading categories...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Service Types & Categories
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Error loading categories
            </p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">
                  Failed to load categories
                </p>
                <pre className="text-red-600 text-xs mt-1 whitespace-pre-wrap">
                  {error}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCategories}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Service Types & Categories
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage service types and categories for all your services
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAddServiceTypeModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service Type
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCategories}</p>
                <p className="text-xs text-gray-500">Total Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeCategories}</p>
                <p className="text-xs text-gray-500">Active Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalServiceTypes}</p>
                <p className="text-xs text-gray-500">Service Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedServiceType}
              onValueChange={setSelectedServiceType}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Service Types</SelectItem>
                {serviceTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({filteredCategories.length})</CardTitle>
          <CardDescription>
            Manage categories for all your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No categories found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first category.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {getServiceTypeIcon(category.service_type)}
                        </span>
                        <span className="text-sm">
                          {getServiceTypeLabel(category.service_type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(category.is_active)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {category.sort_order}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(category.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(category.id)}
                            disabled={deleteLoading === category.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteLoading === category.id
                              ? "Deleting..."
                              : "Delete Category"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Category Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setFormData({
              name: "",
              description: "",
              service_type: "",
              is_active: true,
              sort_order: 0,
              image_url: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for your services
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, service_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Category description"
                rows={3}
              />
            </div>

            <ImageUpload
              value={formData.image_url}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, image_url: value }))
              }
              placeholder="Upload category image"
              fallbackImage="/placeholder.svg"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="active">Active Category</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setEditingCategory(null);
            setFormData({
              name: "",
              description: "",
              service_type: "",
              is_active: true,
              sort_order: 0,
              image_url: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-service_type">Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, service_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Category description"
                rows={3}
              />
            </div>

            <ImageUpload
              value={formData.image_url}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, image_url: value }))
              }
              placeholder="Upload category image"
              fallbackImage="/placeholder.svg"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sort_order">Sort Order</Label>
                <Input
                  id="edit-sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="edit-active">Active Category</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Service Type Modal */}
      <Dialog
        open={isAddServiceTypeModalOpen}
        onOpenChange={(open) => {
          setIsAddServiceTypeModalOpen(open);
          if (!open) {
            setServiceTypeFormData({
              id: "",
              title: "",
              description: "",
              icon: "📦",
              color: "from-gray-500 to-gray-600",
              features: ["", "", ""],
              image_url: "",
              is_active: true,
              sort_order: 0,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Service Type</DialogTitle>
            <DialogDescription>
              Create a new service type that can be used for categories
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-id">Service ID *</Label>
                <Input
                  id="service-id"
                  value={serviceTypeFormData.id}
                  onChange={(e) =>
                    setServiceTypeFormData((prev) => ({
                      ...prev,
                      id: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    }))
                  }
                  placeholder="e.g., cleaning, beauty"
                  required
                />
                <p className="text-xs text-gray-500">
                  Used internally, will be converted to lowercase with dashes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-title">Service Title *</Label>
                <Input
                  id="service-title"
                  value={serviceTypeFormData.title}
                  onChange={(e) =>
                    setServiceTypeFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g., Cleaning Services"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                value={serviceTypeFormData.description}
                onChange={(e) =>
                  setServiceTypeFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the service type"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-icon">Icon (Emoji)</Label>
                <Input
                  id="service-icon"
                  value={serviceTypeFormData.icon}
                  onChange={(e) =>
                    setServiceTypeFormData((prev) => ({
                      ...prev,
                      icon: e.target.value,
                    }))
                  }
                  placeholder="🧹"
                  maxLength={2}
                />
                <p className="text-xs text-gray-500">
                  Single emoji to represent the service
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-color">Color Theme</Label>
                <Select
                  value={serviceTypeFormData.color}
                  onValueChange={(value) =>
                    setServiceTypeFormData((prev) => ({
                      ...prev,
                      color: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="from-blue-500 to-blue-600">
                      Blue
                    </SelectItem>
                    <SelectItem value="from-green-500 to-green-600">
                      Green
                    </SelectItem>
                    <SelectItem value="from-purple-500 to-purple-600">
                      Purple
                    </SelectItem>
                    <SelectItem value="from-orange-500 to-orange-600">
                      Orange
                    </SelectItem>
                    <SelectItem value="from-red-500 to-red-600">Red</SelectItem>
                    <SelectItem value="from-yellow-500 to-yellow-600">
                      Yellow
                    </SelectItem>
                    <SelectItem value="from-pink-500 to-pink-600">
                      Pink
                    </SelectItem>
                    <SelectItem value="from-indigo-500 to-indigo-600">
                      Indigo
                    </SelectItem>
                    <SelectItem value="from-gray-500 to-gray-600">
                      Gray
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Key Features (up to 3)</Label>
              {serviceTypeFormData.features.map((feature, index) => (
                <Input
                  key={index}
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...serviceTypeFormData.features];
                    newFeatures[index] = e.target.value;
                    setServiceTypeFormData((prev) => ({
                      ...prev,
                      features: newFeatures,
                    }));
                  }}
                  placeholder={`Feature ${index + 1}`}
                />
              ))}
            </div>

            <ImageUpload
              value={serviceTypeFormData.image_url}
              onChange={(value) =>
                setServiceTypeFormData((prev) => ({
                  ...prev,
                  image_url: value,
                }))
              }
              placeholder="Upload service type image"
              fallbackImage="/placeholder.svg"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-sort_order">Sort Order</Label>
                <Input
                  id="service-sort_order"
                  type="number"
                  value={serviceTypeFormData.sort_order}
                  onChange={(e) =>
                    setServiceTypeFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="service-active"
                  checked={serviceTypeFormData.is_active}
                  onCheckedChange={(checked) =>
                    setServiceTypeFormData((prev) => ({
                      ...prev,
                      is_active: checked,
                    }))
                  }
                />
                <Label htmlFor="service-active">Active Service Type</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddServiceTypeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddServiceType}>
                Add Service Type
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
