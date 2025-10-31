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
    CheckCircle,
    Heart,
    MapPin,
    Minus,
    Plus,
    Share2,
    ShoppingCart,
    Star,
    Truck
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLocation, serviceAreaId } = useLocation();
  const { state, dispatch } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistContext();
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id, serviceAreaId]);

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
            setProduct({
              id: locationProduct.offering_id || id,
              name: locationProduct.offering_name,
              description: locationProduct.description || null,
              price: locationProduct.base_price,
              discount_price: locationProduct.location_price !== locationProduct.base_price ? locationProduct.location_price : null,
              image_url: locationProduct.primary_image_url,
              stock_quantity: locationProduct.location_stock || 0,
              is_active: locationProduct.is_available,
              rating: 4.5,
              reviews_count: 0,
              sku: null,
              brand: locationProduct.vendor_name || null,
              tags: [],
              categories: {
                id: '',
                name: locationProduct.category_name || '',
                service_type: locationProduct.service_type || '',
              },
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
      <div className="container py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to={`/${product.categories?.service_type || 'grocery'}`} className="hover:text-primary">
            {product.categories?.name || 'Products'}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-gray-50 h-96 flex items-center justify-center">
                  {images[selectedImage] && (images[selectedImage].startsWith('http') || images[selectedImage].startsWith('/')) ? (
                    <img
                      src={images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-9xl">🛍️</span>
                  )}
                  
                  {/* Wishlist & Share buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={handleWishlistToggle}
                      className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isWishlisted ? "text-red-500 fill-red-500" : "text-gray-600"
                        }`}
                      />
                    </button>
                    <button 
                      className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
                      aria-label="Share product"
                      title="Share product"
                    >
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Discount Badge */}
                  {discount > 0 && (
                    <Badge className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1">
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
                      selectedImage === idx ? "border-primary" : "border-gray-200"
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
            {/* Title & Brand */}
            <div>
              {product.brand && (
                <Badge variant="secondary" className="mb-2">{product.brand}</Badge>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {/* Rating & Reviews */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{product.rating || 4.5}</span>
                  <span className="text-gray-600">({product.reviews_count} reviews)</span>
                </div>
                {product.sku && (
                  <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-gray-900">
                  ₹{finalPrice.toFixed(0)}
                </span>
                {originalPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{originalPrice.toFixed(0)}
                    </span>
                    <Badge className="bg-green-500 text-white">Save ₹{(originalPrice - finalPrice).toFixed(0)}</Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600">Inclusive of all taxes</p>
            </div>

            {/* Delivery Info */}
            {currentLocation && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Deliver to {currentLocation.city}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {currentLocation.pincode && `PIN: ${currentLocation.pincode}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                    <Truck className="h-4 w-4" />
                    <span className="font-medium">Free delivery on orders above ₹500</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock_quantity > 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">In Stock ({product.stock_quantity} available)</span>
                </>
              ) : (
                <>
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector & Add to Cart */}
            {product.stock_quantity > 0 && (
              <div className="space-y-4">
                {!isInCart ? (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">Quantity:</span>
                      <div className="flex items-center border-2 rounded-lg">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-3 hover:bg-gray-50 transition-colors"
                          aria-label="Decrease quantity"
                          title="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-6 py-3 text-lg font-semibold min-w-[60px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                          className="p-3 hover:bg-gray-50 transition-colors"
                          aria-label="Increase quantity"
                          title="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleAddToCart}
                        size="lg"
                        className="flex-1 bg-primary text-black hover:bg-primary/90"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          handleAddToCart();
                          navigate('/checkout');
                        }}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <span className="font-medium text-green-700">Item in cart</span>
                      <div className="flex items-center border-2 border-green-500 rounded-lg bg-white">
                        <button
                          onClick={() => handleUpdateQuantity(cartQuantity - 1)}
                          className="p-2 hover:bg-gray-50 transition-colors"
                          aria-label="Decrease cart quantity"
                          title="Decrease cart quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2 text-lg font-semibold min-w-[60px] text-center">
                          {cartQuantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(cartQuantity + 1)}
                          className="p-2 hover:bg-gray-50 transition-colors"
                          disabled={cartQuantity >= product.stock_quantity}
                          aria-label="Increase cart quantity"
                          title="Increase cart quantity"
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
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({product.reviews_count})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="py-4">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {product.description || "No description available for this product."}
                  </p>
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Tags:</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="py-4">
                <div className="space-y-3">
                  {product.brand && (
                    <div className="flex border-b pb-2">
                      <span className="w-1/3 font-medium text-gray-700">Brand</span>
                      <span className="w-2/3 text-gray-600">{product.brand}</span>
                    </div>
                  )}
                  {product.sku && (
                    <div className="flex border-b pb-2">
                      <span className="w-1/3 font-medium text-gray-700">SKU</span>
                      <span className="w-2/3 text-gray-600">{product.sku}</span>
                    </div>
                  )}
                  <div className="flex border-b pb-2">
                    <span className="w-1/3 font-medium text-gray-700">Category</span>
                    <span className="w-2/3 text-gray-600">{product.categories?.name || 'N/A'}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="w-1/3 font-medium text-gray-700">Availability</span>
                    <span className="w-2/3 text-gray-600">
                      {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="py-4">
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No reviews yet. Be the first to review this product!</p>
                  <Button variant="outline" className="mt-4">Write a Review</Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

