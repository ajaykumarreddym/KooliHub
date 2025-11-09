import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useWishlistContext } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";
import { Clock, Heart, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  deliveryTime?: string; // e.g., "15 mins", "30 mins"
}

interface ProductCardProps {
  product: Product;
  onCartOpen?: () => void;
}

export function ProductCard({ product, onCartOpen }: ProductCardProps) {
  const navigate = useNavigate();
  const { state, dispatch } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistContext();
  const [quantity, setQuantity] = useState(1);

  const cartItem = state.items.find((item) => item.product.id === product.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;
  const isWishlisted = isInWishlist(product.id);
  const deliveryTime = product.deliveryTime || "15 mins";

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: { 
        product: {
          ...product,
          description: product.description || '',
        }, 
        quantity 
      },
    });
    // Trigger cart sidebar open if callback provided
    if (onCartOpen) {
      onCartOpen();
    }
  };

  const handleUpdateQuantity = (newQuantity: number) => {
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

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      title: product.name,
      price: product.price,
      image: product.image,
      category: "Grocery",
      description: product.description,
      rating: product.rating,
    });
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-200 cursor-pointer border border-gray-100 rounded-lg overflow-hidden" onClick={handleCardClick}>
      <CardContent className="p-0">
        {/* Image section */}
        <div className="relative bg-white p-3 flex items-center justify-center h-40">
          {/* Delivery Time Badge - Blinkit Style */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200">
            <Clock className="h-3 w-3 text-gray-600" />
            <span className="text-[10px] font-semibold text-gray-700 uppercase">
              {deliveryTime}
            </span>
          </div>

          {product.image && (product.image.startsWith('http') || product.image.startsWith('/')) ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-5xl opacity-60">🛍️</span>';
                }
              }}
            />
          ) : (
            <span className="text-5xl opacity-60">{product.image || '🛍️'}</span>
          )}

          {/* Discount Badge */}
          {product.discount && product.discount > 0 && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5">
                {product.discount}% OFF
              </Badge>
            </div>
          )}
        </div>

        {/* Content section - Blinkit compact style */}
        <div className="p-3 border-t border-gray-100">
          {/* Product Name */}
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-snug mb-1 min-h-[36px]">
            {product.name}
          </h3>

          {/* Unit/Weight */}
          <p className="text-xs text-gray-500 mb-2">{product.unit}</p>

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-gray-900">
                  ₹{product.price.toFixed(0)}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{product.originalPrice.toFixed(0)}
                  </span>
                )}
              </div>
            </div>

            {/* Add to cart button - Blinkit style */}
            <div onClick={(e) => e.stopPropagation()}>
              {!isInCart ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  className="bg-white hover:bg-green-50 text-green-600 border-2 border-green-600 font-semibold h-8 px-4 text-xs rounded-lg transition-all"
                  size="sm"
                  disabled={!product.inStock}
                >
                  ADD
                </Button>
              ) : (
                <div className="flex items-center border-2 border-green-600 rounded-lg bg-green-600">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateQuantity(cartQuantity - 1);
                    }}
                    className="p-1.5 hover:bg-green-700 transition-colors text-white"
                    aria-label="Decrease cart quantity"
                    title="Decrease cart quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 py-1 text-sm font-bold text-white min-w-[32px] text-center">
                    {cartQuantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateQuantity(cartQuantity + 1);
                    }}
                    className="p-1.5 hover:bg-green-700 transition-colors text-white"
                    aria-label="Increase cart quantity"
                    title="Increase cart quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
