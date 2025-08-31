import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, Clock, RefreshCw, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface EmailConfirmationProps {
  email: string;
  onBack?: () => void;
  onConfirmed?: () => void;
}

export const EmailConfirmation: React.FC<EmailConfirmationProps> = ({
  email,
  onBack,
  onConfirmed,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info",
  );
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    // Check for confirmation in URL (if user clicks email link)
    const handleAuthStateChange = () => {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile?.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }

          if (onConfirmed) {
            onConfirmed();
          }
        }
      });
    };

    handleAuthStateChange();
  }, [navigate, onConfirmed]);

  const resendConfirmation = async () => {
    setIsResending(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessageType("error");
        setMessage(error.message);
      } else {
        setMessageType("success");
        setMessage("Confirmation email sent successfully! Check your inbox.");
        setCountdown(60); // 60 second cooldown
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to send confirmation email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const createConfirmedAccount = async () => {
    setIsResending(true);
    setMessage("");

    try {
      // Try to create a confirmed account via admin API
      const response = await fetch("/api/setup/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          skipEmailConfirmation: true,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessageType("success");
        setMessage("Account confirmed successfully! You can now login.");
        setTimeout(() => {
          if (onBack) onBack();
        }, 2000);
      } else {
        setMessageType("error");
        setMessage(result.error || "Failed to confirm account");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Failed to confirm account. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Confirm Your Email
          </CardTitle>
          <CardDescription>
            We've sent a confirmation link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert
              variant={messageType === "error" ? "destructive" : "default"}
            >
              <AlertDescription className="flex items-center gap-2">
                {messageType === "success" && (
                  <CheckCircle className="h-4 w-4" />
                )}
                {messageType === "info" && <Clock className="h-4 w-4" />}
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="text-sm text-gray-600 space-y-2">
              <p>To complete your registration:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Check your email inbox</li>
                <li>Click the confirmation link</li>
                <li>Return here to sign in</li>
              </ol>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm text-gray-600">Didn't receive the email?</p>

              <Button
                onClick={resendConfirmation}
                disabled={isResending || countdown > 0}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Confirmation Email
                  </>
                )}
              </Button>

              {email === "hello.krsolutions@gmail.com" && (
                <Button
                  onClick={createConfirmedAccount}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm Admin Account (Skip Email)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="ghost" onClick={onBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Check your spam folder if you don't see the email.</p>
            <p>The confirmation link expires in 24 hours.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
