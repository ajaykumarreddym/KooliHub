import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import type { ApiResponse, Vendor, VendorStatus } from "@shared/api";

// Get all vendors
export const getVendors: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;

    let query = supabase.from("vendors").select("*");

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,business_email.ilike.%${search}%`,
      );
    }

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    // Order by created_at
    query = query.order("created_at", { ascending: false });

    const { data: vendors, error, count } = await query;

    if (error) throw error;

    const response = {
      success: true,
      vendors: vendors || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
      has_more: count ? count > offset + Number(limit) : false,
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch vendors",
    });
  }
};

// Get single vendor
export const getVendor: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select(
        `
        *,
        vendor_users(
          id,
          role,
          user_id,
          profiles(id, full_name, email)
        ),
        vendor_config(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { vendor },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch vendor",
    });
  }
};

// Create vendor
export const createVendor: RequestHandler = async (req, res) => {
  try {
    console.log("Creating vendor with data:", req.body);

    const {
      name,
      slug,
      description,
      business_email,
      business_phone,
      business_address,
      business_registration_number,
      tax_id,
      commission_rate = 10,
      payment_terms_days = 30,
      minimum_order_amount = 0,
      status = "pending_approval",
      logo_url,
      banner_url,
    } = req.body;

    // Validate required fields
    if (!name || !business_email) {
      return res.status(400).json({
        success: false,
        error: "Name and business email are required",
      });
    }

    // Generate slug if not provided
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    console.log("Generated slug:", finalSlug);

    // Check if slug is unique
    const { data: existingVendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("slug", finalSlug)
      .single();

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        error: "Vendor slug already exists",
      });
    }

    const vendorData = {
      name,
      slug: finalSlug,
      description,
      business_email,
      business_phone,
      business_address,
      business_registration_number,
      tax_id,
      commission_rate,
      payment_terms_days,
      minimum_order_amount,
      status: status as VendorStatus,
      ...(logo_url && { logo_url }),
      ...(banner_url && { banner_url }),
    };

    console.log("Creating vendor with data:", vendorData);

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert([vendorData])
      .select()
      .single();

    if (error) {
      console.error("Vendor creation error:", error);
      throw error;
    }

    console.log("Vendor created successfully:", vendor);

    // Create default vendor config
    try {
      await supabase.from("vendor_config").insert([
        {
          vendor_id: vendor.id,
          business_name: name,
          business_description: description,
        },
      ]);
    } catch (configError) {
      console.error("Failed to create vendor config:", configError);
      // Don't fail the entire operation if config creation fails
    }

    const response = {
      success: true,
      vendor,
      message: "Vendor created successfully",
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create vendor",
    });
  }
};

// Update vendor
export const updateVendor: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove id and timestamps from update data
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    const { data: vendor, error } = await supabase
      .from("vendors")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { vendor },
      message: "Vendor updated successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error updating vendor:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update vendor",
    });
  }
};

// Update vendor status
export const updateVendorStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !status ||
      !["active", "inactive", "pending_approval", "suspended"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        error: "Valid status is required",
      });
    }

    const { data: vendor, error } = await supabase
      .from("vendors")
      .update({ status: status as VendorStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { vendor },
      message: "Vendor status updated successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error updating vendor status:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update vendor status",
    });
  }
};

// Delete vendor (soft delete)
export const deleteVendor: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: vendor, error } = await supabase
      .from("vendors")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Vendor deleted successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete vendor",
    });
  }
};

// Get vendor statistics
export const getVendorStats: RequestHandler = async (req, res) => {
  try {
    const { data: stats, error } = await supabase.rpc("get_vendor_stats");

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: { stats: stats || {} },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching vendor stats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch vendor statistics",
    });
  }
};
