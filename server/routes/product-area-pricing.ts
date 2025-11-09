import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";

// Get effective price for a product in an area
export const getEffectivePrice: RequestHandler = async (req, res) => {
  try {
    const { productId, serviceAreaId, quantity = 1 } = req.query;

    if (!productId || !serviceAreaId) {
      return res.status(400).json({
        error: "Product ID and Service Area ID are required",
      });
    }

    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc("get_effective_product_price", {
      p_product_id: productId,
      p_service_area_id: serviceAreaId,
      p_quantity: parseInt(quantity as string),
      p_check_time: new Date().toISOString(),
    });

    if (error) {
      console.error("Error getting effective price:", error);
      return res.status(500).json({ error: "Failed to get effective price" });
    }

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ error: "Product not available in this area" });
    }

    res.json(data[0]);
  } catch (error) {
    console.error("Error in getEffectivePrice:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get products available in an area
export const getAreaProducts: RequestHandler = async (req, res) => {
  try {
    const { serviceAreaId } = req.params;
    const {
      category_id,
      limit = 50,
      offset = 0,
      search,
      sort_by = "priority",
      available_only = "true",
    } = req.query;

    if (!serviceAreaId) {
      return res.status(400).json({ error: "Service Area ID is required" });
    }

    // Build the query
    let query = supabase
      .from("product_area_pricing")
      .select(
        `
        *,
        products!inner(
          id, name, brand, price, sku, description,
          categories(id, name)
        ),
        serviceable_areas!inner(
          id, city, state, pincode, delivery_time_hours, delivery_charge
        )
      `,
      )
      .eq("service_area_id", serviceAreaId)
      .eq("is_active", true);

    if (available_only === "true") {
      query = query.eq("is_available", true);
    }

    if (category_id) {
      query = query.eq("products.category_id", category_id);
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `products.name.ilike.%${search}%,products.brand.ilike.%${search}%`,
      );
    }

    // Apply sorting
    switch (sort_by) {
      case "price_low":
        query = query.order("area_price", { ascending: true });
        break;
      case "price_high":
        query = query.order("area_price", { ascending: false });
        break;
      case "stock":
        query = query.order("stock_quantity", { ascending: false });
        break;
      case "name":
        query = query.order("products(name)", { ascending: true });
        break;
      case "priority":
      default:
        query = query.order("priority", { ascending: false });
        break;
    }

    query = query.range(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string) - 1,
    );

    const { data, error } = await query;

    if (error) {
      console.error("Error getting area products:", error);
      return res.status(500).json({ error: "Failed to get area products" });
    }

    // Transform the data
    const products = data.map((item) => {
      const product = item.products;
      const now = new Date();
      const isPromoActive =
        item.promotional_price &&
        item.promo_start_date &&
        item.promo_end_date &&
        now >= new Date(item.promo_start_date) &&
        now <= new Date(item.promo_end_date);

      const effectivePrice = isPromoActive
        ? item.promotional_price
        : item.area_price;
      const originalPrice = item.area_original_price || item.area_price;

      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        description: product.description,
        category: product.categories,
        base_price: product.price,
        area_price: item.area_price,
        effective_price: effectivePrice,
        original_price: originalPrice,
        discount_percentage: item.area_discount_percentage,
        savings: originalPrice - effectivePrice,
        stock_quantity: item.stock_quantity,
        max_order_quantity: item.max_order_quantity,
        is_available: item.is_available,
        estimated_delivery_hours: item.estimated_delivery_hours,
        delivery_charge: item.delivery_charge,
        handling_charge: item.handling_charge,
        priority: item.priority,
        is_promotional: isPromoActive,
        promotional_price: item.promotional_price,
        promo_end_date: item.promo_end_date,
        tier_pricing:
          typeof item.tier_pricing === "string"
            ? JSON.parse(item.tier_pricing || "{}")
            : item.tier_pricing,
        notes: item.notes,
        service_area: item.serviceable_areas,
      };
    });

    res.json({
      products,
      pagination: {
        offset: parseInt(offset as string),
        limit: parseInt(limit as string),
        total: data.length,
      },
    });
  } catch (error) {
    console.error("Error in getAreaProducts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Bulk update pricing for multiple products in an area
export const bulkUpdatePricing: RequestHandler = async (req, res) => {
  try {
    const { serviceAreaId } = req.params;
    const { updates } = req.body;

    if (!serviceAreaId || !updates || !Array.isArray(updates)) {
      return res.status(400).json({
        error: "Service Area ID and updates array are required",
      });
    }

    const results = [];

    for (const update of updates) {
      const { product_id, ...updateData } = update;

      if (!product_id) {
        results.push({
          product_id,
          success: false,
          error: "Product ID is required",
        });
        continue;
      }

      try {
        const { data, error } = await supabase
          .from("product_area_pricing")
          .upsert(
            {
              product_id,
              service_area_id: serviceAreaId,
              ...updateData,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "product_id,service_area_id",
            },
          )
          .select()
          .single();

        if (error) {
          results.push({ product_id, success: false, error: error.message });
        } else {
          results.push({ product_id, success: true, data });
        }
      } catch (error) {
        results.push({
          product_id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error("Error in bulkUpdatePricing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Copy pricing from one area to another
export const copyAreaPricing: RequestHandler = async (req, res) => {
  try {
    const { sourceAreaId, targetAreaId, priceMultiplier = 1.0 } = req.body;

    if (!sourceAreaId || !targetAreaId) {
      return res.status(400).json({
        error: "Source Area ID and Target Area ID are required",
      });
    }

    if (sourceAreaId === targetAreaId) {
      return res.status(400).json({
        error: "Source and target areas cannot be the same",
      });
    }

    // Get all pricing data from source area
    const { data: sourcePricing, error: sourceError } = await supabase
      .from("product_area_pricing")
      .select("*")
      .eq("service_area_id", sourceAreaId)
      .eq("is_active", true);

    if (sourceError) {
      console.error("Error getting source pricing:", sourceError);
      return res.status(500).json({ error: "Failed to get source pricing" });
    }

    if (!sourcePricing || sourcePricing.length === 0) {
      return res
        .status(404)
        .json({ error: "No pricing data found in source area" });
    }

    // Get target area info for default values
    const { data: targetArea, error: areaError } = await supabase
      .from("serviceable_areas")
      .select("delivery_time_hours, delivery_charge")
      .eq("id", targetAreaId)
      .single();

    if (areaError) {
      console.error("Error getting target area:", areaError);
      return res.status(500).json({ error: "Failed to get target area info" });
    }

    // Prepare data for target area
    const targetPricingData = sourcePricing.map((item) => ({
      product_id: item.product_id,
      service_area_id: targetAreaId,
      area_price: Math.round(item.area_price * priceMultiplier * 100) / 100, // Apply multiplier
      area_original_price: item.area_original_price
        ? Math.round(item.area_original_price * priceMultiplier * 100) / 100
        : null,
      area_discount_percentage: item.area_discount_percentage,
      stock_quantity: Math.floor(item.stock_quantity * 0.8), // Reduce stock by 20%
      max_order_quantity: item.max_order_quantity,
      estimated_delivery_hours: targetArea.delivery_time_hours,
      delivery_charge: targetArea.delivery_charge,
      handling_charge: item.handling_charge,
      is_available: true,
      is_active: true,
      priority: item.priority,
      tier_pricing: item.tier_pricing,
      notes: `Copied from another area on ${new Date().toLocaleDateString()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Batch insert/update
    const { data, error } = await supabase
      .from("product_area_pricing")
      .upsert(targetPricingData, {
        onConflict: "product_id,service_area_id",
      })
      .select();

    if (error) {
      console.error("Error copying pricing:", error);
      return res.status(500).json({ error: "Failed to copy pricing data" });
    }

    res.json({
      message: "Pricing data copied successfully",
      copied_count: data.length,
      price_multiplier: priceMultiplier,
    });
  } catch (error) {
    console.error("Error in copyAreaPricing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pricing analytics for an area
export const getAreaPricingAnalytics: RequestHandler = async (req, res) => {
  try {
    const { serviceAreaId } = req.params;

    if (!serviceAreaId) {
      return res.status(400).json({ error: "Service Area ID is required" });
    }

    // Get comprehensive analytics
    const { data, error } = await supabase
      .from("product_area_pricing")
      .select(
        `
        area_price,
        stock_quantity,
        is_available,
        area_discount_percentage,
        promotional_price,
        promo_start_date,
        promo_end_date,
        products!inner(
          categories(name)
        )
      `,
      )
      .eq("service_area_id", serviceAreaId)
      .eq("is_active", true);

    if (error) {
      console.error("Error getting analytics:", error);
      return res.status(500).json({ error: "Failed to get analytics data" });
    }

    const analytics = {
      total_products: data.length,
      available_products: data.filter((p) => p.is_available).length,
      avg_price:
        data.length > 0
          ? data.reduce((sum, p) => sum + p.area_price, 0) / data.length
          : 0,
      total_stock_value: data.reduce(
        (sum, p) => sum + p.area_price * p.stock_quantity,
        0,
      ),
      low_stock_count: data.filter(
        (p) => p.stock_quantity <= 10 && p.stock_quantity > 0,
      ).length,
      out_of_stock_count: data.filter((p) => p.stock_quantity === 0).length,
      discounted_products: data.filter((p) => p.area_discount_percentage > 0)
        .length,
      promotional_products: data.filter((p) => {
        if (!p.promotional_price || !p.promo_start_date || !p.promo_end_date)
          return false;
        const now = new Date();
        return (
          now >= new Date(p.promo_start_date) &&
          now <= new Date(p.promo_end_date)
        );
      }).length,
      price_distribution: {
        under_100: data.filter((p) => p.area_price < 100).length,
        from_100_to_500: data.filter(
          (p) => p.area_price >= 100 && p.area_price < 500,
        ).length,
        from_500_to_1000: data.filter(
          (p) => p.area_price >= 500 && p.area_price < 1000,
        ).length,
        above_1000: data.filter((p) => p.area_price >= 1000).length,
      },
      category_breakdown: data.reduce(
        (acc, p) => {
          const productsData = p.products as any;
          const categories = productsData?.categories;
          const category = (Array.isArray(categories) && categories[0]) 
            ? categories[0].name 
            : categories?.name || "Uncategorized";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error in getAreaPricingAnalytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
