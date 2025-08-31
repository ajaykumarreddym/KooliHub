import { supabase } from "./supabase";

export const debugAuthState = async () => {
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("Debug Auth - Current User:", {
      user: user
        ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          }
        : null,
      userError,
    });

    if (!user) {
      console.log("Debug Auth - No user logged in");
      return;
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("Debug Auth - Profile:", {
      profile,
      profileError,
    });

    // Check admin status
    const isAdminByProfile = profile?.role === "admin";
    const isAdminByEmail = user.email === "hello.krsolutions@gmail.com";

    console.log("Debug Auth - Admin Status:", {
      isAdminByProfile,
      isAdminByEmail,
      profileRole: profile?.role,
      userEmail: user.email,
    });

    return {
      user,
      profile,
      isAdminByProfile,
      isAdminByEmail,
    };
  } catch (error) {
    console.error("Debug Auth - Error:", error);
  }
};
