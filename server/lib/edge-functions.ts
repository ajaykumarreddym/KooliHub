import { supabase } from "./supabase";

/**
 * KooliHub Edge Functions Client
 * Provides easy access to Supabase Edge Functions from the Express server
 */

// Types
interface NotificationParams {
  userId?: string;
  tokens?: string[];
  topic?: string;
  title: string;
  body: string;
  imageUrl?: string;
  url?: string;
  data?: Record<string, any>;
}

interface NotificationResult {
  success: boolean;
  results?: any[];
  totalSent?: number;
  totalFailed?: number;
  error?: string;
}

interface AnalyticsResult {
  success: boolean;
  timestamp?: string;
  date?: string;
  metrics?: Record<string, any>;
  error?: string;
}

interface CleanupResult {
  success: boolean;
  timestamp?: string;
  results?: Record<string, any>;
  error?: string;
}

/**
 * Send push notification via FCM
 */
export async function sendNotification(
  params: NotificationParams,
): Promise<NotificationResult> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "send-notification",
      {
        body: params,
      },
    );

    if (error) {
      console.error("Edge function error:", error);
      return { success: false, error: error.message };
    }

    return data as NotificationResult;
  } catch (error) {
    console.error("Failed to invoke send-notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send notification to a specific user
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  options?: {
    imageUrl?: string;
    url?: string;
    data?: Record<string, any>;
  },
): Promise<NotificationResult> {
  return sendNotification({
    userId,
    title,
    body,
    ...options,
  });
}

/**
 * Send notification to multiple device tokens
 */
export async function sendNotificationToTokens(
  tokens: string[],
  title: string,
  body: string,
  options?: {
    imageUrl?: string;
    url?: string;
    data?: Record<string, any>;
  },
): Promise<NotificationResult> {
  return sendNotification({
    tokens,
    title,
    body,
    ...options,
  });
}

/**
 * Send notification to a topic
 */
export async function sendNotificationToTopic(
  topic: string,
  title: string,
  body: string,
  options?: {
    imageUrl?: string;
    url?: string;
    data?: Record<string, any>;
  },
): Promise<NotificationResult> {
  return sendNotification({
    topic,
    title,
    body,
    ...options,
  });
}

/**
 * Trigger analytics aggregation
 * This can be called manually or scheduled via cron
 */
export async function triggerAnalyticsAggregation(): Promise<AnalyticsResult> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "analytics-aggregator",
      {
        body: {},
      },
    );

    if (error) {
      console.error("Edge function error:", error);
      return { success: false, error: error.message };
    }

    return data as AnalyticsResult;
  } catch (error) {
    console.error("Failed to invoke analytics-aggregator:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Trigger database cleanup
 * This can be called manually or scheduled via cron
 */
export async function triggerDatabaseCleanup(): Promise<CleanupResult> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "scheduled-cleanup",
      {
        body: {},
      },
    );

    if (error) {
      console.error("Edge function error:", error);
      return { success: false, error: error.message };
    }

    return data as CleanupResult;
  } catch (error) {
    console.error("Failed to invoke scheduled-cleanup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper function to send order notifications
 * Wraps the edge function call with order-specific logic
 */
export async function sendOrderNotification(
  orderId: string,
  status: string,
  userId: string,
): Promise<NotificationResult> {
  const statusMessages: Record<string, string> = {
    confirmed: "✅ Your order has been confirmed!",
    processing: "⚙️ Your order is being prepared",
    ready: "🎁 Your order is ready!",
    out_for_delivery: "🚚 Your order is out for delivery",
    delivered: "✨ Your order has been delivered!",
    cancelled: "❌ Your order has been cancelled",
  };

  const message = statusMessages[status] || `Order status updated to ${status}`;

  return sendNotificationToUser(userId, "Order Update", message, {
    data: {
      type: "order_status",
      orderId,
      status,
    },
    url: `/orders/${orderId}`,
  });
}

/**
 * Send welcome notification to new users
 */
export async function sendWelcomeNotification(
  userId: string,
  userName?: string,
): Promise<NotificationResult> {
  return sendNotificationToUser(
    userId,
    `Welcome to KooliHub${userName ? `, ${userName}` : ""}! 🎉`,
    "Start exploring our wide range of services and products!",
    {
      data: {
        type: "welcome",
      },
      url: "/",
    },
  );
}

/**
 * Send vendor notification for new orders
 */
export async function sendVendorOrderNotification(
  vendorId: string,
  orderId: string,
  orderAmount: number,
): Promise<NotificationResult> {
  return sendNotificationToUser(
    vendorId,
    "📦 New Order Received",
    `You have a new order worth ₹${orderAmount.toFixed(2)}`,
    {
      data: {
        type: "vendor_order",
        orderId,
      },
      url: `/admin/orders/${orderId}`,
    },
  );
}

/**
 * Send promotional notification to all users via topic
 */
export async function sendPromotionalNotification(
  title: string,
  body: string,
  options?: {
    imageUrl?: string;
    url?: string;
    data?: Record<string, any>;
  },
): Promise<NotificationResult> {
  return sendNotificationToTopic("all_users", title, body, options);
}

