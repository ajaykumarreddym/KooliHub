import { messaging } from "./firebase";
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { VAPID_KEY } from "./firebase";

export interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export class FirebaseMessaging {
  private static instance: FirebaseMessaging;

  public static getInstance(): FirebaseMessaging {
    if (!FirebaseMessaging.instance) {
      FirebaseMessaging.instance = new FirebaseMessaging();
    }
    return FirebaseMessaging.instance;
  }

  private constructor() {
    this.setupMessageListener();
  }

  // Check notification permission status
  getNotificationPermission(): NotificationPermissionStatus {
    if (!("Notification" in window)) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === "granted",
      denied: permission === "denied",
      default: permission === "default",
    };
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (!messaging) {
      console.warn("Firebase messaging not initialized");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }

  // Get FCM token
  async getToken(): Promise<string | null> {
    if (!messaging) {
      console.warn("Firebase messaging not initialized");
      return null;
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        console.log("FCM registration token:", token);
        return token;
      } else {
        console.log("No registration token available");
        return null;
      }
    } catch (error) {
      console.error("An error occurred while retrieving token:", error);
      return null;
    }
  }

  // Setup foreground message listener
  private setupMessageListener() {
    if (!messaging) return;

    onMessage(messaging, (payload: MessagePayload) => {
      console.log("Message received in foreground:", payload);

      // Show notification if the page is in focus
      if (document.visibilityState === "visible") {
        this.showNotification(payload);
      }
    });
  }

  // Show browser notification
  private showNotification(payload: MessagePayload) {
    const { notification, data } = payload;

    if (!notification) return;

    const notificationTitle = notification.title || "KooliHub";
    const notificationOptions = {
      body: notification.body,
      icon: notification.icon || "/icon-192x192.png",
      badge: "/icon-72x72.png",
      tag: data?.tag || "default",
      data: data,
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "View",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    };

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // Use service worker to show notification
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title: notificationTitle,
        options: notificationOptions,
      });
    } else {
      // Fallback to direct notification
      new Notification(notificationTitle, notificationOptions);
    }
  }

  // Send token to server
  async saveTokenToServer(token: string, userId?: string): Promise<boolean> {
    try {
      const response = await fetch("/api/fcm/save-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          userId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to save token to server:", error);
      return false;
    }
  }

  // Initialize messaging for a user
  async initializeForUser(userId?: string): Promise<string | null> {
    const permissionGranted = await this.requestPermission();

    if (!permissionGranted) {
      console.log("Notification permission not granted");
      return null;
    }

    const token = await this.getToken();

    if (token && userId) {
      await this.saveTokenToServer(token, userId);
    }

    return token;
  }

  // Subscribe to topic (requires server-side implementation)
  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch("/api/fcm/subscribe-topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, topic }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to subscribe to topic:", error);
      return false;
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch("/api/fcm/unsubscribe-topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, topic }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to unsubscribe from topic:", error);
      return false;
    }
  }
}

// Export singleton instance
export const firebaseMessaging = FirebaseMessaging.getInstance();
export default firebaseMessaging;
