import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  business_email: string;
  business_phone: string | null;
  business_address: string | null;
  business_registration_number: string | null;
  tax_id: string | null;
  commission_rate: number;
  payment_terms_days: number;
  minimum_order_amount: number;
  status: "active" | "inactive" | "pending_approval" | "suspended";
  is_verified: boolean;
  logo_url: string | null;
  banner_url: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useRealtimeVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const setupFnRef = useRef<(() => Promise<void | (() => void)>) | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;
    let retryTimeout: NodeJS.Timeout;

    const setupRealtimeSubscription = async () => {
      try {
        setError(null);
        console.log("🔄 Setting up vendor subscription...");

        // Test Supabase client connection
        try {
          const { data: connectionTest } = await supabase
            .from("vendors")
            .select("count")
            .limit(1);
          console.log("✅ Supabase client connection verified");
        } catch (connectionError) {
          console.error(
            "❌ Supabase client connection failed:",
            connectionError,
          );
          setError("Database connection failed");
          setLoading(false);
          return;
        }

        // Initial fetch with better error handling
        console.log("🔍 Fetching vendors from database...");

        // First, let's check ALL vendors to see what we have
        const { data: allVendors, error: allError } = await supabase
          .from("vendors")
          .select("*")
          .order("created_at", { ascending: false });

        console.log("🗂️ ALL vendors in database:", allVendors?.length || 0);
        console.log(
          "��️ All vendor details:",
          allVendors?.map((v) => ({
            id: v.id,
            name: v.name,
            status: v.status,
            deleted_at: v.deleted_at,
            is_soft_deleted: !!v.deleted_at,
          })),
        );

        // Now fetch only non-deleted vendors
        const { data: initialVendors, error: fetchError } = await supabase
          .from("vendors")
          .select("*")
          .is("deleted_at", null) // Exclude soft-deleted vendors
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching vendors:", fetchError);

          // Check if it's a permission error
          if (
            fetchError.code === "PGRST116" ||
            fetchError.message.includes("permission")
          ) {
            setError("Permission denied. Please ensure you have admin access.");
          } else if (
            fetchError.code === "42P01" ||
            fetchError.message.includes("does not exist")
          ) {
            setError("Vendors table not found. Please check database setup.");
          } else {
            setError(`Failed to fetch vendors: ${fetchError.message}`);
          }
          setLoading(false);
          return;
        }

        console.log(
          `📊 Fetched ${initialVendors?.length || 0} vendors successfully`,
        );
        console.log(
          "📋 Vendor details:",
          initialVendors?.map((v) => ({
            id: v.id,
            name: v.name,
            status: v.status,
            deleted_at: v.deleted_at,
            created_at: v.created_at,
          })),
        );

        if (initialVendors) {
          setVendors(initialVendors);
        }
        setLoading(false);

        // Check authentication before setting up subscription
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          console.warn(
            "⚠️ No authentication session found, skipping real-time subscription",
          );
          setError(
            "Authentication required for real-time updates. Please login.",
          );
          // Still allow the vendors list to show, just without real-time updates
          return;
        }

        console.log(
          "🔐 Authenticated user found, setting up real-time subscription",
        );
        console.log("🔍 Session details:", {
          userId: session.user?.id,
          userEmail: session.user?.email,
          role:
            session.user?.user_metadata?.role ||
            session.user?.app_metadata?.role,
          hasAccessToken: !!session.access_token,
          tokenExpiry: session.expires_at,
          isExpired: session.expires_at
            ? Date.now() > session.expires_at * 1000
            : false,
        });

        // Test database permissions before setting up subscription
        try {
          const { data: testData, error: testError } = await supabase
            .from("vendors")
            .select("id")
            .limit(1);

          if (testError) {
            console.error("❌ Database permission test failed:", testError);
            setError(`Database access denied: ${testError.message}`);
            setLoading(false);
            return;
          }

          console.log("✅ Database permissions verified");
        } catch (permError) {
          console.error("❌ Permission check failed:", permError);
          setError("Database permission check failed");
          setLoading(false);
          return;
        }

        // Set up real-time subscription with improved error handling
        const channelName = `vendors-changes-${Date.now()}`;
        console.log("📡 Creating channel:", channelName);

        channel = supabase
          .channel(channelName);
        channelRef.current = channel;
        
        channel
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "vendors",
            },
            async (payload) => {
              console.log("Vendor change received:", payload);

              try {
                if (payload.eventType === "INSERT") {
                  const newVendor = payload.new as Vendor;
                  // Only add if not soft-deleted
                  if (!newVendor.deleted_at) {
                    setVendors((prev) => [newVendor, ...prev]);
                  }
                } else if (payload.eventType === "UPDATE") {
                  const updatedVendor = payload.new as Vendor;
                  setVendors(
                    (prev) =>
                      prev
                        .map((vendor) => {
                          if (vendor.id === updatedVendor.id) {
                            // Remove from list if soft-deleted
                            if (updatedVendor.deleted_at) {
                              return null;
                            }
                            return updatedVendor;
                          }
                          return vendor;
                        })
                        .filter(Boolean) as Vendor[],
                  );
                } else if (payload.eventType === "DELETE") {
                  // Hard delete (rarely used)
                  setVendors((prev) =>
                    prev.filter((vendor) => vendor.id !== payload.old.id),
                  );
                }
              } catch (error) {
                console.error("Error processing vendor change:", error);
              }
            },
          )
          .subscribe((status, err) => {
            // Enhanced error parsing to prevent [object Object] display
            let errorMsg = "";
            let errorDetails = null;

            if (err) {
              try {
                errorDetails = err; // Store original for logging
                const error = err as any; // Cast to any for error property access

                if (typeof err === "string") {
                  errorMsg = err;
                } else if (err && typeof err === "object") {
                  // Try multiple ways to extract meaningful error information
                  if (error.message) {
                    errorMsg = error.message;
                  } else if (error.error) {
                    errorMsg =
                      typeof error.error === "string"
                        ? error.error
                        : JSON.stringify(error.error);
                  } else if (error.code) {
                    errorMsg = `Error code: ${error.code}${error.hint ? ` (${error.hint})` : ""}`;
                  } else if (error.details) {
                    errorMsg = error.details;
                  } else if (error.description) {
                    errorMsg = error.description;
                  } else {
                    // Check for common Supabase error patterns
                    if (error.status === 403) {
                      errorMsg =
                        "Permission denied - insufficient privileges for real-time subscriptions";
                    } else if (error.status === 401) {
                      errorMsg = "Authentication required - please login again";
                    } else if (error.status === 400) {
                      errorMsg =
                        "Bad request - subscription configuration error";
                    } else if (error.statusCode) {
                      errorMsg = `HTTP ${error.statusCode}: ${error.statusText || "Request failed"}`;
                    } else {
                      // Safely stringify with fallback
                      try {
                        const stringified = JSON.stringify(
                          err,
                          (key, value) => {
                            // Handle circular references and non-serializable values
                            if (typeof value === "function")
                              return "[Function]";
                            if (typeof value === "symbol") return "[Symbol]";
                            if (value instanceof Error) return value.message;
                            return value;
                          },
                          2,
                        );
                        errorMsg =
                          stringified !== "{}"
                            ? stringified
                            : `Unknown error type: ${Object.prototype.toString.call(err)}`;
                      } catch (stringifyError) {
                        errorMsg = `Error serialization failed: ${Object.prototype.toString.call(err)}`;
                      }
                    }
                  }
                } else {
                  errorMsg = String(err);
                }
              } catch (parseError) {
                errorMsg = `Error parsing failed: ${parseError.message}`;
                errorDetails = {
                  originalError: err,
                  parseError: parseError.message,
                };
              }

              // Ensure we never display [object Object] or other unhelpful strings
              if (
                errorMsg === "[object Object]" ||
                errorMsg === "" ||
                errorMsg === "undefined" ||
                errorMsg === "null"
              ) {
                errorMsg = "Unknown subscription error occurred";
              }

              // Additional check for objects that toString to [object Object]
              if (errorMsg.includes("[object") && errorMsg.includes("]")) {
                errorMsg = `Subscription error (${typeof err}): Check console for detailed information`;
              }
            }

            console.log("🔔 Vendors subscription status:", {
              status,
              error: errorMsg || "(no error)",
              originalError: errorDetails,
              timestamp: new Date().toISOString(),
              channelName,
            });

            if (status === "SUBSCRIBED") {
              console.log("✅ Successfully subscribed to vendors changes");
              setError(null); // Clear any previous errors
              setRetryCount(0); // Reset retry count on success
            } else if (status === "CHANNEL_ERROR") {
              const errorMessage = errorMsg || "Channel error occurred";
              console.error("❌ Failed to subscribe to vendors changes:", {
                parsedError: errorMessage,
                originalError: errorDetails,
                rawError: err,
                channelName,
                timestamp: new Date().toISOString(),
                errorType: typeof err,
                errorConstructor: err?.constructor?.name,
              });

              // Log additional context if available
              if (errorDetails && typeof errorDetails === "object") {
                console.error("🔍 Error details breakdown:", {
                  message: errorDetails.message,
                  code: errorDetails.code,
                  details: errorDetails.details,
                  hint: errorDetails.hint,
                  keys: Object.keys(errorDetails),
                });
              }

              setError(
                `Real-time subscription failed: ${errorMessage}. Data will still update on refresh.`,
              );

              // Retry subscription after delay if retries < 3
              if (retryCount < 3) {
                retryTimeout = setTimeout(
                  () => {
                    console.log(
                      `🔄 Retrying vendor subscription (attempt ${retryCount + 1}/3)`,
                    );
                    setRetryCount((prev) => prev + 1);
                    setupRealtimeSubscription();
                  },
                  2000 * (retryCount + 1),
                ); // Exponential backoff
              } else {
                console.error(
                  "❌ Max retry attempts reached for vendor subscription",
                );
                setError(
                  "Real-time subscription failed after multiple attempts. Please refresh the page.",
                );
              }
            } else if (status === "TIMED_OUT") {
              console.warn("⏱️ Vendors subscription timed out, retrying...", {
                retryCount,
                channelName,
                timestamp: new Date().toISOString(),
              });
              setError("Connection timeout. Retrying real-time sync...");

              // Retry after timeout
              if (retryCount < 3) {
                retryTimeout = setTimeout(() => {
                  console.log(`🔄 Timeout retry attempt ${retryCount + 1}/3`);
                  setRetryCount((prev) => prev + 1);
                  setupRealtimeSubscription();
                }, 1000);
              } else {
                console.error("❌ Max timeout retries reached");
                setError(
                  "Connection timeout - real-time sync disabled. Data updates on refresh.",
                );
              }
            } else if (status === "CLOSED") {
              console.warn("🔌 Vendors subscription closed", {
                channelName,
                timestamp: new Date().toISOString(),
              });
              setError(
                "Real-time connection closed. Data will update on refresh.",
              );
            } else {
              console.warn(`🔄 Unknown subscription status: ${status}`, {
                status,
                error: errorMsg || "(no additional info)",
                channelName,
                timestamp: new Date().toISOString(),
              });

              // Handle unknown status as potential error
              if (status !== "JOINING") {
                setError(
                  `Real-time sync issue: ${status}. Data will update on refresh.`,
                );
              }
            }
          });
      } catch (error) {
        console.error("❌ Error setting up vendors subscription:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        });

        // Gracefully degrade to polling if real-time fails
        console.log("🔄 Real-time failed, enabling polling fallback...");
        setError("Real-time sync unavailable - using periodic updates");

        // Set up periodic refresh as fallback
        const pollInterval = setInterval(() => {
          console.log("🔄 Polling refresh triggered");
          refresh();
        }, 30000); // Refresh every 30 seconds

        // Clean up polling on unmount
        return () => {
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        };

      }
    };

    // Store the function in ref for external access
    setupFnRef.current = setupRealtimeSubscription;
    
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        console.log("🧹 Cleaning up vendors subscription");
        supabase.removeChannel(channel);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryCount]);

  // Helper function to manually refresh data
  const refresh = async () => {
    console.log("🔄 Manual refresh triggered");
    setLoading(true);
    setError(null);

    try {
      // First fetch ALL vendors to see what's in the database
      console.log("🔍 Manual refresh: Fetching ALL vendors...");
      const { data: allVendors, error: allError } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false });

      if (allError) {
        console.error("❌ Error fetching all vendors:", allError);
        setError(`Failed to fetch vendors: ${allError.message}`);
        setLoading(false);
        return;
      }

      console.log(
        "🗂️ Manual refresh: ALL vendors found:",
        allVendors?.length || 0,
      );
      console.log(
        "🗂️ Manual refresh: All vendor details:",
        allVendors?.map((v) => ({
          id: v.id,
          name: v.name,
          status: v.status,
          deleted_at: v.deleted_at,
          is_soft_deleted: !!v.deleted_at,
        })),
      );

      // Now fetch only non-deleted vendors
      const { data: refreshedVendors, error: fetchError } = await supabase
        .from("vendors")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Failed to refresh vendors");
        console.error("Error refreshing vendors:", fetchError);
      } else if (refreshedVendors) {
        console.log(
          "✅ Manual refresh: Non-deleted vendors found:",
          refreshedVendors?.length || 0,
        );
        console.log(
          "✅ Manual refresh: Non-deleted vendor details:",
          refreshedVendors?.map((v) => ({
            id: v.id,
            name: v.name,
            status: v.status,
          })),
        );
        setVendors(refreshedVendors);
      }
    } catch (error) {
      console.error("Error refreshing vendors:", error);
      setError("Failed to refresh vendors");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get vendor statistics
  const getStats = () => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status === "active").length;
    const pending = vendors.filter(
      (v) => v.status === "pending_approval",
    ).length;
    const verified = vendors.filter((v) => v.is_verified).length;

    console.log("📊 Stats calculation:", {
      total,
      active,
      pending,
      verified,
      vendorStatuses: vendors.map((v) => ({ name: v.name, status: v.status })),
    });

    return {
      total,
      active,
      pending,
      verified,
      suspended: vendors.filter((v) => v.status === "suspended").length,
      inactive: vendors.filter((v) => v.status === "inactive").length,
    };
  };

  // Manual subscription restart function
  const restartSubscription = useCallback(async () => {
    console.log("🔄 Manual subscription restart triggered");
    setError(null);
    setRetryCount(0);

    // Clean up existing subscription
    if (channelRef.current) {
      console.log("🧹 Cleaning up existing subscription");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Restart the subscription setup
    if (setupFnRef.current) {
      await setupFnRef.current();
    }
  }, []);

  // Test subscription function for debugging
  const testSubscription = async () => {
    console.log("🧪 Testing subscription setup...");

    try {
      // Test basic connectivity
      const { data, error } = await supabase
        .from("vendors")
        .select("id")
        .limit(1);
      if (error) {
        console.error("❌ Basic query failed:", error);
        return false;
      }

      console.log("✅ Basic database access working");

      // Test simple subscription
      const testChannel = supabase
        .channel("test-vendors-debug")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vendors" },
          (payload) => {
            console.log("🧪 Test subscription received:", payload);
          },
        )
        .subscribe((status, err) => {
          console.log("🧪 Test subscription status:", {
            status,
            error: err,
            errorType: typeof err,
            errorString: err ? String(err) : null,
            errorJSON: err ? JSON.stringify(err, null, 2) : null,
          });
          setTimeout(() => {
            supabase.removeChannel(testChannel);
          }, 5000);
        });

      return true;
    } catch (error) {
      console.error("❌ Subscription test failed:", error);
      return false;
    }
  };

  // Add global debug function for console troubleshooting
  if (typeof window !== "undefined") {
    (window as any).debugVendorSubscription = () => {
      console.log("🔍 Vendor Subscription Debug Info:");
      console.log("Current state:", {
        vendors: vendors.length,
        loading,
        error,
      });
      console.log("Supabase client:", supabase);
      console.log("Current channel:", channelRef.current);
      testSubscription();
    };
  }

  return {
    vendors,
    loading,
    error,
    refresh,
    restartSubscription,
    testSubscription,
    stats: getStats(),
  };
}
