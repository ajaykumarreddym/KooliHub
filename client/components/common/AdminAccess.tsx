import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Settings,
  Key,
  Database,
  BarChart3,
  Users,
  Package,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const AdminAccess: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdminUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const adminRoutes = [
    {
      label: "Admin Guide",
      path: "/admin/guide",
      icon: <HelpCircle className="h-4 w-4" />,
      description: "Setup instructions",
    },
    {
      label: "Database Setup",
      path: "/admin/database-setup",
      icon: <Database className="h-4 w-4" />,
      description: "Configure database",
    },
    {
      label: "Admin Login",
      path: "/admin/login",
      icon: <Key className="h-4 w-4" />,
      description: "Access admin panel",
    },
  ];

  const adminFeatures = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      label: "Inventory",
      path: "/admin/inventory",
      icon: <Package className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      label: "Service Areas",
      path: "/admin/service-areas",
      icon: <MapPin className="h-4 w-4" />,
      requiresAuth: true,
    },
  ];

  const handleNavigation = (path: string, requiresAuth: boolean = false) => {
    if (requiresAuth && (!isAuthenticated || !isAdminUser)) {
      navigate("/admin/login");
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Admin
          {isAuthenticated && isAdminUser && (
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Admin Panel
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Setup & Access */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Setup & Access
        </DropdownMenuLabel>
        {adminRoutes.map((route) => (
          <DropdownMenuItem
            key={route.path}
            onClick={() => handleNavigation(route.path)}
            className="flex items-start gap-2 cursor-pointer"
          >
            {route.icon}
            <div>
              <div className="font-medium">{route.label}</div>
              <div className="text-xs text-gray-500">{route.description}</div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Admin Features */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Admin Features
        </DropdownMenuLabel>
        {adminFeatures.map((feature) => (
          <DropdownMenuItem
            key={feature.path}
            onClick={() => handleNavigation(feature.path, feature.requiresAuth)}
            className="flex items-center gap-2 cursor-pointer"
            disabled={
              feature.requiresAuth && (!isAuthenticated || !isAdminUser)
            }
          >
            {feature.icon}
            <span>{feature.label}</span>
            {feature.requiresAuth && (!isAuthenticated || !isAdminUser) && (
              <Badge variant="secondary" className="text-xs ml-auto">
                Login Required
              </Badge>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Status */}
        <DropdownMenuItem className="focus:bg-transparent">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-gray-500">Status:</span>
            <Badge
              variant={isAuthenticated && isAdminUser ? "default" : "secondary"}
              className="text-xs"
            >
              {isAuthenticated && isAdminUser
                ? "Admin Logged In"
                : "Not Logged In"}
            </Badge>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
