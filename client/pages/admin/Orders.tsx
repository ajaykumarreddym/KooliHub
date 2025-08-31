import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { supabase } from "@/lib/supabase";
import { parseError, logDetailedError } from "@/lib/debug-utils";
import {
  Package,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  user_id: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  total_amount: number;
  delivery_address: string;
  delivery_pincode: string;
  service_type: string;
  order_items: any;
  payment_status: "pending" | "completed" | "failed";
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined user data
  user_email?: string;
  user_name?: string;
  user_phone?: string;
}

interface OrderFilters {
  status: string;
  paymentStatus: string;
  serviceType: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

const initialFilters: OrderFilters = {
  status: "all",
  paymentStatus: "all",
  serviceType: "all",
  dateFrom: "",
  dateTo: "",
  searchTerm: "",
};

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
};

const paymentStatusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800" },
  completed: { color: "bg-green-100 text-green-800" },
  failed: { color: "bg-red-100 text-red-800" },
};

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("orders")
        .select(
          `
          *,
          profiles!orders_user_id_fkey(email, full_name, phone)
        `,
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.paymentStatus !== "all") {
        query = query.eq("payment_status", filters.paymentStatus);
      }

      if (filters.serviceType !== "all") {
        query = query.eq("service_type", filters.serviceType);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo + "T23:59:59");
      }

      if (filters.searchTerm) {
        query = query.or(
          `id.ilike.%${filters.searchTerm}%,delivery_address.ilike.%${filters.searchTerm}%,delivery_pincode.ilike.%${filters.searchTerm}%`,
        );
      }

      const { data, error } = await query;

      if (error) {
        logDetailedError("Fetching Orders", error);
        toast.error(`Failed to fetch orders: ${parseError(error)}`);
        return;
      }

      // Transform data and calculate stats
      const transformedOrders = (data || []).map((order) => ({
        ...order,
        user_email: order.profiles?.email,
        user_name: order.profiles?.full_name,
        user_phone: order.profiles?.phone,
      }));

      setOrders(transformedOrders);
      calculateStats(transformedOrders);
    } catch (error) {
      logDetailedError("Orders Fetch Exception", error);
      toast.error(`Failed to fetch orders: ${parseError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList: Order[]) => {
    const stats = {
      total: ordersList.length,
      pending: ordersList.filter((o) => o.status === "pending").length,
      processing: ordersList.filter((o) =>
        ["confirmed", "processing", "shipped"].includes(o.status),
      ).length,
      delivered: ordersList.filter((o) => o.status === "delivered").length,
      cancelled: ordersList.filter((o) => o.status === "cancelled").length,
      totalRevenue: ordersList
        .filter((o) => o.payment_status === "completed")
        .reduce((sum, o) => sum + Number(o.total_amount), 0),
    };
    setStats(stats);
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        logDetailedError("Updating Order Status", error);
        toast.error(`Failed to update order: ${parseError(error)}`);
        return;
      }

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();

      // Update selected order if it's open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      logDetailedError("Order Status Update Exception", error);
      toast.error(`Failed to update order: ${parseError(error)}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: Order["status"]) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: Order["payment_status"]) => {
    const config = paymentStatusConfig[status];
    return <Badge className={config.color}>{status}</Badge>;
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const exportOrders = () => {
    const csv = [
      [
        "Order ID",
        "Customer",
        "Service Type",
        "Status",
        "Payment Status",
        "Amount",
        "Created At",
      ],
      ...orders.map((order) => [
        order.id,
        order.user_name || order.user_email || "Unknown",
        order.service_type,
        order.status,
        order.payment_status,
        order.total_amount,
        formatDate(order.created_at),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Orders Management
          </h1>
          <p className="text-gray-500">Manage and track customer orders</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchOrders} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.processing}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Order ID, address, pincode..."
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters({ ...filters, searchTerm: e.target.value })
                  }
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment</Label>
              <Select
                value={filters.paymentStatus}
                onValueChange={(value) =>
                  setFilters({ ...filters, paymentStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                value={filters.serviceType}
                onValueChange={(value) =>
                  setFilters({ ...filters, serviceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="grocery">Grocery</SelectItem>
                  <SelectItem value="trips">Trips</SelectItem>
                  <SelectItem value="car-rental">Car Rental</SelectItem>
                  <SelectItem value="handyman">Handyman</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="home-kitchen">Home & Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({stats.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found matching your filters.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          #{order.id.slice(-8)}
                        </h3>
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.payment_status)}
                        <Badge variant="outline">{order.service_type}</Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>
                            {order.user_name ||
                              order.user_email ||
                              "Unknown Customer"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {formatCurrency(Number(order.total_amount))}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {order.delivery_address}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Select
                        value={order.status}
                        onValueChange={(value: Order["status"]) =>
                          updateOrderStatus(order.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Order Details - #{selectedOrder?.id.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Order ID:</strong> {selectedOrder.id}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div>
                      <strong>Payment Status:</strong>{" "}
                      {getPaymentStatusBadge(selectedOrder.payment_status)}
                    </div>
                    <div>
                      <strong>Service Type:</strong>{" "}
                      {selectedOrder.service_type}
                    </div>
                    <div>
                      <strong>Total Amount:</strong>{" "}
                      {formatCurrency(Number(selectedOrder.total_amount))}
                    </div>
                    <div>
                      <strong>Payment Method:</strong>{" "}
                      {selectedOrder.payment_method || "Not specified"}
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedOrder.created_at)}
                    </div>
                    <div>
                      <strong>Updated:</strong>{" "}
                      {formatDate(selectedOrder.updated_at)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong>{" "}
                      {selectedOrder.user_name || "Not provided"}
                    </div>
                    <div>
                      <strong>Email:</strong>{" "}
                      {selectedOrder.user_email || "Not provided"}
                    </div>
                    <div>
                      <strong>Phone:</strong>{" "}
                      {selectedOrder.user_phone || "Not provided"}
                    </div>
                    <div className="flex space-x-2 mt-3">
                      {selectedOrder.user_phone && (
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      )}
                      {selectedOrder.user_email && (
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Delivery Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Address:</strong> {selectedOrder.delivery_address}
                  </div>
                  <div>
                    <strong>Pincode:</strong> {selectedOrder.delivery_pincode}
                  </div>
                </div>
              </div>

              {selectedOrder.order_items && (
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(selectedOrder.order_items, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-3">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
