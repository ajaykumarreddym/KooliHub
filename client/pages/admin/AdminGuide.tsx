import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  Key,
  UserCheck,
  BarChart3,
  Package,
  Users,
  MapPin,
  Settings,
  ExternalLink,
  Copy,
  CheckCircle,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const AdminGuide = () => {
  const navigate = useNavigate();
  const { isAdminUser, isAuthenticated } = useAuth();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const steps = [
    {
      title: "Step 1: Database Setup",
      icon: <Database className="h-5 w-5" />,
      description: "Set up your Supabase database tables",
      action: "Go to Database Setup",
      path: "/admin/database-setup",
      status: "required",
    },
    {
      title: "Step 2: Admin Login",
      icon: <Key className="h-5 w-5" />,
      description: "Login with admin credentials",
      action: "Go to Admin Login",
      path: "/admin/login",
      status: isAuthenticated && isAdminUser ? "completed" : "pending",
    },
    {
      title: "Step 3: Access Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      description: "View admin dashboard and analytics",
      action: "Open Dashboard",
      path: "/admin/dashboard",
      status: isAuthenticated && isAdminUser ? "available" : "locked",
    },
  ];

  const adminFeatures = [
    {
      title: "Dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      description: "Real-time stats and overview",
      path: "/admin/dashboard",
    },
    {
      title: "Inventory",
      icon: <Package className="h-4 w-4" />,
      description: "Product and category management",
      path: "/admin/inventory",
    },
    {
      title: "Users",
      icon: <Users className="h-4 w-4" />,
      description: "User management and roles",
      path: "/admin/users",
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      description: "Revenue and order analytics",
      path: "/admin/analytics",
    },
    {
      title: "Service Areas",
      icon: <MapPin className="h-4 w-4" />,
      description: "Geographic coverage management",
      path: "/admin/service-areas",
    },
    {
      title: "Debug",
      icon: <Settings className="h-4 w-4" />,
      description: "System debugging tools",
      path: "/admin/debug",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">
              Admin Panel Guide
            </CardTitle>
            <CardDescription className="text-lg">
              Complete guide to access and use the KoolHub admin panel
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Access */}
        {isAuthenticated && isAdminUser && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You're logged in as admin!</span>
              <Button onClick={() => navigate("/admin/dashboard")} size="sm">
                <ArrowRight className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Steps</CardTitle>
            <CardDescription>
              Follow these steps to set up and access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        step.status === "completed"
                          ? "default"
                          : step.status === "available"
                            ? "default"
                            : step.status === "required"
                              ? "destructive"
                              : "secondary"
                      }
                    >
                      {step.status === "completed"
                        ? "✓ Done"
                        : step.status === "available"
                          ? "Available"
                          : step.status === "required"
                            ? "Required"
                            : "Pending"}
                    </Badge>

                    <Button
                      onClick={() => navigate(step.path)}
                      size="sm"
                      disabled={step.status === "locked"}
                      variant={
                        step.status === "required" ? "default" : "outline"
                      }
                    >
                      {step.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Admin Credentials
            </CardTitle>
            <CardDescription>
              Use these credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-gray-600">
                    hello.krsolutions@gmail.com
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard("hello.krsolutions@gmail.com")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-gray-600">MySuccess@2025</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard("MySuccess@2025")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Features */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Panel Features</CardTitle>
            <CardDescription>
              Overview of available admin features and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    isAuthenticated && isAdminUser
                      ? navigate(feature.path)
                      : navigate("/admin/login")
                  }
                >
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={() => navigate("/admin/database-setup")}
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
              >
                <Database className="h-5 w-5" />
                <span>Database Setup</span>
              </Button>

              <Button
                onClick={() => navigate("/admin/login")}
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
              >
                <Key className="h-5 w-5" />
                <span>Admin Login</span>
              </Button>

              <Button
                onClick={() => navigate("/admin/dashboard")}
                disabled={!isAuthenticated || !isAdminUser}
                className="h-auto p-4 flex flex-col gap-2"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                If you're having issues accessing the admin panel:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Make sure you've completed the database setup first</li>
                <li>Check that you're using the correct admin credentials</li>
                <li>Verify your email is confirmed (if required)</li>
                <li>Contact support if issues persist</li>
              </ol>

              <div className="pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/debug")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Open Debug Tools
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
