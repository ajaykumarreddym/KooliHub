import { supabase } from "./supabase";

/**
 * Verify admin access and provide detailed diagnostics
 */
export async function verifyAdminAccess() {
  console.group("🔐 Admin Access Verification");

  try {
    // 1. Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("❌ Auth Error:", authError);
      return {
        success: false,
        error: "Authentication failed",
        details: authError,
      };
    }

    if (!user) {
      console.warn("⚠️ No authenticated user");
      return { success: false, error: "Not authenticated" };
    }

    console.log("✅ User authenticated:", user.email);

    // 2. Check if profiles table exists and user has a profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, full_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("❌ Profile Error:", profileError);
      return {
        success: false,
        error: "Profile access failed",
        details: profileError,
        user: user.email,
      };
    }

    if (!profile) {
      console.warn("⚠️ No profile found for user");
      return {
        success: false,
        error: "Profile not found",
        user: user.email,
      };
    }

    console.log("✅ Profile found:", profile);

    // 3. Check admin role
    const isAdmin = profile.role === "admin";
    console.log(`${isAdmin ? "✅" : "❌"} Admin role:`, profile.role);

    // 4. Test admin table access
    console.log("🧪 Testing admin table access...");

    const adminTables = [
      "coupons",
      "banners",
      "notifications",
      "payment_methods",
    ];
    const tableResults: Record<string, boolean> = {};

    for (const table of adminTables) {
      try {
        const { error } = await supabase.from(table).select("id").limit(1);

        if (error) {
          console.error(`❌ ${table} access failed:`, error.message);
          tableResults[table] = false;
        } else {
          console.log(`✅ ${table} access successful`);
          tableResults[table] = true;
        }
      } catch (error) {
        console.error(`❌ ${table} exception:`, error);
        tableResults[table] = false;
      }
    }

    const allTablesAccessible = Object.values(tableResults).every(
      (result) => result,
    );

    console.log("📊 Summary:", {
      authenticated: true,
      profileExists: true,
      isAdmin,
      allTablesAccessible,
      tableResults,
    });

    console.groupEnd();

    return {
      success: isAdmin && allTablesAccessible,
      user: user.email,
      profile,
      isAdmin,
      tableResults,
      allTablesAccessible,
    };
  } catch (error) {
    console.error("💥 Verification Exception:", error);
    console.groupEnd();
    return {
      success: false,
      error: "Verification failed",
      details: error,
    };
  }
}

/**
 * Quick admin check for components
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role === "admin";
  } catch {
    return false;
  }
}
