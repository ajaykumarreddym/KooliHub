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

import React from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { FirebaseProvider } from "@/components/firebase/FirebaseProvider";

// Consumer Pages
import Index from "./pages/Index";
import Grocery from "./pages/Grocery";
import Trips from "./pages/Trips";
import CarRental from "./pages/CarRental";
import Handyman from "./pages/Handyman";
import HomeKitchen from "./pages/HomeKitchen";
import Electronics from "./pages/Electronics";
import Fashion from "./pages/Fashion";
import Beauty from "./pages/Beauty";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import UserTest from "./pages/UserTest";
import { AuthCallback } from "./pages/AuthCallback";

// Admin pages
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";
import { Users } from "./pages/admin/Users";
import { Analytics } from "./pages/admin/Analytics";
import { ServiceAreas } from "./pages/admin/ServiceAreas";
import { ServiceTypes } from "./pages/admin/ServiceTypes";
import { Coupons } from "./pages/admin/Coupons";
import { Banners } from "./pages/admin/Banners";
import { Notifications } from "./pages/admin/Notifications";
import { Payments } from "./pages/admin/Payments";
import { AppConfig } from "./pages/admin/AppConfig";
import { DatabaseSetup } from "./pages/admin/DatabaseSetup";
import { Orders } from "./pages/admin/Orders";
import { OrderFulfillment } from "./pages/admin/OrderFulfillment";
import { OrderAnalytics } from "./pages/admin/OrderAnalytics";
import { FirebaseNotifications } from "./pages/admin/FirebaseNotifications";
import { AreaInventory } from "./pages/admin/AreaInventory";
import { POS } from "./pages/admin/POS";
import { Vendors } from "./pages/admin/Vendors";
import { ProductsInventory } from "./pages/admin/ProductsInventory";

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
                        <Route path="pos" element={<POS />} />
                        <Route path="vendors" element={<Vendors />} />
                        <Route
                          path="products-inventory"
                          element={<ProductsInventory />}
                        />
                        {/* Redirect old routes to unified page */}
                        <Route
                          path="products"
                          element={
                            <Navigate to="/admin/products-inventory" replace />
                          }
                        />
                        <Route
                          path="inventory"
                          element={
                            <Navigate to="/admin/products-inventory" replace />
                          }
                        />
                        <Route
                          path="area-inventory"
                          element={<AreaInventory />}
                        />
                        <Route path="users" element={<Users />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route
                          path="service-areas"
                          element={<ServiceAreas />}
                        />
                        <Route
                          path="service-types"
                          element={<ServiceTypes />}
                        />
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
                      </Route>

                      {/* 404 Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </CartProvider>
            </WishlistProvider>
          </FirebaseProvider>
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
