import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/grocery/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal, MapPin, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "@/contexts/LocationContext";
import { NoServiceAvailable } from "@/components/location/NoServiceAvailable";

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

  // Get location context
  const {
    currentLocation,
    serviceAreaId,
    hasLocation,
    isServiceAvailable,
    isCheckingService,
    availableServiceTypes,
  } = useLocation();

  // Check if beauty service is available in the current location
  const hasBeautyService =
    isServiceAvailable && availableServiceTypes.includes("beauty");

  useEffect(() => {
    fetchData();
  }, [serviceAreaId, hasBeautyService]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // If location is selected and service is available, use location-based filtering
      if (serviceAreaId && hasBeautyService) {
        const { data: locationData, error: locationError } = await supabase.rpc(
          "get_products_by_service_area",
          {
            p_service_area_id: serviceAreaId,
            p_service_type: "beauty",
            p_category_id: null,
            p_search_term: null,
            p_limit: 100,
            p_offset: 0,
          }
        );

        if (locationError) {
          console.error("Error fetching location-based products:", locationError);
          setProducts([]);
        } else if (locationData) {
          const transformedProducts: Product[] = (locationData || []).map(
            (p: any) => ({
              id: p.offering_id,
              name: p.offering_name,
              price: p.location_price || 0,
              originalPrice: undefined,
              brand: "Beauty Brand",
              image: p.primary_image_url || "💄",
              rating: 4.0,
              reviewCount: 0,
              discount: undefined,
              inStock: p.is_available && (p.location_stock || 0) > 0,
              category: p.category_name || "Beauty",
              unit: "piece",
              tags: [],
              description: undefined,
            })
          );
          setProducts(transformedProducts);
        }

        // Fetch location-based categories
        const { data: locationCategories, error: categoriesError } =
          await supabase
            .from("service_area_categories")
            .select(
              `
              *,
              categories:category_id (
                id,
                name,
                service_type,
                is_active,
                sort_order
              )
            `
            )
            .eq("service_area_id", serviceAreaId)
            .eq("is_available", true)
            .order("display_order");

        if (categoriesError) {
          console.error("Error fetching location-based categories:", categoriesError);
          setCategories([]);
        } else {
          const transformedCategories = (locationCategories || [])
            .map((sc: any) => sc.categories)
            .filter((c: any) => c && c.service_type === "beauty");
          setCategories(transformedCategories);
        }
      } else {
        // Fallback: Fetch all beauty products
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
          setProducts([]);
        } else {
          const transformedProducts: Product[] = (productsResult.data || []).map(
            (product: any) => ({
              id: product.id,
              name: product.name || product.title,
              price: product.price || 0,
              originalPrice: product.original_price,
              brand: product.brand || product.vendor || "Beauty Brand",
              image: product.image_url || product.image || "💄",
              rating: product.rating || 4.0,
              reviewCount: product.review_count || 0,
              discount: product.discount_percentage,
              inStock: product.in_stock !== false && product.stock_quantity > 0,
              category: product.categories?.name || "Beauty",
              unit: product.unit || "piece",
              tags: product.tags || [],
              description: product.description,
            }),
          );
          setProducts(transformedProducts);
        }

        if (categoriesResult.error) {
          console.error("Error fetching categories:", categoriesResult.error);
          setCategories([]);
        } else {
          setCategories(categoriesResult.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching beauty data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Beauty</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                💄 Beauty & Personal Care
              </h1>
              <p className="text-gray-600 mb-2">
                Discover premium beauty products for your daily care routine
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>
                    {hasLocation && currentLocation
                      ? `${currentLocation.city}, ${currentLocation.state}`
                      : "Select location to see available products"}
                  </span>
                </div>
                {hasLocation && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Fast delivery</span>
                  </div>
                )}
              </div>
            </div>

            <Badge className="bg-pink-500 text-white self-start lg:self-center">
              Premium Quality • Authentic Products
            </Badge>
          </div>
        </div>

        {/* Location Alert */}
        {!hasLocation && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Please select your location from the header to see products
              available in your area.
            </AlertDescription>
          </Alert>
        )}

        {/* Service Not Available Alert */}
        {hasLocation && !isCheckingService && !hasBeautyService && (
          <div className="mb-6">
            <NoServiceAvailable
              locationName={
                currentLocation
                  ? `${currentLocation.city}, ${currentLocation.state}`
                  : undefined
              }
              variant="card"
            />
          </div>
        )}
        {/* Filters and Search */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="animate-pulse border-gray-100">
                <CardContent className="p-0">
                  <div className="bg-gray-200 h-40"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Products Grid */
          filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : hasBeautyService ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No beauty products found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== "all" || priceRange !== "all"
                  ? "Try adjusting your search or filters"
                  : "Beauty products will appear here once they're added"}
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
          ) : null
        )}

        {/* Service not available - full empty state */}
        {!loading &&
          hasLocation &&
          !isCheckingService &&
          !hasBeautyService && (
            <NoServiceAvailable
              locationName={
                currentLocation
                  ? `${currentLocation.city}, ${currentLocation.state}`
                  : undefined
              }
              variant="full"
              showSuggestions={true}
            />
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
    </Layout>
  );
}
