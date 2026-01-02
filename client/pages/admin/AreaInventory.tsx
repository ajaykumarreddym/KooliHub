import { ProductAreaPricing } from "@/components/admin/ProductAreaPricing";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useAreaProducts,
  type AreaProductFilters,
} from "@/hooks/use-area-products";
import { formatCurrency } from "@/lib/payment-utils";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  IndianRupee,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Settings,
  Star,
  Tag,
  Trash2,
  TrendingDown,
  Truck
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface ServiceArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  is_serviceable: boolean;
  service_types: string[];
  delivery_time_hours: number;
  delivery_charge: number;
}

interface Category {
  id: string;
  name: string;
}

export const AreaInventory: React.FC = () => {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [filters, setFilters] = useState<AreaProductFilters>({
    available_only: false,
    sort_by: "priority",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const {
    products,
    loading: productsLoading,
    stats,
    refetch,
    getLowStockProducts,
    getPromotionalProducts,
    getDiscountedProducts,
  } = useAreaProducts(selectedArea, {
    ...filters,
    search: searchTerm,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load service areas
      const { data: areasData, error: areasError } = await supabase
        .from("serviceable_areas")
        .select("*")
        .eq("is_serviceable", true)
        .order("city");

      if (areasError) throw areasError;

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (categoriesError) throw categoriesError;

      setServiceAreas(areasData || []);
      setCategories(categoriesData || []);

      // Set first area as default
      if (areasData && areasData.length > 0) {
        setSelectedArea(areasData[0].id);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AreaProductFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !selectedArea) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from("service_area_products")
        .update({
          stock_quantity: editingProduct.stock_quantity,
          price_override: editingProduct.area_price,
          is_available: editingProduct.is_available,
          delivery_time_override: editingProduct.estimated_delivery_hours,
          priority_order: editingProduct.priority,
          location_notes: editingProduct.notes || null,
        })
        .eq("service_area_id", selectedArea)
        .eq("offering_id", editingProduct.id);

      if (error) throw error;

      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      refetch();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("service_area_products")
        .update({ is_available: !currentStatus })
        .eq("service_area_id", selectedArea)
        .eq("offering_id", productId);

      if (error) throw error;

      toast.success(`Product ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      refetch();
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error("Failed to update product");
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this product from this service area?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("service_area_products")
        .delete()
        .eq("service_area_id", selectedArea)
        .eq("offering_id", productId);

      if (error) throw error;

      toast.success("Product removed from service area");
      refetch();
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error("Failed to remove product");
    }
  };

  const exportData = () => {
    const selectedAreaInfo = serviceAreas.find(
      (area) => area.id === selectedArea,
    );
    if (!selectedAreaInfo || products.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvData = [
      [
        "Product Name",
        "Brand",
        "Category",
        "Base Price",
        "Area Price",
        "Stock",
        "Delivery Hours",
        "Status",
      ],
      ...products.map((product) => [
        product.name,
        product.brand,
        product.category_name,
        product.base_price,
        product.effective_price,
        product.stock_quantity,
        product.estimated_delivery_hours,
        product.is_available ? "Available" : "Unavailable",
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedAreaInfo.city}_inventory_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const lowStockProducts = getLowStockProducts();
  const promotionalProducts = getPromotionalProducts();
  const discountedProducts = getDiscountedProducts();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading inventory data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Area-Based Inventory
          </h1>
          <p className="text-gray-500 mt-1">
            Manage products, pricing, and availability by service area
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refetch}
            disabled={productsLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${productsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Area Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Area Selection
          </CardTitle>
          <CardDescription>
            Select a service area to view and manage area-specific inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={
                selectedArea && selectedArea.trim() !== ""
                  ? selectedArea
                  : undefined
              }
              onValueChange={setSelectedArea}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service area" />
              </SelectTrigger>
              <SelectContent>
                {serviceAreas
                  .filter((area) => area.id && area.id.trim() !== "")
                  .map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {area.city}, {area.state}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {area.pincode}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedArea && (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Delivery:{" "}
                    {
                      serviceAreas.find((a) => a.id === selectedArea)
                        ?.delivery_time_hours
                    }
                    h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Charge: ₹
                    {
                      serviceAreas.find((a) => a.id === selectedArea)
                        ?.delivery_charge
                    }
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedArea && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Stock</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.inStock}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Low Stock</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.lowStock}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Promotional</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.promotional}
                    </p>
                  </div>
                  <Tag className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Price</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.avgPrice)}
                    </p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(stats.totalValue)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products">Products Overview</TabsTrigger>
              <TabsTrigger value="pricing">Area Pricing</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Products in This Area</CardTitle>
                  <CardDescription>
                    View and manage product availability and pricing for the
                    selected service area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Select
                      value={
                        filters.category_id && filters.category_id.trim() !== ""
                          ? filters.category_id
                          : "all"
                      }
                      onValueChange={(value) =>
                        handleFilterChange(
                          "category_id",
                          value === "all" ? undefined : value,
                        )
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories
                          .filter(
                            (category) =>
                              category.id && category.id.trim() !== "",
                          )
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={
                        filters.sort_by && filters.sort_by.trim() !== ""
                          ? filters.sort_by
                          : "priority"
                      }
                      onValueChange={(value) =>
                        handleFilterChange("sort_by", value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price_low">
                          Price: Low to High
                        </SelectItem>
                        <SelectItem value="price_high">
                          Price: High to Low
                        </SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Products Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Pricing</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Delivery</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                              Loading products...
                            </TableCell>
                          </TableRow>
                        ) : products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500">
                                No products found for this area
                              </p>
                              <p className="text-sm text-gray-400">
                                Add products to this service area to start managing inventory
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {product.primary_image_url && (
                                    <img
                                      src={product.primary_image_url}
                                      alt={product.name}
                                      className="w-12 h-12 object-cover rounded-lg"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-gray-500">
                                      {product.brand} • {product.category_name}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {formatCurrency(product.effective_price)}
                                    </span>
                                    {product.is_promotional && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        PROMO
                                      </Badge>
                                    )}
                                  </div>
                                  {product.savings > 0 && (
                                    <p className="text-xs text-green-600">
                                      Save {formatCurrency(product.savings)}
                                    </p>
                                  )}
                                  {product.area_discount_percentage > 0 && (
                                    <p className="text-xs text-blue-600">
                                      {product.area_discount_percentage}% OFF
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    product.stock_quantity === 0
                                      ? "destructive"
                                      : product.stock_quantity <= 10
                                        ? "secondary"
                                        : "default"
                                  }
                                >
                                  {product.stock_quantity}
                                </Badge>
                                {product.stock_quantity <= 10 &&
                                  product.stock_quantity > 0 && (
                                    <p className="text-xs text-orange-600 mt-1">
                                      Low Stock
                                    </p>
                                  )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{product.estimated_delivery_hours}h</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    product.is_available
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {product.is_available
                                    ? "Available"
                                    : "Unavailable"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  <span className="text-sm">
                                    {product.priority}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingProduct(product);
                                        setIsEditDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleToggleAvailability(product.id, product.is_available)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      {product.is_available ? 'Disable' : 'Enable'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveProduct(product.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove from Area
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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

            <TabsContent value="pricing">
              <ProductAreaPricing serviceAreaId={selectedArea} />
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Low Stock Alert */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                      Low Stock Items ({lowStockProducts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm truncate">
                            {product.name}
                          </span>
                          <Badge variant="secondary">
                            {product.stock_quantity}
                          </Badge>
                        </div>
                      ))}
                      {lowStockProducts.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No low stock items
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Promotional Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <Tag className="h-5 w-5" />
                      Active Promotions ({promotionalProducts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {promotionalProducts.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm truncate">
                            {product.name}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {formatCurrency(product.promotional_price)}
                          </Badge>
                        </div>
                      ))}
                      {promotionalProducts.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No active promotions
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Discounted Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingDown className="h-5 w-5" />
                      Discounted Items ({discountedProducts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {discountedProducts.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm truncate">
                            {product.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {product.area_discount_percentage}% OFF
                          </Badge>
                        </div>
                      ))}
                      {discountedProducts.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No discounted items
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Area Performance Analytics
                  </CardTitle>
                  <CardDescription>
                    Analytics and insights for the selected service area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Price Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Under ₹100:</span>
                          <span className="text-sm font-medium">
                            {
                              products.filter((p) => p.effective_price < 100)
                                .length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">₹100 - ₹500:</span>
                          <span className="text-sm font-medium">
                            {
                              products.filter(
                                (p) =>
                                  p.effective_price >= 100 &&
                                  p.effective_price < 500,
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Above ₹500:</span>
                          <span className="text-sm font-medium">
                            {
                              products.filter((p) => p.effective_price >= 500)
                                .length
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Stock Levels</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Out of Stock:</span>
                          <span className="text-sm font-medium text-red-600">
                            {
                              products.filter((p) => p.stock_quantity === 0)
                                .length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Low Stock (��10):</span>
                          <span className="text-sm font-medium text-orange-600">
                            {
                              products.filter(
                                (p) =>
                                  p.stock_quantity > 0 &&
                                  p.stock_quantity <= 10,
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">
                            Well Stocked (&gt;10):
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            {
                              products.filter((p) => p.stock_quantity > 10)
                                .length
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product Details</DialogTitle>
            <DialogDescription>
              Update product settings for this service area
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {editingProduct.primary_image_url && (
                  <img
                    src={editingProduct.primary_image_url}
                    alt={editingProduct.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h4 className="font-semibold text-lg">{editingProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    {editingProduct.brand} • {editingProduct.category_name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Area Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editingProduct.area_price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        area_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={editingProduct.area_discount_percentage.toFixed(2)}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Auto-calculated from price difference
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery">Delivery Time (hours)</Label>
                  <Input
                    id="delivery"
                    type="number"
                    value={editingProduct.estimated_delivery_hours}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        estimated_delivery_hours: parseInt(e.target.value) || 24,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Order</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={editingProduct.priority}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="space-y-2 flex items-center justify-between pt-6">
                  <Label htmlFor="available">Product Available</Label>
                  <Switch
                    id="available"
                    checked={editingProduct.is_available}
                    onCheckedChange={(checked) =>
                      setEditingProduct({
                        ...editingProduct,
                        is_available: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-sm mb-2">Price Calculation</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">{formatCurrency(editingProduct.base_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area Price:</span>
                    <span className="font-medium">{formatCurrency(editingProduct.area_price)}</span>
                  </div>
                  {editingProduct.base_price > editingProduct.area_price && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Savings:</span>
                        <span>-{formatCurrency(editingProduct.base_price - editingProduct.area_price)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>{editingProduct.area_discount_percentage.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t text-blue-600 font-semibold">
                        <span>Final Price:</span>
                        <span>{formatCurrency(editingProduct.area_price)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={updating}>
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AreaInventory;
