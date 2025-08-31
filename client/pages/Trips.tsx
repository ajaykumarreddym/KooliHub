import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TripCard } from "@/components/trips/TripCard";
import { TripBookingModal } from "@/components/trips/TripBookingModal";
import { Search, Filter, MapPin, Clock, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TripRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  price: number;
  duration: string;
  distance: string;
  departure_times: string[];
  vehicle_type: string;
  amenities: string[];
  rating: number | null;
  reviews_count: number;
  is_active: boolean;
}

export default function Trips() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<TripRoute | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [tripRoutes, setTripRoutes] = useState<TripRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripRoutes();
  }, []);

  const fetchTripRoutes = async () => {
    try {
      // For now, we'll fetch products from the trips category
      // In the future, you might want to create a dedicated "routes" table
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          categories!inner (
            name,
            service_type
          )
        `,
        )
        .eq("categories.service_type", "trips")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) {
        console.error("Error fetching trip routes:", error);
        return;
      }

      // Transform products to trip routes format
      const routes = (data || []).map((product) => ({
        id: product.id,
        name: product.name,
        from: "Rayachoty", // Default from location
        to: product.description?.split("to")[1]?.trim() || "Destination",
        price: product.discount_price || product.price,
        duration: "2-3 hours", // Default duration
        distance: "120 km", // Default distance
        departure_times: ["06:00", "09:00", "15:00", "18:00"], // Default times
        vehicle_type: "AC Bus",
        amenities: product.tags || ["WiFi", "AC", "Comfortable Seats"],
        rating: product.rating,
        reviews_count: product.reviews_count,
        is_active: product.is_active,
      }));

      setTripRoutes(routes);
    } catch (error) {
      console.error("Error fetching trip routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = tripRoutes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.to.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRouteSelect = (route: TripRoute) => {
    setSelectedRoute(route);
    setIsBookingModalOpen(true);
  };

  const popularDestinations = [
    "Tirupati",
    "Kadapa",
    "Madanapalle",
    "Bangalore",
    "Chittoor",
  ];

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Trip Booking</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Trip Booking
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Rayachoty, Annamayya District</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Reliable timing</span>
                </div>
              </div>
            </div>

            <Badge className="bg-blue-500 text-white self-start lg:self-center">
              Comfortable AC buses with WiFi
            </Badge>
          </div>
        </div>

        {/* Quick booking form */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Quick Trip Search</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">From</label>
              <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Rayachoty</option>
                <option>Madanapalle</option>
                <option>Punganur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Tirupati</option>
                <option>Kadapa</option>
                <option>Bangalore</option>
                <option>Chittoor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-primary text-black hover:bg-primary/90">
                Search Trips
              </Button>
            </div>
          </div>
        </div>

        {/* Popular destinations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Popular Destinations</h2>
          <div className="flex flex-wrap gap-3">
            {popularDestinations.map((destination) => (
              <Button
                key={destination}
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm(destination)}
                className="hover:bg-primary hover:text-black"
              >
                {destination}
              </Button>
            ))}
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search routes, destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {filteredRoutes.length} route
            {filteredRoutes.length !== 1 ? "s" : ""} available
          </p>

          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </Button>
          )}
        </div>

        {/* Route cards */}
        {loading ? (
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg border animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredRoutes.map((route) => (
              <TripCard
                key={route.id}
                route={route}
                onSelect={handleRouteSelect}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredRoutes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No trips found
            </h3>
            <p className="text-gray-600 mb-4">
              Try searching for a different destination or adjust your filters
            </p>
            <Button onClick={() => setSearchTerm("")}>Show all routes</Button>
          </div>
        )}

        {/* Info section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Multiple Pickup Points</h3>
            <p className="text-gray-600 text-sm">
              Convenient pickup locations across Annamayya District
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">On-Time Guarantee</h3>
            <p className="text-gray-600 text-sm">
              We guarantee on-time departures and arrivals
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Flexible Booking</h3>
            <p className="text-gray-600 text-sm">
              Easy cancellation and rescheduling options
            </p>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <TripBookingModal
        route={selectedRoute}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedRoute(null);
        }}
      />
    </Layout>
  );
}
