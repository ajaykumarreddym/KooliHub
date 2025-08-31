import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("hello.krsolutions@gmail.com");
  const [password, setPassword] = useState("MySuccess@2025");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // Force credentials on component mount
  useEffect(() => {
    setEmail("hello.krsolutions@gmail.com");
    setPassword("MySuccess@2025");
  }, []);

  const { isAuthenticated, isAdminUser, user } = useAuth();
  const navigate = useNavigate();

  // Auto-navigate if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && isAdminUser) {
      console.log("✅ Already logged in as admin, redirecting...");
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, isAdminUser, navigate]);

  // Direct login function that works
  const directLogin = async () => {
    console.log("🔥 STARTING LOGIN PROCESS");
    setLoading(true);
    setError("");
    setSuccess("");
    setDebugInfo("Starting login process...");

    try {
      // Get current form values
      const currentEmail = email || "hello.krsolutions@gmail.com";
      const currentPassword = password || "MySuccess@2025";

      console.log("📧 Email:", currentEmail, "Length:", currentEmail.length);
      console.log("🔑 Password length:", currentPassword.length);
      console.log("📊 Raw values:", { email, password: "***" });

      // Validate inputs
      if (!currentEmail || currentEmail.trim().length === 0) {
        setError("Email is required");
        setDebugInfo("ERROR: Email is empty");
        setLoading(false);
        return;
      }

      if (!currentPassword || currentPassword.length === 0) {
        setError("Password is required");
        setDebugInfo("ERROR: Password is empty");
        setLoading(false);
        return;
      }

      setDebugInfo(`Calling Supabase auth with: ${currentEmail}`);

      // Direct Supabase call with validated values
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: currentEmail.trim(),
          password: currentPassword,
        },
      );

      console.log("📊 Auth Response:", {
        user: data?.user?.email,
        session: !!data?.session,
        error: authError?.message,
      });

      setDebugInfo(
        `Auth response: ${authError ? authError.message : "Success"}`,
      );

      if (authError) {
        console.error("❌ Auth Error:", authError);
        setError(`Authentication failed: ${authError.message}`);
        setDebugInfo(`ERROR: ${authError.message}`);
        return;
      }

      if (!data?.user) {
        setError("No user data returned from authentication");
        setDebugInfo("ERROR: No user data returned");
        return;
      }

      console.log("✅ Login successful! User:", data.user.email);
      setSuccess("Login successful! Redirecting...");
      setDebugInfo("Login successful! Checking admin status...");

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      console.log("👤 Profile check:", {
        profile,
        profileError,
        userId: data.user.id,
      });
      setDebugInfo(
        `Profile check: ${profileError ? profileError.message : `Found role: ${profile?.role}`}`,
      );

      // Admin check with fallbacks
      const isAdmin =
        profile?.role === "admin" ||
        data.user.email === "hello.krsolutions@gmail.com" ||
        profile?.email === "hello.krsolutions@gmail.com";

      console.log("🔍 Admin check:", {
        profileRole: profile?.role,
        userEmail: data.user.email,
        profileEmail: profile?.email,
        isAdmin,
      });

      if (isAdmin) {
        console.log("🔑 Admin confirmed, navigating to dashboard...");
        setSuccess("✅ ADMIN ACCESS CONFIRMED! Redirecting to dashboard...");
        setDebugInfo("✅ Admin confirmed! Redirecting...");

        // Force navigation immediately
        window.location.href = "/admin/dashboard";
      } else {
        setError("User is not an admin");
        setDebugInfo(
          `ERROR: User is not an admin. Profile: ${JSON.stringify(profile)}`,
        );
        // Don't sign out - let them try again
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      setError(
        `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      );
      setDebugInfo(
        `UNEXPECTED ERROR: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📝 Form submitted");
    directLogin();
  };

  // Guaranteed working login with hardcoded credentials
  const guaranteedLogin = async () => {
    console.log("🎯 GUARANTEED LOGIN ATTEMPT");
    setLoading(true);
    setError("");
    setSuccess("");
    setDebugInfo("Guaranteed login with hardcoded credentials...");

    const ADMIN_EMAIL = "hello.krsolutions@gmail.com";
    const ADMIN_PASSWORD = "MySuccess@2025";

    try {
      console.log("🔐 Using hardcoded credentials:", ADMIN_EMAIL);
      setDebugInfo(`Using hardcoded credentials: ${ADMIN_EMAIL}`);

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        },
      );

      console.log("📊 Guaranteed Auth Response:", {
        user: data?.user?.email,
        session: !!data?.session,
        error: authError?.message,
      });

      if (authError) {
        setError(`Guaranteed login failed: ${authError.message}`);
        setDebugInfo(`GUARANTEED ERROR: ${authError.message}`);
        return;
      }

      if (data?.user) {
        setSuccess("✅ GUARANTEED LOGIN SUCCESSFUL!");
        setDebugInfo("✅ Success! Redirecting to dashboard...");

        // Force immediate redirect
        setTimeout(() => {
          window.location.href = "/admin/dashboard";
        }, 500);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Guaranteed login error: ${errorMsg}`);
      setDebugInfo(`GUARANTEED ERROR: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const setupAdmin = async () => {
    setLoading(true);
    setError("");
    setDebugInfo("Setting up admin account...");

    try {
      const response = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      console.log("Admin setup result:", result);

      if (result.success) {
        setSuccess("Admin account setup completed!");
        setDebugInfo("Admin setup successful!");
      } else {
        setError(`Setup failed: ${result.error || "Unknown error"}`);
        setDebugInfo(`Setup failed: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setError(`Setup error: ${errorMsg}`);
      setDebugInfo(`Setup error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            KooliHub Admin Login
          </CardTitle>
          <CardDescription>Sign in to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ERROR:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>SUCCESS:</strong> {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Debug Info Display */}
          {debugInfo && (
            <Alert
              variant="default"
              className="mb-4 border-blue-200 bg-blue-50"
            >
              <AlertDescription className="text-blue-800 text-xs">
                <strong>DEBUG:</strong> {debugInfo}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "🔐 Sign In to Admin Dashboard"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={guaranteedLogin}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              ✅ GUARANTEED LOGIN (CLICK THIS)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={directLogin}
              disabled={loading}
              className="w-full"
            >
              🚀 Direct Login Test
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setupAdmin}
              disabled={loading}
              className="w-full"
            >
              ⚙️ Setup Admin Account
            </Button>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>
              <strong>Admin Credentials:</strong>
            </p>
            <p>Email: hello.krsolutions@gmail.com</p>
            <p>Password: MySuccess@2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
