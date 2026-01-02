import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
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
  primary_image_url?: string;
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

      // Build query with filters - using service_area_products table
      let query = supabase
        .from("service_area_products")
        .select(
          `
          *,
          offerings!inner(
            id, name, base_price, type, status,
            primary_image_url, description, vendor_id,
            categories(id, name, service_type)
          )
        `,
        )
        .eq("service_area_id", serviceAreaId);

      if (filters.available_only !== false) {
        query = query.eq("is_available", true);
      }

      if (filters.in_stock) {
        query = query.gt("stock_quantity", 0);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process and enhance the data
      let processedProducts: AreaProduct[] = (data || []).map((item) => {
        const product = item.offerings;
        
        // Calculate pricing
        const basePrice = product.base_price || 0;
        const areaPrice = item.price_override || basePrice;
        const effectivePrice = areaPrice;
        const savings = basePrice - effectivePrice;

        return {
          id: product.id,
          name: product.name,
          brand: "", // Brand field not available in offerings table
          category_name: product.categories?.name || "Uncategorized",
          base_price: basePrice,
          area_price: areaPrice,
          area_original_price: basePrice,
          area_discount_percentage: savings > 0 ? ((savings / basePrice) * 100) : 0,
          stock_quantity: item.stock_quantity || 0,
          max_order_quantity: item.max_order_quantity || 10,
          is_available: item.is_available !== false,
          is_active: true,
          estimated_delivery_hours: item.delivery_time_override || 24,
          delivery_charge: 0,
          handling_charge: 0,
          priority: item.priority_order || 1,
          promotional_price: 0,
          promo_start_date: "",
          promo_end_date: "",
          tier_pricing: {},
          notes: item.location_notes || "",
          effective_price: effectivePrice,
          is_promotional: savings > 0,
          savings: Math.max(0, savings),
          primary_image_url: product.primary_image_url || undefined,
        };
      });

      // Apply client-side filters
      if (filters.category_id) {
        processedProducts = processedProducts.filter((product) => {
          // Get the category_id from the original data
          const originalItem = data?.find((item) => item.offerings.id === product.id);
          return originalItem?.offerings?.categories?.id === filters.category_id;
        });
      }
      
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
