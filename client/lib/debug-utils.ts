/**
 * Debug utility functions for better error handling and logging
 */

/**
 * Parse and extract meaningful error messages from various error objects
 */
export function parseError(error: any): string {
  if (!error) return "Unknown error";

  // If it's already a string
  if (typeof error === "string") return error;

  // Try different error message properties
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.details) return error.details;
  if (error.hint) return error.hint;
  if (error.description) return error.description;

  // PostgreSQL specific error fields
  if (error.code && error.message) {
    return `${error.code}: ${error.message}`;
  }

  // Supabase specific error fields
  if (error.error && error.error.message) {
    return error.error.message;
  }

  // If it's an object, try to stringify it safely
  if (typeof error === "object") {
    try {
      // Check if it has meaningful properties
      const keys = Object.keys(error);
      if (keys.length === 0) return "Empty error object";

      // Try to extract key information
      const errorInfo: any = {};
      const relevantKeys = [
        "code",
        "message",
        "details",
        "hint",
        "error_description",
        "status",
        "statusText",
      ];

      relevantKeys.forEach((key) => {
        if (error[key] !== undefined) {
          errorInfo[key] = error[key];
        }
      });

      if (Object.keys(errorInfo).length > 0) {
        return JSON.stringify(errorInfo, null, 2);
      }

      // Last resort - stringify the whole object
      return JSON.stringify(error, null, 2);
    } catch {
      return "Complex error object (cannot stringify)";
    }
  }

  return "Unknown error type";
}

/**
 * Check if error indicates a missing table
 */
export function isMissingTableError(error: any, tableName: string): boolean {
  if (!error) return false;

  const errorStr = parseError(error).toLowerCase();
  const tableStr = tableName.toLowerCase();

  // Common patterns for missing table errors
  const patterns = [
    `relation "public.${tableStr}" does not exist`,
    `table "${tableStr}" doesn't exist`,
    `table "public.${tableStr}" doesn't exist`,
    `no such table: ${tableStr}`,
    "pgrst116", // PostgREST table not found
  ];

  return patterns.some(
    (pattern) =>
      errorStr.includes(pattern) ||
      error.code === "PGRST116" ||
      error.code === "42P01", // PostgreSQL undefined table error
  );
}

/**
 * Log detailed error information for debugging
 */
export function logDetailedError(context: string, error: any): void {
  console.group(`🐛 ${context} Error Details`);
  console.error("Raw error:", error);
  console.error("Error type:", typeof error);

  if (error && typeof error === "object") {
    console.error("Error keys:", Object.keys(error));
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error details:", error.details);
    console.error("Error hint:", error.hint);
    console.error("Error description:", error.error_description);

    // Supabase specific
    if (error.error) {
      console.error("Nested error:", error.error);
    }
  }

  console.error("Parsed message:", parseError(error));
  console.groupEnd();
}

/**
 * Check Supabase connection and permissions
 */
export async function debugSupabaseConnection() {
  try {
    const { supabase } = await import("./supabase");

    console.group("🔍 Supabase Connection Debug");

    // Test basic connection
    console.log("Testing Supabase connection...");
    const { data: connectionTest, error: connectionError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (connectionError) {
      console.error("Connection test failed:", connectionError);
      logDetailedError("Connection Test", connectionError);
    } else {
      console.log("✅ Connection successful");
    }

    // Test auth
    console.log("Checking auth status...");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth check failed:", authError);
      logDetailedError("Auth Check", authError);
    } else if (user) {
      console.log("✅ User authenticated:", user.id);
      console.log("User email:", user.email);
    } else {
      console.warn("⚠️ No authenticated user");
    }

    // Test admin table access
    const adminTables = [
      "coupons",
      "banners",
      "notifications",
      "payment_methods",
    ];

    for (const table of adminTables) {
      console.log(`Testing access to ${table} table...`);

      const { data, error } = await supabase.from(table).select("id").limit(1);

      if (error) {
        console.error(`❌ ${table} access failed:`, error.message);

        if (isMissingTableError(error, table)) {
          console.warn(`📋 Table "${table}" does not exist`);
        } else {
          logDetailedError(`${table} Access`, error);
        }
      } else {
        console.log(`✅ ${table} access successful`);
      }
    }

    console.groupEnd();
  } catch (error) {
    console.error("Debug connection failed:", error);
    logDetailedError("Debug Connection", error);
  }
}
