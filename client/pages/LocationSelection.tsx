import { LocationPicker } from "@/components/location/LocationPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { LocationData } from "@/lib/location-utils";
import { CheckCircle, MapPin, Package, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * LocationSelection Page
 * Mandatory location selection before accessing the app
 * Users must select their location to see available services
 */
export default function LocationSelection() {
  const { currentLocation, setLocation, isServiceAvailable, availableServiceTypes } = useLocationContext();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(currentLocation);

  // If user already has a valid location with available services, redirect to home
  useEffect(() => {
    if (currentLocation && isServiceAvailable && availableServiceTypes.length > 0) {
      // User already has valid location, redirect after a short delay
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLocation, isServiceAvailable, availableServiceTypes, navigate]);

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setLocation(location);
  };

  const handleContinue = () => {
    if (!selectedLocation) {
      toast.error("Please select your location first");
      return;
    }

    if (!isServiceAvailable) {
      toast.error("Unfortunately, we don't service this area yet. Please try a different location.");
      return;
    }

    if (availableServiceTypes.length === 0) {
      toast.error("No services available in this area. Please select a different location.");
      return;
    }

    toast.success(`Welcome to ${selectedLocation.city}! Loading available services...`);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-black flex items-center justify-center font-bold text-2xl shadow-lg">
              KH
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            Welcome to KooliHub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Local Hands, Local Deliveries - Your Super App for Everything
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Location Selection Card */}
          <Card className="shadow-xl border-2">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Select Your Location</h2>
                  <p className="text-sm text-gray-600">To see available services in your area</p>
                </div>
              </div>

              <div className="space-y-4">
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={selectedLocation}
                  showInDialog={false}
                  className="border-0 shadow-none p-0"
                />

                {selectedLocation && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900">Location Selected</p>
                        <p className="text-sm text-green-700 mt-1">
                          {selectedLocation.city}, {selectedLocation.state} - {selectedLocation.pincode}
                        </p>
                        {isServiceAvailable ? (
                          <p className="text-xs text-green-600 mt-2">
                            ✓ {availableServiceTypes.length} service{availableServiceTypes.length !== 1 ? 's' : ''} available in your area
                          </p>
                        ) : (
                          <p className="text-xs text-orange-600 mt-2">
                            ⚠️ Checking service availability...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleContinue}
                  disabled={!selectedLocation || !isServiceAvailable}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {selectedLocation ? "Continue to KooliHub" : "Select Location to Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features/Benefits Card */}
          <div className="space-y-6">
            <Card className="border-2 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-xl font-bold text-gray-900">Why Choose KooliHub?</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    { icon: ShoppingBag, text: "Multiple services in one app - Groceries, Electronics, Fashion & more" },
                    { icon: Package, text: "Fast delivery from local vendors in your area" },
                    { icon: TrendingUp, text: "Best prices with exclusive local deals" },
                    { icon: CheckCircle, text: "Quality assured products and services" },
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <feature.icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Service Icons Preview */}
            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Available Services</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { emoji: "🛒", label: "Grocery" },
                    { emoji: "📱", label: "Electronics" },
                    { emoji: "🏠", label: "Home" },
                    { emoji: "🚗", label: "Rentals" },
                    { emoji: "🔧", label: "Handyman" },
                    { emoji: "👗", label: "Fashion" },
                    { emoji: "💄", label: "Beauty" },
                    { emoji: "🚌", label: "Trips" },
                  ].map((service, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="text-2xl mb-1">{service.emoji}</span>
                      <span className="text-xs font-medium text-gray-700">{service.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  * Available services may vary by location
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            By continuing, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

