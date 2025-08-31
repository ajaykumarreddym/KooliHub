import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/grocery/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  brand: string;
  image: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  inStock: boolean;
  category: string;
  unit: string;
  tags: string[];
  isOrganic?: boolean;
  isFresh?: boolean;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  service_type: string;
  is_active: boolean;
  sort_order: number;
}

export default function Beauty() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [priceRange, setPriceRange] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products and categories for beauty service type
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
          .eq("categories.service_type", "beauty"),
        supabase
          .from("categories")
          .select("*")
          .eq("service_type", "beauty")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (productsResult.error) {
        console.error("Error fetching products:", productsResult.error);
        return;
      }

      if (categoriesResult.error) {
        console.error("Error fetching categories:", categoriesResult.error);
        return;
      }

      // Transform products to match the expected interface
      const transformedProducts: Product[] = (productsResult.data || []).map(
        (product: any) => ({
          id: product.id,
          name: product.name || product.title,
          price: product.price || 0,
          originalPrice: product.original_price,
          brand: product.brand || product.vendor || "Beauty Brand",
          image: product.image_url || product.image || "💄",
          rating: product.rating || 4.0,
          reviewCount:
            product.review_count || Math.floor(Math.random() * 500) + 10,
          discount: product.discount_percentage,
          inStock: product.in_stock !== false && product.stock_quantity > 0,
          category: product.categories?.name || "Beauty",
          unit: product.unit || "piece",
          tags: product.tags || [],
          description: product.description,
        }),
      );

      setProducts(transformedProducts);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error("Error fetching beauty data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("beauty-products")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: "categories.service_type=eq.beauty",
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesPrice =
        priceRange === "all" ||
        (priceRange === "under-500" && product.price < 500) ||
        (priceRange === "500-1000" &&
          product.price >= 500 &&
          product.price <= 1000) ||
        (priceRange === "1000-2000" &&
          product.price >= 1000 &&
          product.price <= 2000) ||
        (priceRange === "above-2000" && product.price > 2000);

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Beauty & Personal Care</h1>
            <p className="text-xl opacity-90">
              Discover premium beauty products for your daily care routine
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search beauty products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range Filter */}
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-48">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-500">Under ₹500</SelectItem>
                <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
                <SelectItem value="1000-2000">₹1000 - ₹2000</SelectItem>
                <SelectItem value="above-2000">Above ₹2000</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters */}
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSearchTerm("")}
              >
                Search: {searchTerm} ×
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSelectedCategory("all")}
              >
                Category: {selectedCategory} ×
              </Badge>
            )}
            {priceRange !== "all" && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setPriceRange("all")}
              >
                Price: {priceRange} ×
              </Badge>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No beauty products found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== "all" || priceRange !== "all"
                ? "Try adjusting your search or filters"
                : "Beauty products will appear here once they're added to the database"}
            </p>
            {(searchTerm ||
              selectedCategory !== "all" ||
              priceRange !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setPriceRange("all");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Category showcase */}
        {categories.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                  <div className="text-3xl mb-2">💄</div>
                  <h3 className="font-medium text-sm">{category.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
