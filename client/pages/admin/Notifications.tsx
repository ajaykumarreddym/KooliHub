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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Edit,
  Trash2,
  Bell,
  Send,
  Users,
  Mail,
  MessageSquare,
  Eye,
  Calendar,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationSettings } from "@/components/admin/NotificationSettings";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "promotion";
  target_audience: "all" | "customers" | "vendors" | "admins";
  delivery_method: "in_app" | "email" | "sms" | "push";
  scheduled_at: string | null;
  sent_at: string | null;
  is_sent: boolean;
  is_active: boolean;
  image_url: string | null;
  action_url: string | null;
  action_text: string | null;
  created_at: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "promotion";
  category: "order" | "user" | "system" | "marketing";
  variables: string[];
}

const initialNotification: Omit<
  Notification,
  "id" | "created_at" | "sent_at" | "is_sent"
> = {
  title: "",
  message: "",
  type: "info",
  target_audience: "all",
  delivery_method: "in_app",
  scheduled_at: null,
  is_active: true,
  image_url: null,
  action_url: null,
  action_text: null,
};

const notificationTemplates: NotificationTemplate[] = [
  {
    id: "1",
    name: "Welcome New User",
    title: "Welcome to KooliHub!",
    message:
      "Thank you for joining us, {{name}}! Explore our services and get started.",
    type: "success",
    category: "user",
    variables: ["name"],
  },
  {
    id: "2",
    name: "Order Confirmed",
    title: "Order Confirmed",
    message:
      "Your order #{{order_id}} has been confirmed and will be delivered by {{delivery_date}}.",
    type: "success",
    category: "order",
    variables: ["order_id", "delivery_date"],
  },
  {
    id: "3",
    name: "Special Offer",
    title: "Special Offer Just for You!",
    message:
      "Get {{discount}}% off your next order. Use code {{code}} at checkout.",
    type: "promotion",
    category: "marketing",
    variables: ["discount", "code"],
  },
  {
    id: "4",
    name: "Order Delayed",
    title: "Order Update",
    message:
      "Your order #{{order_id}} has been delayed. New estimated delivery: {{new_date}}.",
    type: "warning",
    category: "order",
    variables: ["order_id", "new_date"],
  },
];

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);
  const [formData, setFormData] = useState(initialNotification);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error details:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);

        // Check if table doesn't exist
        if (
          error.code === "PGRST116" ||
          error.message?.includes(
            'relation "public.notifications" does not exist',
          )
        ) {
          toast.error(
            "Notifications table not found. Please run database migrations.",
          );
          return;
        }

        // Extract meaningful error message
        let errorMessage = "Unknown database error";
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        toast.error(`Database error: ${errorMessage}`);
        return;
      }
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);

      // Better error parsing
      let errorMessage = "Unknown error";
      if (error && typeof error === "object") {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (error.details) {
          errorMessage = error.details;
        } else {
          // If it's still an object, stringify it
          try {
            errorMessage = JSON.stringify(error, null, 2);
          } catch {
            errorMessage = "Complex error object - check console";
          }
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error(`Failed to fetch notifications: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        scheduled_at: formData.scheduled_at
          ? new Date(formData.scheduled_at).toISOString()
          : null,
      };

      if (editingNotification) {
        const { error } = await supabase
          .from("notifications")
          .update(submitData)
          .eq("id", editingNotification.id);

        if (error) throw error;
        toast.success("Notification updated successfully");
      } else {
        const { error } = await supabase
          .from("notifications")
          .insert([{ ...submitData, is_sent: false }]);

        if (error) throw error;
        toast.success("Notification created successfully");
      }

      setIsDialogOpen(false);
      setEditingNotification(null);
      setFormData(initialNotification);
      fetchNotifications();
    } catch (error) {
      console.error("Error saving notification:", error);
      toast.error("Failed to save notification");
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      target_audience: notification.target_audience,
      delivery_method: notification.delivery_method,
      scheduled_at: notification.scheduled_at
        ? notification.scheduled_at.split("T")[0]
        : null,
      is_active: notification.is_active,
      image_url: notification.image_url,
      action_url: notification.action_url,
      action_text: notification.action_text,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Notification deleted successfully");
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const handleSendNow = async (notification: Notification) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_sent: true,
          sent_at: new Date().toISOString(),
          scheduled_at: null,
        })
        .eq("id", notification.id);

      if (error) throw error;
      toast.success("Notification sent successfully");
      fetchNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    }
  };

  const applyTemplate = (template: NotificationTemplate) => {
    setFormData({
      ...formData,
      title: template.title,
      message: template.message,
      type: template.type,
    });
    setSelectedTemplate("");
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" || notification.type === filterType;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "sent" && notification.is_sent) ||
      (filterStatus === "scheduled" &&
        notification.scheduled_at &&
        !notification.is_sent) ||
      (filterStatus === "draft" &&
        !notification.scheduled_at &&
        !notification.is_sent);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    const colors = {
      info: "bg-blue-100 text-blue-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      promotion: "bg-purple-100 text-purple-800",
    };
    return (
      <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>
    );
  };

  const getStatusBadge = (notification: Notification) => {
    if (notification.is_sent) {
      return <Badge className="bg-green-500">Sent</Badge>;
    }
    if (notification.scheduled_at) {
      const scheduledDate = new Date(notification.scheduled_at);
      const now = new Date();
      if (scheduledDate > now) {
        return <Badge variant="outline">Scheduled</Badge>;
      }
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const getDeliveryIcon = (method: string) => {
    switch (method) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "push":
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">
            Manage and send notifications to users
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingNotification(null);
                setFormData(initialNotification);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingNotification
                  ? "Edit Notification"
                  : "Create New Notification"}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="compose" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="compose">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Enter notification title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: Notification["type"]) =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Enter notification message"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target_audience">Target Audience</Label>
                      <Select
                        value={formData.target_audience}
                        onValueChange={(
                          value: Notification["target_audience"],
                        ) =>
                          setFormData({ ...formData, target_audience: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="vendors">Vendors</SelectItem>
                          <SelectItem value="admins">Admins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delivery_method">Delivery Method</Label>
                      <Select
                        value={formData.delivery_method}
                        onValueChange={(
                          value: Notification["delivery_method"],
                        ) =>
                          setFormData({ ...formData, delivery_method: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_app">In-App</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="push">
                            Push Notification
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL (Optional)</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          image_url: e.target.value || null,
                        })
                      }
                      placeholder="Enter image URL"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="action_url">Action URL (Optional)</Label>
                      <Input
                        id="action_url"
                        value={formData.action_url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            action_url: e.target.value || null,
                          })
                        }
                        placeholder="Enter action URL"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="action_text">
                        Action Text (Optional)
                      </Label>
                      <Input
                        id="action_text"
                        value={formData.action_text || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            action_text: e.target.value || null,
                          })
                        }
                        placeholder="Enter action text"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled_at">
                      Schedule for Later (Optional)
                    </Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduled_at: e.target.value || null,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingNotification ? "Update" : "Create"} Notification
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="templates">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Template</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTemplates
                          .filter(
                            (template) =>
                              template.id && template.id.trim() !== "",
                          )
                          .map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-4">
                      {(() => {
                        const template = notificationTemplates.find(
                          (t) => t.id === selectedTemplate,
                        );
                        return template ? (
                          <div className="border rounded-lg p-4 space-y-2">
                            <h3 className="font-semibold">{template.name}</h3>
                            <div className="space-y-1">
                              <p>
                                <strong>Title:</strong> {template.title}
                              </p>
                              <p>
                                <strong>Message:</strong> {template.message}
                              </p>
                              <div className="flex items-center space-x-2">
                                <strong>Type:</strong>{" "}
                                {getTypeBadge(template.type)}
                              </div>
                              {template.variables.length > 0 && (
                                <div>
                                  <strong>Variables:</strong>{" "}
                                  {template.variables
                                    .map((v) => `{{${v}}}`)
                                    .join(", ")}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              onClick={() => applyTemplate(template)}
                              className="mt-2"
                            >
                              Apply Template
                            </Button>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <CardTitle>All Notifications</CardTitle>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "No notifications found matching your filters."
                : "No notifications yet. Create your first notification!"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {notification.title}
                        </h3>
                        {getStatusBadge(notification)}
                        {getTypeBadge(notification.type)}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {notification.message}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          {getDeliveryIcon(notification.delivery_method)}
                          <span>{notification.delivery_method}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{notification.target_audience}</span>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(
                            notification.created_at,
                          ).toLocaleDateString()}
                        </div>
                        {notification.scheduled_at && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(
                                notification.scheduled_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!notification.is_sent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendNow(notification)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send Now
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(notification)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Notification
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "
                              {notification.title}"? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(notification.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
