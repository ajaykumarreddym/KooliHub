import "./global.css";

// Enhanced ResizeObserver error handling
const enhanceResizeObserver = () => {
  // Store original ResizeObserver
  const OriginalResizeObserver = window.ResizeObserver;

  // Create enhanced ResizeObserver that handles errors gracefully
  window.ResizeObserver = class extends OriginalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        try {
          // Use requestAnimationFrame to prevent blocking
          requestAnimationFrame(() => {
            try {
              callback(entries, observer);
            } catch (error) {
              // Silently handle specific ResizeObserver errors
              if (
                !(error instanceof Error) ||
                !error.message?.includes(
                  "loop completed with undelivered notifications",
                )
              ) {
                console.warn("ResizeObserver callback error:", error);
              }
            }
          });
        } catch (error) {
          // Silently handle ResizeObserver loop errors
          if (
            !(error instanceof Error) ||
            !error.message?.includes(
              "loop completed with undelivered notifications",
            )
          ) {
            console.warn("ResizeObserver error:", error);
          }
        }
      });
    }
  };

  // Suppress console warnings for ResizeObserver
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args.length > 0 &&
      typeof args[0] === "string" &&
      args[0].includes(
        "ResizeObserver loop completed with undelivered notifications",
      )
    ) {
      return; // Suppress this specific warning
    }
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled errors
  window.addEventListener("error", (e) => {
    if (
      e.message?.includes(
        "ResizeObserver loop completed with undelivered notifications",
      )
    ) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (e) => {
    if (
      e.reason?.message?.includes(
        "ResizeObserver loop completed with undelivered notifications",
      )
    ) {
      e.preventDefault();
      return false;
    }
  });
};

enhanceResizeObserver();

// Register Firebase Messaging Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("Firebase SW registered: ", registration);
    })
    .catch((registrationError) => {
      console.log("Firebase SW registration failed: ", registrationError);
    });
}

import { AdminRoute } from "@/components/admin/AdminRoute";
import { FirebaseProvider } from "@/components/firebase/FirebaseProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminDataProvider } from "@/contexts/AdminDataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CustomFieldsTest } from "@/pages/admin/CustomFieldsTest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Consumer Pages
import { AuthCallback } from "./pages/AuthCallback";
import Beauty from "./pages/Beauty";
import CarRental from "./pages/CarRental";
import Electronics from "./pages/Electronics";
import Fashion from "./pages/Fashion";
import Grocery from "./pages/Grocery";
import Handyman from "./pages/Handyman";
import HomeKitchen from "./pages/HomeKitchen";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Trips from "./pages/Trips";
import UserTest from "./pages/UserTest";

// Admin pages
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { Analytics } from "./pages/admin/Analytics";
import { AppConfig } from "./pages/admin/AppConfig";
import { AreaInventory } from "./pages/admin/AreaInventory";
import { Banners } from "./pages/admin/Banners";
import { Coupons } from "./pages/admin/Coupons";
import { Dashboard } from "./pages/admin/Dashboard";
import { DatabaseSetup } from "./pages/admin/DatabaseSetup";
import { FirebaseNotifications } from "./pages/admin/FirebaseNotifications";
import { Notifications } from "./pages/admin/Notifications";
import { OrderAnalytics } from "./pages/admin/OrderAnalytics";
import { OrderFulfillment } from "./pages/admin/OrderFulfillment";
import { Orders } from "./pages/admin/Orders";
import { Payments } from "./pages/admin/Payments";
import { POS } from "./pages/admin/POS";
import { ServiceManagement } from "./pages/admin/ServiceManagement";
import { UnifiedProductManagement } from "./pages/admin/UnifiedProductManagement";
import { Users } from "./pages/admin/Users";
import { Vendors } from "./pages/admin/Vendors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AdminDataProvider>
            <FirebaseProvider>
              <WishlistProvider>
                <CartProvider>
                  <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      {/* Consumer App Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/grocery" element={<Grocery />} />
                      <Route path="/trips" element={<Trips />} />
                      <Route path="/car-rental" element={<CarRental />} />
                      <Route path="/handyman" element={<Handyman />} />
                      <Route path="/home" element={<HomeKitchen />} />
                      <Route path="/electronics" element={<Electronics />} />
                      <Route path="/fashion" element={<Fashion />} />
                      <Route path="/beauty" element={<Beauty />} />

                      {/* User Profile Routes */}
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/user-test" element={<UserTest />} />

                      {/* Auth Routes */}
                      <Route path="/auth/callback" element={<AuthCallback />} />

                      {/* Admin Routes - Protected */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="services/*" element={<ServiceManagement />} />
                        <Route path="pos" element={<POS />} />
                        <Route path="vendors" element={<Vendors />} />
                        <Route
                          path="product-management"
                          element={<UnifiedProductManagement />}
                        />
                        {/* Redirect old routes to unified product management */}
                        <Route
                          path="products-inventory"
                          element={
                            <Navigate to="/admin/product-management" replace />
                          }
                        />
                        <Route
                          path="products"
                          element={
                            <Navigate to="/admin/product-management" replace />
                          }
                        />
                        <Route
                          path="inventory"
                          element={
                            <Navigate to="/admin/product-management" replace />
                          }
                        />
                        <Route
                          path="service-areas"
                          element={
                            <Navigate to="/admin/product-management" replace />
                          }
                        />
                        <Route
                          path="service-types"
                          element={
                            <Navigate to="/admin/product-management" replace />
                          }
                        />
                        <Route
                          path="area-inventory"
                          element={<AreaInventory />}
                        />
                        <Route path="users" element={<Users />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="orders" element={<Orders />} />
                        <Route
                          path="order-fulfillment"
                          element={<OrderFulfillment />}
                        />
                        <Route
                          path="order-analytics"
                          element={<OrderAnalytics />}
                        />
                        <Route path="coupons" element={<Coupons />} />
                        <Route path="banners" element={<Banners />} />
                        <Route
                          path="notifications"
                          element={<Notifications />}
                        />
                        <Route
                          path="firebase-notifications"
                          element={<FirebaseNotifications />}
                        />
                        <Route path="payments" element={<Payments />} />
                        <Route path="app-config" element={<AppConfig />} />
                        <Route
                          path="database-setup"
                          element={<DatabaseSetup />}
                        />
                        <Route
                          path="custom-fields-test"
                          element={<CustomFieldsTest />}
                        />
                      </Route>

                      {/* 404 Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </CartProvider>
            </WishlistProvider>
          </FirebaseProvider>
          </AdminDataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

// Initialize the React app
function initializeApp() {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Root container not found");
  }

  // Check if root already exists to prevent multiple createRoot calls
  let root = (container as any)._reactRoot;
  if (!root) {
    root = createRoot(container);
    (container as any)._reactRoot = root;
  }

  root.render(<App />);
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
