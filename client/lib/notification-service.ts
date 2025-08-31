import { toast } from "sonner";

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp: number;
  read: boolean;
  type: "info" | "success" | "warning" | "error" | "order" | "promotion";
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = "default";
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private notifications: NotificationData[] = [];
  private subscribers: ((notifications: NotificationData[]) => void)[] = [];

  constructor() {
    this.initializePermission();
    this.loadNotificationsFromStorage();
    this.setupServiceWorker();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializePermission() {
    if ("Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  private async setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        this.serviceWorkerRegistration =
          await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered successfully");
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return "Notification" in window;
  }

  // Check if permission is granted
  isPermissionGranted(): boolean {
    return this.permission === "granted";
  }

  // Show browser notification
  async showNotification(
    notification: Omit<NotificationData, "id" | "timestamp" | "read">,
  ): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn("Notifications not supported");
      return false;
    }

    if (!this.isPermissionGranted()) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn("Notification permission not granted");
        return false;
      }
    }

    try {
      const notificationData: NotificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false,
        ...notification,
      };

      // Add to local storage
      this.addNotification(notificationData);

      // Show browser notification
      if (this.serviceWorkerRegistration) {
        const notificationOptions: any = {
          body: notification.body,
          icon: notification.icon || "/icon-192x192.png",
          badge: notification.badge || "/icon-72x72.png",
          data: { ...notification.data, id: notificationData.id },
          actions: notification.actions,
          requireInteraction: notification.requireInteraction || false,
          silent: notification.silent || false,
          tag: notificationData.id,
        };

        if (notification.image) {
          notificationOptions.image = notification.image;
        }

        await this.serviceWorkerRegistration.showNotification(
          notification.title,
          notificationOptions,
        );
      } else {
        // Fallback to regular notification
        const browserNotif = new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || "/icon-192x192.png",
          data: { ...notification.data, id: notificationData.id },
          requireInteraction: notification.requireInteraction || false,
          silent: notification.silent || false,
          tag: notificationData.id,
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          browserNotif.close();
        }, 5000);
      }

      // Show toast notification as well
      this.showToast(notification);

      return true;
    } catch (error) {
      console.error("Error showing notification:", error);
      // Fallback to toast only
      this.showToast(notification);
      return false;
    }
  }

  // Show toast notification (always works)
  private showToast(
    notification: Omit<NotificationData, "id" | "timestamp" | "read">,
  ) {
    switch (notification.type) {
      case "success":
        toast.success(notification.title, { description: notification.body });
        break;
      case "error":
        toast.error(notification.title, { description: notification.body });
        break;
      case "warning":
        toast.warning(notification.title, { description: notification.body });
        break;
      case "order":
        toast.info(`🛍️ ${notification.title}`, {
          description: notification.body,
        });
        break;
      case "promotion":
        toast.info(`🎉 ${notification.title}`, {
          description: notification.body,
        });
        break;
      default:
        toast.info(notification.title, { description: notification.body });
    }
  }

  // Add notification to local storage and notify subscribers
  private addNotification(notification: NotificationData) {
    this.notifications.unshift(notification);
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    this.saveNotificationsToStorage();
    this.notifySubscribers();
  }

  // Get all notifications
  getNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  // Get unread notifications
  getUnreadNotifications(): NotificationData[] {
    return this.notifications.filter((n) => !n.read);
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      notification.read = true;
      this.saveNotificationsToStorage();
      this.notifySubscribers();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.saveNotificationsToStorage();
    this.notifySubscribers();
  }

  // Delete notification
  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(
      (n) => n.id !== notificationId,
    );
    this.saveNotificationsToStorage();
    this.notifySubscribers();
  }

  // Clear all notifications
  clearAllNotifications() {
    this.notifications = [];
    this.saveNotificationsToStorage();
    this.notifySubscribers();
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: NotificationData[]) => void) {
    this.subscribers.push(callback);
    // Immediately call with current notifications
    callback(this.notifications);

    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.notifications));
  }

  // Save notifications to localStorage
  private saveNotificationsToStorage() {
    try {
      localStorage.setItem(
        "koolihub_notifications",
        JSON.stringify(this.notifications),
      );
    } catch (error) {
      console.error("Failed to save notifications to storage:", error);
    }
  }

  // Load notifications from localStorage
  private loadNotificationsFromStorage() {
    try {
      const stored = localStorage.getItem("koolihub_notifications");
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load notifications from storage:", error);
      this.notifications = [];
    }
  }

  // Predefined notification templates
  showOrderNotification(orderId: string, status: string, message: string) {
    return this.showNotification({
      title: `Order ${status}`,
      body: `Order #${orderId}: ${message}`,
      type: "order",
      data: { orderId, status },
      requireInteraction: true,
    });
  }

  showPromotionNotification(
    title: string,
    description: string,
    promoCode?: string,
  ) {
    return this.showNotification({
      title,
      body: description + (promoCode ? ` Use code: ${promoCode}` : ""),
      type: "promotion",
      data: { promoCode },
    });
  }

  showDeliveryNotification(orderId: string, estimatedTime: string) {
    return this.showNotification({
      title: "Delivery Update",
      body: `Your order #${orderId} will be delivered in ${estimatedTime}`,
      type: "info",
      data: { orderId, estimatedTime },
      requireInteraction: true,
    });
  }

  showPaymentNotification(
    orderId: string,
    amount: number,
    status: "success" | "failed",
  ) {
    return this.showNotification({
      title: status === "success" ? "Payment Successful" : "Payment Failed",
      body:
        status === "success"
          ? `Payment of ₹${amount} for order #${orderId} was successful`
          : `Payment of ₹${amount} for order #${orderId} failed. Please try again.`,
      type: status === "success" ? "success" : "error",
      data: { orderId, amount, status },
      requireInteraction: status === "failed",
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Utility functions
export const requestNotificationPermission = () =>
  notificationService.requestPermission();
export const showNotification = (
  notification: Omit<NotificationData, "id" | "timestamp" | "read">,
) => notificationService.showNotification(notification);
export const getNotifications = () => notificationService.getNotifications();
export const getUnreadNotifications = () =>
  notificationService.getUnreadNotifications();
export const markNotificationAsRead = (id: string) =>
  notificationService.markAsRead(id);
export const subscribeToNotifications = (
  callback: (notifications: NotificationData[]) => void,
) => notificationService.subscribe(callback);

export default notificationService;
