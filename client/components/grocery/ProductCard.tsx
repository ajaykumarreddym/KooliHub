import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useWishlistContext } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";
import { Heart, Minus, Plus, Star } from "lucide-react";
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
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { state, dispatch } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistContext();
  const [quantity, setQuantity] = useState(1);

  const cartItem = state.items.find((item) => item.product.id === product.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;
  const isWishlisted = isInWishlist(product.id);

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
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleCardClick}>
      <CardContent className="p-0">
        {/* Image section */}
        <div className="relative bg-gray-50 h-48 flex items-center justify-center">
          {product.image && (product.image.startsWith('http') || product.image.startsWith('/')) ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-6xl opacity-80">🛍️</span>';
                }
              }}
            />
          ) : (
            <span className="text-6xl opacity-80">{product.image || '🛍️'}</span>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.discount && (
              <Badge className="bg-red-500 text-white text-xs font-bold">
                {product.discount}% OFF
              </Badge>
            )}
            {product.isOrganic && (
              <Badge className="bg-green-500 text-white text-xs">Organic</Badge>
            )}
            {product.isFresh && (
              <Badge className="bg-blue-500 text-white text-xs">Fresh</Badge>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWishlistToggle(e);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isWishlisted
                  ? "text-red-500 fill-red-500"
                  : "text-gray-400 hover:text-red-500",
              )}
            />
          </button>
        </div>

        {/* Content section */}
        <div className="p-4">
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs mb-1">
              {product.brand}
            </Badge>
            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{product.unit}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{product.rating}</span>
            <span className="text-xs text-gray-500">
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price.toFixed(0)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>

          {/* Add to cart controls */}
          {!isInCart ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(Math.max(1, quantity - 1));
                  }}
                  className="p-2 hover:bg-gray-50 transition-colors"
                  aria-label="Decrease quantity"
                  title="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-3 py-2 text-sm font-medium">
                  {quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(quantity + 1);
                  }}
                  className="p-2 hover:bg-gray-50 transition-colors"
                  aria-label="Increase quantity"
                  title="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                className="flex-1 bg-primary text-black hover:bg-primary/90"
                size="sm"
              >
                Add to Cart
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateQuantity(cartQuantity - 1);
                  }}
                  className="p-2 hover:bg-gray-50 transition-colors"
                  aria-label="Decrease cart quantity"
                  title="Decrease cart quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-3 py-2 text-sm font-medium">
                  {cartQuantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateQuantity(cartQuantity + 1);
                  }}
                  className="p-2 hover:bg-gray-50 transition-colors"
                  aria-label="Increase cart quantity"
                  title="Increase cart quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <Badge className="bg-green-500 text-white">In Cart</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
