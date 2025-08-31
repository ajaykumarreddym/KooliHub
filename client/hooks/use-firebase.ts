import { useEffect, useState } from "react";
import { firebaseAnalytics } from "@/lib/firebase-analytics";
import { firebaseMessaging } from "@/lib/firebase-messaging";

export interface FirebaseState {
  analyticsInitialized: boolean;
  messagingInitialized: boolean;
  notificationPermission: "granted" | "denied" | "default" | "unsupported";
  fcmToken: string | null;
  loading: boolean;
  error: string | null;
}

export function useFirebase(userId?: string) {
  const [state, setState] = useState<FirebaseState>({
    analyticsInitialized: false,
    messagingInitialized: false,
    notificationPermission: "default",
    fcmToken: null,
    loading: true,
    error: null,
  });

  // Initialize Firebase services
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if we're in browser environment
        if (typeof window === "undefined") {
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        // Initialize analytics
        setState((prev) => ({ ...prev, analyticsInitialized: true }));

        // Check notification support
        if (!("Notification" in window)) {
          setState((prev) => ({
            ...prev,
            notificationPermission: "unsupported",
            loading: false,
          }));
          return;
        }

        // Get current permission status
        const permission = Notification.permission;
        setState((prev) => ({ ...prev, notificationPermission: permission }));

        // Initialize messaging if supported
        if (permission === "granted" && userId) {
          const token = await firebaseMessaging.initializeForUser(userId);
          setState((prev) => ({
            ...prev,
            fcmToken: token,
            messagingInitialized: !!token,
          }));
        }

        setState((prev) => ({ ...prev, loading: false }));
      } catch (error) {
        console.error("Firebase initialization error:", error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    };

    initializeFirebase();
  }, [userId]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    try {
      const granted = await firebaseMessaging.requestPermission();

      if (granted && userId) {
        const token = await firebaseMessaging.initializeForUser(userId);
        setState((prev) => ({
          ...prev,
          notificationPermission: "granted",
          fcmToken: token,
          messagingInitialized: !!token,
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          notificationPermission: "denied",
        }));
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setState((prev) => ({
        ...prev,
        error: error.message,
        notificationPermission: "denied",
      }));
      return false;
    }
  };

  // Subscribe to topic
  const subscribeToTopic = async (topic: string) => {
    if (!state.fcmToken) return false;

    try {
      const success = await firebaseMessaging.subscribeToTopic(
        state.fcmToken,
        topic,
      );
      return success;
    } catch (error) {
      console.error("Error subscribing to topic:", error);
      return false;
    }
  };

  // Unsubscribe from topic
  const unsubscribeFromTopic = async (topic: string) => {
    if (!state.fcmToken) return false;

    try {
      const success = await firebaseMessaging.unsubscribeFromTopic(
        state.fcmToken,
        topic,
      );
      return success;
    } catch (error) {
      console.error("Error unsubscribing from topic:", error);
      return false;
    }
  };

  // Track analytics events
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (state.analyticsInitialized) {
      firebaseAnalytics.trackEvent(eventName, parameters);
    }
  };

  const trackPageView = (pageName: string, pageTitle?: string) => {
    if (state.analyticsInitialized) {
      firebaseAnalytics.trackPageView(pageName, pageTitle);
    }
  };

  const trackPurchase = (
    transactionId: string,
    value: number,
    currency?: string,
    items?: any[],
  ) => {
    if (state.analyticsInitialized) {
      firebaseAnalytics.trackPurchase(transactionId, value, currency, items);
    }
  };

  // Set user properties for analytics
  const setUserProperties = (
    userId: string,
    properties?: Record<string, string>,
  ) => {
    if (state.analyticsInitialized) {
      firebaseAnalytics.setUser(userId);
      if (properties) {
        Object.entries(properties).forEach(([key, value]) => {
          firebaseAnalytics.setUserProperty(key, value);
        });
      }
    }
  };

  return {
    ...state,
    requestNotificationPermission,
    subscribeToTopic,
    unsubscribeFromTopic,
    trackEvent,
    trackPageView,
    trackPurchase,
    setUserProperties,
    analytics: {
      trackEvent,
      trackPageView,
      trackPurchase,
      setUserProperties,
      trackSignUp: (method?: string) =>
        state.analyticsInitialized && firebaseAnalytics.trackSignUp(method),
      trackLogin: (method?: string) =>
        state.analyticsInitialized && firebaseAnalytics.trackLogin(method),
      trackItemView: (
        itemId: string,
        itemName: string,
        category: string,
        value?: number,
      ) =>
        state.analyticsInitialized &&
        firebaseAnalytics.trackItemView(itemId, itemName, category, value),
      trackAddToCart: (
        itemId: string,
        itemName: string,
        category: string,
        quantity: number,
        value: number,
      ) =>
        state.analyticsInitialized &&
        firebaseAnalytics.trackAddToCart(
          itemId,
          itemName,
          category,
          quantity,
          value,
        ),
      trackSearch: (searchTerm: string, category?: string) =>
        state.analyticsInitialized &&
        firebaseAnalytics.trackSearch(searchTerm, category),
      trackServiceBooking: (
        serviceType: string,
        serviceId: string,
        value: number,
      ) =>
        state.analyticsInitialized &&
        firebaseAnalytics.trackServiceBooking(serviceType, serviceId, value),
      trackDeliveryTracking: (orderId: string, status: string) =>
        state.analyticsInitialized &&
        firebaseAnalytics.trackDeliveryTracking(orderId, status),
      trackCouponUsage: (couponCode: string, discount: number) =>
        state.analyticsInitialized &&
        firebaseAnalytics.trackCouponUsage(couponCode, discount),
      trackLocationSearch: (pincode: string, serviceType: string) =>
        state.analyticsInitialized &&
        firebaseAnalytics.trackLocationSearch(pincode, serviceType),
    },
  };
}

export default useFirebase;
