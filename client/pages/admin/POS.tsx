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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Phone,
  MessageSquare,
  UserPlus,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Calculator,
  User,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/payment-utils";
import { useAreaProducts } from "@/hooks/use-area-products";

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface ServiceArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  delivery_time_hours: number;
  delivery_charge: number;
}

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  max_quantity: number;
  delivery_charge: number;
  handling_charge: number;
}

interface NewCustomer {
  full_name: string;
  email: string;
  phone: string;
  delivery_address: string;
  pincode: string;
}

export const POS: React.FC = () => {
  const [activeTab, setActiveTab] = useState("order");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    full_name: "",
    email: "",
    phone: "",
    delivery_address: "",
    pincode: "",
  });

  const [orderDetails, setOrderDetails] = useState({
    delivery_address: "",
    pincode: "",
    payment_method: "cash",
    notes: "",
  });

  // Get products for selected area
  const {
    products,
    loading: productsLoading,
    stats,
  } = useAreaProducts(selectedArea, {
    available_only: true,
    in_stock: true,
  });

  useEffect(() => {
    fetchServiceAreas();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchQuery]);

  const fetchServiceAreas = async () => {
    try {
      const { data, error } = await supabase
        .from("serviceable_areas")
        .select("*")
        .eq("is_serviceable", true)
        .order("city");

      if (error) throw error;
      setServiceAreas(data || []);
    } catch (error) {
      console.error("Error fetching service areas:", error);
      toast.error("Failed to load service areas");
    }
  };

  const searchCustomers = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(
          `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`,
        )
        .limit(10);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error searching customers:", error);
      toast.error("Failed to search customers");
    } finally {
      setLoading(false);
    }
  };

  const createNewCustomer = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (
        !newCustomer.full_name ||
        !newCustomer.phone ||
        !newCustomer.pincode
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Check if customer already exists
      const { data: existingCustomer } = await supabase
        .from("profiles")
        .select("*")
        .or(`email.eq.${newCustomer.email},phone.eq.${newCustomer.phone}`)
        .single();

      if (existingCustomer) {
        toast.error("Customer with this email or phone already exists");
        return;
      }

      // Create new customer
      const { data, error } = await supabase
        .from("profiles")
        .insert([
          {
            full_name: newCustomer.full_name,
            email: newCustomer.email || `${newCustomer.phone}@temp.com`,
            phone: newCustomer.phone,
            role: "user",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSelectedCustomer(data);
      setOrderDetails({
        ...orderDetails,
        delivery_address: newCustomer.delivery_address,
        pincode: newCustomer.pincode,
      });

      // Auto-select service area if pincode matches
      const matchingArea = serviceAreas.find(
        (area) => area.pincode === newCustomer.pincode,
      );
      if (matchingArea) {
        setSelectedArea(matchingArea.id);
      }

      toast.success("Customer created successfully");
      setIsNewCustomerModalOpen(false);
      setNewCustomer({
        full_name: "",
        email: "",
        phone: "",
        delivery_address: "",
        pincode: "",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.product_id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.max_order_quantity) {
        toast.error(
          `Maximum quantity for ${product.name} is ${product.max_order_quantity}`,
        );
        return;
      }
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          price: product.effective_price,
          quantity: 1,
          max_quantity: product.max_order_quantity,
          delivery_charge: product.delivery_charge || 0,
          handling_charge: product.handling_charge || 0,
        },
      ]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const calculateTotal = () => {
    const itemsTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const deliveryCharge =
      cart.length > 0
        ? Math.max(...cart.map((item) => item.delivery_charge))
        : 0;
    const handlingCharge = cart.reduce(
      (sum, item) => sum + item.handling_charge,
      0,
    );

    return {
      itemsTotal,
      deliveryCharge,
      handlingCharge,
      total: itemsTotal + deliveryCharge + handlingCharge,
    };
  };

  const placeOrder = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!orderDetails.delivery_address || !orderDetails.pincode) {
      toast.error("Please provide delivery address and pincode");
      return;
    }

    try {
      setOrderLoading(true);

      const totals = calculateTotal();
      const orderItems = cart.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            user_id: selectedCustomer.id,
            status: "pending",
            total_amount: totals.total,
            delivery_address: orderDetails.delivery_address,
            delivery_pincode: orderDetails.pincode,
            service_type: "mixed", // You can determine this based on products
            order_items: orderItems,
            payment_method: orderDetails.payment_method,
            payment_status:
              orderDetails.payment_method === "cash" ? "pending" : "pending",
            notes: orderDetails.notes,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Order #${data.id.slice(0, 8)} placed successfully!`);

      // Reset form
      setCart([]);
      setSelectedCustomer(null);
      setOrderDetails({
        delivery_address: "",
        pincode: "",
        payment_method: "cash",
        notes: "",
      });
      setSearchQuery("");
      setSelectedArea("");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    } finally {
      setOrderLoading(false);
    }
  };

  const totals = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">POS System</h1>
          <p className="text-gray-500 mt-1">
            Handle phone and WhatsApp orders efficiently
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Phone className="h-4 w-4 mr-1" />
            Phone Orders
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <MessageSquare className="h-4 w-4 mr-1" />
            WhatsApp Orders
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Customer & Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Selection
              </CardTitle>
              <CardDescription>
                Search for existing customer or create new one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Dialog
                  open={isNewCustomerModalOpen}
                  onOpenChange={setIsNewCustomerModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      New Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Customer</DialogTitle>
                      <DialogDescription>
                        Add customer details for phone/WhatsApp order
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name *</Label>
                          <Input
                            value={newCustomer.full_name}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                full_name: e.target.value,
                              })
                            }
                            placeholder="Customer name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input
                            value={newCustomer.phone}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                phone: e.target.value,
                              })
                            }
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={newCustomer.email}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              email: e.target.value,
                            })
                          }
                          placeholder="customer@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Address *</Label>
                        <Textarea
                          value={newCustomer.delivery_address}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              delivery_address: e.target.value,
                            })
                          }
                          placeholder="Full delivery address"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pincode *</Label>
                        <Input
                          value={newCustomer.pincode}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              pincode: e.target.value,
                            })
                          }
                          placeholder="XXXXXX"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsNewCustomerModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={createNewCustomer} disabled={loading}>
                          {loading ? "Creating..." : "Create Customer"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Customer Search Results */}
              {customers.length > 0 && (
                <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 rounded cursor-pointer hover:bg-gray-50 ${
                        selectedCustomer?.id === customer.id
                          ? "bg-blue-50 border border-blue-200"
                          : ""
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="font-medium">{customer.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {customer.email} • {customer.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      Selected: {selectedCustomer.full_name}
                    </span>
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {selectedCustomer.email} • {selectedCustomer.phone}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Area Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Service Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery area" />
                </SelectTrigger>
                <SelectContent>
                  {serviceAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.city}, {area.state} - {area.pincode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Products */}
          {selectedArea && (
            <Card>
              <CardHeader>
                <CardTitle>Available Products</CardTitle>
                <CardDescription>
                  {stats.total} products available • {stats.inStock} in stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-center py-8">Loading products...</div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.slice(0, 20).map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-500">
                              {product.brand} • {product.category_name}
                            </p>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              {formatCurrency(product.effective_price)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {product.stock_quantity} • Max:{" "}
                              {product.max_order_quantity}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(product)}
                            disabled={product.stock_quantity === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No products available in this area
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Cart & Order */}
        <div className="space-y-6">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-3 p-3 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(item.price)} each
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateCartQuantity(
                              item.product_id,
                              item.quantity - 1,
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateCartQuantity(
                              item.product_id,
                              item.quantity + 1,
                            )
                          }
                          disabled={item.quantity >= item.max_quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Order Total */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Items Total:</span>
                      <span>{formatCurrency(totals.itemsTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Charge:</span>
                      <span>{formatCurrency(totals.deliveryCharge)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Handling Charge:</span>
                      <span>{formatCurrency(totals.handlingCharge)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Cart is empty</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          {cart.length > 0 && selectedCustomer && (
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Delivery Address</Label>
                  <Textarea
                    value={orderDetails.delivery_address}
                    onChange={(e) =>
                      setOrderDetails({
                        ...orderDetails,
                        delivery_address: e.target.value,
                      })
                    }
                    placeholder="Full delivery address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={orderDetails.pincode}
                    onChange={(e) =>
                      setOrderDetails({
                        ...orderDetails,
                        pincode: e.target.value,
                      })
                    }
                    placeholder="XXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={orderDetails.payment_method}
                    onValueChange={(value) =>
                      setOrderDetails({
                        ...orderDetails,
                        payment_method: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash on Delivery</SelectItem>
                      <SelectItem value="card">Card Payment</SelectItem>
                      <SelectItem value="upi">UPI Payment</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order Notes</Label>
                  <Textarea
                    value={orderDetails.notes}
                    onChange={(e) =>
                      setOrderDetails({
                        ...orderDetails,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Special instructions or notes"
                    rows={2}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={placeOrder}
                  disabled={orderLoading}
                  size="lg"
                >
                  {orderLoading ? (
                    "Placing Order..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Place Order • {formatCurrency(totals.total)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
