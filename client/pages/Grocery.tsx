import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/grocery/ProductCard";
import { Search, Filter, Grid, List, MapPin, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  rating: number | null;
  reviews_count: number;
  sku: string | null;
  brand: string | null;
  tags: string[];
  categories: {
    id: string;
    name: string;
    service_type: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  service_type: string;
  image_url: string | null;
  is_active: boolean;
}

export default function Grocery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products and categories
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from("products")
          .select(
            `
            *,
            categories!inner (
              id,
              name,
              service_type
            )
          `,
          )
          .eq("is_active", true)
          .eq("categories.service_type", "grocery"),
        supabase
          .from("categories")
          .select("*")
          .eq("service_type", "grocery")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (productsResult.error) {
        console.error("Error fetching products:", productsResult.error);
      } else {
        console.log("GROCERY DEBUG - Products fetched:", productsResult.data);
        console.log(
          "GROCERY DEBUG - Products count:",
          productsResult.data?.length,
        );
        setProducts(productsResult.data || []);
      }

      if (categoriesResult.error) {
        console.error("Error fetching categories:", categoriesResult.error);
      } else {
        setCategories(categoriesResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesCategory =
      selectedCategory === "all" || product.categories?.id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.discount_price || a.price) - (b.discount_price || b.price);
      case "price-high":
        return (b.discount_price || b.price) - (a.discount_price || a.price);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "discount":
        const aDiscount = a.discount_price
          ? ((a.price - a.discount_price) / a.price) * 100
          : 0;
        const bDiscount = b.discount_price
          ? ((b.price - b.discount_price) / b.price) * 100
          : 0;
        return bDiscount - aDiscount;
      default:
        return b.reviews_count - a.reviews_count; // Popular (most reviews)
    }
  });

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Grocery Delivery</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Grocery Delivery
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Rayachoty, Annamayya District</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>30-minute delivery</span>
                </div>
              </div>
            </div>

            <Badge className="bg-green-500 text-white self-start lg:self-center">
              Free delivery on orders above ₹500
            </Badge>
          </div>
        </div>

        {/* Quick categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Shop by Category</h2>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-4">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`${selectedCategory === "all" ? "ring-2 ring-primary" : ""}
                         bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center transition-all`}
            >
              <div className="text-2xl mb-2">🛒</div>
              <p className="text-xs font-medium">All Items</p>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${selectedCategory === category.id ? "ring-2 ring-primary" : ""}
                           bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center transition-all`}
              >
                <div className="text-2xl mb-2">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-8 h-8 mx-auto object-contain"
                    />
                  ) : (
                    "🛒"
                  )}
                </div>
                <p className="text-xs font-medium leading-tight">
                  {category.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for products, brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Best Discount</option>
            </select>

            {/* View mode */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-primary text-black" : "bg-white text-gray-600"}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-primary text-black" : "bg-white text-gray-600"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {sortedProducts.length} of {products.length} products
            {selectedCategory !== "all" && (
              <span>
                {" "}
                in {categories.find((c) => c.id === selectedCategory)?.name}
              </span>
            )}
          </p>

          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </Button>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="bg-gray-200 h-48"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Products grid */
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {sortedProducts.map((product) => {
              // Transform database product to match ProductCard expected format
              const transformedProduct = {
                id: product.id,
                name: product.name,
                price: product.discount_price || product.price,
                originalPrice: product.discount_price
                  ? product.price
                  : undefined,
                brand: product.brand || "Generic",
                image: product.image_url || "/placeholder.svg",
                rating: product.rating || 4.0,
                reviewCount: product.reviews_count,
                discount: product.discount_price
                  ? Math.round(
                      ((product.price - product.discount_price) /
                        product.price) *
                        100,
                    )
                  : undefined,
                inStock: product.stock_quantity > 0,
                category: product.categories?.name || "Grocery",
                unit: "each", // Default unit
                tags: product.tags || [],
              };
              return (
                <ProductCard key={product.id} product={transformedProduct} />
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
