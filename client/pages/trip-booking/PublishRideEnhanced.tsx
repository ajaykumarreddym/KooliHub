import { Layout } from "@/components/layout/Layout";
import { LocationPickerMap } from "@/components/trip-booking/molecules/LocationPickerMap";
import { getCleanLocationName, LocationResult, LocationSearchInput } from "@/components/trip-booking/molecules/LocationSearchInput";
import { RouteMap } from "@/components/trip-booking/molecules/RouteMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { calculatePriceRecommendation, calculateRoutes, findStopoversAlongRoute, RouteOption } from "@/lib/osrm";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowDown, ArrowLeft, ArrowUp, Bike, Calendar as CalendarIcon, Car, Check, CheckCircle2, ChevronRight, Clock, IndianRupee, Map, MapPin, Minus, Navigation, Plus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  seating_capacity: number;
  vehicle_type: string;
  is_verified: boolean;
}

interface Stopover {
  id: string;
  name: string;
  lat: number;
  lon: number;
  priceFromOrigin: number;
  order: number;
  distanceFromPrevKm?: number; // Distance from previous point (origin or stopover)
  priceFromPrev?: number; // Price for this segment
}

export default function PublishRideEnhanced() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Step 1: Locations - BlaBlaCar style flow
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originLocation, setOriginLocation] = useState<LocationResult | null>(null);
  const [destLocation, setDestLocation] = useState<LocationResult | null>(null);
  // Track if location was confirmed on map (required for continue)
  const [originMapConfirmed, setOriginMapConfirmed] = useState(false);
  const [destMapConfirmed, setDestMapConfirmed] = useState(false);
  // Full-screen map picker visibility
  const [showPickupMapPicker, setShowPickupMapPicker] = useState(false);
  const [showDropoffMapPicker, setShowDropoffMapPicker] = useState(false);
  // Pending location from search (to center map picker)
  const [pendingPickupLocation, setPendingPickupLocation] = useState<LocationResult | null>(null);
  const [pendingDropoffLocation, setPendingDropoffLocation] = useState<LocationResult | null>(null);
  // Search suggestions
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationResult[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationResult[]>([]);
  const [loadingPickupSuggestions, setLoadingPickupSuggestions] = useState(false);
  const [loadingDropoffSuggestions, setLoadingDropoffSuggestions] = useState(false);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

  // Step 2: Route Selection
  const [availableRoutes, setAvailableRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);

  // Step 3: Stopovers
  const [availableStopovers, setAvailableStopovers] = useState<Stopover[]>([]);
  const [selectedStopovers, setSelectedStopovers] = useState<Stopover[]>([]);
  const [loadingStopovers, setLoadingStopovers] = useState(false);
  const [stopoverSearch, setStopoverSearch] = useState("");
  const [manualStopover, setManualStopover] = useState<LocationResult | null>(null);

  // Step 4: Trip Details
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState(1);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Step 5: Pricing
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [priceRecommendation, setPriceRecommendation] = useState<{ 
    min: number; 
    max: number; 
    recommended: number;
    perKmRate?: number;
    breakdown?: {
      fuelCost: number;
      tollEstimate: number;
      driverEarning: number;
    };
  } | null>(null);
  const [stopoverPrices, setStopoverPrices] = useState<Record<string, number>>({});

  // Step 6: Booking Settings
  const [bookingType, setBookingType] = useState<"instant" | "review">("review");

  // Step 7: Publish Options
  const [publishType, setPublishType] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState("");

  const AMENITIES_OPTIONS = ["AC", "Music", "Luggage Space", "Pet Friendly", "Smoking Allowed"];

  // Calculate Haversine distance between two points in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Recalculate stopover prices when main price changes
  useEffect(() => {
    if (!pricePerSeat || !selectedStopovers.length || !originLocation || !destLocation) return;
    
    const mainPrice = parseFloat(pricePerSeat);
    if (isNaN(mainPrice) || mainPrice <= 0) return;
    
    // Calculate total route distance
    const totalDistanceKm = selectedRoute ? selectedRoute.distance / 1000 : 0;
    if (totalDistanceKm <= 0) return;
    
    // Calculate per-km rate from user's price
    const perKmRate = mainPrice / totalDistanceKm;
    
    // Calculate segment distances and prices
    const newStopoverPrices: Record<string, number> = {};
    
    let prevLat = parseFloat(originLocation.lat);
    let prevLon = parseFloat(originLocation.lon);
    let cumulativeDistance = 0;
    
    // Sort stopovers by order
    const sortedStopovers = [...selectedStopovers].sort((a, b) => a.order - b.order);
    
    sortedStopovers.forEach((stopover, index) => {
      // Distance from previous point to this stopover
      const segmentDistance = calculateDistance(prevLat, prevLon, stopover.lat, stopover.lon);
      cumulativeDistance += segmentDistance;
      
      // Distance from this stopover to destination
      const destLat = parseFloat(destLocation.lat);
      const destLon = parseFloat(destLocation.lon);
      const distanceToDestination = calculateDistance(stopover.lat, stopover.lon, destLat, destLon);
      
      // Price from this stopover to destination (proportional to distance)
      const priceToDestination = Math.round(distanceToDestination * perKmRate);
      
      // Minimum price of ₹50
      newStopoverPrices[stopover.id] = Math.max(50, priceToDestination);
      
      // Update for next iteration
      prevLat = stopover.lat;
      prevLon = stopover.lon;
    });
    
    setStopoverPrices(newStopoverPrices);
  }, [pricePerSeat, selectedStopovers, originLocation, destLocation, selectedRoute]);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  // Search suggestions for pickup location
  useEffect(() => {
    if (origin.length < 2 || originMapConfirmed) {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingPickupSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(origin)}&countrycodes=in&format=json&addressdetails=1&limit=5`,
          { headers: { "User-Agent": "KooliHub/1.0" } }
        );
        if (response.ok) {
          const data = await response.json();
          setPickupSuggestions(data);
          setShowPickupSuggestions(data.length > 0);
        }
      } catch (error) {
        console.error("Error fetching pickup suggestions:", error);
      } finally {
        setLoadingPickupSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [origin, originMapConfirmed]);

  // Search suggestions for drop-off location
  useEffect(() => {
    if (destination.length < 2 || destMapConfirmed) {
      setDropoffSuggestions([]);
      setShowDropoffSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingDropoffSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(destination)}&countrycodes=in&format=json&addressdetails=1&limit=5`,
          { headers: { "User-Agent": "KooliHub/1.0" } }
        );
        if (response.ok) {
          const data = await response.json();
          setDropoffSuggestions(data);
          setShowDropoffSuggestions(data.length > 0);
        }
      } catch (error) {
        console.error("Error fetching dropoff suggestions:", error);
      } finally {
        setLoadingDropoffSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [destination, destMapConfirmed]);

  // Handle selecting a pickup suggestion
  const handleSelectPickupSuggestion = (loc: LocationResult) => {
    setPendingPickupLocation(loc);
    setOrigin(getCleanLocationName(loc));
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
    // Auto-open map picker centered on this location
    setShowPickupMapPicker(true);
  };

  // Handle selecting a drop-off suggestion
  const handleSelectDropoffSuggestion = (loc: LocationResult) => {
    setPendingDropoffLocation(loc);
    setDestination(getCleanLocationName(loc));
    setShowDropoffSuggestions(false);
    setDropoffSuggestions([]);
    // Auto-open map picker centered on this location
    setShowDropoffMapPicker(true);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPickupSuggestions(false);
      setShowDropoffSuggestions(false);
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchVehicles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_verified", true)
        .eq("is_active", true);

      if (error) throw error;
      setVehicles(data || []);

      if (data && data.length > 0) {
        setSelectedVehicle(data[0].id);
        setAvailableSeats(data[0].seating_capacity - 1);
      }
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive",
      });
    }
  };

  const handleStep1Next = async () => {
    if (!originMapConfirmed || !destMapConfirmed) {
      toast({ 
        title: "Select locations on map", 
        description: "Please confirm both pickup and drop-off points on the map",
        variant: "destructive" 
      });
      return;
    }

    if (!originLocation || !destLocation) {
      toast({ title: "Please select both origin and destination", variant: "destructive" });
      return;
    }

    if (originLocation.place_id === destLocation.place_id) {
      toast({ title: "Origin and destination must be different", variant: "destructive" });
      return;
    }

    // Calculate routes
    setCalculatingRoutes(true);
    try {
      const routes = await calculateRoutes(
        { lat: parseFloat(originLocation.lat), lon: parseFloat(originLocation.lon) },
        { lat: parseFloat(destLocation.lat), lon: parseFloat(destLocation.lon) },
        3
      );
      setAvailableRoutes(routes);
      if (routes.length > 0) {
        setSelectedRoute(routes[0]);
      }
      setStep(2);
    } catch (error) {
      console.error("Error calculating routes:", error);
      toast({ title: "Error calculating routes", variant: "destructive" });
    } finally {
      setCalculatingRoutes(false);
    }
  };

  const handleStep2Next = async () => {
    if (!selectedRoute) {
      toast({ title: "Please select a route", variant: "destructive" });
      return;
    }

    // Find stopovers along the route
    setLoadingStopovers(true);
    try {
      const stopovers = await findStopoversAlongRoute(selectedRoute.geometry, 5);
      setAvailableStopovers(
        stopovers.map((s, idx) => ({
          id: `stopover-${idx}`,
          name: s.name,
          lat: s.lat,
          lon: s.lon,
          priceFromOrigin: 0, // Will be calculated in pricing step
          order: idx + 1,
        }))
      );
      setStep(3);
    } catch (error) {
      console.error("Error finding stopovers:", error);
      toast({ title: "Error finding stopovers", variant: "destructive" });
      setStep(3); // Continue anyway
    } finally {
      setLoadingStopovers(false);
    }
  };

  const handleStep3Next = () => {
    setStep(4);
  };

  const handleStep4Next = () => {
    if (!selectedVehicle) {
      toast({ title: "Please select a vehicle", variant: "destructive" });
      return;
    }
    if (!departureDate) {
      toast({ title: "Please select departure date", variant: "destructive" });
      return;
    }
    if (!departureTime) {
      toast({ title: "Please select departure time", variant: "destructive" });
      return;
    }

    // Calculate price recommendation using carpooling formula (₹2/km)
    if (selectedRoute && originLocation && destLocation) {
      const pricing = calculatePriceRecommendation(selectedRoute.distance);
      setPriceRecommendation(pricing);
      setPricePerSeat(pricing.recommended.toString());

      // Calculate segment distances and stopover prices
      const totalDistanceKm = selectedRoute.distance / 1000;
      const perKmRate = pricing.recommended / totalDistanceKm;
      
      const stopoverPricing: Record<string, number> = {};
      const sortedStopovers = [...selectedStopovers].sort((a, b) => a.order - b.order);
      
      sortedStopovers.forEach((stopover) => {
        // Calculate distance from stopover to destination
        const distanceToDestination = calculateDistance(
          stopover.lat,
          stopover.lon,
          parseFloat(destLocation.lat),
          parseFloat(destLocation.lon)
        );
        
        // Price proportional to remaining distance
        const priceToDestination = Math.round(distanceToDestination * perKmRate);
        stopoverPricing[stopover.id] = Math.max(50, priceToDestination);
      });
      
      setStopoverPrices(stopoverPricing);
    }

    setStep(5);
  };

  const handleStep5Next = () => {
    if (!pricePerSeat || parseFloat(pricePerSeat) <= 0) {
      toast({ title: "Please enter a valid price", variant: "destructive" });
      return;
    }
    setStep(6);
  };

  const handleStep6Next = () => {
    setStep(7);
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const addManualStopover = (location: LocationResult) => {
    const cleanName = location.address.city || location.address.town || location.address.village || location.display_name.split(",")[0];
    
    const newStopover: Stopover = {
      id: `manual-${Date.now()}`,
      name: cleanName,
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
      priceFromOrigin: 0,
      order: selectedStopovers.length + 1,
    };
    
    setSelectedStopovers((prev) => [...prev, newStopover]);
    setStopoverSearch("");
    setManualStopover(null);
    toast({ title: `Added ${cleanName} as stopover` });
  };

  const toggleStopover = (stopover: Stopover) => {
    setSelectedStopovers((prev) => {
      const exists = prev.find((s) => s.id === stopover.id);
      if (exists) {
        return prev.filter((s) => s.id !== stopover.id);
      } else {
        return [...prev, { ...stopover, order: prev.length + 1 }];
      }
    });
  };

  const removeStopover = (stopoverId: string) => {
    setSelectedStopovers((prev) => 
      prev.filter((s) => s.id !== stopoverId).map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  };

  const moveStopoverUp = (index: number) => {
    if (index === 0) return;
    setSelectedStopovers((prev) => {
      const newStopovers = [...prev];
      [newStopovers[index - 1], newStopovers[index]] = [newStopovers[index], newStopovers[index - 1]];
      return newStopovers.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const moveStopoverDown = (index: number) => {
    setSelectedStopovers((prev) => {
      if (index === prev.length - 1) return prev;
      const newStopovers = [...prev];
      [newStopovers[index], newStopovers[index + 1]] = [newStopovers[index + 1], newStopovers[index]];
      return newStopovers.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const handlePublish = async () => {
    if (!user || !departureDate || !originLocation || !destLocation || !selectedRoute) return;

    setLoading(true);

    try {
      // Check if scheduled for future
      const shouldSchedule = publishType === "schedule" && scheduleDate && scheduleTime;
      let publishTime: Date | null = null;
      
      if (shouldSchedule) {
        publishTime = new Date(scheduleDate);
        const [hours, minutes] = scheduleTime.split(":");
        publishTime.setHours(parseInt(hours), parseInt(minutes));
      }

      // Create route with coordinates and full addresses
      const { data: routeData, error: routeError } = await supabase
        .from("routes")
        .insert({
          name: `${origin} to ${destination}`,
          departure_location: origin,
          arrival_location: destination,
          departure_address: originLocation.display_name,
          arrival_address: destLocation.display_name,
          origin_lat: parseFloat(originLocation.lat),
          origin_lon: parseFloat(originLocation.lon),
          destination_lat: parseFloat(destLocation.lat),
          destination_lon: parseFloat(destLocation.lon),
          distance_km: selectedRoute.distance / 1000,
          estimated_duration_minutes: Math.round(selectedRoute.duration / 60),
          route_geometry: { coordinates: selectedRoute.geometry },
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Create trip
      const departureDateTime = new Date(departureDate);
      const [hours, minutes] = departureTime.split(":");
      departureDateTime.setHours(parseInt(hours), parseInt(minutes));

      const vehicle = vehicles.find((v) => v.id === selectedVehicle);

      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .insert({
          driver_id: user.id,
          vehicle_id: selectedVehicle,
          route_id: routeData.id,
          departure_time: departureDateTime.toISOString(),
          total_seats: vehicle?.seating_capacity || availableSeats + 1,
          available_seats: availableSeats,
          price_per_seat: parseFloat(pricePerSeat),
          status: shouldSchedule && publishTime && publishTime > new Date() ? "scheduled" : "active",
          amenities,
          metadata: { notes },
          booking_type: bookingType,
          is_scheduled: shouldSchedule || false,
          scheduled_publish_time: shouldSchedule ? publishTime?.toISOString() : null,
          price_recommendation: priceRecommendation,
          selected_route_id: selectedRoute.id,
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Create stopovers
      if (selectedStopovers.length > 0) {
        const stopoverInserts = selectedStopovers.map((stopover) => ({
          trip_id: tripData.id,
          stopover_order: stopover.order,
          location_name: stopover.name,
          latitude: stopover.lat,
          longitude: stopover.lon,
          price_from_origin: stopoverPrices[stopover.id] || 0,
        }));

        if (stopoverInserts.length > 0) {
          const { error: stopoverError } = await supabase
            .from("route_stopovers")
            .insert(stopoverInserts);

          if (stopoverError) console.error("Error creating stopovers:", stopoverError);
        }
      }

      toast({
        title: shouldSchedule ? "Ride scheduled successfully!" : "Ride published successfully!",
        description: shouldSchedule
          ? `Your ride will be published on ${format(publishTime!, "PPP 'at' p")}`
          : "Your ride is now visible to passengers",
      });

      navigate("/trip-booking/my-rides");
    } catch (error: any) {
      console.error("Error publishing ride:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish ride",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (vehicles.length === 0 && !loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Car className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Verified Vehicle
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to add and verify a vehicle before publishing rides
            </p>
            <Button
              onClick={() => navigate("/trip-booking/add-vehicle")}
              className="bg-[#137fec] hover:bg-[#137fec]/90"
            >
              Add Vehicle
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
        {/* Header */}
        <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ zIndex: 100 }}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 text-center">
              Publish a Ride
            </h1>
            <div className="w-10" />
          </div>

          {/* Progress Steps - Simplified for mobile */}
          <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4">
            {/* Mobile: Show progress bar with current step */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#137fec]">Step {step} of 7</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {step === 1 && "Locations"}
                  {step === 2 && "Routes"}
                  {step === 3 && "Stops"}
                  {step === 4 && "Details"}
                  {step === 5 && "Price"}
                  {step === 6 && "Type"}
                  {step === 7 && "Publish"}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#137fec] transition-all duration-300" 
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>

            {/* Desktop: Show all steps */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs transition-colors",
                        step >= s
                          ? "bg-[#137fec] text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                      )}
                    >
                      {s}
                    </div>
                    {s < 7 && (
                      <div
                        className={cn(
                          "w-4 h-0.5 mx-0.5 transition-colors",
                          step > s ? "bg-[#137fec]" : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs font-medium">
                <span className={step >= 1 ? "text-[#137fec]" : "text-gray-500"}>Locations</span>
                <span className={step >= 2 ? "text-[#137fec]" : "text-gray-500"}>Routes</span>
                <span className={step >= 3 ? "text-[#137fec]" : "text-gray-500"}>Stops</span>
                <span className={step >= 4 ? "text-[#137fec]" : "text-gray-500"}>Details</span>
                <span className={step >= 5 ? "text-[#137fec]" : "text-gray-500"}>Price</span>
                <span className={step >= 6 ? "text-[#137fec]" : "text-gray-500"}>Type</span>
                <span className={step >= 7 ? "text-[#137fec]" : "text-gray-500"}>Publish</span>
              </div>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-32 sm:pb-40">
          {/* Step 1: Locations - BlaBlaCar Style Flow */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Where are you going?
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Search and select exact pickup & drop-off points on the map
                </p>
              </div>

              {/* ===== PICKUP LOCATION ===== */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  Pickup Location
                </Label>

                {/* Pickup - Not yet confirmed */}
                {!originMapConfirmed ? (
                  <div className="space-y-2">
                    {/* Search Input */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#10b981] z-10" />
                      <Input
                        type="text"
                        placeholder="Search pickup location..."
                        value={origin}
                        onChange={(e) => {
                          setOrigin(e.target.value);
                          setPendingPickupLocation(null);
                        }}
                        onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
                        className="pl-12 pr-12 h-14 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-[#10b981] rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPickupMapPicker(true)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                        title="Pick on map"
                      >
                        <Map className="h-5 w-5 text-[#10b981]" />
                      </button>

                      {/* Suggestions Dropdown */}
                      {showPickupSuggestions && pickupSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                          {/* Select on Map option */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowPickupSuggestions(false);
                              setShowPickupMapPicker(true);
                            }}
                            className="w-full p-3 flex items-center gap-3 hover:bg-[#10b981]/10 transition-colors border-b-2 border-gray-100 dark:border-gray-700 bg-[#10b981]/5"
                          >
                            <div className="w-9 h-9 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                              <Map className="h-4 w-4 text-[#10b981]" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-[#10b981] text-sm">Select on Map</p>
                              <p className="text-xs text-gray-500">Drop a pin at exact location</p>
                            </div>
                          </button>
                          {/* Suggestions */}
                          {pickupSuggestions.map((loc) => (
                            <button
                              key={loc.place_id}
                              type="button"
                              onClick={() => handleSelectPickupSuggestion(loc)}
                              className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {getCleanLocationName(loc)}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {loc.address.state}, {loc.address.country}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending location prompt */}
                    {pendingPickupLocation && !showPickupSuggestions && (
                      <button
                        type="button"
                        onClick={() => setShowPickupMapPicker(true)}
                        className="w-full p-4 bg-[#10b981]/10 border-2 border-[#10b981] rounded-xl flex items-center gap-3 hover:bg-[#10b981]/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {getCleanLocationName(pendingPickupLocation)}
                          </p>
                          <p className="text-sm text-[#10b981] font-medium">
                            Tap to confirm exact location on map →
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Direct map selection prompt */}
                    {!pendingPickupLocation && !origin && (
                      <button
                        type="button"
                        onClick={() => setShowPickupMapPicker(true)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center gap-3 hover:border-[#10b981] hover:bg-[#10b981]/5 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-[#10b981]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Map className="h-5 w-5 text-gray-400 group-hover:text-[#10b981]" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#10b981]">
                            Or select directly on map
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Drop a pin at your exact pickup point
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Pickup - Confirmed on map */
                  <div className="p-4 bg-[#10b981]/10 border-2 border-[#10b981] rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-lg">
                          {origin}
                        </p>
                        <p className="text-sm text-[#10b981] font-medium flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Confirmed on map
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOriginMapConfirmed(false);
                          setShowPickupMapPicker(true);
                        }}
                        className="text-sm font-medium text-[#10b981] hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ===== DROP-OFF LOCATION ===== */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#137fec] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  Drop-off Location
                </Label>

                {/* Drop-off - Not yet confirmed */}
                {!destMapConfirmed ? (
                  <div className="space-y-2">
                    {/* Search Input */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#137fec] z-10" />
                      <Input
                        type="text"
                        placeholder="Search drop-off location..."
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value);
                          setPendingDropoffLocation(null);
                        }}
                        onFocus={() => dropoffSuggestions.length > 0 && setShowDropoffSuggestions(true)}
                        className="pl-12 pr-12 h-14 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-[#137fec] rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDropoffMapPicker(true)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                        title="Pick on map"
                      >
                        <Map className="h-5 w-5 text-[#137fec]" />
                      </button>

                      {/* Suggestions Dropdown */}
                      {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                          {/* Select on Map option */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowDropoffSuggestions(false);
                              setShowDropoffMapPicker(true);
                            }}
                            className="w-full p-3 flex items-center gap-3 hover:bg-[#137fec]/10 transition-colors border-b-2 border-gray-100 dark:border-gray-700 bg-[#137fec]/5"
                          >
                            <div className="w-9 h-9 rounded-full bg-[#137fec]/20 flex items-center justify-center">
                              <Map className="h-4 w-4 text-[#137fec]" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-[#137fec] text-sm">Select on Map</p>
                              <p className="text-xs text-gray-500">Drop a pin at exact location</p>
                            </div>
                          </button>
                          {/* Suggestions */}
                          {dropoffSuggestions.map((loc) => (
                            <button
                              key={loc.place_id}
                              type="button"
                              onClick={() => handleSelectDropoffSuggestion(loc)}
                              className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {getCleanLocationName(loc)}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {loc.address.state}, {loc.address.country}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending location prompt */}
                    {pendingDropoffLocation && !showDropoffSuggestions && (
                      <button
                        type="button"
                        onClick={() => setShowDropoffMapPicker(true)}
                        className="w-full p-4 bg-[#137fec]/10 border-2 border-[#137fec] rounded-xl flex items-center gap-3 hover:bg-[#137fec]/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#137fec] flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {getCleanLocationName(pendingDropoffLocation)}
                          </p>
                          <p className="text-sm text-[#137fec] font-medium">
                            Tap to confirm exact location on map →
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Direct map selection prompt */}
                    {!pendingDropoffLocation && !destination && (
                      <button
                        type="button"
                        onClick={() => setShowDropoffMapPicker(true)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center gap-3 hover:border-[#137fec] hover:bg-[#137fec]/5 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-[#137fec]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Map className="h-5 w-5 text-gray-400 group-hover:text-[#137fec]" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#137fec]">
                            Or select directly on map
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Drop a pin at your exact drop-off point
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Drop-off - Confirmed on map */
                  <div className="p-4 bg-[#137fec]/10 border-2 border-[#137fec] rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#137fec] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-lg">
                          {destination}
                        </p>
                        <p className="text-sm text-[#137fec] font-medium flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Confirmed on map
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDestMapConfirmed(false);
                          setShowDropoffMapPicker(true);
                        }}
                        className="text-sm font-medium text-[#137fec] hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info message when both not confirmed */}
              {(!originMapConfirmed || !destMapConfirmed) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Select exact locations on the map
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Both pickup and drop-off points must be confirmed on the map before you can continue
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Route Selection */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Header with trip summary */}
              <div className="bg-gradient-to-r from-[#137fec]/10 to-[#10b981]/10 dark:from-[#137fec]/20 dark:to-[#10b981]/20 rounded-2xl p-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Choose Your Route
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Select the best route for your trip
                </p>
                
                {/* Trip Summary */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{origin}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#137fec]"></div>
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{destination}</span>
                  </div>
                </div>
              </div>

              {calculatingRoutes ? (
                <div className="text-center py-16">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-[#137fec]/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#137fec] animate-spin"></div>
                    <Map className="absolute inset-0 m-auto h-6 w-6 text-[#137fec]" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Finding best routes...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRoutes.map((route, index) => {
                    const isSelected = selectedRoute?.id === route.id;
                    const isFastest = index === 0;
                    const distanceKm = (route.distance / 1000).toFixed(0);
                    const hours = Math.floor(route.duration / 3600);
                    const mins = Math.round((route.duration % 3600) / 60);
                    const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
                    
                    return (
                      <div
                        key={route.id}
                        className={cn(
                          "relative rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden",
                          isSelected
                            ? "border-[#137fec] bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/30 dark:to-gray-800/50 shadow-lg shadow-blue-500/10"
                            : "border-gray-200 dark:border-gray-700 hover:border-[#137fec]/50 hover:shadow-md bg-white dark:bg-gray-800"
                        )}
                        onClick={() => setSelectedRoute(route)}
                      >
                        {/* Badge for fastest route */}
                        {isFastest && (
                          <div className="absolute top-0 right-0">
                            <div className="bg-[#10b981] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                              Fastest
                            </div>
                          </div>
                        )}
                        
                        <div className="p-4 flex items-center gap-4">
                          {/* Selection indicator */}
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            isSelected 
                              ? "border-[#137fec] bg-[#137fec]" 
                              : "border-gray-300 dark:border-gray-600"
                          )}>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          
                          {/* Route info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-semibold text-base",
                              isSelected ? "text-[#137fec] dark:text-blue-400" : "text-gray-900 dark:text-white"
                            )}>
                              {route.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                <Navigation className="h-3.5 w-3.5" />
                                <span className="font-medium">{distanceKm} km</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="font-medium">{durationText}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Show selected route on map - INTERACTIVE */}
              {selectedRoute && originLocation && destLocation && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Map className="h-4 w-4 text-[#137fec]" />
                      Selected Route Preview
                    </Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                      Drag to explore
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                    <RouteMap
                      origin={{
                        lat: parseFloat(originLocation.lat),
                        lon: parseFloat(originLocation.lon),
                        name: origin,
                      }}
                      destination={{
                        lat: parseFloat(destLocation.lat),
                        lon: parseFloat(destLocation.lon),
                        name: destination,
                      }}
                      route={selectedRoute.geometry}
                      height="350px"
                      interactive={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Stopover Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Add Stopovers (Optional)
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Add intermediate stops where passengers can board or alight
                </p>
              </div>

              {/* Manual Stopover Search */}
              <div>
                <Label className="text-base font-medium mb-2 block">Search & Add Stopover Manually</Label>
                <LocationSearchInput
                  value={stopoverSearch}
                  onChange={setStopoverSearch}
                  onSelectLocation={addManualStopover}
                  placeholder="Search city/town..."
                  icon="pin"
                />
              </div>

              {/* Selected Stopovers with Reordering */}
              {selectedStopovers.length > 0 && (
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Selected Stopovers ({selectedStopovers.length})
                  </Label>
                  <div className="space-y-2">
                    {selectedStopovers.map((stopover, index) => (
                      <Card key={stopover.id} className="border-[#137fec] border-2 bg-blue-50 dark:bg-blue-900/20">
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-[#137fec] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {stopover.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStopoverUp(index)}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStopoverDown(index)}
                              disabled={index === selectedStopovers.length - 1}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStopover(stopover.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Stopovers from Route */}
              {loadingStopovers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#137fec] mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Finding suggested stopovers on route...</p>
                </div>
              ) : availableStopovers.length > 0 ? (
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Suggested Stopovers on Route
                  </Label>
                  <div className="space-y-2">
                    {availableStopovers.map((stopover) => {
                      const isSelected = selectedStopovers.find((s) => s.id === stopover.id);
                      return (
                        <Card
                          key={stopover.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            isSelected
                              ? "opacity-50 pointer-events-none"
                              : "border-gray-200 dark:border-gray-700 hover:border-[#137fec]/50"
                          )}
                          onClick={() => !isSelected && toggleStopover(stopover)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5 text-gray-400" />
                              <p className="font-medium text-gray-900 dark:text-white">
                                {stopover.name}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="h-5 w-5 text-[#137fec]" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {selectedStopovers.length === 0 && !loadingStopovers && availableStopovers.length === 0 && (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No stopovers added yet. Search and add cities/towns manually above.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Trip Details */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Trip Details
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Set your trip schedule and preferences
                </p>
              </div>

              {/* What vehicle are you driving? */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  What vehicle are you driving?
                </Label>
                
                {/* Vehicle Type Selection - Visual Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'car', label: 'Car', icon: Car },
                    { type: 'auto', label: 'Auto', icon: Car },
                    { type: 'bike', label: 'Bike', icon: Bike },
                  ].map(({ type, label, icon: Icon }) => {
                    const isSelected = vehicles.find(v => v.id === selectedVehicle)?.vehicle_type === type;
                    const vehicleOfType = vehicles.find(v => v.vehicle_type === type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          if (vehicleOfType) {
                            setSelectedVehicle(vehicleOfType.id);
                            setAvailableSeats(Math.max(1, vehicleOfType.seating_capacity - 1));
                          }
                        }}
                        disabled={!vehicleOfType}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-[#137fec] bg-[#137fec]/10 text-[#137fec]"
                            : vehicleOfType
                            ? "border-gray-200 dark:border-gray-700 hover:border-[#137fec]/50"
                            : "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Icon className={cn("h-8 w-8 mb-2", isSelected ? "text-[#137fec]" : "text-gray-500")} />
                        <span className={cn("text-sm font-medium", isSelected ? "text-[#137fec]" : "text-gray-700 dark:text-gray-300")}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Your Vehicle (from user's vehicles) */}
              {vehicles.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Select Your Vehicle
                  </Label>
                  <div className="space-y-2">
                    {vehicles.map((vehicle) => {
                      const isSelected = selectedVehicle === vehicle.id;
                      return (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => {
                            setSelectedVehicle(vehicle.id);
                            setAvailableSeats(Math.max(1, vehicle.seating_capacity - 1));
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                            isSelected
                              ? "border-[#137fec] bg-[#137fec]/5"
                              : "border-gray-200 dark:border-gray-700 hover:border-[#137fec]/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              isSelected ? "bg-[#137fec]" : "bg-gray-100 dark:bg-gray-700"
                            )}>
                              <Car className={cn("h-5 w-5", isSelected ? "text-white" : "text-gray-500")} />
                            </div>
                            <div>
                              <p className={cn(
                                "font-semibold",
                                isSelected ? "text-[#137fec]" : "text-gray-900 dark:text-white"
                              )}>
                                {vehicle.make} {vehicle.model}
                              </p>
                              <p className="text-sm text-gray-500">
                                {vehicle.year} • {vehicle.seating_capacity} seats
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#137fec] flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedVehicle && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#10b981]" />
                      Selected Vehicle: <span className="font-medium text-gray-900 dark:text-white">
                        {vehicles.find(v => v.id === selectedVehicle)?.make} {vehicles.find(v => v.id === selectedVehicle)?.model}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Departure Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-14 mt-2 justify-start text-left font-normal",
                          !departureDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {departureDate ? format(departureDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-0 shadow-2xl rounded-3xl" align="start">
                      <CustomCalendar
                        value={departureDate}
                        onChange={setDepartureDate}
                        minDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="time" className="text-base font-medium">
                    Time
                  </Label>
                  <div className="relative mt-2">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="time"
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="h-14 pl-11"
                    />
                  </div>
                </div>
              </div>

              {/* Seats */}
              <div>
                <Label htmlFor="seats" className="text-base font-medium">
                  Available Seats
                </Label>
                <div className="relative mt-2">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    max={vehicles.find((v) => v.id === selectedVehicle)?.seating_capacity || 4}
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(parseInt(e.target.value))}
                    className="h-14 pl-11"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <Label className="text-base font-medium">Amenities (Optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AMENITIES_OPTIONS.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={cn(
                        "px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors",
                        amenities.includes(amenity)
                          ? "border-[#137fec] bg-[#137fec]/10 text-[#137fec]"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-base font-medium">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Step 5: Pricing */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Set Your Price
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Fair pricing based on fuel cost sharing
                </p>
              </div>

              {/* Price Recommendation with Breakdown */}
              {priceRecommendation && (
                <div className="space-y-4">
                  {/* Recommended Price Card */}
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Recommended Price per Seat
                        </p>
                        <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                          ₹{priceRecommendation.perKmRate || 1.5}/km
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                        ₹{priceRecommendation.recommended}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        Range: ₹{priceRecommendation.min} - ₹{priceRecommendation.max}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Price Breakdown */}
                  {priceRecommendation.breakdown && (
                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          How this price is calculated (per seat)
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Fuel cost share</span>
                            <span className="font-medium text-gray-900 dark:text-white">₹{priceRecommendation.breakdown.fuelCost}</span>
                          </div>
                          {priceRecommendation.breakdown.tollEstimate > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Toll share (est.)</span>
                              <span className="font-medium text-gray-900 dark:text-white">₹{priceRecommendation.breakdown.tollEstimate}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Vehicle wear & maintenance</span>
                            <span className="font-medium text-gray-900 dark:text-white">₹{priceRecommendation.breakdown.driverEarning}</span>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between font-medium">
                            <span className="text-gray-700 dark:text-gray-300">Total per seat</span>
                            <span className="text-[#137fec]">₹{priceRecommendation.recommended}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          💡 This is carpooling, not a taxi. Keep prices fair to share costs, not make profit.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Distance Info */}
                  {selectedRoute && (
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <span className="flex items-center gap-1">
                        <Navigation className="h-4 w-4" />
                        {(selectedRoute.distance / 1000).toFixed(0)} km
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {(() => {
                          const totalMins = Math.round(selectedRoute.duration / 60);
                          const hrs = Math.floor(totalMins / 60);
                          const mins = totalMins % 60;
                          return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Price Input with +/- */}
              <div>
                <Label className="text-base font-medium">Price per Seat</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={() => setPricePerSeat((prev) => Math.max(0, parseFloat(prev || "0") - 10).toString())}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="relative flex-1">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={pricePerSeat}
                      onChange={(e) => setPricePerSeat(e.target.value)}
                      className="h-14 pl-11 text-center text-2xl font-bold"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={() => setPricePerSeat((prev) => (parseFloat(prev || "0") + 10).toString())}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Stopover Prices - Segment by Segment */}
              {selectedStopovers.length > 0 && (
                <div>
                  <Label className="text-base font-medium mb-3 block">Stopover Prices</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Prices from each stopover to {destination}
                  </p>
                  <Card>
                    <CardContent className="p-0">
                      {/* Show segment breakdown */}
                      {(() => {
                        const sortedStopovers = [...selectedStopovers].sort((a, b) => a.order - b.order);
                        const segments: { from: string; to: string; stopoverId?: string; price?: number }[] = [];
                        
                        // Build segments: Origin → Stopover1 → Stopover2 → ... → Destination
                        let prevName = origin;
                        sortedStopovers.forEach((stopover, idx) => {
                          segments.push({
                            from: prevName,
                            to: stopover.name,
                          });
                          prevName = stopover.name;
                        });
                        // Last segment to destination
                        segments.push({
                          from: prevName,
                          to: destination,
                        });
                        
                        return (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* Route visualization */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Route Segments</p>
                              <div className="flex items-center flex-wrap gap-1 text-sm">
                                <span className="font-semibold text-[#10b981]">{origin}</span>
                                {sortedStopovers.map((s, i) => (
                                  <span key={s.id} className="flex items-center gap-1">
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-[#137fec]">{s.name}</span>
                                  </span>
                                ))}
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-red-500">{destination}</span>
                              </div>
                            </div>
                            
                            {/* Stopover prices (from stopover to destination) */}
                            {sortedStopovers.map((stopover, index) => {
                              const price = stopoverPrices[stopover.id] || 0;
                              const distanceToDestKm = destLocation ? calculateDistance(
                                stopover.lat,
                                stopover.lon,
                                parseFloat(destLocation.lat),
                                parseFloat(destLocation.lon)
                              ) : 0;
                              
                              return (
                                <div key={stopover.id} className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-[#137fec] text-white flex items-center justify-center text-xs font-bold">
                                          {index + 1}
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {stopover.name}
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-600 dark:text-gray-400">
                                          {destination}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">
                                        ~{Math.round(distanceToDestKm)} km remaining
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() =>
                                          setStopoverPrices((prev) => ({
                                            ...prev,
                                            [stopover.id]: Math.max(50, (prev[stopover.id] || 0) - 10),
                                          }))
                                        }
                                      >
                                        <Minus className="h-4 w-4 text-gray-500" />
                                      </Button>
                                      <span className="text-xl font-bold text-[#10b981] min-w-[80px] text-center">
                                        ₹{price}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() =>
                                          setStopoverPrices((prev) => ({
                                            ...prev,
                                            [stopover.id]: (prev[stopover.id] || 0) + 10,
                                          }))
                                        }
                                      >
                                        <Plus className="h-4 w-4 text-gray-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Info about full price */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center">
                                    <Check className="h-3 w-3" />
                                  </div>
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {origin}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium text-gray-600 dark:text-gray-400">
                                    {destination}
                                  </span>
                                </div>
                                <span className="text-xl font-bold text-[#137fec]">
                                  ₹{pricePerSeat}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 ml-8 mt-1">
                                Full trip price per seat
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Booking Type */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Booking Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose how you want to handle booking requests
                </p>
              </div>

              <RadioGroup value={bookingType} onValueChange={(v) => setBookingType(v as "instant" | "review")}>
                <Card
                  className={cn(
                    "cursor-pointer transition-all",
                    bookingType === "instant"
                      ? "border-[#137fec] border-2 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                  onClick={() => setBookingType("instant")}
                >
                  <CardContent className="p-6 flex items-start gap-4">
                    <RadioGroupItem value="instant" id="instant" />
                    <div className="flex-1">
                      <Label
                        htmlFor="instant"
                        className="text-lg font-bold text-[#137fec] dark:text-[#137fec] cursor-pointer"
                      >
                        Enable Instant Booking
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Passengers can book immediately without waiting for approval. Faster bookings!
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "cursor-pointer transition-all",
                    bookingType === "review"
                      ? "border-[#137fec] border-2 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                  onClick={() => setBookingType("review")}
                >
                  <CardContent className="p-6 flex items-start gap-4">
                    <RadioGroupItem value="review" id="review" />
                    <div className="flex-1">
                      <Label
                        htmlFor="review"
                        className="text-lg font-bold text-gray-900 dark:text-white cursor-pointer"
                      >
                        Review Every Request Before It Expires
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        You'll review and approve each booking request. More control over passengers.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </RadioGroup>
            </div>
          )}

          {/* Step 7: Publish Options */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Confirm & Publish
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Review your trip details and publish
                </p>
              </div>

              {/* Publish Type Selector */}
              <div>
                <Label className="text-base font-medium mb-3 block">Publishing Option</Label>
                <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setPublishType("now")}
                    className={cn(
                      "flex-1 py-3 rounded-md font-medium transition-all",
                      publishType === "now"
                        ? "bg-[#137fec] text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    Publish Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishType("schedule")}
                    className={cn(
                      "flex-1 py-3 rounded-md font-medium transition-all",
                      publishType === "schedule"
                        ? "bg-[#137fec] text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    Schedule
                  </button>
                </div>
              </div>

              {/* Schedule DateTime if selected */}
              {publishType === "schedule" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-medium">Publish Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-14 mt-2 justify-start text-left font-normal",
                            !scheduleDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduleDate ? format(scheduleDate, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-0 shadow-2xl rounded-3xl" align="start">
                        <CustomCalendar
                          value={scheduleDate}
                          onChange={setScheduleDate}
                          minDate={new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="scheduleTime" className="text-base font-medium">
                      Publish Time
                    </Label>
                    <div className="relative mt-2">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="scheduleTime"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="h-14 pl-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Route</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {origin} → {destination}
                    </p>
                    {selectedStopovers.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedStopovers.length} stopover{selectedStopovers.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Departure</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {departureDate && format(departureDate, "PP")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{departureTime}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Available Seats</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {availableSeats} seat{availableSeats !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price per Seat</p>
                    <p className="text-2xl font-bold text-[#137fec]">₹{pricePerSeat}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Booking Type</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {bookingType === "instant" ? "Instant Booking" : "Review Requests"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Bottom Action Bar - Above Footer - Always Visible */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]" style={{ zIndex: 9999 }}>
          <div className="max-w-2xl mx-auto">
            {step === 1 && (
              <Button
                onClick={handleStep1Next}
                disabled={!originMapConfirmed || !destMapConfirmed || !originLocation || !destLocation || calculatingRoutes}
                className={cn(
                  "w-full h-14 text-white font-bold transition-all",
                  originMapConfirmed && destMapConfirmed
                    ? "bg-[#137fec] hover:bg-[#137fec]/90"
                    : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                )}
              >
                {calculatingRoutes ? (
                  "Calculating Routes..."
                ) : !originMapConfirmed || !destMapConfirmed ? (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Select locations on map first
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={handleStep2Next}
                disabled={!selectedRoute || loadingStopovers}
                className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                {loadingStopovers ? "Finding Stopovers..." : "Continue"}
              </Button>
            )}
            {step === 3 && (
              <Button
                onClick={handleStep3Next}
                className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                Continue
              </Button>
            )}
            {step === 4 && (
              <Button
                onClick={handleStep4Next}
                className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                Continue
              </Button>
            )}
            {step === 5 && (
              <Button
                onClick={handleStep5Next}
                className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                Continue
              </Button>
            )}
            {step === 6 && (
              <Button
                onClick={handleStep6Next}
                className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                Continue
              </Button>
            )}
            {step === 7 && (
              <Button
                onClick={handlePublish}
                disabled={loading || (publishType === "schedule" && (!scheduleDate || !scheduleTime))}
                className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                {loading ? "Publishing..." : publishType === "now" ? "Publish Ride" : "Schedule Ride"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ===== PICKUP MAP PICKER MODAL ===== */}
      {showPickupMapPicker && (
        <LocationPickerMap
          locationType="pickup"
          initialLocation={
            pendingPickupLocation
              ? { lat: parseFloat(pendingPickupLocation.lat), lon: parseFloat(pendingPickupLocation.lon) }
              : originLocation
              ? { lat: parseFloat(originLocation.lat), lon: parseFloat(originLocation.lon) }
              : undefined
          }
          onSelectLocation={(loc) => {
            const cleanName = getCleanLocationName(loc);
            setOrigin(cleanName);
            setOriginLocation(loc);
            setOriginMapConfirmed(true);
            setPendingPickupLocation(null);
            setShowPickupMapPicker(false);
          }}
          onClose={() => {
            setShowPickupMapPicker(false);
          }}
        />
      )}

      {/* ===== DROP-OFF MAP PICKER MODAL ===== */}
      {showDropoffMapPicker && (
        <LocationPickerMap
          locationType="dropoff"
          initialLocation={
            pendingDropoffLocation
              ? { lat: parseFloat(pendingDropoffLocation.lat), lon: parseFloat(pendingDropoffLocation.lon) }
              : destLocation
              ? { lat: parseFloat(destLocation.lat), lon: parseFloat(destLocation.lon) }
              : undefined
          }
          onSelectLocation={(loc) => {
            const cleanName = getCleanLocationName(loc);
            setDestination(cleanName);
            setDestLocation(loc);
            setDestMapConfirmed(true);
            setPendingDropoffLocation(null);
            setShowDropoffMapPicker(false);
          }}
          onClose={() => {
            setShowDropoffMapPicker(false);
          }}
        />
      )}
    </Layout>
  );
}

