import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AreaProduct {
  id: string;
  name: string;
  brand: string;
  category_name: string;
  base_price: number;
  area_price: number;
  area_original_price: number;
  area_discount_percentage: number;
  stock_quantity: number;
  max_order_quantity: number;
  is_available: boolean;
  is_active: boolean;
  estimated_delivery_hours: number;
  delivery_charge: number;
  handling_charge: number;
  priority: number;
  promotional_price: number;
  promo_start_date: string;
  promo_end_date: string;
  tier_pricing: any;
  notes: string;
  effective_price: number;
  is_promotional: boolean;
  savings: number;
}

export interface AreaProductFilters {
  category_id?: string;
  price_min?: number;
  price_max?: number;
  in_stock?: boolean;
  available_only?: boolean;
  search?: string;
  sort_by?: "name" | "price_low" | "price_high" | "priority" | "stock";
}

export const useAreaProducts = (
  serviceAreaId: string,
  filters: AreaProductFilters = {},
) => {
  const [products, setProducts] = useState<AreaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAreaProducts = async () => {
    if (!serviceAreaId || serviceAreaId.trim() === "") {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query with filters
      let query = supabase
        .from("product_area_pricing")
        .select(
          `
          *,
          products!inner(
            id, name, brand, price,
            categories(id, name)
          )
        `,
        )
        .eq("service_area_id", serviceAreaId)
        .eq("is_active", true);

      if (filters.available_only !== false) {
        query = query.eq("is_available", true);
      }

      if (filters.in_stock) {
        query = query.gt("stock_quantity", 0);
      }

      if (filters.category_id) {
        query = query.eq("products.category_id", filters.category_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process and enhance the data
      let processedProducts: AreaProduct[] = (data || []).map((item) => {
        const product = item.products;
        const isPromoActive =
          item.promotional_price &&
          item.promo_start_date &&
          item.promo_end_date &&
          new Date() >= new Date(item.promo_start_date) &&
          new Date() <= new Date(item.promo_end_date);

        const effectivePrice = isPromoActive
          ? item.promotional_price
          : item.area_price;
        const originalPrice = item.area_original_price || item.area_price;
        const savings = originalPrice - effectivePrice;

        return {
          id: product.id,
          name: product.name,
          brand: product.brand || "",
          category_name: product.categories?.name || "Uncategorized",
          base_price: product.price,
          area_price: item.area_price,
          area_original_price: originalPrice,
          area_discount_percentage: item.area_discount_percentage || 0,
          stock_quantity: item.stock_quantity,
          max_order_quantity: item.max_order_quantity,
          is_available: item.is_available,
          is_active: item.is_active,
          estimated_delivery_hours: item.estimated_delivery_hours,
          delivery_charge: item.delivery_charge,
          handling_charge: item.handling_charge,
          priority: item.priority || 1,
          promotional_price: item.promotional_price,
          promo_start_date: item.promo_start_date,
          promo_end_date: item.promo_end_date,
          tier_pricing:
            typeof item.tier_pricing === "string"
              ? JSON.parse(item.tier_pricing || "{}")
              : item.tier_pricing,
          notes: item.notes || "",
          effective_price: effectivePrice,
          is_promotional: isPromoActive,
          savings,
        };
      });

      // Apply client-side filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        processedProducts = processedProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            product.category_name.toLowerCase().includes(searchTerm),
        );
      }

      if (filters.price_min !== undefined) {
        processedProducts = processedProducts.filter(
          (product) => product.effective_price >= filters.price_min!,
        );
      }

      if (filters.price_max !== undefined) {
        processedProducts = processedProducts.filter(
          (product) => product.effective_price <= filters.price_max!,
        );
      }

      // Apply sorting
      switch (filters.sort_by) {
        case "price_low":
          processedProducts.sort(
            (a, b) => a.effective_price - b.effective_price,
          );
          break;
        case "price_high":
          processedProducts.sort(
            (a, b) => b.effective_price - a.effective_price,
          );
          break;
        case "priority":
          processedProducts.sort((a, b) => b.priority - a.priority);
          break;
        case "stock":
          processedProducts.sort((a, b) => b.stock_quantity - a.stock_quantity);
          break;
        case "name":
        default:
          processedProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      setProducts(processedProducts);
    } catch (err) {
      console.error("Error fetching area products:", err);
      let errorMessage = "Failed to fetch products";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = (err as any).message;
      } else if (err && typeof err === "object" && "details" in err) {
        errorMessage = `Database error: ${(err as any).details}`;
      } else if (err && typeof err === "object") {
        errorMessage = `Error: ${JSON.stringify(err)}`;
      }

      setError(errorMessage);
      toast.error(`Failed to load products: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreaProducts();
  }, [serviceAreaId, JSON.stringify(filters)]);

  // Get tier pricing for a specific quantity
  const getTierPrice = (product: AreaProduct, quantity: number): number => {
    if (!product.tier_pricing || quantity < 5) {
      return product.effective_price;
    }

    if (quantity >= 10 && product.tier_pricing.tier2?.price) {
      return product.tier_pricing.tier2.price;
    }

    if (quantity >= 5 && product.tier_pricing.tier1?.price) {
      return product.tier_pricing.tier1.price;
    }

    return product.effective_price;
  };

  // Calculate total cost including delivery and handling
  const calculateTotalCost = (
    product: AreaProduct,
    quantity: number,
  ): {
    itemTotal: number;
    deliveryCharge: number;
    handlingCharge: number;
    total: number;
  } => {
    const unitPrice = getTierPrice(product, quantity);
    const itemTotal = unitPrice * quantity;
    const deliveryCharge = product.delivery_charge || 0;
    const handlingCharge = product.handling_charge || 0;
    const total = itemTotal + deliveryCharge + handlingCharge;

    return {
      itemTotal,
      deliveryCharge,
      handlingCharge,
      total,
    };
  };

  // Get products by category
  const getProductsByCategory = (categoryName: string): AreaProduct[] => {
    return products.filter(
      (product) =>
        product.category_name.toLowerCase() === categoryName.toLowerCase(),
    );
  };

  // Get low stock products
  const getLowStockProducts = (threshold: number = 10): AreaProduct[] => {
    return products.filter(
      (product) =>
        product.stock_quantity <= threshold && product.stock_quantity > 0,
    );
  };

  // Get out of stock products
  const getOutOfStockProducts = (): AreaProduct[] => {
    return products.filter((product) => product.stock_quantity === 0);
  };

  // Get promotional products
  const getPromotionalProducts = (): AreaProduct[] => {
    return products.filter((product) => product.is_promotional);
  };

  // Get products with discounts
  const getDiscountedProducts = (): AreaProduct[] => {
    return products.filter(
      (product) => product.area_discount_percentage > 0 || product.savings > 0,
    );
  };

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.stock_quantity > 0).length;
    const lowStock = getLowStockProducts().length;
    const promotional = getPromotionalProducts().length;
    const avgPrice =
      total > 0
        ? products.reduce((sum, p) => sum + p.effective_price, 0) / total
        : 0;
    const totalValue = products.reduce(
      (sum, p) => sum + p.effective_price * p.stock_quantity,
      0,
    );

    return {
      total,
      inStock,
      lowStock,
      promotional,
      avgPrice,
      totalValue,
    };
  }, [products]);

  return {
    products,
    loading,
    error,
    stats,
    getTierPrice,
    calculateTotalCost,
    getProductsByCategory,
    getLowStockProducts,
    getOutOfStockProducts,
    getPromotionalProducts,
    getDiscountedProducts,
    refetch: fetchAreaProducts,
  };
};

export default useAreaProducts;
