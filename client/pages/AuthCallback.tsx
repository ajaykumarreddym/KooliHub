import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = React.useState("Processing authentication...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL fragments
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setStatus("error");
          setMessage(error.message || "Authentication failed");
          toast.error("Authentication failed: " + error.message);
          return;
        }

        if (data.session) {
          setStatus("success");
          setMessage("Successfully signed in with Google!");
          toast.success("Welcome to KooliHub!");

          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
        } else {
          setStatus("error");
          setMessage("No session found. Please try signing in again.");
          toast.error("Authentication incomplete");
        }
      } catch (err) {
        console.error("Unexpected error during auth callback:", err);
        setStatus("error");
        setMessage("An unexpected error occurred during authentication");
        toast.error("Authentication failed");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handleRetry = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {status === "loading" && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span>Authenticating</span>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Authentication Successful</span>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                <span>Authentication Failed</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>

          {status === "success" && (
            <div className="text-sm text-gray-500">
              Redirecting you to the homepage...
            </div>
          )}

          {status === "error" && (
            <Button onClick={handleRetry} className="w-full">
              Return to Homepage
            </Button>
          )}

          {status === "loading" && (
            <div className="text-sm text-gray-500">
              This may take a few moments...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
