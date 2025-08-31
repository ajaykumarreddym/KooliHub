import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  MapPin,
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  Layers,
  Tag,
  Image,
  Bell,
  CreditCard,
  Cog,
  Database,
  ShoppingCart,
  Truck,
  TrendingUp,
  Calculator,
  Store,
} from "lucide-react";

// FIXED: Unified Products & Inventory Management - No separate items
const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "POS System",
    href: "/admin/pos",
    icon: Calculator,
  },
  {
    title: "Vendors",
    href: "/admin/vendors",
    icon: Store,
  },
  {
    title: "Products & Inventory ✓",
    href: "/admin/products-inventory",
    icon: Package,
  },
  {
    title: "Area Inventory",
    href: "/admin/area-inventory",
    icon: MapPin,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Service Areas",
    href: "/admin/service-areas",
    icon: MapPin,
  },
  {
    title: "Service Types",
    href: "/admin/service-types",
    icon: Layers,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Fulfillment",
    href: "/admin/order-fulfillment",
    icon: Truck,
  },
  {
    title: "Order Analytics",
    href: "/admin/order-analytics",
    icon: TrendingUp,
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    icon: Tag,
  },
  {
    title: "Banners",
    href: "/admin/banners",
    icon: Image,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Firebase Push",
    href: "/admin/firebase-notifications",
    icon: Bell,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "App Config",
    href: "/admin/app-config",
    icon: Cog,
  },
  {
    title: "Database Setup",
    href: "/admin/database-setup",
    icon: Database,
  },
];

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Modern design with perfect alignment */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full max-h-screen">
          {/* Logo - Modern branding with perfect spacing */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/90 rounded-lg flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-900">
                  KooliHub
                </span>
                <span className="text-xs text-gray-500">Admin Panel • Unified ✓</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation - Clean modern design with enhanced scrolling */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            <div className="space-y-1 pb-4">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    )
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* User info - Clean profile section */}
          <div className="p-3 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 py-2 h-auto hover:bg-gray-100 rounded-lg"
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="text-sm bg-primary text-white">
                      {profile?.full_name?.[0] || profile?.email?.[0] || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900">
                      {profile?.full_name || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {profile?.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content - Perfect flex layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - Clean modern header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-10 w-10 p-0 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Manage your platform efficiently
              </p>
            </div>

            <div className="block sm:hidden">
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="h-9 px-3 sm:px-4 hover:bg-gray-50"
          >
            <Home className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">View Site</span>
          </Button>
        </header>

        {/* Page content - Perfectly aligned and responsive */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
