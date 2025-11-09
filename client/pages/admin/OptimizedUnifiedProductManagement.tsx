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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Hooks and utilities
import { useAdminData } from "@/contexts/AdminDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";

// Components
import { AddServiceAreaModal } from "@/components/admin/AddServiceAreaModal";
import { EditServiceAreaModal } from "@/components/admin/EditServiceAreaModal";
import { EnhancedProductModal } from "@/components/admin/EnhancedProductModal";

// Icons
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  Download,
  Edit,
  Layers,
  Map,
  MapPin,
  MoreHorizontal,
  Navigation,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  TrendingUp
} from "lucide-react";

// Types from AdminDataContext
interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  category_id: string;
  vendor_id: string;
  sku: string | null;
  brand: string | null;
  tags: string[];
  status: string;
  image_url: string | null;
  created_at: string;
  vendor?: { id: string; name: string };
  category?: { id: string; name: string; service_type: string };
  variants?: any[];
}

interface ServiceArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  is_serviceable: boolean;
  service_types: string[];
  delivery_time_hours: number | null;
  delivery_charge: number | null;
  coordinates: any;
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
  image_url: string | null;
  created_at: string;
}

export const UnifiedProductManagement: React.FC = () => {
  const { user, isAuthenticated, isAdminUser } = useAuth();
  
  // 🚀 OPTIMIZED: Get data from cached context - NO re-fetching on tab switches!
  const {
    products,
    serviceAreas,
    serviceTypes,
    categories,
    vendors,
    loading,
    refreshProducts,
    refreshServiceAreas,
    refreshServiceTypes,
    refreshCategories,
    refreshVendors,
    isDataLoaded,
    getCacheStats
  } = useAdminData();
  
  // UI state only - no data fetching logic here
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [formLoading, setFormLoading] = useState(false);
  
  // Modal states
  const [showEnhancedProductModal, setShowEnhancedProductModal] = useState(false);
  const [showAddServiceAreaModal, setShowAddServiceAreaModal] = useState(false);
  const [showEditServiceAreaModal, setShowEditServiceAreaModal] = useState(false);
  const [showAddServiceTypeModal, setShowAddServiceTypeModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  
  // Edit states
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    totalAreas: 0,
    activeAreas: 0,
    totalStates: 0,
    avgDeliveryTime: 0,
    totalCategories: 0,
    activeCategories: 0,
    totalServiceTypes: 0,
  });

  // Form states
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

  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    service_type: "",
    is_active: true,
    sort_order: 0,
    image_url: "",
  });

  // 🚀 PERFORMANCE: Debug tab switching without re-fetching
  useEffect(() => {
    if (isDataLoaded) {
      console.log(`📊 Tab switched to: ${activeTab} (no re-fetch needed!)`);
      console.log('📈 Cache stats:', getCacheStats());
    }
  }, [activeTab, isDataLoaded, getCacheStats]);

  // Calculate stats when data changes (memoized for performance)
  const calculateStats = useCallback(() => {
    if (!isDataLoaded) return;

    // Product stats
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.is_active).length;
    const lowStockProducts = products.filter(
      p => p.stock_quantity > 0 && p.stock_quantity < 20
    ).length;
    const outOfStockProducts = products.filter(
      p => p.stock_quantity === 0
    ).length;
    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.price) * p.stock_quantity, 0
    );

    // Service area stats
    const totalAreas = serviceAreas.length;
    const activeAreas = serviceAreas.filter(a => a.is_serviceable).length;
    const uniqueStates = new Set(serviceAreas.map(a => a.state)).size;
    const validDeliveryTimes = serviceAreas.filter(a => a.delivery_time_hours !== null);
    const avgDeliveryTime = validDeliveryTimes.length > 0
      ? Math.round(
          validDeliveryTimes.reduce((sum, a) => sum + (a.delivery_time_hours || 0), 0) /
          validDeliveryTimes.length
        )
      : 0;

    // Category and service type stats
    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.is_active).length;
    const totalServiceTypes = serviceTypes.filter(st => st.is_active).length;

    setStats({
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      totalAreas,
      activeAreas,
      totalStates: uniqueStates,
      avgDeliveryTime,
      totalCategories,
      activeCategories,
      totalServiceTypes,
    });
  }, [products, serviceAreas, categories, serviceTypes, isDataLoaded]);

  // Trigger stats calculation when data changes
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // 🚀 OPTIMIZED: Manual refresh functions for specific use cases only
  const handleManualRefresh = useCallback(async (dataType: string) => {
    console.log(`🔄 Manual refresh requested for: ${dataType}`);
    switch (dataType) {
      case 'products':
        await refreshProducts();
        break;
      case 'serviceAreas':
        await refreshServiceAreas();
        break;
      case 'serviceTypes':
        await refreshServiceTypes();
        break;
      case 'categories':
        await refreshCategories();
        break;
      case 'vendors':
        await refreshVendors();
        break;
      default:
        console.log('Unknown data type for refresh:', dataType);
    }
  }, [refreshProducts, refreshServiceAreas, refreshServiceTypes, refreshCategories, refreshVendors]);

  // 🚀 MEMOIZED: Filter functions to prevent unnecessary re-calculations
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVendor = vendorFilter === "all" || product.vendor_id === vendorFilter;
      const matchesServiceType = selectedServiceType === "all" || 
        product.category?.service_type === selectedServiceType;
      return matchesSearch && matchesVendor && matchesServiceType;
    });
  }, [products, searchTerm, vendorFilter, selectedServiceType]);

  const filteredServiceAreas = useMemo(() => {
    return serviceAreas.filter(area =>
      area.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.pincode.includes(searchTerm) ||
      area.state.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [serviceAreas, searchTerm]);

  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchesSearch = 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesServiceType = selectedServiceType === "all" || 
        category.service_type === selectedServiceType;
      return matchesSearch && matchesServiceType;
    });
  }, [categories, searchTerm, selectedServiceType]);

  // Utility functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (stock < 20) return <Badge variant="secondary">Low Stock</Badge>;
    return <Badge variant="default">In Stock</Badge>;
  };

  // Event handlers
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    setDeleteLoading(productId);
    try {
      const response = await authenticatedFetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Success", description: "Product deleted successfully" });
        handleManualRefresh('products');
      } else {
        const errorData = await response.json();
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to delete product",
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ 
        title: "Error", 
        description: "Error deleting product",
        variant: "destructive" 
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteServiceArea = async (areaId: string) => {
    if (!window.confirm("Are you sure you want to delete this service area?")) return;

    setDeleteLoading(areaId);
    try {
      const { error } = await supabase
        .from("serviceable_areas")
        .delete()
        .eq("id", areaId);

      if (error) throw error;

      toast({ title: "Success", description: "Service area deleted successfully" });
      handleManualRefresh('serviceAreas');
    } catch (error: any) {
      console.error("Error deleting service area:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete service area",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    setDeleteLoading(categoryId);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      toast({ title: "Success", description: "Category deleted successfully" });
      handleManualRefresh('categories');
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

    const existingService = serviceTypes.find(
      service => service.id === serviceTypeFormData.id
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
      setFormLoading(true);
      const { data, error } = await supabase
        .from("service_types")
        .insert([{
          id: serviceTypeFormData.id,
          title: serviceTypeFormData.title,
          description: serviceTypeFormData.description || null,
          icon: serviceTypeFormData.icon || "📦",
          color: serviceTypeFormData.color,
          features: serviceTypeFormData.features.filter(f => f.trim() !== ""),
          image_url: serviceTypeFormData.image_url || null,
          is_active: serviceTypeFormData.is_active,
          sort_order: serviceTypeFormData.sort_order,
        }])
        .select();

      if (error) throw error;

      toast({ title: "Success", description: "Service type added successfully" });

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

      setShowAddServiceTypeModal(false);
      handleManualRefresh('serviceTypes');
    } catch (error: any) {
      console.error("Error saving service type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save service type",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryFormData.name || !categoryFormData.service_type) {
      toast({
        title: "Error",
        description: "Please provide name and service type for the category",
        variant: "destructive",
      });
      return;
    }

    try {
      setFormLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .insert([{
          name: categoryFormData.name,
          description: categoryFormData.description || null,
          service_type: categoryFormData.service_type,
          is_active: categoryFormData.is_active,
          sort_order: categoryFormData.sort_order,
          image_url: categoryFormData.image_url || null,
        }])
        .select();

      if (error) throw error;

      toast({ title: "Success", description: "Category added successfully" });

      setCategoryFormData({
        name: "",
        description: "",
        service_type: "",
        is_active: true,
        sort_order: 0,
        image_url: "",
      });

      setShowAddCategoryModal(false);
      handleManualRefresh('categories');
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Overview Component
  const OverviewSection = () => (
    <div className="space-y-6">
      {/* Cache Status Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  🚀 Optimized Performance Mode
                </p>
                <p className="text-xs text-blue-700">
                  Data cached & real-time sync active • Total items: {getCacheStats().totalItems}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleManualRefresh('products')}
              disabled={loading.offerings}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {loading.offerings ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
                <p className="text-sm text-blue-700 font-medium">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.activeProducts}</p>
                <p className="text-sm text-green-700 font-medium">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {formatPrice(stats.totalValue)}
                </p>
                <p className="text-sm text-purple-700 font-medium">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900">{stats.activeAreas}</p>
                <p className="text-sm text-orange-700 font-medium">Service Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-900">{stats.totalCategories}</p>
                <p className="text-sm text-indigo-700 font-medium">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-600 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-900">{stats.totalServiceTypes}</p>
                <p className="text-sm text-pink-700 font-medium">Service Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Manage your product ecosystem efficiently (no loading delays!)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => setShowEnhancedProductModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddServiceAreaModal(true)}
              className="h-12"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Add Service Area
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddCategoryModal(true)}
              className="h-12"
            >
              <Tag className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddServiceTypeModal(true)}
              className="h-12"
            >
              <Settings className="h-4 w-4 mr-2" />
              Add Service Type
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {(stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Inventory Alerts
            </CardTitle>
            <CardDescription className="text-orange-700">
              Products requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.outOfStockProducts > 0 && (
                <div className="flex items-center gap-2 text-red-700">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">
                    {stats.outOfStockProducts} products are out of stock
                  </span>
                </div>
              )}
              {stats.lowStockProducts > 0 && (
                <div className="flex items-center gap-2 text-orange-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="font-medium">
                    {stats.lowStockProducts} products have low stock
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Products Section
  const ProductsSection = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Service Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Service Types</SelectItem>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.icon} {type.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowEnhancedProductModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>Manage your product catalog • Real-time sync active</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first product.
              </p>
              <Button onClick={() => setShowEnhancedProductModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.brand}
                          </div>
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {product.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {product.vendor?.name || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>{product.category?.name || "-"}</TableCell>
                    <TableCell>{getStatusBadge(product.is_active)}</TableCell>
                    <TableCell>{formatDate(product.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedProduct(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleteLoading === product.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteLoading === product.id ? "Deleting..." : "Delete"}
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
    </div>
  );

  // Service Areas Section
  const ServiceAreasSection = () => (
    <div className="space-y-6">
      {/* Area stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeAreas}</p>
                <p className="text-xs text-gray-500">Active Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAreas}</p>
                <p className="text-xs text-gray-500">Total Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgDeliveryTime}h</p>
                <p className="text-xs text-gray-500">Avg Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Map className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStates}</p>
                <p className="text-xs text-gray-500">States</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by city, pincode, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowAddServiceAreaModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service Area
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Areas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Areas ({filteredServiceAreas.length})</CardTitle>
          <CardDescription>Manage your delivery coverage zones • Real-time sync active</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredServiceAreas.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No service areas found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first service area.
              </p>
              <Button onClick={() => setShowAddServiceAreaModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service Area
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Delivery Time</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServiceAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{area.city}, {area.state}</p>
                          <p className="text-sm text-gray-500">
                            {area.pincode} | {area.country}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(area.is_serviceable)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {area.service_types.length > 0
                          ? area.service_types.slice(0, 2).join(", ")
                          : "All"}
                        {area.service_types.length > 2 &&
                          ` +${area.service_types.length - 2}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {area.delivery_time_hours ? `${area.delivery_time_hours}h` : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {area.delivery_charge ? formatPrice(area.delivery_charge) : "Free"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(area.updated_at)}
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
                            onClick={() => {
                              setEditingArea(area);
                              setShowEditServiceAreaModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Area
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteServiceArea(area.id)}
                            disabled={deleteLoading === area.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteLoading === area.id ? "Deleting..." : "Delete Area"}
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
    </div>
  );

  // Service Types & Categories Section
  const ServiceTypesSection = () => (
    <div className="space-y-6">
      {/* Stats */}
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
              <Settings className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalServiceTypes}</p>
                <p className="text-xs text-gray-500">Service Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Search */}
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
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Service Types</SelectItem>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.icon} {type.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowAddServiceTypeModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service Type
            </Button>
            <Button onClick={() => setShowAddCategoryModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({filteredCategories.length})</CardTitle>
          <CardDescription>Manage categories for all your services • Real-time sync active</CardDescription>
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
              <Button onClick={() => setShowAddCategoryModal(true)}>
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
                          {serviceTypes.find(st => st.id === category.service_type)?.icon || "📦"}
                        </span>
                        <span className="text-sm">
                          {serviceTypes.find(st => st.id === category.service_type)?.title || category.service_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(category.is_active)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{category.sort_order}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(category.created_at)}
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
                          <DropdownMenuItem onClick={() => {/* handle edit */}}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deleteLoading === category.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteLoading === category.id ? "Deleting..." : "Delete Category"}
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
    </div>
  );

  // 🚀 OPTIMIZED: Only show loading if data hasn't been loaded yet (not on tab switches)
  if (!isDataLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Product Management
            </h1>
            <p className="text-gray-600 mt-1">🚀 Loading optimized data cache...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-500">Setting up real-time sync & cache...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            🚀 Product Management
          </h1>
          <p className="text-gray-600 mt-1">
            Unified management • Optimized performance • Real-time sync active
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowEnhancedProductModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="service-areas" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Service Areas
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categories & Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewSection />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductsSection />
        </TabsContent>

        <TabsContent value="service-areas" className="space-y-6">
          <ServiceAreasSection />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <ServiceTypesSection />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EnhancedProductModal
        isOpen={showEnhancedProductModal}
        onClose={() => {
          setShowEnhancedProductModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          handleManualRefresh('products'); // Optimized refresh
          setShowEnhancedProductModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        mode={selectedProduct ? "edit" : "add"}
      />

      <AddServiceAreaModal
        isOpen={showAddServiceAreaModal}
        onClose={() => setShowAddServiceAreaModal(false)}
        onSuccess={() => {
          handleManualRefresh('serviceAreas'); // Optimized refresh
          setShowAddServiceAreaModal(false);
        }}
      />

      <EditServiceAreaModal
        isOpen={showEditServiceAreaModal}
        onClose={() => {
          setShowEditServiceAreaModal(false);
          setEditingArea(null);
        }}
        onSuccess={() => {
          handleManualRefresh('serviceAreas'); // Optimized refresh
          setShowEditServiceAreaModal(false);
          setEditingArea(null);
        }}
        area={editingArea}
      />

      {/* Add Service Type Modal */}
      <Dialog open={showAddServiceTypeModal} onOpenChange={setShowAddServiceTypeModal}>
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
                    setServiceTypeFormData(prev => ({
                      ...prev,
                      id: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    }))
                  }
                  placeholder="e.g., cleaning, beauty"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-title">Service Title *</Label>
                <Input
                  id="service-title"
                  value={serviceTypeFormData.title}
                  onChange={(e) =>
                    setServiceTypeFormData(prev => ({
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
                  setServiceTypeFormData(prev => ({
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
                    setServiceTypeFormData(prev => ({
                      ...prev,
                      icon: e.target.value,
                    }))
                  }
                  placeholder="🧹"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-sort_order">Sort Order</Label>
                <Input
                  id="service-sort_order"
                  type="number"
                  value={serviceTypeFormData.sort_order}
                  onChange={(e) =>
                    setServiceTypeFormData(prev => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="service-active"
                checked={serviceTypeFormData.is_active}
                onCheckedChange={(checked) =>
                  setServiceTypeFormData(prev => ({
                    ...prev,
                    is_active: checked,
                  }))
                }
              />
              <Label htmlFor="service-active">Active Service Type</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddServiceTypeModal(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddServiceType} disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Service Type"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for your services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Select
                value={categoryFormData.service_type}
                onValueChange={(value) =>
                  setCategoryFormData(prev => ({ ...prev, service_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={categoryFormData.description}
                onChange={(e) =>
                  setCategoryFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Category description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={categoryFormData.sort_order}
                  onChange={(e) =>
                    setCategoryFormData(prev => ({
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
                  checked={categoryFormData.is_active}
                  onCheckedChange={(checked) =>
                    setCategoryFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="active">Active Category</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddCategoryModal(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddCategory} disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
