import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

// Resend email confirmation
export const resendConfirmation: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log("Resending email confirmation for:", email);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${req.headers.origin || "http://localhost:8080"}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error resending confirmation:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: "Confirmation email sent successfully",
      email,
    });
  } catch (error) {
    console.error("Error in resend confirmation:", error);
    res.status(500).json({
      error: "Failed to resend confirmation email",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Confirm email manually (for development)
export const confirmEmail: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log("Manually confirming email for:", email);

    // Find the user in auth.users
    const { data: users, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError);
      return res.status(500).json({ error: "Failed to find user" });
    }

    const user = users.users?.find((u) => u.email === email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user to confirmed
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true },
    );

    if (updateError) {
      console.error("Error confirming user:", updateError);
      return res.status(500).json({ error: "Failed to confirm email" });
    }

    res.json({
      success: true,
      message: "Email confirmed successfully",
      email,
      userId: user.id,
    });
  } catch (error) {
    console.error("Error in confirm email:", error);
    res.status(500).json({
      error: "Failed to confirm email",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
