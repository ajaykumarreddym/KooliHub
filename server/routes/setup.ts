import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

// Setup admin account - THIS SHOULD ONLY BE USED ONCE IN DEVELOPMENT
export const setupAdminAccount: RequestHandler = async (req, res) => {
  try {
    const {
      email: customEmail,
      password: customPassword,
      skipEmailConfirmation,
    } = req.body;
    const adminEmail = customEmail || "hello.krsolutions@gmail.com";
    const adminPassword = customPassword || "MySuccess@2025";

    console.log("Starting admin setup process...", {
      email: adminEmail,
      skipEmailConfirmation,
    });

    // Method 1: Try to create user via auth.admin
    let userId: string | null = null;

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: skipEmailConfirmation || true, // Skip email confirmation for admin
          user_metadata: {
            full_name: "Admin User",
          },
        });

      console.log("Admin signup result:", { signUpData, signUpError });

      if (signUpData?.user) {
        userId = signUpData.user.id;
        console.log("Created new admin user with ID:", userId);
      } else if (signUpError?.message.includes("already registered")) {
        console.log("Admin user already exists, looking up existing user...");

        // Try to find existing user
        const { data: listUsers } = await supabase.auth.admin.listUsers();
        const existingUser = listUsers.users?.find(
          (u: any) => u.email === adminEmail,
        );
        if (existingUser) {
          userId = existingUser.id;
          console.log("Found existing admin user with ID:", userId);
        }
      } else {
        throw signUpError;
      }
    } catch (error) {
      console.error("Error with admin.createUser:", error);
    }

    // Method 2: If admin.createUser failed, try regular signup
    if (!userId) {
      console.log("Trying regular signup method...");
      const { data: regularSignUp, error: regularError } =
        await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
          options: {
            data: {
              full_name: "Admin User",
            },
          },
        });

      if (regularSignUp?.user) {
        userId = regularSignUp.user.id;
        console.log("Created admin user via regular signup:", userId);
      } else {
        console.error("Regular signup failed:", regularError);
      }
    }

    // Ensure profile exists and has admin role
    if (userId) {
      console.log("Setting up profile for user:", userId);

      // First, check if profile already exists
      const { data: existingProfile, error: existingError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (existingProfile) {
        console.log("Profile exists, updating to admin role:", existingProfile);

        // Update existing profile to admin
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            role: "admin",
            email: adminEmail,
            full_name: "Admin User",
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating profile:", updateError);
        } else {
          console.log("Successfully updated profile to admin");
        }
      } else {
        console.log("Profile does not exist, creating new one...");

        // Create new profile
        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId,
          email: adminEmail,
          full_name: "Admin User",
          role: "admin",
        });

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          console.log("Successfully created admin profile");
        }
      }
    }

    // Final verification - check if we can find the admin user
    const { data: finalCheck, error: finalError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", adminEmail)
      .single();

    console.log("Final verification:", { finalCheck, finalError });

    if (finalCheck && finalCheck.role === "admin") {
      res.json({
        success: true,
        message: "Admin account setup completed successfully!",
        admin: {
          id: finalCheck.id,
          email: finalCheck.email,
          role: finalCheck.role,
          full_name: finalCheck.full_name,
        },
      });
    } else {
      res.status(500).json({
        error: "Admin setup completed but verification failed",
        details: { finalCheck, finalError },
      });
    }
  } catch (error) {
    console.error("Error setting up admin account:", error);
    res.status(500).json({
      error: "Failed to setup admin account",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Test auth endpoint to verify admin can login
export const testAdminAuth: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Testing auth for:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("Auth test result:", {
      success: !!data.user,
      error: error?.message,
      userId: data.user?.id,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    if (data.user) {
      // Check admin role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      console.log("Profile check:", { profile, profileError });

      if (profileError) {
        return res.status(500).json({
          error: "Failed to fetch user profile",
          details: profileError.message,
        });
      }

      res.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        },
        profile,
        isAdmin: profile?.role === "admin",
      });
    } else {
      res.status(401).json({ error: "Authentication failed" });
    }
  } catch (error) {
    console.error("Error testing auth:", error);
    res.status(500).json({
      error: "Authentication test failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Check database tables and setup
export const checkDatabase: RequestHandler = async (req, res) => {
  try {
    console.log("Checking database setup...");

    // Check if profiles table exists and has data
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(5);

    console.log("Profiles check:", { profiles, profilesError });

    // Check if admin profile exists
    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "hello.krsolutions@gmail.com")
      .single();

    console.log("Admin profile check:", { adminProfile, adminError });

    // Check auth users
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();
    const adminUser = authUsers.users?.find(
      (u: any) => u.email === "hello.krsolutions@gmail.com",
    );

    console.log("Auth users check:", {
      totalUsers: authUsers.users?.length,
      adminUserExists: !!adminUser,
      adminUserId: adminUser?.id,
    });

    res.json({
      database: {
        profilesTable: {
          accessible: !profilesError,
          error: profilesError?.message,
          recordCount: profiles?.length || 0,
        },
        adminProfile: {
          exists: !!adminProfile,
          data: adminProfile,
          error: adminError?.message,
        },
        authUsers: {
          totalCount: authUsers.users?.length || 0,
          adminExists: !!adminUser,
          adminUserId: adminUser?.id,
        },
      },
    });
  } catch (error) {
    console.error("Database check error:", error);
    res.status(500).json({
      error: "Database check failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
