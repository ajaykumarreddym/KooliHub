import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useRealtimeCategories } from "@/hooks/use-realtime-products";

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

const getServiceColor = (serviceType: string) => {
  const colors: Record<string, string> = {
    grocery: "bg-green-50 hover:bg-green-100",
    trips: "bg-blue-50 hover:bg-blue-100",
    "car-rental": "bg-purple-50 hover:bg-purple-100",
    handyman: "bg-orange-50 hover:bg-orange-100",
    electronics: "bg-gray-50 hover:bg-gray-100",
    "home-kitchen": "bg-yellow-50 hover:bg-yellow-100",
    beauty: "bg-pink-50 hover:bg-pink-100",
    sports: "bg-red-50 hover:bg-red-100",
    default: "bg-gray-50 hover:bg-gray-100"
  };
  return colors[serviceType] || colors.default;
};

export function CategoryGrid() {
  const { categories, loading } = useRealtimeCategories();

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
  return (
    <section className="py-6">
      <div className="container">
        {/* Category icons grid */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {categories.map((category) => (
            <Link key={category.id} to={`/${category.service_type}`}>
              <Card className={`${getServiceColor(category.service_type)} border-0 transition-all duration-200 hover:scale-105 cursor-pointer`}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-8 h-8 mx-auto object-contain"
                      />
                    ) : (
                      getServiceIcon(category.service_type)
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-700 leading-tight">
                    {category.name}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
