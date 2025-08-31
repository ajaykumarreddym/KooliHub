import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export const AdminSetup = () => {
  const [setupStatus, setSetupStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const runSetup = async () => {
    setSetupStatus("loading");
    setMessage("Setting up admin account...");

    try {
      const response = await fetch("/api/setup/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "hello.krsolutions@gmail.com",
          password: "MySuccess@2025",
          fullName: "Admin User",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSetupStatus("success");
        setMessage("Admin account created successfully! You can now login.");
      } else {
        setSetupStatus("error");
        setMessage(result.error || "Setup failed");
      }
    } catch (error) {
      setSetupStatus("error");
      setMessage("Network error occurred");
    }
  };

  const checkDatabase = async () => {
    setSetupStatus("loading");
    setMessage("Checking database setup...");

    try {
      const response = await fetch("/api/check/database");
      const result = await response.json();

      if (response.ok) {
        setSetupStatus("success");
        setMessage(
          `Database check complete. Admin exists: ${result.database.adminProfile.exists}`,
        );
      } else {
        setSetupStatus("error");
        setMessage("Database check failed");
      }
    } catch (error) {
      setSetupStatus("error");
      setMessage("Network error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Set up your admin account to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              onClick={checkDatabase}
              variant="outline"
              className="w-full"
              disabled={setupStatus === "loading"}
            >
              {setupStatus === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Check Database Status
            </Button>

            <Button
              onClick={runSetup}
              className="w-full"
              disabled={setupStatus === "loading"}
            >
              {setupStatus === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Admin Account
            </Button>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                setupStatus === "success"
                  ? "bg-green-50 text-green-700"
                  : setupStatus === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {setupStatus === "success" && <CheckCircle className="h-4 w-4" />}
              {setupStatus === "error" && <AlertCircle className="h-4 w-4" />}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Admin Email:</strong> hello.krsolutions@gmail.com
            </p>
            <p>
              <strong>Admin Password:</strong> MySuccess@2025
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
