import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "@/contexts/LocationContext";
import { useLocationCategories } from "@/hooks/use-location-services";
import { AlertCircle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const getServiceIcon = (serviceType: string, iconFromDb?: string | null) => {
  // Prefer database icon if available
  if (iconFromDb) return iconFromDb;
  
  const icons: Record<string, string> = {
    grocery: "🛒",
    trips: "🚌",
    "car-rental": "🚗",
    handyman: "🔧",
    electronics: "📱",
    "home-kitchen": "🏠",
    beauty: "💄",
    sports: "⚽",
    fashion: "👗",
    sarees: "🥻",
    default: "🏪"
  };
  return icons[serviceType] || icons.default;
};

const getServiceColor = (serviceType: string, colorFromDb?: string | null) => {
  // Prefer database color if available
  if (colorFromDb) return colorFromDb;
  
  const colors: Record<string, string> = {
    grocery: "bg-green-50 hover:bg-green-100",
    trips: "bg-blue-50 hover:bg-blue-100",
    "car-rental": "bg-purple-50 hover:bg-purple-100",
    handyman: "bg-orange-50 hover:bg-orange-100",
    electronics: "bg-gray-50 hover:bg-gray-100",
    "home-kitchen": "bg-yellow-50 hover:bg-yellow-100",
    beauty: "bg-pink-50 hover:bg-pink-100",
    sports: "bg-red-50 hover:bg-red-100",
    fashion: "bg-pink-50 hover:bg-pink-100",
    sarees: "bg-purple-50 hover:bg-purple-100",
    default: "bg-gray-50 hover:bg-gray-100"
  };
  return colors[serviceType] || colors.default;
};

export function CategoryGrid() {
  const { currentLocation, serviceAreaId } = useLocation();
  const { categories, loading } = useLocationCategories(serviceAreaId);

  if (loading) {
    return (
      <section className="py-6">
        <div className="container">
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-gray-100 animate-pulse">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show message if no categories available in this location
  if (!loading && categories.length === 0) {
    return (
      <section className="py-6">
        <div className="container">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Services Available
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {currentLocation 
                  ? `We currently don't have any services available in ${currentLocation.city}.`
                  : "Please select your location to see available services."}
              </p>
              {currentLocation && (
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Current location: {currentLocation.city}, {currentLocation.state}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="container">
        {/* Location indicator */}
        {currentLocation && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Showing services in {currentLocation.city}</span>
          </div>
        )}

        {/* Category icons grid */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {categories.map((category) => (
            <Link key={category.category_id} to={`/${category.service_type_id}`}>
              <Card className={`${getServiceColor(category.service_type_id, category.color)} border-0 transition-all duration-200 hover:scale-105 cursor-pointer relative`}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.category_name}
                        className="w-8 h-8 mx-auto object-contain"
                      />
                    ) : (
                      getServiceIcon(category.service_type_id, category.icon)
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-700 leading-tight">
                    {category.category_name}
                  </p>
                  {/* Product count badge */}
                  {category.product_count > 0 && (
                    <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {category.product_count}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
