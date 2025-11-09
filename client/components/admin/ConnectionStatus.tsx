import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyAdminAccess } from "@/lib/admin-verify";
import { logDetailedError, parseError } from "@/lib/debug-utils";
import { supabase } from "@/lib/supabase";
import {
    CheckCircle,
    Database,
    RefreshCw,
    Shield,
    User,
    UserX,
    Wifi,
    WifiOff,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface ConnectionInfo {
  supabaseConnected: boolean;
  userAuthenticated: boolean;
  userRole: string | null;
  projectUrl: string | null;
  errors: string[];
}

export const ConnectionStatus: React.FC = () => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    supabaseConnected: false,
    userAuthenticated: false,
    userRole: null,
    projectUrl: null,
    errors: [],
  });
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    const errors: string[] = [];

    try {
      // Get project URL from environment variable
      const projectUrl = import.meta.env.VITE_SUPABASE_URL || '';

      // Test basic connection
      let supabaseConnected = false;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .limit(1);

        if (error) {
          logDetailedError("Supabase Connection Test", error);
          errors.push(`Connection: ${parseError(error)}`);
        } else {
          supabaseConnected = true;
        }
      } catch (error) {
        logDetailedError("Supabase Connection Exception", error);
        errors.push(`Connection Exception: ${parseError(error)}`);
      }

      // Check auth status
      let userAuthenticated = false;
      let userRole: string | null = null;

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          logDetailedError("Auth Check", authError);
          errors.push(`Auth: ${parseError(authError)}`);
        } else if (user) {
          userAuthenticated = true;

          // Get user role
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single();

            if (profileError) {
              logDetailedError("Profile Check", profileError);
              errors.push(`Profile: ${parseError(profileError)}`);
            } else if (profile) {
              userRole = profile.role;
            }
          } catch (error) {
            logDetailedError("Profile Exception", error);
            errors.push(`Profile Exception: ${parseError(error)}`);
          }
        } else {
          errors.push("No authenticated user found");
        }
      } catch (error) {
        logDetailedError("Auth Exception", error);
        errors.push(`Auth Exception: ${parseError(error)}`);
      }

      setConnectionInfo({
        supabaseConnected,
        userAuthenticated,
        userRole,
        projectUrl,
        errors,
      });
    } catch (error) {
      logDetailedError("Connection Check Exception", error);
      setConnectionInfo({
        supabaseConnected: false,
        userAuthenticated: false,
        userRole: null,
        projectUrl: null,
        errors: [`General Exception: ${parseError(error)}`],
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return status ? (
      <Badge className="bg-green-500">{label}</Badge>
    ) : (
      <Badge variant="destructive">Not {label}</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Connection Status</span>
          </CardTitle>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={checking}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`}
              />
              {checking ? "Checking..." : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={verifyAdminAccess}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Admin
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionInfo.supabaseConnected)}
              <span className="font-medium">Supabase</span>
            </div>
            {getStatusBadge(connectionInfo.supabaseConnected, "Connected")}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              {connectionInfo.userAuthenticated ? (
                <User className="h-4 w-4 text-green-500" />
              ) : (
                <UserX className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">Authentication</span>
            </div>
            {getStatusBadge(connectionInfo.userAuthenticated, "Authenticated")}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              {connectionInfo.userRole === "admin" ? (
                <Shield className="h-4 w-4 text-green-500" />
              ) : (
                <Shield className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">Admin Role</span>
            </div>
            <Badge
              variant={
                connectionInfo.userRole === "admin" ? "default" : "secondary"
              }
            >
              {connectionInfo.userRole || "None"}
            </Badge>
          </div>
        </div>

        {connectionInfo.projectUrl && (
          <div className="text-sm text-gray-600">
            <strong>Project URL:</strong> {connectionInfo.projectUrl}
          </div>
        )}

        {connectionInfo.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-1">
                <strong>Connection Issues:</strong>
                {connectionInfo.errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    • {error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!connectionInfo.supabaseConnected && (
          <Alert>
            <AlertDescription>
              <strong>Troubleshooting:</strong>
              <br />• Check if Supabase MCP is properly connected
              <br />• Verify your project credentials
              <br />• Ensure the database is accessible
            </AlertDescription>
          </Alert>
        )}

        {connectionInfo.supabaseConnected &&
          !connectionInfo.userAuthenticated && (
            <Alert>
              <AlertDescription>
                <strong>Authentication Required:</strong>
                <br />• Please log in to access admin features
                <br />• Ensure your account has admin privileges
              </AlertDescription>
            </Alert>
          )}

        {connectionInfo.userAuthenticated &&
          connectionInfo.userRole !== "admin" && (
            <Alert>
              <AlertDescription>
                <strong>Admin Access Required:</strong>
                <br />• Your account role: {connectionInfo.userRole || "none"}
                <br />• Admin role required for these features
                <br />• Contact an administrator to upgrade your account
              </AlertDescription>
            </Alert>
          )}
      </CardContent>
    </Card>
  );
};
