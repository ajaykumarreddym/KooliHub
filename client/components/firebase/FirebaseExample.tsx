import React, { useEffect } from "react";
import { useFirebaseContext } from "./FirebaseProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BarChart3, Smartphone } from "lucide-react";

export function FirebaseExample() {
  const {
    analyticsInitialized,
    messagingInitialized,
    notificationPermission,
    fcmToken,
    loading,
    error,
    requestNotificationPermission,
    analytics,
  } = useFirebaseContext();

  // Track page view when component mounts
  useEffect(() => {
    analytics.trackPageView("firebase-example", "Firebase Integration Example");
  }, [analytics]);

  const handleTrackEvent = () => {
    analytics.trackEvent("button_click", {
      button_name: "track_example_event",
      page: "firebase-example",
    });
  };

  const handleTrackPurchase = () => {
    analytics.trackPurchase("test-transaction-123", 99.99, "USD", [
      {
        item_id: "test-item",
        item_name: "Test Product",
        category: "Electronics",
        quantity: 1,
        price: 99.99,
      },
    ]);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading Firebase services...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Firebase Integration Status
          </CardTitle>
          <CardDescription>
            Current status of Firebase Analytics and Cloud Messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">Error: {error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Analytics</span>
              <Badge variant={analyticsInitialized ? "default" : "secondary"}>
                {analyticsInitialized ? "Initialized" : "Not Available"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Messaging</span>
              <Badge variant={messagingInitialized ? "default" : "secondary"}>
                {messagingInitialized ? "Initialized" : "Not Available"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Notification Permission
              </span>
              <Badge
                variant={
                  notificationPermission === "granted"
                    ? "default"
                    : notificationPermission === "denied"
                      ? "destructive"
                      : "secondary"
                }
              >
                {notificationPermission}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">FCM Token</span>
              <Badge variant={fcmToken ? "default" : "secondary"}>
                {fcmToken ? "Available" : "Not Available"}
              </Badge>
            </div>
          </div>

          {fcmToken && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 font-mono break-all">
                FCM Token: {fcmToken.substring(0, 50)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Test Firebase Cloud Messaging functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationPermission !== "granted" && (
            <Button onClick={requestNotificationPermission} className="w-full">
              <Smartphone className="h-4 w-4 mr-2" />
              Enable Push Notifications
            </Button>
          )}

          {notificationPermission === "granted" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">
                ✅ Push notifications are enabled! You will receive
                notifications from KooliHub.
              </p>
            </div>
          )}

          {notificationPermission === "denied" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">
                ❌ Push notifications are blocked. Please enable them in your
                browser settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Testing
          </CardTitle>
          <CardDescription>
            Test Firebase Analytics event tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleTrackEvent}
              variant="outline"
              disabled={!analyticsInitialized}
            >
              Track Custom Event
            </Button>

            <Button
              onClick={handleTrackPurchase}
              variant="outline"
              disabled={!analyticsInitialized}
            >
              Track Test Purchase
            </Button>

            <Button
              onClick={() =>
                analytics.trackSearch("firebase integration", "testing")
              }
              variant="outline"
              disabled={!analyticsInitialized}
            >
              Track Search Event
            </Button>

            <Button
              onClick={() =>
                analytics.trackServiceBooking("grocery", "test-service", 50)
              }
              variant="outline"
              disabled={!analyticsInitialized}
            >
              Track Service Booking
            </Button>
          </div>

          {analyticsInitialized && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-700 text-sm">
                📊 Analytics events are being tracked. Check your Firebase
                Analytics dashboard for real-time data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FirebaseExample;
