import React, { createContext, useContext, useEffect } from "react";
import { useFirebase } from "@/hooks/use-firebase";
import { useAuth } from "@/contexts/AuthContext";

interface FirebaseContextType {
  analyticsInitialized: boolean;
  messagingInitialized: boolean;
  notificationPermission: "granted" | "denied" | "default" | "unsupported";
  fcmToken: string | null;
  loading: boolean;
  error: string | null;
  requestNotificationPermission: () => Promise<boolean>;
  subscribeToTopic: (topic: string) => Promise<boolean>;
  unsubscribeFromTopic: (topic: string) => Promise<boolean>;
  analytics: {
    trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
    trackPageView: (pageName: string, pageTitle?: string) => void;
    trackPurchase: (
      transactionId: string,
      value: number,
      currency?: string,
      items?: any[],
    ) => void;
    trackSignUp: (method?: string) => void;
    trackLogin: (method?: string) => void;
    trackItemView: (
      itemId: string,
      itemName: string,
      category: string,
      value?: number,
    ) => void;
    trackAddToCart: (
      itemId: string,
      itemName: string,
      category: string,
      quantity: number,
      value: number,
    ) => void;
    trackSearch: (searchTerm: string, category?: string) => void;
    trackServiceBooking: (
      serviceType: string,
      serviceId: string,
      value: number,
    ) => void;
    trackDeliveryTracking: (orderId: string, status: string) => void;
    trackCouponUsage: (couponCode: string, discount: number) => void;
    trackLocationSearch: (pincode: string, serviceType: string) => void;
  };
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function useFirebaseContext() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error(
      "useFirebaseContext must be used within a FirebaseProvider",
    );
  }
  return context;
}

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const { user } = useAuth();
  const firebase = useFirebase(user?.id);

  // Set user properties when user logs in
  useEffect(() => {
    if (user && firebase.analyticsInitialized) {
      firebase.setUserProperties(user.id, {
        user_role: user.role || "user",
        user_email: user.email || "",
        registration_date: user.created_at || new Date().toISOString(),
      });
    }
  }, [user, firebase.analyticsInitialized]);

  // Auto-subscribe to user-specific topics
  useEffect(() => {
    if (firebase.fcmToken && user) {
      // Subscribe to general notifications
      firebase.subscribeToTopic("general");

      // Subscribe to role-specific notifications
      if (user.role) {
        firebase.subscribeToTopic(`role_${user.role}`);
      }

      // Subscribe to user-specific notifications
      firebase.subscribeToTopic(`user_${user.id}`);
    }
  }, [firebase.fcmToken, user]);

  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}

export default FirebaseProvider;
