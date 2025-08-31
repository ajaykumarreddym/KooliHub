import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Filter,
  Star,
  Users,
  Fuel,
  Cog,
  MapPin,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  category: string;
  pricePerDay: number;
  pricePerHour: number;
  image_url: string | null;
  rating: number | null;
  reviews_count: number;
  available: boolean;
  seats: number;
  transmission: string;
  fuelType: string;
  features: string[];
  location: string;
  mileage: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function CarRental() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [pickupDate, setPickupDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [returnDate, setReturnDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch car rental products and categories
      const [vehiclesResult, categoriesResult] = await Promise.all([
        supabase
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
          .eq("categories.service_type", "car-rental")
          .eq("is_active", true)
          .order("price", { ascending: true }),
        supabase
          .from("categories")
          .select("*")
          .eq("service_type", "car-rental")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (vehiclesResult.error) {
        console.error("Error fetching vehicles:", vehiclesResult.error);
      } else {
        // Transform products to vehicles format
        const transformedVehicles = (vehiclesResult.data || []).map(
          (product) => ({
            id: product.id,
            name: product.name,
            brand: product.brand || "Generic",
            category: product.categories?.name || "Standard",
            pricePerDay: Math.floor(product.price / 8), // Estimate per day price
            pricePerHour: Math.floor(product.price / 8 / 24), // Estimate per hour price
            image_url: product.image_url,
            rating: product.rating,
            reviews_count: product.reviews_count,
            available: product.stock_quantity > 0,
            seats: 5, // Default seats
            transmission: "Manual", // Default transmission
            fuelType: "Petrol", // Default fuel type
            features: product.tags || ["AC", "Music System", "GPS"],
            location: "Rayachoty",
            mileage: "15 km/l", // Default mileage
          }),
        );
        setVehicles(transformedVehicles);
      }

      if (categoriesResult.error) {
        console.error("Error fetching categories:", categoriesResult.error);
      } else {
        // Transform categories
        const transformedCategories = (categoriesResult.data || []).map(
          (cat) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || "",
            icon: "🚗", // Default icon
          }),
        );
        setCategories(transformedCategories);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || vehicle.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.pricePerDay - b.pricePerDay;
      case "price-high":
        return b.pricePerDay - a.pricePerDay;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return b.reviews_count - a.reviews_count;
    }
  });

  const handleBookVehicle = (vehicle: Vehicle) => {
    // Simulate booking
    alert(`Booking ${vehicle.name} for ${pickupDate} to ${returnDate}`);
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Car Rental</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Car Rental
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Rayachoty, Annamayya District</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Flexible pickup times</span>
                </div>
              </div>
            </div>

            <Badge className="bg-purple-500 text-white self-start lg:self-center">
              Insurance included • 24/7 support
            </Badge>
          </div>
        </div>

        {/* Booking form */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Quick Booking</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pickup Location
              </label>
              <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Rayachoty Bus Stand</option>
                <option>Madanapalle Junction</option>
                <option>Punganur</option>
                <option>Railway Station</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Pickup Date
              </label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Return Date
              </label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-primary text-black hover:bg-primary/90">
                Search Cars
              </Button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Vehicle Categories</h2>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`${selectedCategory === "all" ? "ring-2 ring-primary" : ""} 
                         bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center transition-all`}
            >
              <div className="text-2xl mb-2">🚗</div>
              <p className="text-xs font-medium">All Cars</p>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${selectedCategory === category.id ? "ring-2 ring-primary" : ""} 
                           bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center transition-all`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <p className="text-xs font-medium">{category.name}</p>
                <p className="text-xs text-gray-500">{category.description}</p>
              </button>
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
                placeholder="Search vehicles, brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {sortedVehicles.length} vehicle
            {sortedVehicles.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Vehicle grid */}
        <div className="grid gap-6">
          {sortedVehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Vehicle image */}
                  <div className="lg:w-1/3">
                    <div className="bg-gray-50 rounded-lg h-48 flex items-center justify-center">
                      {vehicle.image_url ? (
                        <img
                          src={vehicle.image_url}
                          alt={vehicle.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-6xl">🚗</span>
                      )}
                    </div>
                  </div>

                  {/* Vehicle details */}
                  <div className="lg:w-2/3">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge className="mb-2 capitalize">
                          {vehicle.category}
                        </Badge>
                        <h3 className="text-xl font-bold text-gray-900">
                          {vehicle.name}
                        </h3>
                        <p className="text-gray-600">{vehicle.brand}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ₹{vehicle.pricePerDay}/day
                        </div>
                        <div className="text-sm text-gray-500">
                          ₹{vehicle.pricePerHour}/hour
                        </div>
                      </div>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <Users className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <div className="text-sm">{vehicle.seats} seats</div>
                      </div>
                      <div className="text-center">
                        <Cog className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <div className="text-sm capitalize">
                          {vehicle.transmission}
                        </div>
                      </div>
                      <div className="text-center">
                        <Fuel className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <div className="text-sm capitalize">
                          {vehicle.fuelType}
                        </div>
                      </div>
                      <div className="text-center">
                        <MapPin className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <div className="text-sm">{vehicle.location}</div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.slice(0, 4).map((feature, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                        {vehicle.features.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{vehicle.features.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Rating and booking */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">
                            {vehicle.rating ? vehicle.rating.toFixed(1) : "4.5"}
                          </span>
                          <span className="text-gray-500 text-sm">
                            ({vehicle.reviews_count || 0})
                          </span>
                        </div>
                        <span className="text-gray-500">•</span>
                        <span className="text-sm text-gray-600">
                          {vehicle.mileage}
                        </span>
                      </div>

                      <Button
                        onClick={() => handleBookVehicle(vehicle)}
                        disabled={!vehicle.available}
                        className="bg-primary text-black hover:bg-primary/90"
                      >
                        {vehicle.available ? "Book Now" : "Not Available"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Multiple Locations</h3>
            <p className="text-gray-600 text-sm">
              Convenient pickup across Annamayya District
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Flexible Booking</h3>
            <p className="text-gray-600 text-sm">
              Hourly and daily rental options
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Cog className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Full Insurance</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive coverage included
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
