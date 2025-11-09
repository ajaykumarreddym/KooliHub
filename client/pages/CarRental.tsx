import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Cog,
  Fuel,
  CheckCircle,
  Star,
  Shield,
  Truck,
  Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "@/contexts/LocationContext";

interface Vehicle {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  pricePerDay: number;
  image_url: string | null;
  rating: number;
  reviews_count: number;
  available: boolean;
  seats: number;
  transmission: string;
  fuelType: string;
  features: string[];
  mileage: string;
}

interface BookingForm {
  name: string;
  phone: string;
  email: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
}

export default function CarRental() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [pickupDate, setPickupDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [returnDate, setReturnDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    name: "",
    phone: "",
    email: "",
    pickupDate: pickupDate,
    returnDate: returnDate,
    pickupLocation: "",
    returnLocation: ""
  });

  const { currentLocation, hasLocation, serviceAreaId } = useLocation();

  useEffect(() => {
    fetchData();
  }, [serviceAreaId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // If location is selected, use location-based filtering
      if (serviceAreaId) {
        const { data: locationData, error: locationError } = await supabase.rpc(
          "get_products_by_service_area",
          {
            p_service_area_id: serviceAreaId,
            p_service_type: "car-rental",
            p_category_id: null,
            p_search_term: null,
            p_limit: 100,
            p_offset: 0,
          }
        );

        if (locationError) {
          console.error("Error fetching location-based vehicles:", locationError);
        } else if (locationData) {
          const transformedVehicles: Vehicle[] = (locationData || []).map((item: any) => {
            const customFields = item.custom_fields || {};
            return {
              id: item.offering_id,
              name: item.offering_name,
              description: "",
              brand: customFields.brand || item.offering_name.split(" ")[0],
              category: item.category_name || "Standard",
              pricePerDay: parseFloat(item.location_price || "0"),
              image_url: item.primary_image_url,
              rating: parseFloat(customFields.rating || "4.5"),
              reviews_count: parseInt(customFields.reviews_count || "0"),
              available: item.is_available,
              seats: parseInt(customFields.seats || "5"),
              transmission: customFields.transmission || "Manual",
              fuelType: customFields.fuel_type || "Petrol",
              features: customFields.features || ["AC", "Music System", "GPS"],
              mileage: customFields.mileage || "15 km/l"
            };
          });
          setVehicles(transformedVehicles);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(transformedVehicles.map((v) => v.category))
          );
          setCategories(uniqueCategories);
          setLoading(false);
          return;
        }
      }

      // Fallback: Fetch car rental offerings from database
      const { data, error } = await supabase
        .from("offerings")
        .select(`
          *,
          categories!inner (
            name,
            service_type_id
          )
        `)
        .eq("categories.service_type_id", "car-rental")
        .eq("is_active", true)
        .order("base_price", { ascending: true });

      if (error) {
        console.error("Error fetching vehicles:", error);
        return;
      }

      // Transform offerings to vehicles format with proper attributes
      const transformedVehicles: Vehicle[] = (data || []).map((offering) => {
        // Extract brand from name or custom fields
        const customFields = offering.custom_fields || {};
        const nameParts = offering.name.split(" ");
        const brand = customFields.brand || nameParts[0];
        
        return {
          id: offering.id,
          name: offering.name,
          description: offering.description || "",
          brand: brand,
          category: offering.categories?.name || "Standard",
          pricePerDay: parseFloat(offering.base_price || "0"),
          image_url: offering.primary_image_url,
          rating: parseFloat(customFields.rating || offering.rating || "4.5"),
          reviews_count: parseInt(customFields.reviews_count || offering.reviews_count || "0"),
          available: offering.is_active && (offering.stock_quantity || 0) > 0,
          seats: parseInt(customFields.seats || "5"),
          transmission: customFields.transmission || "Manual",
          fuelType: customFields.fuel_type || "Petrol",
          features: offering.tags || ["AC", "Music System", "GPS"],
          mileage: customFields.mileage || "15 km/l"
        };
      });

      setVehicles(transformedVehicles);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(transformedVehicles.map((v) => v.category))
      );
      setCategories(uniqueCategories);
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
        return b.rating - a.rating;
      default:
        return b.reviews_count - a.reviews_count;
    }
  });

  const handleBookVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setBookingForm({
      ...bookingForm,
      pickupDate: pickupDate,
      returnDate: returnDate
    });
    setIsBookingModalOpen(true);
  };

  const handleSubmitBooking = () => {
    // Simulate booking
    alert(`Booking confirmed for ${selectedVehicle?.name}!\nPickup: ${bookingForm.pickupDate}\nReturn: ${bookingForm.returnDate}\nTotal: ₹${calculateTotal()}`);
    setIsBookingModalOpen(false);
    setBookingForm({
      name: "",
      phone: "",
      email: "",
      pickupDate: pickupDate,
      returnDate: returnDate,
      pickupLocation: "",
      returnLocation: ""
    });
  };

  const calculateTotal = () => {
    if (!selectedVehicle) return 0;
    const days = Math.ceil(
      (new Date(bookingForm.returnDate).getTime() - new Date(bookingForm.pickupDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return selectedVehicle.pricePerDay * Math.max(days, 1);
  };

  const daysDifference = Math.ceil(
    (new Date(returnDate).getTime() - new Date(pickupDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

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
                🚗 Car Rental
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>
                    {hasLocation && currentLocation
                      ? `${currentLocation.city}, ${currentLocation.state}`
                      : "Select location"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Flexible rental periods</span>
                </div>
              </div>
            </div>

            <Badge className="bg-purple-500 text-white self-start lg:self-center">
              ✓ Insurance included • 24/7 support
            </Badge>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <Shield className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Full Insurance</h3>
            <p className="text-xs text-gray-600">Comprehensive coverage</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <Truck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Free Delivery</h3>
            <p className="text-xs text-gray-600">To your doorstep</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Instant Booking</h3>
            <p className="text-xs text-gray-600">Quick confirmation</p>
          </div>
        </div>

        {/* Quick booking form */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quick Search
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2">Pickup Date</Label>
                <Input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="border-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2">Return Date</Label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={pickupDate}
                  className="border-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2">Pickup Location</Label>
                <select className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  {hasLocation && currentLocation ? (
                    <>
                      <option>{currentLocation.city} - Main Location</option>
                      <option>{currentLocation.city} - Bus Stand</option>
                      <option>{currentLocation.city} - Railway Station</option>
                      <option>{currentLocation.city} - Airport</option>
                    </>
                  ) : (
                    <>
                      <option>Select your location first</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  🔍 Search Cars
                </Button>
              </div>
            </div>
            {daysDifference > 0 && (
              <p className="text-sm text-gray-600 mt-3">
                 📅 Rental period: {daysDifference} day{daysDifference > 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Vehicle Categories</h2>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`${
                selectedCategory === "all"
                  ? "ring-2 ring-purple-600 bg-purple-50"
                  : "bg-white"
              } border-2 border-gray-200 hover:border-purple-300 p-4 rounded-xl text-center transition-all`}
            >
              <div className="text-3xl mb-2">🚗</div>
              <p className="text-xs font-semibold">All Cars</p>
              <p className="text-xs text-gray-500">{vehicles.length}</p>
            </button>
            {categories.map((category) => {
              const count = vehicles.filter((v) => v.category === category).length;
              const icon = category.includes("Hatchback") ? "🚙" : 
                          category.includes("Sedan") ? "🚘" :
                          category.includes("SUV") ? "🚙" : "🏎️";
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`${
                    selectedCategory === category
                      ? "ring-2 ring-purple-600 bg-purple-50"
                      : "bg-white"
                  } border-2 border-gray-200 hover:border-purple-300 p-4 rounded-xl text-center transition-all`}
                >
                  <div className="text-3xl mb-2">{icon}</div>
                  <p className="text-xs font-semibold leading-tight">{category}</p>
                  <p className="text-xs text-gray-500">{count} cars</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search vehicles, brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-700 font-medium">
            {sortedVehicles.length} vehicle{sortedVehicles.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Vehicle grid */}
        {loading ? (
          <div className="grid gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedVehicles.length > 0 ? (
          <div className="grid gap-6">
            {sortedVehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className="hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-purple-200"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Vehicle image */}
                    <div className="lg:w-1/3">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-56 lg:h-full flex items-center justify-center overflow-hidden">
                        {vehicle.image_url ? (
                          <img
                            src={vehicle.image_url}
                            alt={vehicle.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-7xl">🚗</span>
                        )}
                      </div>
                    </div>

                    {/* Vehicle details */}
                    <div className="lg:w-2/3">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge className="mb-2 bg-purple-100 text-purple-700 border-purple-200">
                            {vehicle.category}
                          </Badge>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {vehicle.name}
                          </h3>
                          <p className="text-gray-600">{vehicle.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-purple-600">
                            ₹{vehicle.pricePerDay}
                          </div>
                          <div className="text-sm text-gray-500">per day</div>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <Users className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                          <div className="text-sm font-medium">{vehicle.seats} seats</div>
                        </div>
                        <div className="text-center">
                          <Cog className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                          <div className="text-sm font-medium">{vehicle.transmission}</div>
                        </div>
                        <div className="text-center">
                          <Fuel className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                          <div className="text-sm font-medium">{vehicle.fuelType}</div>
                        </div>
                        <div className="text-center">
                          <MapPin className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                          <div className="text-sm font-medium">{vehicle.mileage}</div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            ✓ Insurance
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ✓ AC
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ✓ Music System
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ✓ GPS
                          </Badge>
                        </div>
                      </div>

                      {/* Rating and booking */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{vehicle.rating.toFixed(1)}</span>
                            <span className="text-gray-500 text-sm">
                              ({vehicle.reviews_count})
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleBookVehicle(vehicle)}
                          disabled={!vehicle.available}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                          size="lg"
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
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">🚗</span>
              Book {selectedVehicle?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Vehicle Summary */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{selectedVehicle?.name}</h3>
                  <p className="text-sm text-gray-600">{selectedVehicle?.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{selectedVehicle?.pricePerDay}/day
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span>✓ {selectedVehicle?.seats} Seats</span>
                <span>✓ {selectedVehicle?.transmission}</span>
                <span>✓ {selectedVehicle?.fuelType}</span>
              </div>
            </div>

            {/* Booking Form */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={bookingForm.name}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, name: e.target.value })
                    }
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={bookingForm.phone}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, phone: e.target.value })
                    }
                    placeholder="+91 xxxxx xxxxx"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupDate">Pickup Date *</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    value={bookingForm.pickupDate}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, pickupDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="returnDate">Return Date *</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={bookingForm.returnDate}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, returnDate: e.target.value })
                    }
                    min={bookingForm.pickupDate}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupLocation">Pickup Location *</Label>
                  <select
                    id="pickupLocation"
                    value={bookingForm.pickupLocation}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, pickupLocation: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Select location</option>
                    {hasLocation && currentLocation ? (
                      <>
                        <option value={`${currentLocation.city} - Main Location`}>{currentLocation.city} - Main Location</option>
                        <option value={`${currentLocation.city} - Bus Stand`}>{currentLocation.city} - Bus Stand</option>
                        <option value={`${currentLocation.city} - Railway Station`}>{currentLocation.city} - Railway Station</option>
                        <option value={`${currentLocation.city} - Airport`}>{currentLocation.city} - Airport</option>
                      </>
                    ) : (
                      <option value="">Please select your location first</option>
                    )}
                  </select>
                </div>
                <div>
                  <Label htmlFor="returnLocation">Return Location *</Label>
                  <select
                    id="returnLocation"
                    value={bookingForm.returnLocation}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, returnLocation: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Select location</option>
                    {hasLocation && currentLocation ? (
                      <>
                        <option value={`${currentLocation.city} - Main Location`}>{currentLocation.city} - Main Location</option>
                        <option value={`${currentLocation.city} - Bus Stand`}>{currentLocation.city} - Bus Stand</option>
                        <option value={`${currentLocation.city} - Railway Station`}>{currentLocation.city} - Railway Station</option>
                        <option value={`${currentLocation.city} - Airport`}>{currentLocation.city} - Airport</option>
                      </>
                    ) : (
                      <option value="">Please select your location first</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Booking Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Daily Rate:</span>
                  <span className="font-medium">₹{selectedVehicle?.pricePerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rental Days:</span>
                  <span className="font-medium">
                    {Math.max(
                      Math.ceil(
                        (new Date(bookingForm.returnDate).getTime() -
                          new Date(bookingForm.pickupDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ),
                      1
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold text-purple-600 text-lg">
                    ₹{calculateTotal()}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              ✓ Full insurance coverage included<br/>
              ✓ Free roadside assistance 24/7<br/>
              ✓ Flexible cancellation policy
            </div>

            <Button
              onClick={handleSubmitBooking}
              disabled={
                !bookingForm.name ||
                !bookingForm.phone ||
                !bookingForm.email ||
                !bookingForm.pickupLocation ||
                !bookingForm.returnLocation
              }
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              Confirm Booking - ₹{calculateTotal()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
