import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart } from "lucide-react";
import { useRealtimeProducts } from "@/hooks/use-realtime-products";

const getServiceIcon = (serviceType: string) => {
  const icons: Record<string, string> = {
    grocery: "🥬",
    trips: "🚌",
    "car-rental": "🚗",
    handyman: "🔨",
    electronics: "📱",
    "home-kitchen": "🏠",
    beauty: "💄",
    sports: "⚽",
    default: "🏪"
  };
  return icons[serviceType] || icons.default;
};

export function RecommendedSection() {
  const { products: recommendations, loading } = useRealtimeProducts(undefined, 6);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = (originalPrice: number, discountPrice: number) => {
    const discount = ((originalPrice - discountPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  const getRandomBadges = (index: number) => {
    const badges = ['Best Seller', 'New', 'Popular', 'Top Rated'];
    const shouldShow = Math.random() > 0.5;
    return shouldShow ? badges[index % badges.length] : null;
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recommended for you</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="bg-gray-200 h-40"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="py-8">
      <div className="container">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recommended for you</h2>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recommendations.length > 0 ? (
            recommendations.map((item, index) => {
              const badge = getRandomBadges(index);
              return (
                <Card key={item.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    {/* Image section */}
                    <div className="relative bg-gray-50 h-40 flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl opacity-60">
                          {getServiceIcon(item.categories?.service_type || 'default')}
                        </span>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {badge && (
                          <Badge className={`${
                            badge === 'Best Seller' ? 'bg-primary text-black' :
                            badge === 'New' ? 'bg-green-500 text-white' :
                            badge === 'Popular' ? 'bg-blue-500 text-white' :
                            'bg-purple-500 text-white'
                          } text-xs`}>
                            {badge}
                          </Badge>
                        )}
                      </div>

                      {/* Wishlist button */}
                      <button className="absolute top-2 right-2 p-1 rounded-full bg-white shadow-sm hover:bg-gray-50">
                        <Heart className="h-4 w-4 text-gray-400" />
                      </button>

                      {/* Discount badge */}
                      {item.discount_price && (
                        <Badge className="absolute bottom-2 left-2 bg-red-500 text-white text-xs">
                          {calculateDiscount(item.price, item.discount_price)}% OFF
                        </Badge>
                      )}
                    </div>

                    {/* Content section */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
                        {item.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">
                          {item.rating ? item.rating.toFixed(1) : '4.5'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({item.reviews_count || 0})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(item.discount_price || item.price)}
                        </span>
                        {item.discount_price && (
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>

                      {/* Add to cart button */}
                      <Button size="sm" className="w-full text-xs bg-primary text-black hover:bg-primary/90">
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No recommendations available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
