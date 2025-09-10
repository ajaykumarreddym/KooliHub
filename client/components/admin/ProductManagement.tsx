import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { useRealtimeProducts } from "@/hooks/use-realtime-products";
import { authenticatedFetch, vendorApi } from "@/lib/api";
import type {
    Category,
    Product,
    Vendor
} from "@shared/api";
import {
    DollarSign,
    Edit,
    Grid3X3,
    Package,
    Plus,
    Store,
    Trash2
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { EnhancedProductModal } from "./EnhancedProductModal";

interface ProductManagementProps {
  className?: string;
}

export function ProductManagement({ className }: ProductManagementProps) {
  const { products, loading: productsLoading } = useRealtimeProducts();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVariantsDialog, setShowVariantsDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [enhancedModalMode, setEnhancedModalMode] = useState<"add" | "edit">(
    "add",
  );

  const [formData, setFormData] = useState({
    vendor_id: "",
    name: "",
    slug: "",
    description: "",
    category_id: "",
    brand: "",
    tags: [] as string[],
    status: "active",
    meta_title: "",
    meta_description: "",
  });

  const [variantFormData, setVariantFormData] = useState({
    sku: "",
    name: "",
    description: "",
    unit: "piece",
    weight: 0,
    dimensions: {} as Record<string, any>,
    attributes: {} as Record<string, any>,
    is_default: false,
  });

  useEffect(() => {
    fetchVendors();
    fetchCategories();
  }, []);

  const fetchVendors = async () => {
    try {
      const result = await vendorApi.getAll();
      if (result.success) {
        setVendors(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authenticatedFetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        console.error("Failed to fetch categories:", response.status);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = selectedProduct
        ? `/api/admin/products/${selectedProduct.id}`
        : "/api/admin/products";
      const method = selectedProduct ? "PUT" : "POST";

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          tags: Array.isArray(formData.tags)
            ? formData.tags
            : formData.tags
                .toString()
                .split(",")
                .map((t) => t.trim()),
        }),
      });

      if (response.ok) {
        toast.success(
          selectedProduct
            ? "Product updated successfully"
            : "Product created successfully",
        );
        resetForm();
        setShowEditDialog(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error saving product");
    }
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const response = await authenticatedFetch(
        `/api/admin/products/${selectedProduct.id}/variants`,
        {
          method: "POST",
          body: JSON.stringify(variantFormData),
        },
      );

      if (response.ok) {
        toast.success("Variant created successfully");
        resetVariantForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create variant");
      }
    } catch (error) {
      console.error("Error creating variant:", error);
      toast.error("Error creating variant");
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const response = await authenticatedFetch(
        `/api/admin/products/${productId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("Product deleted successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error deleting product");
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_id: "",
      name: "",
      slug: "",
      description: "",
      category_id: "",
      brand: "",
      tags: [],
      status: "active",
      meta_title: "",
      meta_description: "",
    });
    setSelectedProduct(null);
  };

  const resetVariantForm = () => {
    setVariantFormData({
      sku: "",
      name: "",
      description: "",
      unit: "piece",
      weight: 0,
      dimensions: {},
      attributes: {},
      is_default: false,
    });
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      vendor_id: product.vendor_id,
      name: product.name,
      slug: product.slug || "",
      description: product.description || "",
      category_id: product.category_id || "",
      brand: product.brand || "",
      tags: product.tags || [],
      status: product.status || "active",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
    });
    setShowEditDialog(true);
  };

  const openVariantsDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowVariantsDialog(true);
  };

  const openPricingDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowPricingDialog(true);
  };

  const openEnhancedAddDialog = () => {
    setSelectedProduct(null);
    setEnhancedModalMode("add");
    setShowEnhancedModal(true);
  };

  const openEnhancedEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setEnhancedModalMode("edit");
    setShowEnhancedModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor =
      vendorFilter === "all" || product.vendor_id === vendorFilter;
    const matchesCategory =
      categoryFilter === "all" || product.category_id === categoryFilter;
    return matchesSearch && matchesVendor && matchesCategory;
  });

  const ProductForm = React.memo(() => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vendor_id">Vendor *</Label>
          <Select
            value={formData.vendor_id}
            onValueChange={(value) =>
              setFormData({ ...formData, vendor_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) =>
              setFormData({ ...formData, category_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({
                ...formData,
                name,
                slug: generateSlug(name),
              });
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) =>
              setFormData({ ...formData, brand: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={
            Array.isArray(formData.tags)
              ? formData.tags.join(", ")
              : formData.tags
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              tags: e.target.value.split(",").map((t) => t.trim()),
            })
          }
          placeholder="electronics, smartphone, android"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="meta_title">Meta Title (SEO)</Label>
          <Input
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) =>
              setFormData({ ...formData, meta_title: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="meta_description">Meta Description (SEO)</Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) =>
              setFormData({ ...formData, meta_description: e.target.value })
            }
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm();
            setShowEditDialog(false);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {selectedProduct ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  ));

  const VariantsDialog = () => (
    <Dialog open={showVariantsDialog} onOpenChange={setShowVariantsDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Variants - {selectedProduct?.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">Variants List</TabsTrigger>
            <TabsTrigger value="add">Add Variant</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProduct?.variants?.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-mono">{variant.sku}</TableCell>
                      <TableCell>{variant.name}</TableCell>
                      <TableCell>{variant.unit}</TableCell>
                      <TableCell>
                        {variant.weight ? `${variant.weight}kg` : "-"}
                      </TableCell>
                      <TableCell>
                        {variant.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={variant.is_active ? "default" : "secondary"}
                        >
                          {variant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="variant_sku">SKU *</Label>
                  <Input
                    id="variant_sku"
                    value={variantFormData.sku}
                    onChange={(e) =>
                      setVariantFormData({
                        ...variantFormData,
                        sku: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="variant_name">Variant Name *</Label>
                  <Input
                    id="variant_name"
                    value={variantFormData.name}
                    onChange={(e) =>
                      setVariantFormData({
                        ...variantFormData,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="variant_description">Description</Label>
                <Textarea
                  id="variant_description"
                  value={variantFormData.description}
                  onChange={(e) =>
                    setVariantFormData({
                      ...variantFormData,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="variant_unit">Unit</Label>
                  <Select
                    value={variantFormData.unit}
                    onValueChange={(value) =>
                      setVariantFormData({ ...variantFormData, unit: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="gram">Gram</SelectItem>
                      <SelectItem value="liter">Liter</SelectItem>
                      <SelectItem value="ml">Milliliter</SelectItem>
                      <SelectItem value="meter">Meter</SelectItem>
                      <SelectItem value="cm">Centimeter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="variant_weight">Weight (kg)</Label>
                  <Input
                    id="variant_weight"
                    type="number"
                    step="0.001"
                    min="0"
                    value={variantFormData.weight}
                    onChange={(e) =>
                      setVariantFormData({
                        ...variantFormData,
                        weight: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="variant_default"
                    checked={variantFormData.is_default}
                    onChange={(e) =>
                      setVariantFormData({
                        ...variantFormData,
                        is_default: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="variant_default">
                    Set as default variant
                  </Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetVariantForm}
                >
                  Clear
                </Button>
                <Button type="submit">Add Variant</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Management
              </CardTitle>
              <CardDescription>
                Manage products and their variants across all vendors
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={openEnhancedAddDialog}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
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
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {product.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.tags.length - 2}
                                  </Badge>
                                )}
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
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVariantsDialog(product)}
                        >
                          {product.variants?.length || 0} variants
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.is_active ? "default" : "secondary"}
                        >
                          {product.status ||
                            (product.is_active ? "Active" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(product.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openVariantsDialog(product)}
                          >
                            <Grid3X3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPricingDialog(product)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEnhancedEditDialog(product)}
                            className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Product
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  {product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(product.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm />
        </DialogContent>
      </Dialog>

      {/* Variants Dialog */}
      <VariantsDialog />

      {/* Pricing Dialog (placeholder) */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Pricing Management - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            Pricing management interface will be implemented here
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Product Modal */}
      <EnhancedProductModal
        isOpen={showEnhancedModal}
        onClose={() => setShowEnhancedModal(false)}
        onSuccess={() => {}}
        product={selectedProduct}
        mode={enhancedModalMode}
      />
    </div>
  );
}
