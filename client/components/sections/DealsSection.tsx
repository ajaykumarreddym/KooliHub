import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star } from "lucide-react";
import { useRealtimeProducts } from "@/hooks/use-realtime-products";

const getServiceIcon = (serviceType: string) => {
  const icons: Record<string, string> = {
    grocery: "🛒",
    trips: "🚌",
    "car-rental": "🚗",
    handyman: "🔧",
    electronics: "📱",
    "home-kitchen": "🏠",
    beauty: "💄",
    sports: "⚽",
    default: "🏪"
  };
  return icons[serviceType] || icons.default;
};

export function DealsSection() {
  const { products: allProducts, loading } = useRealtimeProducts(undefined, 20);

  // Filter for products with discounts
  const deals = allProducts.filter(product => product.discount_price !== null).slice(0, 4);

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

  if (loading) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mega deals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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
        </div>
      </section>
    );
  }
  return (
    <section className="py-8 bg-gray-50">
      <div className="container">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Mega deals</h2>
            <Badge className="bg-red-500 text-white">
              <Clock className="h-3 w-3 mr-1" />
              Limited Time
            </Badge>
          </div>
          <Button variant="outline" size="sm">
            ALL DEALS
          </Button>
        </div>

        {/* Deals grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.length > 0 ? (
            deals.map((deal) => (
              <Card key={deal.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-0">
                  {/* Image section */}
                  <div className="relative bg-gray-100 h-48 flex items-center justify-center">
                    {deal.image_url ? (
                      <img
                        src={deal.image_url}
                        alt={deal.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl opacity-50">
                        {getServiceIcon(deal.categories?.service_type || 'default')}
                      </span>
                    )}
                    {deal.discount_price && (
                      <Badge className="absolute top-3 left-3 bg-red-500 text-white font-bold">
                        {calculateDiscount(deal.price, deal.discount_price)}% OFF
                      </Badge>
                    )}
                  </div>

                  {/* Content section */}
                  <div className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">
                      {deal.categories?.name || 'Product'}
                    </Badge>

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {deal.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {deal.rating ? deal.rating.toFixed(1) : '4.5'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({deal.reviews_count || 0})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(deal.discount_price || deal.price)}
                      </span>
                      {deal.discount_price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(deal.price)}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="flex justify-end">
                      <Button size="sm" className="bg-primary text-black hover:bg-primary/90">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No deals available at the moment</p>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {deals.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              View All Deals
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
