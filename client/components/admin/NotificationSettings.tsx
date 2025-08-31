import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFirebaseContext } from "@/components/firebase/FirebaseProvider";
import { Bell, Send, TestTube, Users, User, Tag } from "lucide-react";
import { toast } from "sonner";

export function NotificationSettings() {
  const { fcmToken, notificationPermission, requestNotificationPermission } =
    useFirebaseContext();
  const [loading, setLoading] = useState(false);

  // Test notification form
  const [testForm, setTestForm] = useState({
    title: "Test Notification",
    body: "This is a test notification from KooliHub admin panel",
    url: "/",
  });

  // User notification form
  const [userForm, setUserForm] = useState({
    userId: "",
    title: "",
    body: "",
    imageUrl: "",
    url: "",
  });

  // Topic notification form
  const [topicForm, setTopicForm] = useState({
    topic: "general",
    title: "",
    body: "",
    imageUrl: "",
    url: "",
  });

  // Order notification form
  const [orderForm, setOrderForm] = useState({
    orderId: "",
    status: "confirmed",
  });

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        toast.success("Notification permission granted!");
      } else {
        toast.error("Notification permission denied");
      }
    } catch (error) {
      toast.error("Failed to request permission");
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!fcmToken) {
      toast.error("No FCM token available. Please enable notifications first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fcm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: fcmToken,
          ...testForm,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Test notification sent successfully!");
      } else {
        toast.error("Failed to send test notification");
      }
    } catch (error) {
      toast.error("Error sending test notification");
    } finally {
      setLoading(false);
    }
  };

  const sendUserNotification = async () => {
    if (!userForm.userId || !userForm.title || !userForm.body) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fcm/send-to-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Notification sent to user successfully!");
        setUserForm({ userId: "", title: "", body: "", imageUrl: "", url: "" });
      } else {
        toast.error("Failed to send notification to user");
      }
    } catch (error) {
      toast.error("Error sending notification to user");
    } finally {
      setLoading(false);
    }
  };

  const sendTopicNotification = async () => {
    if (!topicForm.topic || !topicForm.title || !topicForm.body) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fcm/send-to-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topicForm),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Notification sent to topic successfully!");
        setTopicForm({
          topic: "general",
          title: "",
          body: "",
          imageUrl: "",
          url: "",
        });
      } else {
        toast.error("Failed to send notification to topic");
      }
    } catch (error) {
      toast.error("Error sending notification to topic");
    } finally {
      setLoading(false);
    }
  };

  const sendOrderNotification = async () => {
    if (!orderForm.orderId || !orderForm.status) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fcm/send-order-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderForm),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Order notification sent successfully!");
        setOrderForm({ orderId: "", status: "confirmed" });
      } else {
        toast.error("Failed to send order notification");
      }
    } catch (error) {
      toast.error("Error sending order notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Permission Status
          </CardTitle>
          <CardDescription>
            Current notification permission status and FCM token information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Permission Status</p>
              <p className="text-sm text-muted-foreground capitalize">
                {notificationPermission}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  notificationPermission === "granted"
                    ? "bg-green-500"
                    : notificationPermission === "denied"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              />
              {notificationPermission !== "granted" && (
                <Button onClick={handleRequestPermission} disabled={loading}>
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>

          {fcmToken && (
            <div>
              <p className="font-medium">FCM Token</p>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {fcmToken.substring(0, 50)}...
              </p>
            </div>
          )}

          {notificationPermission === "unsupported" && (
            <Alert>
              <AlertDescription>
                Push notifications are not supported in this browser.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Notification
          </CardTitle>
          <CardDescription>
            Send a test notification to your current device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-title">Title</Label>
            <Input
              id="test-title"
              value={testForm.title}
              onChange={(e) =>
                setTestForm({ ...testForm, title: e.target.value })
              }
              placeholder="Notification title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-body">Message</Label>
            <Textarea
              id="test-body"
              value={testForm.body}
              onChange={(e) =>
                setTestForm({ ...testForm, body: e.target.value })
              }
              placeholder="Notification message"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-url">URL (optional)</Label>
            <Input
              id="test-url"
              value={testForm.url}
              onChange={(e) =>
                setTestForm({ ...testForm, url: e.target.value })
              }
              placeholder="URL to open when clicked"
            />
          </div>
          <Button
            onClick={sendTestNotification}
            disabled={loading || !fcmToken}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Test Notification
          </Button>
        </CardContent>
      </Card>

      {/* Send to User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Send to Specific User
          </CardTitle>
          <CardDescription>
            Send a notification to a specific user by their ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-id">User ID *</Label>
            <Input
              id="user-id"
              value={userForm.userId}
              onChange={(e) =>
                setUserForm({ ...userForm, userId: e.target.value })
              }
              placeholder="Enter user ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-title">Title *</Label>
            <Input
              id="user-title"
              value={userForm.title}
              onChange={(e) =>
                setUserForm({ ...userForm, title: e.target.value })
              }
              placeholder="Notification title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-body">Message *</Label>
            <Textarea
              id="user-body"
              value={userForm.body}
              onChange={(e) =>
                setUserForm({ ...userForm, body: e.target.value })
              }
              placeholder="Notification message"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-image">Image URL (optional)</Label>
            <Input
              id="user-image"
              value={userForm.imageUrl}
              onChange={(e) =>
                setUserForm({ ...userForm, imageUrl: e.target.value })
              }
              placeholder="Image URL for rich notification"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-url">Action URL (optional)</Label>
            <Input
              id="user-url"
              value={userForm.url}
              onChange={(e) =>
                setUserForm({ ...userForm, url: e.target.value })
              }
              placeholder="URL to open when clicked"
            />
          </div>
          <Button
            onClick={sendUserNotification}
            disabled={loading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Send to User
          </Button>
        </CardContent>
      </Card>

      {/* Send to Topic */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Send to Topic
          </CardTitle>
          <CardDescription>
            Send a notification to all users subscribed to a topic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic *</Label>
            <Select
              value={topicForm.topic}
              onValueChange={(value) =>
                setTopicForm({ ...topicForm, topic: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="promotions">Promotions</SelectItem>
                <SelectItem value="role_admin">Admins</SelectItem>
                <SelectItem value="role_user">Users</SelectItem>
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
            <Label htmlFor="topic-title">Title *</Label>
            <Input
              id="topic-title"
              value={topicForm.title}
              onChange={(e) =>
                setTopicForm({ ...topicForm, title: e.target.value })
              }
              placeholder="Notification title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-body">Message *</Label>
            <Textarea
              id="topic-body"
              value={topicForm.body}
              onChange={(e) =>
                setTopicForm({ ...topicForm, body: e.target.value })
              }
              placeholder="Notification message"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-image">Image URL (optional)</Label>
            <Input
              id="topic-image"
              value={topicForm.imageUrl}
              onChange={(e) =>
                setTopicForm({ ...topicForm, imageUrl: e.target.value })
              }
              placeholder="Image URL for rich notification"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-url">Action URL (optional)</Label>
            <Input
              id="topic-url"
              value={topicForm.url}
              onChange={(e) =>
                setTopicForm({ ...topicForm, url: e.target.value })
              }
              placeholder="URL to open when clicked"
            />
          </div>
          <Button
            onClick={sendTopicNotification}
            disabled={loading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Send to Topic
          </Button>
        </CardContent>
      </Card>

      {/* Order Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Order Status Notification
          </CardTitle>
          <CardDescription>
            Send automated order status notification to customer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order-id">Order ID *</Label>
            <Input
              id="order-id"
              value={orderForm.orderId}
              onChange={(e) =>
                setOrderForm({ ...orderForm, orderId: e.target.value })
              }
              placeholder="Enter order ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-status">Status *</Label>
            <Select
              value={orderForm.status}
              onValueChange={(value) =>
                setOrderForm({ ...orderForm, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={sendOrderNotification}
            disabled={loading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Order Notification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationSettings;
