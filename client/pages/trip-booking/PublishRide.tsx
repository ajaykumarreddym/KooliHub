import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MapPin, Calendar as CalendarIcon, Clock, Users, IndianRupee, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Indian cities for autocomplete
const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivali", "Vasai-Virar",
  "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad",
  "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur",
  "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad"
];

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  seating_capacity: number;
  vehicle_type: string;
  is_verified: boolean;
}

export default function PublishRide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Step 1: Route Details
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // Step 2: Trip Details
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState(1);
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const AMENITIES_OPTIONS = ["AC", "Music", "Luggage Space", "Pet Friendly", "Smoking Allowed"];

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

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
        setAvailableSeats(data[0].seating_capacity - 1); // Driver takes 1 seat
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

  const handleOriginChange = (value: string) => {
    setOrigin(value);
    if (value.length > 0) {
      const filtered = INDIAN_CITIES.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setOriginSuggestions(filtered.slice(0, 5));
      setShowOriginSuggestions(true);
    } else {
      setShowOriginSuggestions(false);
    }
  };

  const handleDestChange = (value: string) => {
    setDestination(value);
    if (value.length > 0) {
      const filtered = INDIAN_CITIES.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setDestSuggestions(filtered.slice(0, 5));
      setShowDestSuggestions(true);
    } else {
      setShowDestSuggestions(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const validateStep1 = () => {
    if (!origin.trim()) {
      toast({ title: "Origin required", variant: "destructive" });
      return false;
    }
    if (!destination.trim()) {
      toast({ title: "Destination required", variant: "destructive" });
      return false;
    }
    if (origin === destination) {
      toast({ title: "Origin and destination must be different", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!selectedVehicle) {
      toast({ title: "Please select a vehicle", variant: "destructive" });
      return false;
    }
    if (!departureDate) {
      toast({ title: "Please select departure date", variant: "destructive" });
      return false;
    }
    if (!departureTime) {
      toast({ title: "Please select departure time", variant: "destructive" });
      return false;
    }
    if (!pricePerSeat || parseFloat(pricePerSeat) <= 0) {
      toast({ title: "Please enter valid price", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePublish = async () => {
    if (!user || !departureDate) return;

    setLoading(true);

    try {
      // Create route
      const { data: routeData, error: routeError } = await supabase
        .from("routes")
        .insert({
          name: `${origin} to ${destination}`,
          departure_location: origin,
          arrival_location: destination,
          distance_km: 0, // Calculate later
          estimated_duration_minutes: 0, // Calculate later
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Create trip
      const departureDateTime = new Date(departureDate);
      const [hours, minutes] = departureTime.split(":");
      departureDateTime.setHours(parseInt(hours), parseInt(minutes));

      const vehicle = vehicles.find(v => v.id === selectedVehicle);

      const { error: tripError } = await supabase
        .from("trips")
        .insert({
          driver_id: user.id,
          vehicle_id: selectedVehicle,
          route_id: routeData.id,
          departure_time: departureDateTime.toISOString(),
          total_seats: vehicle?.seating_capacity || availableSeats + 1,
          available_seats: availableSeats,
          price_per_seat: parseFloat(pricePerSeat),
          status: "scheduled",
          amenities,
          metadata: { notes },
        });

      if (tripError) throw tripError;

      toast({
        title: "Ride published successfully!",
        description: "Your ride is now visible to passengers",
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 text-center">
              Publish a Ride
            </h1>
            <div className="w-10" />
          </div>

          {/* Progress Steps */}
          <div className="max-w-2xl mx-auto px-4 pb-4">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                      step >= s
                        ? "bg-[#137fec] text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    )}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-2",
                        step > s ? "bg-[#137fec]" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium">
              <span className={step >= 1 ? "text-[#137fec]" : "text-gray-500"}>Route</span>
              <span className={step >= 2 ? "text-[#137fec]" : "text-gray-500"}>Details</span>
              <span className={step >= 3 ? "text-[#137fec]" : "text-gray-500"}>Confirm</span>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <main className="max-w-2xl mx-auto p-4 pb-24">
          {/* Step 1: Route Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Where are you going?
              </h2>

              {/* Origin */}
              <div className="relative">
                <Label htmlFor="origin" className="text-base font-medium">Leaving from</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="origin"
                    placeholder="Enter city"
                    value={origin}
                    onChange={(e) => handleOriginChange(e.target.value)}
                    onFocus={() => origin && setShowOriginSuggestions(true)}
                    className="h-14 pl-11"
                  />
                </div>
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {originSuggestions.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setOrigin(city);
                          setShowOriginSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination */}
              <div className="relative">
                <Label htmlFor="destination" className="text-base font-medium">Going to</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#137fec]" />
                  <Input
                    id="destination"
                    placeholder="Enter city"
                    value={destination}
                    onChange={(e) => handleDestChange(e.target.value)}
                    onFocus={() => destination && setShowDestSuggestions(true)}
                    className="h-14 pl-11"
                  />
                </div>
                {showDestSuggestions && destSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {destSuggestions.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setDestination(city);
                          setShowDestSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Trip Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trip Details
              </h2>

              {/* Vehicle Selection */}
              <div>
                <Label htmlFor="vehicle" className="text-base font-medium">Select Vehicle</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="mt-2 h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  <Label htmlFor="time" className="text-base font-medium">Time</Label>
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

              {/* Seats & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seats" className="text-base font-medium">Available Seats</Label>
                  <div className="relative mt-2">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="seats"
                      type="number"
                      min="1"
                      max={vehicles.find(v => v.id === selectedVehicle)?.seating_capacity || 4}
                      value={availableSeats}
                      onChange={(e) => setAvailableSeats(parseInt(e.target.value))}
                      className="h-14 pl-11"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="price" className="text-base font-medium">Price per Seat</Label>
                  <div className="relative mt-2">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      value={pricePerSeat}
                      onChange={(e) => setPricePerSeat(e.target.value)}
                      className="h-14 pl-11"
                    />
                  </div>
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
                <Label htmlFor="notes" className="text-base font-medium">Additional Notes (Optional)</Label>
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

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Confirm Your Ride
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Route</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {origin} → {destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Departure</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {departureDate && format(departureDate, "PPP")} at {departureTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {vehicles.find(v => v.id === selectedVehicle)?.make}{" "}
                      {vehicles.find(v => v.id === selectedVehicle)?.model}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Available Seats</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {availableSeats} seat{availableSeats > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IndianRupee className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price per Seat</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹{pricePerSeat}
                    </p>
                  </div>
                </div>

                {amenities.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="px-3 py-1 bg-[#137fec]/10 text-[#137fec] rounded-full text-sm font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {notes && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                    <p className="text-gray-900 dark:text-white">{notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="max-w-2xl mx-auto">
            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                {loading ? "Publishing..." : "Publish Ride"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

