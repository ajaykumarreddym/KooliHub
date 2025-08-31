import { analytics } from "./firebase";
import { logEvent, setUserProperties, setUserId } from "firebase/analytics";

export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

export class FirebaseAnalytics {
  private static instance: FirebaseAnalytics;

  public static getInstance(): FirebaseAnalytics {
    if (!FirebaseAnalytics.instance) {
      FirebaseAnalytics.instance = new FirebaseAnalytics();
    }
    return FirebaseAnalytics.instance;
  }

  private constructor() {}

  // Track page views
  trackPageView(pageName: string, pageTitle?: string) {
    if (!analytics) return;

    try {
      logEvent(analytics, "page_view", {
        page_name: pageName,
        page_title: pageTitle || pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    } catch (error) {
      console.warn("Failed to track page view:", error);
    }
  }

  // Track custom events
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (!analytics) return;

    try {
      logEvent(analytics, eventName, parameters);
    } catch (error) {
      console.warn("Failed to track event:", error);
    }
  }

  // E-commerce tracking
  trackPurchase(
    transactionId: string,
    value: number,
    currency: string = "USD",
    items?: any[],
  ) {
    if (!analytics) return;

    try {
      logEvent(analytics, "purchase", {
        transaction_id: transactionId,
        value: value,
        currency: currency,
        items: items || [],
      });
    } catch (error) {
      console.warn("Failed to track purchase:", error);
    }
  }

  // Track user registration
  trackSignUp(method: string = "email") {
    if (!analytics) return;

    try {
      logEvent(analytics, "sign_up", {
        method: method,
      });
    } catch (error) {
      console.warn("Failed to track sign up:", error);
    }
  }

  // Track user login
  trackLogin(method: string = "email") {
    if (!analytics) return;

    try {
      logEvent(analytics, "login", {
        method: method,
      });
    } catch (error) {
      console.warn("Failed to track login:", error);
    }
  }

  // Track product/service views
  trackItemView(
    itemId: string,
    itemName: string,
    category: string,
    value?: number,
  ) {
    if (!analytics) return;

    try {
      logEvent(analytics, "view_item", {
        item_id: itemId,
        item_name: itemName,
        item_category: category,
        value: value || 0,
        currency: "USD",
      });
    } catch (error) {
      console.warn("Failed to track item view:", error);
    }
  }

  // Track cart actions
  trackAddToCart(
    itemId: string,
    itemName: string,
    category: string,
    quantity: number,
    value: number,
  ) {
    if (!analytics) return;

    try {
      logEvent(analytics, "add_to_cart", {
        item_id: itemId,
        item_name: itemName,
        item_category: category,
        quantity: quantity,
        value: value,
        currency: "USD",
      });
    } catch (error) {
      console.warn("Failed to track add to cart:", error);
    }
  }

  // Track search
  trackSearch(searchTerm: string, category?: string) {
    if (!analytics) return;

    try {
      logEvent(analytics, "search", {
        search_term: searchTerm,
        category: category || "all",
      });
    } catch (error) {
      console.warn("Failed to track search:", error);
    }
  }

  // Set user properties
  setUserProperty(propertyName: string, value: string) {
    if (!analytics) return;

    try {
      setUserProperties(analytics, {
        [propertyName]: value,
      });
    } catch (error) {
      console.warn("Failed to set user property:", error);
    }
  }

  // Set user ID
  setUser(userId: string) {
    if (!analytics) return;

    try {
      setUserId(analytics, userId);
    } catch (error) {
      console.warn("Failed to set user ID:", error);
    }
  }

  // Track service-specific events
  trackServiceBooking(serviceType: string, serviceId: string, value: number) {
    this.trackEvent("service_booking", {
      service_type: serviceType,
      service_id: serviceId,
      value: value,
      currency: "USD",
    });
  }

  trackDeliveryTracking(orderId: string, status: string) {
    this.trackEvent("delivery_tracking", {
      order_id: orderId,
      delivery_status: status,
    });
  }

  trackCouponUsage(couponCode: string, discount: number) {
    this.trackEvent("coupon_used", {
      coupon_code: couponCode,
      discount_value: discount,
    });
  }

  trackLocationSearch(pincode: string, serviceType: string) {
    this.trackEvent("location_search", {
      pincode: pincode,
      service_type: serviceType,
    });
  }
}

// Export singleton instance
export const firebaseAnalytics = FirebaseAnalytics.getInstance();
export default firebaseAnalytics;
