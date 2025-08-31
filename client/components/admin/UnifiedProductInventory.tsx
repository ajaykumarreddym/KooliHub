import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeInventory } from "@/hooks/use-realtime";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { ProductManagement } from "./ProductManagement";
import { EnhancedProductModal } from "./EnhancedProductModal";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Filter,
  Download,
  MoreHorizontal,
  TrendingUp,
  ShoppingCart,
  Layers,
  BarChart3,
  Activity,
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
import { SafeTable } from "@/components/common/SafeTableWrapper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  category_id: string;
  categories?: {
    name: string;
  } | null;
  sku: string | null;
  brand: string | null;
  created_at: string;
}

export const UnifiedProductInventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const { products: realtimeProducts, loading } = useRealtimeInventory();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    activeProducts: 0,
    inactiveProducts: 0,
  });

  // Convert realtime products to match expected format
  const products = useMemo(
    () =>
      realtimeProducts.map((product) => ({
        ...product,
        categories: product.categories,
      })),
    [realtimeProducts],
  );

  useEffect(() => {
    calculateStats();
  }, [products]);

  const calculateStats = useCallback(() => {
    if (!products.length) return;

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const inactiveProducts = products.filter((p) => !p.is_active).length;
    const lowStockProducts = products.filter(
      (p) => p.stock_quantity > 0 && p.stock_quantity < 20,
    ).length;
    const outOfStockProducts = products.filter(
      (p) => p.stock_quantity === 0,
    ).length;
    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.price) * p.stock_quantity,
      0,
    );

    setStats({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      activeProducts,
      inactiveProducts,
    });
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.categories?.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (product.sku || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (product.brand || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
    [products, searchTerm],
  );

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (stock < 20) return <Badge variant="secondary">Low Stock</Badge>;
    return <Badge variant="default">In Stock</Badge>;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeleteLoading(productId);

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const StatsOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalProducts}
                </p>
                <p className="text-sm text-blue-700 font-medium">
                  Total Products
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {stats.activeProducts}
                </p>
                <p className="text-sm text-green-700 font-medium">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-600 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.inactiveProducts}
                </p>
                <p className="text-sm text-gray-700 font-medium">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.lowStockProducts}
                </p>
                <p className="text-sm text-orange-700 font-medium">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">
                  {stats.outOfStockProducts}
                </p>
                <p className="text-sm text-red-700 font-medium">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {formatPrice(stats.totalValue)}
                </p>
                <p className="text-sm text-purple-700 font-medium">
                  Total Value
                </p>
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
          <CardDescription>Common inventory management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowEnhancedModal(true)}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("inventory")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Inventory
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter Products
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity or Low Stock Alert */}
      {stats.lowStockProducts > 0 || stats.outOfStockProducts > 0 ? (
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
      ) : null}
    </div>
  );

  const InventoryManagement = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name, category, SKU, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              onClick={() => setShowEnhancedModal(true)}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Real-time inventory tracking and stock management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first product to the inventory.
              </p>
              <Button onClick={() => setShowEnhancedModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <SafeTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              {product.sku && `SKU: ${product.sku}`}
                              {product.brand && ` | ${product.brand}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {product.categories?.name || "No Category"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatPrice(Number(product.price))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {product.stock_quantity}
                          </span>
                          {getStockBadge(product.stock_quantity)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.is_active)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(product.created_at)}
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
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deleteLoading === product.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deleteLoading === product.id
                                ? "Deleting..."
                                : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SafeTable>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Products & Inventory
            </h1>
            <p className="text-gray-600 mt-1">Loading...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            Products & Inventory
          </h1>
          <p className="text-gray-600 mt-1">
            Unified product and inventory management system
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-gray-50 border-gray-200 rounded-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowEnhancedModal(true)}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 rounded-lg"
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
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatsOverview />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventoryManagement />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Manage product categories and organize your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Category management interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Product Modal */}
      <EnhancedProductModal
        isOpen={showEnhancedModal}
        onClose={() => setShowEnhancedModal(false)}
        onSuccess={() => {
          /* Products will update automatically via realtime */
        }}
        mode="add"
      />

      {/* Edit Product Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and settings
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => {
                    if (editingProduct) {
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                      });
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.price}
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({
                          ...editingProduct,
                          price: parseFloat(e.target.value) || 0,
                        });
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({
                          ...editingProduct,
                          stock_quantity: parseInt(e.target.value) || 0,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={editingProduct.sku || ""}
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({
                          ...editingProduct,
                          sku: e.target.value,
                        });
                      }
                    }}
                    placeholder="Product SKU"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    value={editingProduct.brand || ""}
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({
                          ...editingProduct,
                          brand: e.target.value,
                        });
                      }
                    }}
                    placeholder="Brand name"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingProduct.is_active}
                  onCheckedChange={(checked) => {
                    if (editingProduct) {
                      setEditingProduct({
                        ...editingProduct,
                        is_active: checked,
                      });
                    }
                  }}
                />
                <Label>Active Product</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from("products")
                        .update({
                          name: editingProduct.name,
                          price: editingProduct.price,
                          stock_quantity: editingProduct.stock_quantity,
                          sku: editingProduct.sku,
                          brand: editingProduct.brand,
                          is_active: editingProduct.is_active,
                        })
                        .eq("id", editingProduct.id);

                      if (error) throw error;

                      setIsEditModalOpen(false);

                      toast({
                        title: "Success",
                        description: "Product updated successfully",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description:
                          error.message || "Failed to update product",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
