import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import type { ApiResponse, Product, ProductVariant } from "@shared/api";

// Get all products
export const getProducts: RequestHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      vendor_id,
      category_id,
      status,
      search,
      include,
    } = req.query;

    let selectQuery = `
      *,
      categories(id, name, service_type)
    `;

    // Add includes based on query parameter
    const includes = include ? String(include).split(",") : [];
    if (includes.includes("vendor")) {
      selectQuery += `, vendors(id, name, slug, status)`;
    }
    if (includes.includes("variants")) {
      selectQuery += `, product_variants!inner(*)`;
    }
    if (includes.includes("images")) {
      selectQuery += `, product_images(*)`;
    }

    let query = supabase
      .from("products")
      .select(selectQuery)
      .is("deleted_at", null);

    // Apply filters
    if (vendor_id) {
      query = query.eq("vendor_id", vendor_id);
    }

    if (category_id && category_id !== "all") {
      query = query.eq("category_id", category_id);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,brand.ilike.%${search}%,sku.ilike.%${search}%`,
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    // Order by created_at
    query = query.order("created_at", { ascending: false });

    const { data: products, error } = await query;

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: {
        products: products || [],
        total: count || 0,
        page: Number(page),
        limit: Number(limit),
        has_more: count ? count > offset + Number(limit) : false,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch products",
    });
  }
};

// Get single product
export const getProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        vendors(id, name, slug, status),
        categories(id, name, service_type),
        product_variants(
          *,
          inventory_levels(
            *,
            inventory_locations(id, name, type)
          ),
          price_list_items(
            *,
            price_lists(id, name, vendor_id, zone_id)
          )
        ),
        product_images(*)
      `,
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) throw error;

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { product },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch product",
    });
  }
};

// Create product
export const createProduct: RequestHandler = async (req, res) => {
  try {
    const {
      vendor_id,
      name,
      slug,
      description,
      category_id,
      brand,
      tags = [],
      status = "active",
      meta_title,
      meta_description,
    } = req.body;

    // Validate required fields
    if (!vendor_id || !name) {
      return res.status(400).json({
        success: false,
        error: "Vendor ID and product name are required",
      });
    }

    // Generate slug if not provided
    const productSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check if slug is unique for this vendor
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendor_id)
      .eq("slug", productSlug)
      .is("deleted_at", null)
      .single();

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: "Product slug already exists for this vendor",
      });
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert([
        {
          vendor_id,
          name,
          slug: productSlug,
          description,
          category_id,
          brand,
          tags: Array.isArray(tags) ? tags : [],
          status,
          meta_title,
          meta_description,
          // Legacy fields for compatibility
          price: 0,
          stock_quantity: 0,
          is_active: status === "active",
        },
      ])
      .select(
        `
        *,
        vendors(id, name, slug),
        categories(id, name, service_type)
      `,
      )
      .single();

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: { product },
      message: "Product created successfully",
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create product",
    });
  }
};

// Update product
export const updateProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove id and timestamps from update data
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    // Ensure tags is an array
    if (updateData.tags && !Array.isArray(updateData.tags)) {
      updateData.tags = updateData.tags
        .split(",")
        .map((tag: string) => tag.trim());
    }

    // Update legacy fields for compatibility
    if (updateData.status) {
      updateData.is_active = updateData.status === "active";
    }

    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .is("deleted_at", null)
      .select(
        `
        *,
        vendors(id, name, slug),
        categories(id, name, service_type)
      `,
      )
      .single();

    if (error) throw error;

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { product },
      message: "Product updated successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update product",
    });
  }
};

// Delete product (soft delete)
export const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Product deleted successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete product",
    });
  }
};

// Get product variants
export const getProductVariants: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: variants, error } = await supabase
      .from("product_variants")
      .select(
        `
        *,
        inventory_levels(
          *,
          inventory_locations(id, name, type)
        ),
        price_list_items(
          *,
          price_lists(id, name, vendor_id, zone_id)
        ),
        product_images(*)
      `,
      )
      .eq("product_id", id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: { variants: variants || [] },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch product variants",
    });
  }
};

// Create product variant
export const createProductVariant: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const {
      sku,
      name,
      description,
      unit = "piece",
      weight,
      dimensions = {},
      attributes = {},
      is_default = false,
      sort_order = 0,
    } = req.body;

    // Validate required fields
    if (!sku || !name) {
      return res.status(400).json({
        success: false,
        error: "SKU and name are required",
      });
    }

    // Check if SKU is unique
    const { data: existingVariant } = await supabase
      .from("product_variants")
      .select("id")
      .eq("sku", sku)
      .is("deleted_at", null)
      .single();

    if (existingVariant) {
      return res.status(400).json({
        success: false,
        error: "SKU already exists",
      });
    }

    // If this is set as default, unset other defaults for this product
    if (is_default) {
      await supabase
        .from("product_variants")
        .update({ is_default: false })
        .eq("product_id", id);
    }

    const { data: variant, error } = await supabase
      .from("product_variants")
      .insert([
        {
          product_id: id,
          sku,
          name,
          description,
          unit,
          weight,
          dimensions,
          attributes,
          is_default,
          sort_order,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: { variant },
      message: "Product variant created successfully",
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Error creating product variant:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create product variant",
    });
  }
};

// Update product variant
export const updateProductVariant: RequestHandler = async (req, res) => {
  try {
    const { variantId } = req.params;
    const updateData = req.body;

    // Remove id and timestamps from update data
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    // If this is set as default, unset other defaults for this product
    if (updateData.is_default) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("product_id")
        .eq("id", variantId)
        .single();

      if (variant) {
        await supabase
          .from("product_variants")
          .update({ is_default: false })
          .eq("product_id", variant.product_id)
          .neq("id", variantId);
      }
    }

    const { data: updatedVariant, error } = await supabase
      .from("product_variants")
      .update(updateData)
      .eq("id", variantId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw error;

    if (!updatedVariant) {
      return res.status(404).json({
        success: false,
        error: "Product variant not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { variant: updatedVariant },
      message: "Product variant updated successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error updating product variant:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update product variant",
    });
  }
};

// Delete product variant (soft delete)
export const deleteProductVariant: RequestHandler = async (req, res) => {
  try {
    const { variantId } = req.params;

    const { data: variant, error } = await supabase
      .from("product_variants")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", variantId)
      .select()
      .single();

    if (error) throw error;

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: "Product variant not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Product variant deleted successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error deleting product variant:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete product variant",
    });
  }
};
