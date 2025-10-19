import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

// Reorder attributes for any entity
export const reorderAttributes: RequestHandler = async (req, res) => {
  try {
    const { entity_type, entity_id, attribute_orders } = req.body;

    if (!entity_type || !entity_id || !Array.isArray(attribute_orders)) {
      return res.status(400).json({
        success: false,
        error: "entity_type, entity_id, and attribute_orders are required",
      });
    }

    const tableName = entity_type === 'service' 
      ? 'service_attribute_config' 
      : 'category_attribute_config';
    
    const idField = entity_type === 'service' ? 'service_type_id' : 'category_id';

    // Bulk update display orders
    for (const order of attribute_orders) {
      await supabase
        .from(tableName)
        .update({ display_order: order.display_order })
        .eq(idField, entity_id)
        .eq('attribute_id', order.attribute_id);
    }

    res.json({
      success: true,
      message: "Attributes reordered successfully",
    });
  } catch (error: any) {
    console.error("Error reordering attributes:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to reorder attributes",
    });
  }
};

// Get preview of product form fields (uses v2 function)
export const previewProductForm: RequestHandler = async (req, res) => {
  try {
    const { service_type_id, category_id, subcategory_id } = req.query;

    const { data, error } = await supabase.rpc(
      'get_product_form_attributes_v2',
      {
        p_service_type_id: service_type_id as string || null,
        p_category_id: category_id as string || null,
        p_subcategory_id: subcategory_id as string || null,
      }
    );

    if (error) throw error;

    res.json({
      success: true,
      data: {
        fields: data || [],
      },
    });
  } catch (error: any) {
    console.error("Error fetching form preview:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch form preview",
    });
  }
};

// Validate product attributes before save
export const validateProductAttributes: RequestHandler = async (req, res) => {
  try {
    const { category_id, subcategory_id, attributes } = req.body;

    // Get required fields using the v2 function
    const { data: fields, error } = await supabase.rpc(
      'get_product_form_attributes_v2',
      {
        p_category_id: category_id,
        p_subcategory_id: subcategory_id || null,
      }
    );

    if (error) throw error;

    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate required fields
    fields?.forEach((field: any) => {
      if (field.is_required && !attributes[field.attribute_name]) {
        errors.push({
          field: field.attribute_name,
          message: `${field.attribute_label} is required`,
          type: 'required',
        });
      }

      // Validate data types
      if (attributes[field.attribute_name]) {
        const value = attributes[field.attribute_name];
        
        if (field.data_type === 'number' && isNaN(Number(value))) {
          errors.push({
            field: field.attribute_name,
            message: `${field.attribute_label} must be a number`,
            type: 'validation',
          });
        }

        if (field.data_type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              field: field.attribute_name,
              message: `${field.attribute_label} must be a valid email`,
              type: 'validation',
            });
          }
        }

        // Check validation rules
        if (field.validation_rules) {
          const rules = field.validation_rules;
          if (rules.min !== undefined && Number(value) < rules.min) {
            errors.push({
              field: field.attribute_name,
              message: `${field.attribute_label} must be at least ${rules.min}`,
              type: 'validation',
            });
          }
          if (rules.max !== undefined && Number(value) > rules.max) {
            errors.push({
              field: field.attribute_name,
              message: `${field.attribute_label} must not exceed ${rules.max}`,
              type: 'validation',
            });
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        isValid: errors.length === 0,
        errors,
        warnings,
      },
    });
  } catch (error: any) {
    console.error("Error validating attributes:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to validate attributes",
    });
  }
};

// Get attribute hierarchy for a product
export const getAttributeHierarchy: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('service_type, category_id, categories!inner(parent_id, level)')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    const serviceType = product.service_type;
    const categoryId = product.category_id;
    const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;
    const isSubcategory = category?.level > 0;
    const subcategoryId = isSubcategory ? categoryId : null;
    const parentCategoryId = isSubcategory ? category?.parent_id : categoryId;

    // Get service attributes
    const { data: serviceAttrs } = await supabase
      .from('service_attribute_config')
      .select('*, attribute_registry(*)')
      .eq('service_type_id', serviceType)
      .order('display_order');

    // Get category attributes
    const { data: categoryAttrs } = await supabase
      .from('category_attribute_config')
      .select('*, attribute_registry(*)')
      .eq('category_id', parentCategoryId || categoryId)
      .order('display_order');

    // Get subcategory attributes (if applicable)
    let subcategoryAttrs = [];
    if (subcategoryId) {
      const { data } = await supabase
        .from('category_attribute_config')
        .select('*, attribute_registry(*)')
        .eq('category_id', subcategoryId)
        .order('display_order');
      subcategoryAttrs = data || [];
    }

    res.json({
      success: true,
      data: {
        service_attributes: serviceAttrs || [],
        category_attributes: categoryAttrs || [],
        subcategory_attributes: subcategoryAttrs,
      },
    });
  } catch (error: any) {
    console.error("Error fetching attribute hierarchy:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch attribute hierarchy",
    });
  }
};

// Get subcategories for a category
export const getSubcategories: RequestHandler = async (req, res) => {
  try {
    const { parent_id } = req.query;

    if (!parent_id) {
      return res.status(400).json({
        success: false,
        error: "parent_id is required",
      });
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parent_id)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    res.json({
      success: true,
      data: {
        subcategories: data || [],
      },
    });
  } catch (error: any) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch subcategories",
    });
  }
};

// Create subcategory
export const createSubcategory: RequestHandler = async (req, res) => {
  try {
    const { name, description, image_url, service_type, parent_id, sort_order = 0 } = req.body;

    if (!name || !service_type || !parent_id) {
      return res.status(400).json({
        success: false,
        error: "name, service_type, and parent_id are required",
      });
    }

    // Verify parent category exists
    const { data: parent, error: parentError } = await supabase
      .from('categories')
      .select('id, level')
      .eq('id', parent_id)
      .single();

    if (parentError || !parent) {
      return res.status(404).json({
        success: false,
        error: "Parent category not found",
      });
    }

    const { data: subcategory, error } = await supabase
      .from('categories')
      .insert([{
        name,
        description,
        image_url,
        service_type,
        parent_id,
        sort_order,
        is_active: true,
      }])
      .select(`
        *,
        parent:categories!parent_id(id, name)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { subcategory },
      message: "Subcategory created successfully",
    });
  } catch (error: any) {
    console.error("Error creating subcategory:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create subcategory",
    });
  }
};

