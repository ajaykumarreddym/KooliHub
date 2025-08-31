import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Database,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

export const DatabaseStatus: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { profileError, clearProfileError } = useAuth();
  const location = useLocation();

  // Only show on admin routes
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (!isAdminRoute) {
    return null;
  }

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/check/database");
      const result = await response.json();
      setDbStatus(result.database);
      setLastCheck(new Date());
    } catch (error) {
      console.error("Failed to check database status:", error);
      setDbStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const hasIssues =
    profileError || (dbStatus && !dbStatus.profilesTable.accessible);

  if (!hasIssues && !dbStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profileError && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                {profileError}
              </AlertDescription>
            </Alert>
          )}

          {dbStatus && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Profiles Table</span>
                <Badge
                  variant={
                    dbStatus.profilesTable.accessible
                      ? "default"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {dbStatus.profilesTable.accessible ? "OK" : "Missing"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Admin Profile</span>
                <Badge
                  variant={
                    dbStatus.adminProfile.exists ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {dbStatus.adminProfile.exists ? "Exists" : "Missing"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Auth Users</span>
                <Badge variant="outline" className="text-xs">
                  {dbStatus.authUsers.totalCount} users
                </Badge>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={checkDatabaseStatus}
              disabled={loading}
              className="text-xs flex-1"
            >
              {loading ? (
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Database className="mr-1 h-3 w-3" />
              )}
              Check
            </Button>

            <Button size="sm" asChild className="text-xs flex-1">
              <a href="/admin/database-setup" target="_blank">
                <ExternalLink className="mr-1 h-3 w-3" />
                Setup
              </a>
            </Button>
          </div>

          {profileError && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearProfileError}
              className="text-xs w-full"
            >
              Dismiss
            </Button>
          )}

          {lastCheck && (
            <p className="text-xs text-gray-500 text-center">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
