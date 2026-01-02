import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronDown,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Settings,
  Shield,
  ShoppingBag,
  User,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

export const UserProfile: React.FC = () => {
  const { user, profile, signOut, isAdminUser, profileError } = useAuth();

  // Don't show if user is not authenticated
  if (!user) {
    return null;
  }

  // Create fallback profile data if profile is missing
  const profileData = profile || {
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    role: (user.email === "hello.krsolutions@gmail.com" ? "admin" : "user") as
      | "admin"
      | "user"
      | "guest",
    phone: user.user_metadata?.phone || null,
    created_at: "",
    updated_at: "",
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserInitials = () => {
    if (profileData.full_name) {
      return profileData.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return profileData.email[0].toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "user":
        return "default";
      case "guest":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto p-2 hover:bg-gray-100"
        >
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={profileData.avatar_url || ""} />
            <AvatarFallback className="text-sm bg-primary text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-sm font-medium leading-none text-gray-900">
              {profileData.full_name ||
                profileData.email.split("@")[0] ||
                "User"}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Badge
                variant={getRoleBadgeVariant(profileData.role)}
                className="text-xs px-2 py-0.5"
              >
                {profileData.role}
              </Badge>
              {profileError && (
                <Badge
                  variant="outline"
                  className="text-xs px-1 py-0.5 text-orange-600"
                >
                  ⚠
                </Badge>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profileData.full_name ||
                profileData.email.split("@")[0] ||
                "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profileData.email}
            </p>
            {profileData.phone && (
              <p className="text-xs leading-none text-muted-foreground">
                {profileData.phone}
              </p>
            )}
            {profileError && (
              <p className="text-xs leading-none text-orange-600">
                ⚠ Profile sync pending
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            My Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/orders" className="flex items-center">
            <ShoppingBag className="mr-2 h-4 w-4" />
            My Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/wishlist" className="flex items-center">
            <Heart className="mr-2 h-4 w-4" />
            Wishlist
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/addresses" className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            Saved Addresses
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        {(isAdminUser || profileData.role === "admin") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/admin/dashboard"
                className="flex items-center text-red-600 font-medium bg-red-50 focus:bg-red-100"
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/help" className="flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
            Help & Support
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
