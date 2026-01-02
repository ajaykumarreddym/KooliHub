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
import { LocationProvider } from "@/contexts/LocationContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CustomFieldsTest } from "@/pages/admin/CustomFieldsTest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Consumer Pages
import { LocationGuard } from "@/components/guards/LocationGuard";
import { AuthCallback } from "./pages/AuthCallback";
import Beauty from "./pages/Beauty";
import CarRental from "./pages/CarRental";
import DynamicServicePage from "./pages/DynamicServicePage";
import Electronics from "./pages/Electronics";
import Fashion from "./pages/Fashion";
import Grocery from "./pages/Grocery";
import Handyman from "./pages/Handyman";
import HomeKitchen from "./pages/HomeKitchen";
import Index from "./pages/Index";
import LocationSelection from "./pages/LocationSelection";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import AddVehicle from "./pages/trip-booking/AddVehicle";
import BookingConfirmation from "./pages/trip-booking/BookingConfirmation";
import BookTrip from "./pages/trip-booking/BookTrip";
import HelpSupport from "./pages/trip-booking/HelpSupport";
import LiveTracking from "./pages/trip-booking/LiveTracking";
import MyPublishedRides from "./pages/trip-booking/MyPublishedRides";
import NotificationSettings from "./pages/trip-booking/NotificationSettings";
import PaymentMethods from "./pages/trip-booking/PaymentMethods";
import PrivacySettings from "./pages/trip-booking/PrivacySettings";
import PublishRideEnhanced from "./pages/trip-booking/PublishRideEnhanced";
import RateTrip from "./pages/trip-booking/RateTrip";
import TripBookingProfile from "./pages/trip-booking/TripBookingProfile";
import TripChat from "./pages/trip-booking/TripChat";
import TripDetails from "./pages/trip-booking/TripDetails";
import TripSearchResults from "./pages/trip-booking/TripSearchResults";
import VehicleManagement from "./pages/trip-booking/VehicleManagement";
import VehicleDetails from "./pages/trip-booking/VehicleDetails";
import DriverProfile from "./pages/trip-booking/DriverProfile";
import VerificationID from "./pages/trip-booking/VerificationID";
import MyBookings from "./pages/trip-booking/MyBookings";
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
              <LocationProvider>
                <WishlistProvider>
                  <CartProvider>
                    <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                    <Routes>
                      {/* Location Selection - Must be first before any protected routes */}
                      <Route path="/location-selection" element={<LocationSelection />} />

          {/* Consumer App Routes - Index handles its own location modal */}
          <Route path="/" element={<Index />} />
          
          {/* Main Service Routes - Using custom pages for better UX */}
          <Route path="/grocery" element={<LocationGuard><Grocery /></LocationGuard>} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trip-booking" element={<Trips />} />
          <Route path="/trip-booking/search" element={<TripSearchResults />} />
          <Route path="/trip-booking/trip/:id" element={<TripDetails />} />
          <Route path="/trip-booking/profile" element={<TripBookingProfile />} />
          <Route path="/trip-booking/verification" element={<VerificationID />} />
          <Route path="/trip-booking/notifications" element={<NotificationSettings />} />
          <Route path="/trip-booking/payment" element={<PaymentMethods />} />
          <Route path="/trip-booking/privacy" element={<PrivacySettings />} />
          <Route path="/trip-booking/help" element={<HelpSupport />} />
          <Route path="/trip-booking/my-rides" element={<MyPublishedRides />} />
              <Route path="/trip-booking/publish-ride" element={<PublishRideEnhanced />} />
          <Route path="/trip-booking/rate/:bookingId" element={<RateTrip />} />
          <Route path="/trip-booking/tracking/:tripId" element={<LiveTracking />} />
          <Route path="/trip-booking/chat/:tripId" element={<TripChat />} />
          <Route path="/trip-booking/book/:tripId" element={<BookTrip />} />
          <Route path="/trip-booking/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
          <Route path="/trip-booking/my-bookings" element={<MyBookings />} />
          <Route path="/trip-booking/add-vehicle" element={<AddVehicle />} />
          <Route path="/trip-booking/vehicles" element={<VehicleManagement />} />
          <Route path="/trip-booking/vehicle/:id" element={<VehicleDetails />} />
          <Route path="/trip-booking/vehicle/:id/edit" element={<AddVehicle />} />
          <Route path="/trip-booking/driver/:id" element={<DriverProfile />} />
          <Route path="/trip-booking/driver/:id/vehicles" element={<VehicleManagement />} />
          <Route path="/trip-booking/profile/:id" element={<TripBookingProfile />} />
          <Route path="/car-rental" element={<LocationGuard><CarRental /></LocationGuard>} />
          <Route path="/handyman" element={<LocationGuard><Handyman /></LocationGuard>} />
          <Route path="/home-kitchen" element={<LocationGuard><HomeKitchen /></LocationGuard>} />
          <Route path="/home" element={<LocationGuard><HomeKitchen /></LocationGuard>} />
          <Route path="/electronics" element={<LocationGuard><Electronics /></LocationGuard>} />
          <Route path="/fashion" element={<LocationGuard><Fashion /></LocationGuard>} />
          <Route path="/beauty" element={<LocationGuard><Beauty /></LocationGuard>} />
          <Route path="/beauty-wellness" element={<LocationGuard><Beauty /></LocationGuard>} />
          
          {/* All Service Types - Dynamic routing for all database service types */}
          <Route path="/fruits-and-vegitables" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/commercial-vehicles" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/liquor" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/pharmacy" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/pet-care" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/laundry" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/food-delivery" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/books-stationery" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/fitness" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          <Route path="/jewelry" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          
          {/* Generic service route - Catches any service type from database */}
          <Route path="/service/:serviceType" element={<LocationGuard><DynamicServicePage /></LocationGuard>} />
          
          {/* Product Detail Page */}
          <Route path="/product/:id" element={<LocationGuard><ProductDetail /></LocationGuard>} />

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
              </LocationProvider>
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
