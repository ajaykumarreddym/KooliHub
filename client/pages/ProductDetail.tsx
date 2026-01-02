import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "@/contexts/LocationContext";
import { useWishlistContext } from "@/contexts/WishlistContext";
import { supabase } from "@/lib/supabase";
import {
    ArrowLeft,
    Award,
    CheckCircle,
    Clock,
    Heart,
    MapPin,
    Minus,
    Package,
    Plus,
    Share2,
    ShoppingCart,
    ShoppingBag,
    Star,
    Truck
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "@/components/grocery/ProductCard";
import { CartSidebar } from "@/components/cart/CartSidebar";

interface ProductDetails {
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
  // Additional fields from service area offerings
  offering_name?: string;
  primary_image_url?: string;
  location_price?: number;
  location_stock?: number;
  is_available?: boolean;
  custom_attributes?: any;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLocation, serviceAreaId } = useLocation();
  const { state, dispatch } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistContext();
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [productAttributes, setProductAttributes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id, serviceAreaId]);

  useEffect(() => {
    if (product && serviceAreaId) {
      fetchRelatedProducts();
    }
  }, [product, serviceAreaId]);

  const fetchRelatedProducts = async () => {
    if (!product || !serviceAreaId) return;

    try {
      // Fetch similar products from the same category
      const { data: locationProducts, error } = await supabase.rpc(
        'get_products_by_service_area',
        {
          p_service_area_id: serviceAreaId,
          p_service_type: product.categories?.service_type || null,
          p_category_id: null,
          p_search_term: null,
          p_limit: 12,
          p_offset: 0,
        }
      );

      if (!error && locationProducts) {
        // Transform and filter out current product
        const transformed = locationProducts
          .filter((p: any) => p.offering_id !== product.id && p.product_id !== product.id)
          .slice(0, 10)
          .map((p: any) => ({
            id: p.offering_id || p.product_id,
            name: p.offering_name,
            price: p.location_price,
            originalPrice: p.location_price !== p.base_price ? p.base_price : undefined,
            brand: p.vendor_name || 'Generic',
            image: p.primary_image_url || '/placeholder.svg',
            rating: p.rating || 0,
            reviewCount: p.reviews_count || 0,
            discount: p.location_price !== p.base_price ? Math.round(((p.base_price - p.location_price) / p.base_price) * 100) : undefined,
            inStock: p.location_stock > 0,
            category: p.category_name || 'Product',
            unit: p.unit || 'each',
            tags: p.tags || [],
            description: p.description || '',
            deliveryTime: '15 mins',
          }));

        setSimilarProducts(transformed.slice(0, 4));
        setTopProducts(transformed.slice(4, 10));
      }
    } catch (err) {
      console.error("Error fetching related products:", err);
    }
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);

      // First, try to get location-specific product data if service area is selected
      if (serviceAreaId) {
        const { data: locationProducts, error } = await supabase.rpc(
          'get_products_by_service_area',
          {
            p_service_area_id: serviceAreaId,
            p_service_type: null,
            p_category_id: null,
            p_search_term: null,
            p_limit: 1000,
            p_offset: 0,
          }
        );

        if (!error && locationProducts) {
          const locationProduct = locationProducts.find(
            (p: any) => p.offering_id === id || p.product_id === id
          );

          if (locationProduct) {
            // Fetch additional product attributes from products table
            const { data: productData } = await supabase
              .from("products")
              .select("custom_fields, weight, dimensions, manufacturer, country_of_origin")
              .eq("id", locationProduct.product_id)
              .single();

            // Fetch custom attributes and description from offerings table
            const { data: offeringData, error: offeringError } = await supabase
              .from("offerings")
              .select("custom_attributes, description")
              .eq("id", locationProduct.offering_id)
              .single();

            if (offeringError) {
              console.log("Error fetching offering data:", offeringError);
            }
            console.log("Offering data:", {
              custom_attributes: offeringData?.custom_attributes,
              description: offeringData?.description
            });

            setProduct({
              id: locationProduct.offering_id || id,
              name: locationProduct.offering_name,
              description: offeringData?.description || locationProduct.description || null,
              price: locationProduct.base_price,
              discount_price: locationProduct.location_price !== locationProduct.base_price ? locationProduct.location_price : null,
              image_url: locationProduct.primary_image_url,
              stock_quantity: locationProduct.location_stock || 0,
              is_active: locationProduct.is_available,
              rating: locationProduct.rating || null,
              reviews_count: locationProduct.reviews_count || 0,
              sku: locationProduct.sku || null,
              brand: locationProduct.vendor_name || null,
              tags: locationProduct.tags || [],
              categories: {
                id: '',
                name: locationProduct.category_name || '',
                service_type: locationProduct.service_type || '',
              },
              custom_attributes: offeringData?.custom_attributes || null,
            });

            if (productData) {
              console.log("Product custom fields:", productData.custom_fields);
              setProductAttributes(productData);
            }
            
            console.log("Final product state:", {
              custom_attributes: offeringData?.custom_attributes,
              product_custom_fields: productData?.custom_fields
            });
            
            setLoading(false);
            return;
          }
        }
      }

      // Fallback to regular products table
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name,
            service_type
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } else {
        setProduct(data);
        // Store additional attributes
        if (data.custom_fields || data.weight || data.dimensions) {
          setProductAttributes({
            custom_fields: data.custom_fields,
            weight: data.weight,
            dimensions: data.dimensions,
            manufacturer: data.manufacturer,
            country_of_origin: data.country_of_origin,
          });
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const cartItem = state.items.find((item) => item.product.id === product?.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    
    dispatch({
      type: "ADD_ITEM",
      payload: {
        product: {
          id: product.id,
          name: product.name,
          price: product.discount_price || product.location_price || product.price,
          originalPrice: product.discount_price || product.location_price ? product.price : undefined,
          brand: product.brand || "Generic",
          image: product.image_url || product.primary_image_url || "/placeholder.svg",
          rating: product.rating || 4.0,
          reviewCount: product.reviews_count,
          discount: product.discount_price || product.location_price
            ? Math.round(((product.price - (product.discount_price || product.location_price!)) / product.price) * 100)
            : undefined,
          inStock: product.stock_quantity > 0,
          category: product.categories?.name || "Product",
          unit: "each",
          description: product.description || '',
        },
        quantity,
      },
    });
    
    // Open cart sidebar after adding to cart
    setCartSidebarOpen(true);
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (!product) return;
    
    if (newQuantity === 0) {
      dispatch({
        type: "REMOVE_ITEM",
        payload: { productId: product.id },
      });
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId: product.id, quantity: newQuantity },
      });
    }
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    
    toggleWishlist({
      id: product.id,
      title: product.name,
      price: product.discount_price || product.location_price || product.price,
      image: product.image_url || product.primary_image_url || "/placeholder.svg",
      category: product.categories?.name || "Product",
      description: product.description,
      rating: product.rating || 4.0,
    });
  };

  const finalPrice = product?.discount_price || product?.location_price || product?.price || 0;
  const originalPrice = (product?.discount_price || product?.location_price) ? product?.price : null;
  const discount = originalPrice ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;
  const images = product?.image_url ? [product.image_url] : (product?.primary_image_url ? [product.primary_image_url] : ["/placeholder.svg"]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid lg:grid-cols-2 gap-8 animate-pulse">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
              <p className="text-gray-600 mb-6">
                The product you're looking for doesn't exist or is no longer available.
              </p>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to={`/${product.categories?.service_type || 'grocery'}`} className="hover:text-primary">
            {product.categories?.name || 'Products'}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8 mb-8">
          {/* Left: Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="relative bg-white h-96 flex items-center justify-center p-6">
                  {images[selectedImage] && (images[selectedImage].startsWith('http') || images[selectedImage].startsWith('/')) ? (
                    <img
                      src={images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-9xl">🛍️</span>
                  )}

                  {/* Discount Badge */}
                  {discount > 0 && (
                    <Badge className="absolute top-4 left-4 bg-blue-600 text-white text-sm font-bold px-3 py-1">
                      {discount}% OFF
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`border-2 rounded-lg overflow-hidden ${
                      selectedImage === idx ? "border-green-600" : "border-gray-200"
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <p className="text-sm text-gray-600 mb-3">{product.brand || 'Generic'} • {product.categories?.name}</p>
              
              {/* Price */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{finalPrice.toFixed(0)}
                </span>
                {originalPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ₹{originalPrice.toFixed(0)}
                    </span>
                    <Badge className="bg-blue-600 text-white text-sm font-bold">
                      {discount}% OFF
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">Inclusive of all taxes</p>
            </div>

            <Separator />

            {/* Add to Cart Section */}
            {product.stock_quantity > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                {!isInCart ? (
                  <Button
                    onClick={handleAddToCart}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to cart
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-green-700">Item added to cart</span>
                      <div className="flex items-center border-2 border-green-600 rounded-lg bg-green-600">
                        <button
                          onClick={() => handleUpdateQuantity(cartQuantity - 1)}
                          className="p-3 hover:bg-green-700 transition-colors text-white"
                          aria-label="Decrease cart quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-6 py-2 text-lg font-bold text-white min-w-[60px] text-center">
                          {cartQuantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(cartQuantity + 1)}
                          className="p-3 hover:bg-green-700 transition-colors text-white"
                          disabled={cartQuantity >= product.stock_quantity}
                          aria-label="Increase cart quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => navigate('/checkout')}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Why Shop Section - Blinkit Style */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-blue-50">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Why shop from KooliHub?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Superfast Delivery</h4>
                      <p className="text-xs text-gray-600">Get your order delivered to your doorstep at the earliest from nearest stores.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Best Prices & Offers</h4>
                      <p className="text-xs text-gray-600">Deal price & discounts at our lowest prices with offers directly from the manufacturers.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <ShoppingBag className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Wide Assortment</h4>
                      <p className="text-xs text-gray-600">Choose from 5000+ products across food, personal care, household & other categories.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            {currentLocation && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Delivering to {currentLocation.city}</p>
                  {currentLocation.pincode && (
                    <p className="text-xs text-gray-600">PIN: {currentLocation.pincode}</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Product Overview Section - Just Below Product - Blinkit Style */}
        <Card className="border-0 shadow-sm mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Overview</h2>
            
            {/* View More Details Button - Only show when collapsed */}
            {!showFullDetails && (
              <button
                onClick={() => setShowFullDetails(true)}
                className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-1 mb-4"
              >
                View more details
                <span className="text-lg">▼</span>
              </button>
            )}

            {/* Collapsible Full Details */}
            {showFullDetails && (
              <>
                {/* HIGHLIGHTS Section */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-3 uppercase tracking-wide">HIGHLIGHTS</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    {product.description ? (
                      product.description.split('\n').filter(s => s.trim()).length > 1 ? (
                        // Multi-line description
                        product.description.split('\n').filter(s => s.trim()).map((line, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{line.trim()}</span>
                          </li>
                        ))
                      ) : (
                        // Single paragraph - split by sentences
                        product.description.split('.').filter(s => s.trim()).map((line, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{line.trim()}</span>
                          </li>
                        ))
                      )
                    ) : (
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{product.name}</span>
                      </li>
                    )}
                  </ul>
                </div>

                <Separator className="my-6" />

                {/* PRODUCT DETAILS Section */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4 uppercase tracking-wide">PRODUCT DETAILS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.brand && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Brand</div>
                        <div className="font-medium text-gray-900">{product.brand}</div>
                      </div>
                    )}
                    
                    {product.categories?.name && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Category</div>
                        <div className="font-medium text-gray-900">{product.categories.name}</div>
                      </div>
                    )}

                    {product.sku && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">SKU</div>
                        <div className="font-medium text-gray-900">{product.sku}</div>
                      </div>
                    )}

                    {product.stock_quantity > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Available Stock</div>
                        <div className="font-medium text-gray-900">
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {product.stock_quantity} units
                          </span>
                        </div>
                      </div>
                    )}

                    {currentLocation && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Delivery Time</div>
                        <div className="font-medium text-gray-900 flex items-center gap-1">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span>15-30 minutes</span>
                        </div>
                      </div>
                    )}

                    {product.categories?.service_type && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Service Type</div>
                        <div className="font-medium text-gray-900 capitalize">{product.categories.service_type}</div>
                      </div>
                    )}

                    {/* Additional attributes from database */}
                    {productAttributes?.weight && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Weight</div>
                        <div className="font-medium text-gray-900">{productAttributes.weight}</div>
                      </div>
                    )}

                    {productAttributes?.dimensions && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Dimensions</div>
                        <div className="font-medium text-gray-900">{productAttributes.dimensions}</div>
                      </div>
                    )}

                    {productAttributes?.manufacturer && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Manufacturer</div>
                        <div className="font-medium text-gray-900">{productAttributes.manufacturer}</div>
                      </div>
                    )}

                    {productAttributes?.country_of_origin && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Country of Origin</div>
                        <div className="font-medium text-gray-900">{productAttributes.country_of_origin}</div>
                      </div>
                    )}

                    {/* Custom attributes from offerings table */}
                    {product.custom_attributes && typeof product.custom_attributes === 'object' && 
                      Object.entries(product.custom_attributes).map(([key, value]: [string, any]) => {
                        // Format the value based on its type
                        let displayValue = value;
                        if (typeof value === 'boolean') {
                          displayValue = value ? 'Yes' : 'No';
                        } else if (Array.isArray(value)) {
                          displayValue = value.join(', ');
                        } else if (typeof value === 'object' && value !== null) {
                          displayValue = JSON.stringify(value);
                        } else {
                          displayValue = String(value);
                        }

                        return (
                          <div key={key} className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
                            <div className="font-medium text-gray-900">{displayValue}</div>
                          </div>
                        );
                      })
                    }

                    {/* Custom fields from products table */}
                    {productAttributes?.custom_fields && typeof productAttributes.custom_fields === 'object' && 
                      Object.entries(productAttributes.custom_fields).map(([key, value]: [string, any]) => {
                        // Format the value based on its type
                        let displayValue = value;
                        if (typeof value === 'boolean') {
                          displayValue = value ? 'Yes' : 'No';
                        } else if (Array.isArray(value)) {
                          displayValue = value.join(', ');
                        } else if (typeof value === 'object' && value !== null) {
                          displayValue = JSON.stringify(value);
                        } else {
                          displayValue = String(value);
                        }

                        return (
                          <div key={key} className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
                            <div className="font-medium text-gray-900">{displayValue}</div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>

                {/* Tags if available */}
                {product.tags && product.tags.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3 uppercase tracking-wide">TAGS</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* View Less Details Button - Show at bottom when expanded */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowFullDetails(false)}
                    className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-1"
                  >
                    View less details
                    <span className="text-lg">▲</span>
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Similar Products Section - Blinkit Style */}
        {similarProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {similarProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Top Products in Category Section - Blinkit Style */}
        {topProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Top 10 products in {product.categories?.name || 'this category'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Cart Sidebar */}
        <CartSidebar open={cartSidebarOpen} onClose={() => setCartSidebarOpen(false)} />
      </div>
    </Layout>
  );
}

