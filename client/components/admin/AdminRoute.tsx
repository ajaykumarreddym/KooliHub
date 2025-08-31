import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdminUser, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Allow access for admin email even if isAdminUser is false (database issues)
  const isAdminEmail = user?.email === "hello.krsolutions@gmail.com";

  if (!isAdminUser && !isAdminEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this area.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Authenticated: {isAuthenticated ? "Yes" : "No"} | Admin User:{" "}
            {isAdminUser ? "Yes" : "No"} | Email: {user?.email || "None"}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
