/**
 * Utility functions for handling and formatting errors
 */

export interface SupabaseError {
  message?: string;
  error_description?: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Extracts a human-readable error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "An unknown error occurred";
  }

  // If it's already a string, return it
  if (typeof error === "string") {
    return error;
  }

  // If it's an Error object
  if (error instanceof Error) {
    return error.message || "An error occurred";
  }

  // If it's a Supabase error object
  if (typeof error === "object" && error !== null) {
    const supabaseError = error as SupabaseError;

    // Try different properties in order of preference
    if (supabaseError.message) {
      return supabaseError.message;
    }

    if (supabaseError.error_description) {
      return supabaseError.error_description;
    }

    if (supabaseError.details) {
      return supabaseError.details;
    }

    if (supabaseError.hint) {
      return supabaseError.hint;
    }

    // Try to stringify the object if it has useful information
    try {
      const errorString = JSON.stringify(error);
      if (errorString !== "{}" && errorString !== "null") {
        return `Error: ${errorString}`;
      }
    } catch {
      // JSON.stringify failed, continue to fallback
    }
  }

  // Fallback message
  return "An unexpected error occurred";
}

/**
 * Formats a detailed error message for debugging purposes
 */
export function getDetailedErrorMessage(
  error: unknown,
  context?: string,
): string {
  const baseMessage = getErrorMessage(error);

  if (context) {
    return `${context}: ${baseMessage}`;
  }

  return baseMessage;
}

/**
 * Checks if an error is a database constraint violation
 */
export function isDatabaseConstraintError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const supabaseError = error as SupabaseError;
    const code = supabaseError.code;

    // Common database constraint error codes
    return (
      code === "23505" || // unique_violation
      code === "23503" || // foreign_key_violation
      code === "23502" || // not_null_violation
      code === "23514" // check_violation
    );
  }

  return false;
}

/**
 * Gets a user-friendly message for common database errors
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const supabaseError = error as SupabaseError;
    const code = supabaseError.code;
    const message = supabaseError.message?.toLowerCase() || "";

    // Handle specific error codes
    switch (code) {
      case "23505": // unique_violation
        if (
          message.includes("pincode") ||
          message.includes("serviceable_areas_pincode_key")
        ) {
          return "A service area with this pincode already exists. Each pincode can only have one service area.";
        }
        return "This entry already exists";

      case "23503": // foreign_key_violation
        return "Referenced data does not exist";

      case "23502": // not_null_violation
        return "Required fields are missing";

      case "23514": // check_violation
        return "Invalid data provided";

      case "PGRST116": // table does not exist
        return "Database table not found. Please contact support.";

      default:
        // Check for common patterns in error messages
        if (
          message.includes("duplicate") ||
          message.includes("already exists")
        ) {
          return "This entry already exists";
        }

        if (message.includes("permission") || message.includes("denied")) {
          return "You don't have permission to perform this action";
        }

        if (message.includes("network") || message.includes("connection")) {
          return "Network connection error. Please try again.";
        }
    }
  }

  // Return the original error message if no specific handling
  return getErrorMessage(error);
}

/**
 * Logs error details for debugging while returning a user-friendly message
 */
export function handleError(error: unknown, context?: string): string {
  const detailedMessage = getDetailedErrorMessage(error, context);
  const friendlyMessage = getFriendlyErrorMessage(error);

  // Log the detailed error for debugging
  console.error("Error details:", {
    context,
    error,
    detailedMessage,
    friendlyMessage,
    timestamp: new Date().toISOString(),
  });

  return friendlyMessage;
}
