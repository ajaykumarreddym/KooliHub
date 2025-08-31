import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import type { ApiResponse, Category } from "@shared/api";

// Get all categories
export const getCategories: RequestHandler = async (req, res) => {
  try {
    const {
      vendor_id,
      service_type,
      parent_id,
      include_inactive = false,
    } = req.query;

    let query = supabase.from("categories").select(`
        *,
        parent:categories!parent_id(id, name),
        children:categories!parent_id(id, name, is_active)
      `);

    // Apply filters
    if (vendor_id) {
      query = query.eq("vendor_id", vendor_id);
    }

    if (service_type) {
      query = query.eq("service_type", service_type);
    }

    if (parent_id) {
      query = query.eq("parent_id", parent_id);
    } else if (parent_id !== "all") {
      // Get root categories by default
      query = query.is("parent_id", null);
    }

    if (!include_inactive) {
      query = query.eq("is_active", true);
    }

    // Order by sort_order and name
    query = query
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    const { data: categories, error } = await query;

    if (error) throw error;

    const response = {
      success: true,
      data: {
        categories: categories || [],
      },
      categories: categories || [], // Include both formats for compatibility
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch categories",
    });
  }
};

// Get single category
export const getCategory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabase
      .from("categories")
      .select(
        `
        *,
        parent:categories!parent_id(id, name),
        children:categories!parent_id(id, name, is_active),
        vendor:vendors(id, name, slug)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { category },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch category",
    });
  }
};

// Create category
export const createCategory: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      description,
      image_url,
      service_type,
      vendor_id,
      parent_id,
      sort_order = 0,
      is_active = true,
    } = req.body;

    // Validate required fields
    if (!name || !service_type) {
      return res.status(400).json({
        success: false,
        error: "Name and service type are required",
      });
    }

    const { data: category, error } = await supabase
      .from("categories")
      .insert([
        {
          name,
          description,
          image_url,
          service_type,
          vendor_id,
          parent_id,
          sort_order,
          is_active,
        },
      ])
      .select(
        `
        *,
        parent:categories!parent_id(id, name),
        vendor:vendors(id, name, slug)
      `,
      )
      .single();

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: { category },
      message: "Category created successfully",
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create category",
    });
  }
};

// Update category
export const updateCategory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove id and timestamps from update data
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    const { data: category, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        parent:categories!parent_id(id, name),
        vendor:vendors(id, name, slug)
      `,
      )
      .single();

    if (error) throw error;

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      data: { category },
      message: "Category updated successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update category",
    });
  }
};

// Delete category
export const deleteCategory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has children
    const { data: children, error: childrenError } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", id)
      .limit(1);

    if (childrenError) throw childrenError;

    if (children && children.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete category with child categories",
      });
    }

    // Check if category has products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("category_id", id)
      .is("deleted_at", null)
      .limit(1);

    if (productsError) throw productsError;

    if (products && products.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete category with products. Move products to another category first.",
      });
    }

    const { data: category, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Category deleted successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete category",
    });
  }
};

// Get category hierarchy (tree structure)
export const getCategoryTree: RequestHandler = async (req, res) => {
  try {
    const { service_type, vendor_id } = req.query;

    let query = supabase.from("categories").select("*").eq("is_active", true);

    if (service_type) {
      query = query.eq("service_type", service_type);
    }

    if (vendor_id) {
      query = query.eq("vendor_id", vendor_id);
    }

    query = query
      .order("level", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    const { data: categories, error } = await query;

    if (error) throw error;

    // Build tree structure
    const categoryMap = new Map();
    const tree: Category[] = [];

    // First pass: create map
    categories?.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree
    categories?.forEach((category) => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(category.id));
        }
      } else {
        tree.push(categoryMap.get(category.id));
      }
    });

    const response: ApiResponse = {
      success: true,
      data: { tree },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching category tree:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch category tree",
    });
  }
};
