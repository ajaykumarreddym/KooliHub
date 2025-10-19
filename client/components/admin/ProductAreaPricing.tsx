import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { formatCurrency } from "@/lib/payment-utils";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  CheckCircle,
  Edit,
  IndianRupee,
  Package,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  brand: string;
  category_name: string;
}

interface ServiceArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  delivery_time_hours: number;
  delivery_charge: number;
}

interface ProductAreaPricing {
  id: string;
  product_id: string;
  service_area_id: string;
  area_price: number;
  area_original_price: number;
  area_discount_percentage: number;
  stock_quantity: number;
  max_order_quantity: number;
  estimated_delivery_hours: number;
  delivery_charge: number;
  handling_charge: number;
  is_available: boolean;
  is_active: boolean;
  priority: number;
  promotional_price: number;
  promo_start_date: string;
  promo_end_date: string;
  tier_pricing: any;
  notes: string;
  product: Product;
  service_area: ServiceArea;
}

interface ProductAreaPricingProps {
  productId?: string;
  serviceAreaId?: string;
}

export const ProductAreaPricing: React.FC<ProductAreaPricingProps> = ({
  productId,
  serviceAreaId,
}) => {
  const [pricingData, setPricingData] = useState<ProductAreaPricing[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>(
    productId || "all",
  );
  const [selectedArea, setSelectedArea] = useState<string>(
    serviceAreaId || "all",
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductAreaPricing | null>(
    null,
  );
  const [formData, setFormData] = useState({
    product_id: "",
    service_area_id: "",
    area_price: 0,
    area_original_price: 0,
    area_discount_percentage: 0,
    stock_quantity: 0,
    max_order_quantity: 100,
    estimated_delivery_hours: 24,
    delivery_charge: 0,
    handling_charge: 0,
    is_available: true,
    is_active: true,
    priority: 1,
    promotional_price: 0,
    promo_start_date: "",
    promo_end_date: "",
    notes: "",
    tier_pricing: {
      tier1: { min_qty: 5, price: 0 },
      tier2: { min_qty: 10, price: 0 },
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (
      (selectedProduct && selectedProduct !== "all") ||
      (selectedArea && selectedArea !== "all")
    ) {
      loadPricingData();
    }
  }, [selectedProduct, selectedArea]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load products from offerings table
      const { data: productsData, error: productsError } = await supabase
        .from("offerings")
        .select(`
          id, 
          name, 
          base_price,
          category_id,
          categories!inner(name)
        `)
        .eq("is_active", true)
        .order("name");

      if (productsError) throw productsError;

      // Load service areas
      const { data: areasData, error: areasError } = await supabase
        .from("serviceable_areas")
        .select(
          "id, pincode, city, state, delivery_time_hours, delivery_charge",
        )
        .eq("is_serviceable", true)
        .order("city");

      if (areasError) throw areasError;

      setProducts(
        productsData?.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.base_price) || 0,
          brand: "", // Brand not available in offerings table
          category_name: p.categories?.name || "Uncategorized",
        })) || [],
      );

      setServiceAreas(areasData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPricingData = async () => {
    try {
      let query = supabase.from("service_area_products").select(`
          *,
          offerings!inner(id, name, base_price, categories(name)),
          serviceable_areas!inner(id, pincode, city, state, delivery_time_hours, delivery_charge)
        `);

      if (selectedProduct && selectedProduct !== "all") {
        query = query.eq("offering_id", selectedProduct);
      }

      if (selectedArea && selectedArea !== "all") {
        query = query.eq("service_area_id", selectedArea);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      setPricingData(
        data?.map((item) => ({
          id: item.id,
          product_id: item.offering_id,
          service_area_id: item.service_area_id,
          area_price: Number(item.price_override || item.offerings?.base_price || 0),
          area_original_price: Number(item.offerings?.base_price || 0),
          area_discount_percentage: 0,
          stock_quantity: item.stock_quantity || 0,
          max_order_quantity: item.max_order_quantity || 100,
          estimated_delivery_hours: item.delivery_time_override || 24,
          delivery_charge: 0,
          handling_charge: 0,
          is_available: item.is_available !== false,
          is_active: true,
          priority: item.priority_order || 1,
          promotional_price: 0,
          promo_start_date: "",
          promo_end_date: "",
          tier_pricing: {},
          notes: item.location_notes || "",
          product: {
            id: item.offerings.id,
            name: item.offerings.name,
            price: Number(item.offerings.base_price) || 0,
            brand: "",
            category_name: item.offerings.categories?.name || "Uncategorized",
          },
          service_area: item.serviceable_areas,
        })) || [],
      );
    } catch (error) {
      console.error("Error loading pricing data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to load pricing data: ${errorMessage}`);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.product_id || !formData.service_area_id) {
        toast.error("Please select both product and service area");
        return;
      }

      const dataToSave = {
        offering_id: formData.product_id,
        service_area_id: formData.service_area_id,
        price_override: formData.area_price,
        stock_quantity: formData.stock_quantity,
        max_order_quantity: formData.max_order_quantity,
        min_order_quantity: 1,
        delivery_time_override: formData.estimated_delivery_hours,
        is_available: formData.is_available,
        priority_order: formData.priority,
        location_notes: formData.notes || null,
        is_featured: false,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("service_area_products")
          .update(dataToSave)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Pricing updated successfully");
      } else {
        const { error } = await supabase
          .from("service_area_products")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Pricing added successfully");
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      loadPricingData();
      resetForm();
    } catch (error: any) {
      console.error("Error saving pricing:", error);
      if (error.code === "23505") {
        toast.error("Pricing already exists for this product-area combination");
      } else {
        const errorMessage = error?.message || "Unknown error occurred";
        toast.error(`Failed to save pricing: ${errorMessage}`);
      }
    }
  };

  const handleEdit = (item: ProductAreaPricing) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id,
      service_area_id: item.service_area_id,
      area_price: item.area_price,
      area_original_price: item.area_original_price || item.area_price,
      area_discount_percentage: item.area_discount_percentage || 0,
      stock_quantity: item.stock_quantity,
      max_order_quantity: item.max_order_quantity,
      estimated_delivery_hours: item.estimated_delivery_hours,
      delivery_charge: item.delivery_charge,
      handling_charge: item.handling_charge,
      is_available: item.is_available,
      is_active: item.is_active,
      priority: item.priority,
      promotional_price: item.promotional_price || 0,
      promo_start_date: item.promo_start_date?.split("T")[0] || "",
      promo_end_date: item.promo_end_date?.split("T")[0] || "",
      notes: item.notes || "",
      tier_pricing:
        typeof item.tier_pricing === "string"
          ? JSON.parse(item.tier_pricing || "{}")
          : item.tier_pricing || {
              tier1: { min_qty: 5, price: 0 },
              tier2: { min_qty: 10, price: 0 },
            },
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing rule?")) return;

    try {
      const { error } = await supabase
        .from("service_area_products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Pricing deleted successfully");
      loadPricingData();
    } catch (error) {
      console.error("Error deleting pricing:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to delete pricing: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: selectedProduct === "all" ? "" : selectedProduct,
      service_area_id: selectedArea === "all" ? "" : selectedArea,
      area_price: 0,
      area_original_price: 0,
      area_discount_percentage: 0,
      stock_quantity: 0,
      max_order_quantity: 100,
      estimated_delivery_hours: 24,
      delivery_charge: 0,
      handling_charge: 0,
      is_available: true,
      is_active: true,
      priority: 1,
      promotional_price: 0,
      promo_start_date: "",
      promo_end_date: "",
      notes: "",
      tier_pricing: {
        tier1: { min_qty: 5, price: 0 },
        tier2: { min_qty: 10, price: 0 },
      },
    });
  };

  const filteredData = useMemo(() => {
    return pricingData.filter(
      (item) =>
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.service_area?.city
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.service_area?.pincode.includes(searchTerm),
    );
  }, [pricingData, searchTerm]);

  const stats = useMemo(() => {
    const total = pricingData.length;
    const active = pricingData.filter(
      (p) => p.is_active && p.is_available,
    ).length;
    const lowStock = pricingData.filter((p) => p.stock_quantity < 10).length;
    const avgPrice =
      total > 0
        ? pricingData.reduce((sum, p) => sum + p.area_price, 0) / total
        : 0;

    return { total, active, lowStock, avgPrice };
  }, [pricingData]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pricing Rules</p>
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
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
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
              <AlertCircle className="h-8 w-8 text-orange-600" />
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
              <IndianRupee className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product Area Pricing Management
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    setEditingItem(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pricing Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit" : "Add"} Product Area Pricing
                  </DialogTitle>
                  <DialogDescription>
                    Configure product pricing, availability, and logistics for
                    specific service areas
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select
                          value={formData.product_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, product_id: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products
                              .filter(
                                (product) =>
                                  product.id && product.id.trim() !== "",
                              )
                              .map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {product.brand} (
                                  {formatCurrency(product.price)})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Service Area</Label>
                        <Select
                          value={formData.service_area_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, service_area_id: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service area" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceAreas
                              .filter(
                                (area) => area.id && area.id.trim() !== "",
                              )
                              .map((area) => (
                                <SelectItem key={area.id} value={area.id}>
                                  {area.city}, {area.state} - {area.pincode}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stock Quantity</Label>
                        <Input
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stock_quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Order Quantity</Label>
                        <Input
                          type="number"
                          value={formData.max_order_quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              max_order_quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.is_available}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_available: checked })
                          }
                        />
                        <Label>Available</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_active: checked })
                          }
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Area Price (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.area_price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              area_price: parseFloat(e.target.value) || 0,
                            })
                          }
                          min="0"
                          placeholder="Custom price for this area"
                        />
                        <p className="text-xs text-gray-500">
                          Leave empty to use base product price
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Delivery Time (hours)</Label>
                        <Input
                          type="number"
                          value={formData.estimated_delivery_hours}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              estimated_delivery_hours:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                          placeholder="24"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stock Quantity</Label>
                        <Input
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stock_quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Order Quantity</Label>
                        <Input
                          type="number"
                          value={formData.max_order_quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              max_order_quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          min="1"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Priority (1-10)</Label>
                      <Input
                        type="number"
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priority: parseInt(e.target.value) || 1,
                          })
                        }
                        min="1"
                        max="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Any special notes for this area-product combination..."
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingItem ? "Update" : "Create"} Pricing Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by product name, city, or pincode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select
                value={
                  selectedProduct && selectedProduct.trim() !== ""
                    ? selectedProduct
                    : "all"
                }
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products
                    .filter((product) => product.id && product.id.trim() !== "")
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={
                  selectedArea && selectedArea.trim() !== ""
                    ? selectedArea
                    : "all"
                }
                onValueChange={setSelectedArea}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {serviceAreas
                    .filter((area) => area.id && area.id.trim() !== "")
                    .map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.city} - {area.pincode}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Service Area</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.product?.brand}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.service_area?.city}</p>
                        <p className="text-sm text-gray-500">
                          {item.service_area?.pincode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatCurrency(item.area_price)}
                        </p>
                        {item.area_discount_percentage > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {item.area_discount_percentage}% OFF
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.stock_quantity < 10 ? "destructive" : "secondary"
                        }
                      >
                        {item.stock_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{item.estimated_delivery_hours}h</p>
                        <p className="text-gray-500">₹{item.delivery_charge}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge
                          variant={item.is_active ? "default" : "secondary"}
                        >
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge
                          variant={
                            item.is_available ? "default" : "destructive"
                          }
                        >
                          {item.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No pricing rules found</p>
              <p className="text-sm text-gray-400">
                Create your first area-specific pricing rule to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductAreaPricing;
