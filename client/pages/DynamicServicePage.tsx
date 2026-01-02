import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/grocery/ProductCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/contexts/LocationContext";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Clock, Grid, List, MapPin, Search } from "lucide-react";
import { NoServiceAvailable } from "@/components/location/NoServiceAvailable";

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

interface ServiceType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export default function DynamicServicePage() {
  const params = useParams<{ serviceType?: string }>();
  const navigate = useNavigate();
  const location = window.location;
  
  // Get service type from either URL param or path
  const getServiceType = () => {
    if (params.serviceType) {
      return params.serviceType;
    }
    // Extract from path like /liquor, /pharmacy, etc.
    const pathParts = location.pathname.split('/').filter(p => p);
    return pathParts[0] || null;
  };
  
  const serviceType = getServiceType();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceInfo, setServiceInfo] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceExists, setServiceExists] = useState(true);

  // Get location context
  const {
    currentLocation,
    serviceAreaId,
    hasLocation,
    isServiceAvailable,
    isCheckingService,
    availableServiceTypes,
  } = useLocation();

  // Check if this service is available in the current location
  const hasThisService =
    isServiceAvailable &&
    serviceType &&
    availableServiceTypes.includes(serviceType);

  useEffect(() => {
    if (serviceType) {
      fetchServiceInfo();
    }
  }, [serviceType]);

  useEffect(() => {
    // Only fetch data if service exists and is available in location
    if (serviceType && serviceExists && hasThisService) {
      fetchData();
    } else {
      setLoading(false);
      setProducts([]);
      setCategories([]);
    }
  }, [serviceAreaId, hasThisService, serviceType, serviceExists]);

  const fetchServiceInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("service_types")
        .select("*")
        .eq("id", serviceType)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        console.error("Service type not found:", error);
        setServiceExists(false);
        setLoading(false);
        return;
      }

      setServiceInfo(data);
      setServiceExists(true);
    } catch (error) {
      console.error("Error fetching service info:", error);
      setServiceExists(false);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // If location is selected, fetch location-based products
      if (serviceAreaId && serviceType) {
        // Use the Postgres function to get location-based products
        const { data: locationProducts, error: productsError } =
          await supabase.rpc("get_products_by_service_area", {
            p_service_area_id: serviceAreaId,
            p_service_type: serviceType,
            p_category_id: null,
            p_search_term: null,
            p_limit: 100,
            p_offset: 0,
          });

        if (productsError) {
          console.error("Error fetching location-based products:", productsError);
          setProducts([]);
        } else {
          // Transform the data to match the Product interface
          const transformedProducts = (locationProducts || []).map((p: any) => ({
            id: p.offering_id,
            name: p.offering_name,
            description: null,
            price: p.location_price,
            discount_price: null,
            image_url: p.primary_image_url,
            stock_quantity: p.location_stock || 0,
            is_active: p.is_available,
            rating: null,
            reviews_count: 0,
            sku: null,
            brand: null,
            tags: [],
            categories: {
              id: "",
              name: p.category_name || "",
              service_type: p.service_type || serviceType,
            },
          }));
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
              image_url,
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
            .filter((c: any) => c && c.service_type === serviceType);
          setCategories(transformedCategories);
        }
      } else {
        // Fallback to all products if no location selected
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
            `
            )
            .eq("is_active", true)
            .eq("categories.service_type", serviceType),
          supabase
            .from("categories")
            .select("*")
            .eq("service_type", serviceType)
            .eq("is_active", true)
            .order("sort_order"),
        ]);

        if (productsResult.error) {
          console.error("Error fetching products:", productsResult.error);
        } else {
          setProducts(productsResult.data || []);
        }

        if (categoriesResult.error) {
          console.error("Error fetching categories:", categoriesResult.error);
        } else {
          setCategories(categoriesResult.data || []);
        }
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

  // If service doesn't exist, show 404
  if (!serviceExists && !loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Service Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The service "{serviceType}" is not available or doesn't exist.
          </p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {serviceInfo?.title || "Service"}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {serviceInfo?.icon && (
                  <span className="text-4xl">{serviceInfo.icon}</span>
                )}
                <h1 className="text-3xl font-bold text-gray-900">
                  {serviceInfo?.title || "Service"}
                </h1>
              </div>
              <p className="text-gray-600 mb-2">
                {serviceInfo?.description || "Browse our offerings"}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>
                    {hasLocation && currentLocation
                      ? `${currentLocation.city || ""}, ${currentLocation.state || ""}`
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

            <Badge
              className="self-start lg:self-center"
              style={{ backgroundColor: serviceInfo?.color || "#3b82f6" }}
            >
              Premium Quality • Fast Delivery
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
        {hasLocation && !isCheckingService && !hasThisService && (
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

        {/* Quick categories */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Shop by Category
            </h2>
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex-shrink-0 flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[100px]
                           ${
                             selectedCategory === "all"
                               ? "border-green-600 bg-green-50 shadow-md"
                               : "border-gray-200 bg-white hover:border-green-300 hover:shadow-sm"
                           }`}
              >
                <div className="text-3xl mb-2">{serviceInfo?.icon || "📦"}</div>
                <p className="text-xs font-semibold text-gray-800">All Items</p>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[100px]
                             ${
                               selectedCategory === category.id
                                 ? "border-green-600 bg-green-50 shadow-md"
                                 : "border-gray-200 bg-white hover:border-green-300 hover:shadow-sm"
                             }`}
                >
                  <div className="text-3xl mb-2">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-10 h-10 mx-auto object-contain"
                      />
                    ) : (
                      serviceInfo?.icon || "📦"
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight text-center line-clamp-2">
                    {category.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search and filters */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12 text-base border-2 focus:border-green-600"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-600 font-medium text-sm min-w-[180px]"
                aria-label="Sort products by"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Best Discount</option>
              </select>

              {/* View mode */}
              <div className="flex border-2 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 transition-colors ${
                    viewMode === "grid"
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 transition-colors ${
                    viewMode === "list"
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  aria-label="List view"
                  title="List view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {sortedProducts.length} Products
              {selectedCategory !== "all" && (
                <span className="text-gray-600 font-normal">
                  {" "}
                  in {categories.find((c) => c.id === selectedCategory)?.name}
                </span>
              )}
            </p>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-1">
                Search results for "{searchTerm}"
              </p>
            )}
          </div>

          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="border-2 hover:border-green-600"
            >
              Clear search
            </Button>
          )}
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
          /* Products grid */
          <div
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
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
                        100
                    )
                  : undefined,
                inStock: product.stock_quantity > 0,
                category: product.categories?.name || serviceInfo?.title || "",
                unit: "each",
                tags: product.tags || [],
                deliveryTime: "Fast delivery",
                description: product.description || "",
              };
              return (
                <ProductCard key={product.id} product={transformedProduct} />
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && sortedProducts.length === 0 && hasThisService && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{serviceInfo?.icon || "📦"}</div>
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

        {/* Service not available - full empty state */}
        {!loading && hasLocation && !isCheckingService && !hasThisService && (
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
      </div>
    </Layout>
  );
}

