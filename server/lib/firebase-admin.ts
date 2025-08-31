import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";

// Firebase Admin configuration
// In production, use the service account key file
const serviceAccount = {
  type: "service_account",
  project_id: "koolihub",
  private_key_id: "6ed6ef073b9a8324baba8e12e561824212ee84ba",
  private_key:
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ||
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhPjD68SqXpo1x\n+aZxvuNz80Z7F+l8UsOGG+JjGOHNfOIa4XdAnqw2gxWUQHZLHbsL8BS5/posqCq5\nBQ0nSVVuKAlwkSgEiPzhTohMMfks/7zXgR9PB69KaPYFE6djl4W/dzUnu3gQ8YjB\nZ2pJbJ/MGcu/8dosgueceg8kJ0bvvNFaATaMAWQ1Qq6ws8CvCMKEnY0M/CqaBcE4\n...(truncated for security)\n-----END PRIVATE KEY-----",
  client_email: "firebase-adminsdk-fbsvc@koolihub.iam.gserviceaccount.com",
  client_id: "107762725544640688323",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40koolihub.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

// Initialize Firebase Admin only when needed (not during build)
let app: any = null;
let adminMessaging: any = null;
let adminAuth: any = null;

function initializeFirebaseAdmin() {
  if (app) return app;

  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(serviceAccount as any),
      projectId: "koolihub",
    });
  } else {
    app = getApps()[0];
  }

  adminMessaging = getMessaging(app);
  adminAuth = getAuth(app);

  return app;
}

// Getter functions to ensure initialization
export function getAdminMessaging() {
  if (!adminMessaging) {
    initializeFirebaseAdmin();
  }
  return adminMessaging;
}

export function getAdminAuth() {
  if (!adminAuth) {
    initializeFirebaseAdmin();
  }
  return adminAuth;
}

// Notification types
export interface NotificationData {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  url?: string;
}

export interface NotificationTarget {
  token?: string;
  tokens?: string[];
  topic?: string;
  condition?: string;
}

export class FirebaseAdmin {
  // Send notification to specific token
  static async sendToToken(token: string, notification: NotificationData) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          url: notification.url || "/",
          ...notification.data,
        },
        token: token,
        webpush: {
          fcmOptions: {
            link: notification.url || "/",
          },
        },
      };

      const response = await getAdminMessaging().send(message);
      console.log("Successfully sent message:", response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple tokens
  static async sendToTokens(tokens: string[], notification: NotificationData) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          url: notification.url || "/",
          ...notification.data,
        },
        tokens: tokens,
        webpush: {
          fcmOptions: {
            link: notification.url || "/",
          },
        },
      };

      const response = await getAdminMessaging().sendEachForMulticast(message);
      console.log("Successfully sent messages:", response);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error("Error sending messages:", error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to topic
  static async sendToTopic(topic: string, notification: NotificationData) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          url: notification.url || "/",
          ...notification.data,
        },
        topic: topic,
        webpush: {
          fcmOptions: {
            link: notification.url || "/",
          },
        },
      };

      const response = await getAdminMessaging().send(message);
      console.log("Successfully sent message to topic:", response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error("Error sending message to topic:", error);
      return { success: false, error: error.message };
    }
  }

  // Subscribe tokens to topic
  static async subscribeToTopic(tokens: string[], topic: string) {
    try {
      const response = await getAdminMessaging().subscribeToTopic(
        tokens,
        topic,
      );
      console.log("Successfully subscribed to topic:", response);
      return { success: true, response };
    } catch (error) {
      console.error("Error subscribing to topic:", error);
      return { success: false, error: error.message };
    }
  }

  // Unsubscribe tokens from topic
  static async unsubscribeFromTopic(tokens: string[], topic: string) {
    try {
      const response = await getAdminMessaging().unsubscribeFromTopic(
        tokens,
        topic,
      );
      console.log("Successfully unsubscribed from topic:", response);
      return { success: true, response };
    } catch (error) {
      console.error("Error unsubscribing from topic:", error);
      return { success: false, error: error.message };
    }
  }

  // Send order notifications
  static async sendOrderNotification(
    userToken: string,
    orderId: string,
    status: string,
  ) {
    const statusMessages = {
      confirmed: {
        title: "🎉 Order Confirmed!",
        body: `Your order #${orderId} has been confirmed and is being processed.`,
        url: `/orders/${orderId}`,
      },
      shipped: {
        title: "🚚 Order Shipped!",
        body: `Your order #${orderId} is on its way! Track your delivery.`,
        url: `/orders/${orderId}/track`,
      },
      delivered: {
        title: "✅ Order Delivered!",
        body: `Your order #${orderId} has been delivered successfully.`,
        url: `/orders/${orderId}`,
      },
      cancelled: {
        title: "❌ Order Cancelled",
        body: `Your order #${orderId} has been cancelled.`,
        url: `/orders/${orderId}`,
      },
    };

    const messageData = statusMessages[status];
    if (!messageData) return { success: false, error: "Invalid status" };

    return this.sendToToken(userToken, {
      ...messageData,
      data: { orderId, status, type: "order_update" },
    });
  }

  // Send promotional notifications
  static async sendPromotionalNotification(
    topic: string,
    title: string,
    body: string,
    imageUrl?: string,
    url?: string,
  ) {
    return this.sendToTopic(topic, {
      title,
      body,
      imageUrl,
      url,
      data: { type: "promotion" },
    });
  }

  // Send service notifications
  static async sendServiceNotification(
    userToken: string,
    serviceType: string,
    message: string,
  ) {
    return this.sendToToken(userToken, {
      title: `${serviceType} Update`,
      body: message,
      data: { type: "service_update", serviceType },
    });
  }
}

export default FirebaseAdmin;
