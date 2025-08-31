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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { parseError, logDetailedError } from "@/lib/debug-utils";
import {
  Package,
  Truck,
  Clock,
  MapPin,
  User,
  Phone,
  RefreshCw,
  Plus,
  Edit,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";

interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  license_number: string;
  is_available: boolean;
  current_location: string;
  rating: number;
  total_deliveries: number;
  created_at: string;
}

interface OrderTracking {
  id: string;
  order_id: string;
  status: string;
  location: string;
  notes: string;
  delivery_agent_id: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  created_at: string;
  // Joined data
  agent_name?: string;
  agent_phone?: string;
}

interface FulfillmentOrder {
  id: string;
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
  created_at: string;
  user_name?: string;
  user_phone?: string;
  tracking_updates?: OrderTracking[];
  assigned_agent?: DeliveryAgent;
}

export const OrderFulfillment: React.FC = () => {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [assignAgentDialogOpen, setAssignAgentDialogOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    status: "",
    location: "",
    notes: "",
    estimated_arrival: "",
  });

  useEffect(() => {
    fetchFulfillmentData();
  }, []);

  const fetchFulfillmentData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchAgents()]);
    } catch (error) {
      logDetailedError("Fetching Fulfillment Data", error);
      toast.error(`Failed to fetch data: ${parseError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles!orders_user_id_fkey(full_name, phone)
      `,
      )
      .in("status", ["confirmed", "processing", "shipped"])
      .order("created_at", { ascending: false });

    if (error) {
      logDetailedError("Fetching Orders", error);
      throw error;
    }

    setOrders(
      (data || []).map((order) => ({
        ...order,
        user_name: order.profiles?.full_name,
        user_phone: order.profiles?.phone,
      })),
    );
  };

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("delivery_agents")
      .select("*")
      .order("name");

    if (error && error.code !== "PGRST116") {
      logDetailedError("Fetching Agents", error);
      throw error;
    }

    setAgents(data || []);
  };

  const addTrackingUpdate = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase.from("order_tracking").insert([
        {
          order_id: selectedOrder.id,
          status: trackingForm.status,
          location: trackingForm.location,
          notes: trackingForm.notes,
          estimated_arrival: trackingForm.estimated_arrival || null,
        },
      ]);

      if (error) {
        logDetailedError("Adding Tracking Update", error);
        toast.error(`Failed to add tracking update: ${parseError(error)}`);
        return;
      }

      // Update order status if needed
      if (trackingForm.status !== selectedOrder.status) {
        await supabase
          .from("orders")
          .update({ status: trackingForm.status })
          .eq("id", selectedOrder.id);
      }

      toast.success("Tracking update added successfully");
      setTrackingDialogOpen(false);
      setTrackingForm({
        status: "",
        location: "",
        notes: "",
        estimated_arrival: "",
      });
      fetchFulfillmentData();
    } catch (error) {
      logDetailedError("Tracking Update Exception", error);
      toast.error(`Failed to add tracking update: ${parseError(error)}`);
    }
  };

  const assignDeliveryAgent = async (orderId: string, agentId: string) => {
    try {
      const { error } = await supabase.from("order_assignments").upsert([
        {
          order_id: orderId,
          delivery_agent_id: agentId,
          assigned_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        logDetailedError("Assigning Agent", error);
        toast.error(`Failed to assign agent: ${parseError(error)}`);
        return;
      }

      // Update order status to processing if it's confirmed
      const order = orders.find((o) => o.id === orderId);
      if (order && order.status === "confirmed") {
        await supabase
          .from("orders")
          .update({ status: "processing" })
          .eq("id", orderId);
      }

      // Update agent availability
      await supabase
        .from("delivery_agents")
        .update({ is_available: false })
        .eq("id", agentId);

      toast.success("Delivery agent assigned successfully");
      setAssignAgentDialogOpen(false);
      fetchFulfillmentData();
    } catch (error) {
      logDetailedError("Agent Assignment Exception", error);
      toast.error(`Failed to assign agent: ${parseError(error)}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-yellow-100 text-yellow-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
    };
    return (
      <Badge
        className={
          colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }
      >
        {status}
      </Badge>
    );
  };

  const getPriorityLevel = (order: FulfillmentOrder) => {
    const hoursOld =
      (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursOld > 24) return "high";
    if (hoursOld > 12) return "medium";
    return "low";
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {priority} priority
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order Fulfillment
          </h1>
          <p className="text-gray-500">
            Track and manage order delivery process
          </p>
        </div>

        <Button onClick={fetchFulfillmentData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="active-orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active-orders">Active Orders</TabsTrigger>
          <TabsTrigger value="delivery-agents">Delivery Agents</TabsTrigger>
          <TabsTrigger value="tracking-board">Tracking Board</TabsTrigger>
        </TabsList>

        <TabsContent value="active-orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders Ready for Fulfillment</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders ready for fulfillment.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const priority = getPriorityLevel(order);
                    return (
                      <div
                        key={order.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold">
                                #{order.id.slice(-8)}
                              </h3>
                              {getStatusBadge(order.status)}
                              {getPriorityBadge(priority)}
                              <Badge variant="outline">
                                {order.service_type}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>{order.user_name || "Unknown"}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{order.user_phone || "No phone"}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">
                                  {order.delivery_address}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setAssignAgentDialogOpen(true);
                              }}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Assign Agent
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setTrackingForm({
                                  ...trackingForm,
                                  status: order.status,
                                });
                                setTrackingDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery-agents">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Delivery Agents</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No delivery agents configured. Add agents to enable order
                  assignment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-sm text-gray-500">
                            {agent.vehicle_type}
                          </p>
                        </div>
                        <Badge
                          variant={agent.is_available ? "default" : "secondary"}
                        >
                          {agent.is_available ? "Available" : "Busy"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{agent.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{agent.current_location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rating: ⭐ {agent.rating.toFixed(1)}</span>
                          <span>Deliveries: {agent.total_deliveries}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking-board">
          <Card>
            <CardHeader>
              <CardTitle>Live Tracking Board</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Live tracking functionality coming soon.</p>
                <p className="text-sm">
                  Real-time order and delivery agent tracking will be displayed
                  here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Tracking Update Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Update</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={trackingForm.status}
                onValueChange={(value) =>
                  setTrackingForm({ ...trackingForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="out_for_delivery">
                    Out for Delivery
                  </SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Current Location</Label>
              <Input
                value={trackingForm.location}
                onChange={(e) =>
                  setTrackingForm({ ...trackingForm, location: e.target.value })
                }
                placeholder="Enter current location"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={trackingForm.notes}
                onChange={(e) =>
                  setTrackingForm({ ...trackingForm, notes: e.target.value })
                }
                placeholder="Add any notes or updates"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Arrival</Label>
              <Input
                type="datetime-local"
                value={trackingForm.estimated_arrival}
                onChange={(e) =>
                  setTrackingForm({
                    ...trackingForm,
                    estimated_arrival: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setTrackingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={addTrackingUpdate}>Add Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Agent Dialog */}
      <Dialog
        open={assignAgentDialogOpen}
        onOpenChange={setAssignAgentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Agent</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">
                  Order #{selectedOrder.id.slice(-8)}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedOrder.delivery_address}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label>Available Agents</Label>
              {agents.filter((agent) => agent.is_available).length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No available agents at the moment.
                </div>
              ) : (
                agents
                  .filter((agent) => agent.is_available)
                  .map((agent) => (
                    <div key={agent.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{agent.name}</h4>
                          <p className="text-sm text-gray-500">
                            {agent.vehicle_type} • {agent.current_location}
                          </p>
                          <p className="text-sm">
                            ⭐ {agent.rating.toFixed(1)} •{" "}
                            {agent.total_deliveries} deliveries
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            selectedOrder &&
                            assignDeliveryAgent(selectedOrder.id, agent.id)
                          }
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
