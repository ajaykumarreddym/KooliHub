import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Edit,
    Eye,
    EyeOff,
    MoreHorizontal,
    Package,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Service Type interface matching current database schema
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
  "🛒", "🚌", "🚗", "🔧", "📱", "🏠", "👗", "🍾", "🎤", "📦", "😄", "🍎", "🎯", "⚡", "🌟", "🏆", "🎪", "🎨", "🎭", "🎪"
];

export const ServiceTypeCRUD: React.FC = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  
  // Loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Form data for service types
  const [formData, setFormData] = useState({
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

  // Real-time subscriptions
  useEffect(() => {
    const subscription = supabase
      .channel('service_types_crud')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'service_types' },
        () => {
          console.log('🔄 Service types changed, refreshing...');
          fetchServiceTypes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all data on component mount
  useEffect(() => {
    fetchServiceTypes();
  }, []);

  // Fetch service types from database
  const fetchServiceTypes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_types")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setServiceTypes(data || []);
      console.log('✅ Fetched service types:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching service types:', error);
      setError("Failed to fetch service types");
      toast({
        title: "Error",
        description: "Failed to fetch service types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Create or update service type
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("saving");

    try {
      const isEditing = !!editingServiceType;
      const serviceTypeData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ""),
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from("service_types")
          .update(serviceTypeData)
          .eq("id", editingServiceType.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Service type updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("service_types")
          .insert([serviceTypeData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Service type created successfully",
        });
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('❌ Error saving service type:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save service type",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Delete service type
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service type? This action cannot be undone.")) {
      return;
    }

    setActionLoading(`deleting-${id}`);

    try {
      const { error } = await supabase
        .from("service_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Service type deleted successfully",
      });
    } catch (error: any) {
      console.error('❌ Error deleting service type:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete service type",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle service type active status
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(`toggling-${id}`);

    try {
      const { error } = await supabase
        .from("service_types")
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Service type ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('❌ Error toggling service type status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update service type status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Update sort order
  const updateSortOrder = async (id: string, direction: 'up' | 'down') => {
    setActionLoading(`sorting-${id}`);

    try {
      const currentItem = serviceTypes.find(st => st.id === id);
      if (!currentItem) return;

      const newSortOrder = direction === 'up' 
        ? Math.max(0, currentItem.sort_order - 1)
        : currentItem.sort_order + 1;

      const { error } = await supabase
        .from("service_types")
        .update({ 
          sort_order: newSortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Sort order updated successfully",
      });
    } catch (error: any) {
      console.error('❌ Error updating sort order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update sort order",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      description: "",
      icon: "📦",
      color: "from-gray-500 to-gray-600",
      features: ["", "", ""],
      image_url: "",
      is_active: true,
      sort_order: serviceTypes.length,
    });
    setEditingServiceType(null);
  };

  // Open edit modal
  const openEditModal = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType);
    setFormData({
      id: serviceType.id,
      title: serviceType.title,
      description: serviceType.description || "",
      icon: serviceType.icon,
      color: serviceType.color,
      features: serviceType.features.length > 0 ? serviceType.features : ["", "", ""],
      image_url: serviceType.image_url || "",
      is_active: serviceType.is_active,
      sort_order: serviceType.sort_order,
    });
    setIsModalOpen(true);
  };

  // Filter service types based on search and status
  const filteredServiceTypes = serviceTypes.filter(serviceType => {
    const matchesSearch = serviceType.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serviceType.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serviceType.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && serviceType.is_active) ||
                         (statusFilter === "inactive" && !serviceType.is_active);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading service types...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={() => fetchServiceTypes()} 
            variant="outline" 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Service Type Management</h2>
          <p className="text-muted-foreground">
            Manage all service types with full CRUD operations
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service Type
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{serviceTypes.length}</div>
            <p className="text-xs text-muted-foreground">Total Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{serviceTypes.filter(st => st.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Active Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{serviceTypes.filter(st => !st.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Inactive Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {serviceTypes.length > 0 ? Math.round((serviceTypes.filter(st => st.is_active).length / serviceTypes.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Active Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search service types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={fetchServiceTypes}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Service Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Types ({filteredServiceTypes.length})</CardTitle>
          <CardDescription>
            Manage your service types with real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServiceTypes.map((serviceType) => (
                <TableRow key={serviceType.id}>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateSortOrder(serviceType.id, 'up')}
                        disabled={actionLoading === `sorting-${serviceType.id}`}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-mono">{serviceType.sort_order}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateSortOrder(serviceType.id, 'down')}
                        disabled={actionLoading === `sorting-${serviceType.id}`}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${serviceType.color} flex items-center justify-center text-white text-lg`}>
                        {serviceType.icon}
                      </div>
                      <div>
                        <div className="font-medium">{serviceType.title}</div>
                        <div className="text-sm text-muted-foreground">{serviceType.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {serviceType.description ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {serviceType.description}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No description</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {serviceType.features.slice(0, 2).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {serviceType.features.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{serviceType.features.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={serviceType.is_active ? "default" : "secondary"}>
                      {serviceType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditModal(serviceType)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleStatus(serviceType.id, serviceType.is_active)}
                          disabled={actionLoading === `toggling-${serviceType.id}`}
                        >
                          {serviceType.is_active ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(serviceType.id)}
                          disabled={actionLoading === `deleting-${serviceType.id}`}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredServiceTypes.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No service types found</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Type Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingServiceType ? "Edit Service Type" : "Add New Service Type"}
            </DialogTitle>
            <DialogDescription>
              Configure the service type details and settings.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">Service ID</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                  })}
                  placeholder="e.g., grocery-delivery"
                  required
                  disabled={!!editingServiceType}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    title: e.target.value 
                  })}
                  placeholder="e.g., Grocery Delivery"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  description: e.target.value 
                })}
                placeholder="Describe what this service offers..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {iconOptions.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ 
                        ...formData, 
                        icon 
                      })}
                      className="w-10 h-10 p-0"
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color Theme</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {colorOptions.map((color) => (
                    <div
                      key={color.value}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer border ${
                        formData.color === color.value ? 'border-primary' : 'border-gray-200'
                      }`}
                      onClick={() => setFormData({ 
                        ...formData, 
                        color: color.value 
                      })}
                    >
                      <div className={`w-6 h-6 rounded ${color.preview}`} />
                      <span className="text-sm">{color.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features (up to 3)</Label>
              {formData.features.map((feature, index) => (
                <Input
                  key={index}
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...formData.features];
                    newFeatures[index] = e.target.value;
                    setFormData({ 
                      ...formData, 
                      features: newFeatures 
                    });
                  }}
                  placeholder={`Feature ${index + 1}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    sort_order: parseInt(e.target.value) || 0 
                  })}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      is_active: checked 
                    })}
                  />
                  <Label htmlFor="is_active">
                    {formData.is_active ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading === "saving"}
              >
                {actionLoading === "saving" && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                {editingServiceType ? "Update Service Type" : "Create Service Type"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};


