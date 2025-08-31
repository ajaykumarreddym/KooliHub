import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import FirebaseAdmin from "../lib/firebase-admin";

// Save FCM token
export const saveFCMToken: RequestHandler = async (req, res) => {
  try {
    const { token, userId, userAgent } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Save token to database
    const { data, error } = await supabase.from("fcm_tokens").upsert(
      {
        token,
        user_id: userId,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
        is_active: true,
      },
      {
        onConflict: "token",
      },
    );

    if (error) {
      console.error("Error saving FCM token:", error);
      return res.status(500).json({ error: "Failed to save token" });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error in saveFCMToken:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Subscribe to topic
export const subscribeToTopic: RequestHandler = async (req, res) => {
  try {
    const { token, topic } = req.body;

    if (!token || !topic) {
      return res.status(400).json({ error: "Token and topic are required" });
    }

    const result = await FirebaseAdmin.subscribeToTopic([token], topic);

    if (result.success) {
      // Update database with topic subscription
      await supabase
        .from("fcm_tokens")
        .update({
          topics: supabase.sql`array_append(COALESCE(topics, ARRAY[]::text[]), ${topic})`,
          updated_at: new Date().toISOString(),
        })
        .eq("token", token);
    }

    res.json(result);
  } catch (error) {
    console.error("Error in subscribeToTopic:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unsubscribe from topic
export const unsubscribeFromTopic: RequestHandler = async (req, res) => {
  try {
    const { token, topic } = req.body;

    if (!token || !topic) {
      return res.status(400).json({ error: "Token and topic are required" });
    }

    const result = await FirebaseAdmin.unsubscribeFromTopic([token], topic);

    if (result.success) {
      // Update database to remove topic subscription
      await supabase
        .from("fcm_tokens")
        .update({
          topics: supabase.sql`array_remove(COALESCE(topics, ARRAY[]::text[]), ${topic})`,
          updated_at: new Date().toISOString(),
        })
        .eq("token", token);
    }

    res.json(result);
  } catch (error) {
    console.error("Error in unsubscribeFromTopic:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send notification to user
export const sendNotificationToUser: RequestHandler = async (req, res) => {
  try {
    const { userId, title, body, imageUrl, url, data } = req.body;

    if (!userId || !title || !body) {
      return res
        .status(400)
        .json({ error: "userId, title, and body are required" });
    }

    // Get user's FCM tokens
    const { data: tokens, error } = await supabase
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error || !tokens || tokens.length === 0) {
      return res.status(404).json({ error: "No active tokens found for user" });
    }

    const tokenList = tokens.map((t) => t.token);
    const result = await FirebaseAdmin.sendToTokens(tokenList, {
      title,
      body,
      imageUrl,
      url,
      data,
    });

    res.json(result);
  } catch (error) {
    console.error("Error in sendNotificationToUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send notification to topic
export const sendNotificationToTopic: RequestHandler = async (req, res) => {
  try {
    const { topic, title, body, imageUrl, url, data } = req.body;

    if (!topic || !title || !body) {
      return res
        .status(400)
        .json({ error: "topic, title, and body are required" });
    }

    const result = await FirebaseAdmin.sendToTopic(topic, {
      title,
      body,
      imageUrl,
      url,
      data,
    });

    res.json(result);
  } catch (error) {
    console.error("Error in sendNotificationToTopic:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send order notification
export const sendOrderNotification: RequestHandler = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: "orderId and status are required" });
    }

    // Get order and user info
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles!inner(*)
      `,
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get user's FCM tokens
    const { data: tokens } = await supabase
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", order.user_id)
      .eq("is_active", true);

    if (!tokens || tokens.length === 0) {
      return res.status(404).json({ error: "No active tokens found for user" });
    }

    const results = await Promise.all(
      tokens.map((t) =>
        FirebaseAdmin.sendOrderNotification(t.token, orderId, status),
      ),
    );

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error in sendOrderNotification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Test notification
export const sendTestNotification: RequestHandler = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const result = await FirebaseAdmin.sendToToken(token, {
      title: "🔔 Test Notification",
      body: "This is a test notification from KooliHub!",
      url: "/",
      data: { type: "test" },
    });

    res.json(result);
  } catch (error) {
    console.error("Error in sendTestNotification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user's notification settings
export const getNotificationSettings: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("fcm_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      return res
        .status(500)
        .json({ error: "Failed to fetch notification settings" });
    }

    res.json({ tokens: data || [] });
  } catch (error) {
    console.error("Error in getNotificationSettings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
