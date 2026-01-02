import { Layout } from "@/components/layout/Layout";
import { RouteMap } from "@/components/trip-booking/molecules/RouteMap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Profile, TripBooking, TripWithDetails } from "@shared/api";
import { format } from "date-fns";
import {
  ArrowLeft,
  Briefcase,
  Car,
  CheckCircle2,
  ChevronRight,
  CigaretteOff,
  Clock,
  Map,
  MapPin,
  MessageSquare,
  Music,
  Navigation,
  PawPrint,
  Shield,
  Snowflake,
  Star,
  Ticket,
  UserCircle,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// Amenity icon mapping
const amenityIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  "AC": { icon: <Snowflake className="h-3.5 w-3.5" />, label: "AC" },
  "Air Conditioning": { icon: <Snowflake className="h-3.5 w-3.5" />, label: "AC" },
  "Music": { icon: <Music className="h-3.5 w-3.5" />, label: "Music" },
  "Luggage Space": { icon: <Briefcase className="h-3.5 w-3.5" />, label: "Luggage Space" },
  "Pet Friendly": { icon: <PawPrint className="h-3.5 w-3.5" />, label: "Pet Friendly" },
  "Smoking Allowed": { icon: <CigaretteOff className="h-3.5 w-3.5" />, label: "Smoking Allowed" },
  "No Smoking": { icon: <CigaretteOff className="h-3.5 w-3.5" />, label: "No Smoking" },
};

interface PassengerBooking extends TripBooking {
  passenger?: Profile;
}

export default function TripDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [bookedPassengers, setBookedPassengers] = useState<PassengerBooking[]>([]);
  const [userBooking, setUserBooking] = useState<PassengerBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Search context - used for route highlighting and segment pricing
  const searchFrom = searchParams.get("searchFrom") || "";
  const searchTo = searchParams.get("searchTo") || "";
  const segmentPriceParam = searchParams.get("segmentPrice");
  const segmentDurationParam = searchParams.get("segmentDuration");
  const passengersParam = searchParams.get("passengers");
  
  // Parse segment pricing if available (for stopover bookings)
  const segmentPrice = segmentPriceParam ? parseFloat(segmentPriceParam) : null;
  const segmentDuration = segmentDurationParam ? parseInt(segmentDurationParam, 10) : null;
  
  // Initialize booking seats from URL params (from search) or default to 1
  const [bookingSeats, setBookingSeats] = useState(() => {
    const fromUrl = passengersParam ? parseInt(passengersParam, 10) : 1;
    return Math.max(1, fromUrl);
  });

  useEffect(() => {
    if (id) {
      fetchTripDetails();
      fetchBookedPassengers();
    }
  }, [id]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("trips")
        .select(`
          *,
          driver:profiles!trips_driver_id_fkey(
            id, 
            full_name, 
            avatar_url, 
            phone,
            driver_profile:driver_profiles(average_rating, total_trips)
          ),
          vehicle:vehicles!trips_vehicle_id_fkey(vehicle_type, make, model, registration_number, color, images, license_plate),
          route:routes!trips_route_id_fkey(
            departure_location,
            arrival_location,
            departure_address,
            arrival_address,
            departure_lat,
            departure_lng,
            arrival_lat,
            arrival_lng,
            origin_lat,
            origin_lon,
            destination_lat,
            destination_lon,
            route_geometry,
            distance_km,
            estimated_duration_minutes
          )
        `)
        .eq("id", id)
        .single();

      if (queryError) throw queryError;

      const transformedTrip: TripWithDetails = {
        ...data,
        departure_location: data.route?.departure_location,
        arrival_location: data.route?.arrival_location,
        departure_address: data.route?.departure_address,
        arrival_address: data.route?.arrival_address,
        departure_lat: data.route?.origin_lat || data.route?.departure_lat,
        departure_lng: data.route?.origin_lon || data.route?.departure_lng,
        arrival_lat: data.route?.destination_lat || data.route?.arrival_lat,
        arrival_lng: data.route?.destination_lon || data.route?.arrival_lng,
        route_geometry: data.route?.route_geometry,
        distance_km: data.route?.distance_km,
        duration_minutes: data.route?.estimated_duration_minutes,
        driver_name: data.driver?.full_name,
        driver_avatar: data.driver?.avatar_url,
        driver_rating: data.driver?.driver_profile?.average_rating,
        driver_profile: data.driver?.driver_profile,
        vehicle_name: data.vehicle ? `${data.vehicle.make} ${data.vehicle.model}` : null,
      };

      setTrip(transformedTrip);
    } catch (err) {
      console.error("Error fetching trip details:", err);
      setError(err instanceof Error ? err.message : "Failed to load trip details");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedPassengers = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          *,
          passenger:profiles!trip_bookings_passenger_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("trip_id", id)
        .in("booking_status", ["confirmed", "pending"]);

      if (error) throw error;
      setBookedPassengers(data || []);
      
      // Check if current user has a booking for this trip
      if (user && data) {
        const currentUserBooking = data.find(b => b.passenger_id === user.id);
        setUserBooking(currentUserBooking || null);
      }
    } catch (err) {
      console.error("Error fetching booked passengers:", err);
    }
  };

  // Fetch route from OSRM for map display
  const fetchRoute = async () => {
    if (!trip) return;
    
    const depLat = (trip as any).departure_lat;
    const depLng = (trip as any).departure_lng;
    const arrLat = (trip as any).arrival_lat;
    const arrLng = (trip as any).arrival_lng;
    
    // Check if stored route geometry exists
    if ((trip as any).route_geometry?.coordinates) {
      const coords = (trip as any).route_geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );
      setRouteCoordinates(coords);
      return;
    }
    
    if (!depLat || !depLng || !arrLat || !arrLng) return;
    
    setLoadingRoute(true);
    try {
      // Fetch route from OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${depLng},${depLat};${arrLng},${arrLat}?overview=full&geometries=geojson`;
      
      const response = await fetch(osrmUrl);
      const data = await response.json();
      
      if (data.routes && data.routes[0]?.geometry?.coordinates) {
        // OSRM returns [lng, lat], we need [lat, lng] for Leaflet
        const coords = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        setRouteCoordinates(coords);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleBookNow = () => {
    if (id) {
      navigate(`/trip-booking/book/${id}?seats=${bookingSeats}`);
    }
  };

  const handleContactDriver = () => {
    if (id) {
      navigate(`/trip-booking/chat/${id}`);
    }
  };

  const handleDriverProfileClick = () => {
    if (trip?.driver_id) {
      navigate(`/trip-booking/driver/${trip.driver_id}`);
    }
  };

  const handlePassengerClick = (passengerId: string) => {
    navigate(`/trip-booking/profile/${passengerId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !trip) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md w-full shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Car className="h-8 w-8 text-gray-400" />
            </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Trip Not Found
              </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || "The trip you're looking for doesn't exist or has been removed."}
              </p>
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const departureTime = new Date(trip.departure_time);
  let arrivalTime = new Date(trip.arrival_time);
  
  // Calculate duration from distance (average speed ~55 km/h for Indian roads)
  const calculateDurationFromDistance = (distanceKm: number) => {
    const AVERAGE_SPEED_KMH = 55;
    const totalMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalMinutes
    };
  };
  
  // Calculate duration - use segment duration if available (for stopover bookings)
  let displayHours: number;
  let displayMinutes: number;
  
  if (segmentDuration && segmentDuration > 0) {
    // Use segment-specific duration for stopovers
    displayHours = Math.floor(segmentDuration / 60);
    displayMinutes = segmentDuration % 60;
  } else if (trip.distance_km && trip.distance_km > 0) {
    // Calculate from distance (more reliable for long distances)
    const duration = calculateDurationFromDistance(trip.distance_km);
    displayHours = duration.hours;
    displayMinutes = duration.minutes;
    // Also recalculate arrival time
    arrivalTime = new Date(departureTime.getTime() + duration.totalMinutes * 60 * 1000);
  } else {
    // Calculate from times as fallback
    let durationMs = arrivalTime.getTime() - departureTime.getTime();
    if (durationMs < 0) durationMs += 24 * 60 * 60 * 1000;
    displayHours = Math.floor(durationMs / (1000 * 60 * 60));
    displayMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Sanity check: if duration seems too short for distance, recalculate
    const totalCalcMinutes = displayHours * 60 + displayMinutes;
    if (trip.distance_km && trip.distance_km > 100 && totalCalcMinutes < 60) {
      const duration = calculateDurationFromDistance(trip.distance_km);
      displayHours = duration.hours;
      displayMinutes = duration.minutes;
      arrivalTime = new Date(departureTime.getTime() + duration.totalMinutes * 60 * 1000);
    }
  }
  
  // Calculate price - use segment price if available (for stopover bookings)
  const pricePerSeat = segmentPrice !== null ? segmentPrice : parseFloat(String(trip.price_per_seat));
  const totalPrice = (pricePerSeat * bookingSeats).toFixed(2);

  // Check if user's search is different from trip's route (for highlighting)
  const isPartialRoute = searchFrom && searchTo && 
    (searchFrom !== trip.departure_location || searchTo !== trip.arrival_location);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">
                Trip Details
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(departureTime, "EEE, d MMM yyyy")}
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-4 pb-36 space-y-4">
          {/* Route Card with Highlighting */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between">
                {/* Timeline */}
              <div className="flex-1">
                  {/* Departure */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full mt-1",
                        isPartialRoute && searchFrom !== trip.departure_location
                          ? "bg-gray-300 dark:bg-gray-600"
                          : "bg-[#054752] dark:bg-teal-400"
                      )} />
                      <div className={cn(
                        "w-0.5 h-12 my-1",
                        isPartialRoute 
                          ? "bg-gradient-to-b from-gray-300 to-[#054752] dark:from-gray-600 dark:to-teal-400"
                          : "bg-gradient-to-b from-[#054752] to-gray-300 dark:from-teal-400 dark:to-gray-600"
                      )} />
                    </div>
                    <div className={cn(
                      isPartialRoute && searchFrom !== trip.departure_location && "opacity-50"
                    )}>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {format(departureTime, "HH:mm")}
                      </p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {trip.departure_location}
                      </p>
                      {(trip as any).departure_address && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {(trip as any).departure_address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Show user's boarding point if different */}
                  {isPartialRoute && searchFrom && searchFrom !== trip.departure_location && (
                    <div className="flex items-start gap-3 -mt-3 ml-1">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00b3a3] border-2 border-white dark:border-gray-800" />
                        <div className="w-0.5 h-8 bg-[#054752] dark:bg-teal-400 my-1" />
                      </div>
                      <div className="pt-0">
                        <p className="text-xs font-medium text-[#00b3a3]">Your boarding point</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {searchFrom}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Show user's drop point if different */}
                  {isPartialRoute && searchTo && searchTo !== trip.arrival_location && (
                    <div className="flex items-start gap-3 ml-1">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00b3a3] border-2 border-white dark:border-gray-800" />
                        <div className="w-0.5 h-8 bg-gradient-to-b from-[#054752] to-gray-300 dark:from-teal-400 dark:to-gray-600 my-1" />
                      </div>
                  <div>
                        <p className="text-xs font-medium text-[#00b3a3]">Your drop point</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {searchTo}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Arrival */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full mt-1",
                        isPartialRoute && searchTo !== trip.arrival_location
                          ? "bg-gray-300 dark:bg-gray-600"
                          : "bg-[#054752] dark:bg-teal-400"
                      )} />
                    </div>
                    <div className={cn(
                      isPartialRoute && searchTo !== trip.arrival_location && "opacity-50"
                    )}>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {format(arrivalTime, "HH:mm")}
                      </p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {trip.arrival_location}
                      </p>
                      {(trip as any).arrival_address && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {(trip as any).arrival_address}
                        </p>
                      )}
                    </div>
                  </div>
              </div>

                {/* Price */}
              <div className="text-right">
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    ₹{pricePerSeat.toFixed(0)}
                </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per seat</p>
                  {segmentPrice !== null && segmentPrice !== parseFloat(String(trip.price_per_seat)) && (
                    <p className="text-xs text-gray-400 line-through mt-0.5">
                      Full route: ₹{parseFloat(String(trip.price_per_seat)).toFixed(0)}
                    </p>
                  )}
              </div>
            </div>

              {/* Trip Info Bar */}
              <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                  <span>{displayHours > 0 ? `${displayHours}h ` : ''}{displayMinutes}m</span>
              </div>
                {trip.distance_km && (
                  <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{trip.distance_km} km</span>
              </div>
                )}
                <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{trip.available_seats} seats left</span>
              </div>
            </div>

            {/* View Route Button */}
            <Button
              variant="outline"
                className="w-full mt-4 h-11 rounded-xl border-gray-200 dark:border-gray-600 font-medium"
              onClick={() => setShowRouteMap(true)}
            >
                <Map className="h-4 w-4 mr-2" />
              View Route on Map
            </Button>
            </div>
          </div>

          {/* BlaBlaCar-Style Passenger/Price Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Total Price Summary - Prominent Display */}
            <div className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#054752]/10 dark:bg-teal-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#054752] dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#054752] dark:text-teal-400">
                      {bookingSeats} {bookingSeats === 1 ? 'passenger' : 'passengers'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ₹{pricePerSeat.toFixed(0)} per seat
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#054752] dark:text-teal-400">
                    ₹{totalPrice}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {trip.available_seats} seats available
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Information Card - Clickable */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
            onClick={handleDriverProfileClick}
          >
            <div className="p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Driver Information
            </h2>
            
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-gray-100 dark:border-gray-700">
                <AvatarImage src={trip.driver_avatar} alt={trip.driver_name} />
                    <AvatarFallback className="text-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {trip.driver_name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
                  {trip.driver_avatar && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00b3a3] rounded-full border-2 border-white dark:border-gray-800" />
                  )}
                </div>
              
                {/* Driver Info */}
              <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {trip.driver_name || "Driver"}
                </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {trip.driver_rating?.toFixed(1) || "4.5"}
                      </span>
                  </div>
                  <span>•</span>
                  <span>{trip.driver_profile?.total_trips || 0} trips</span>
                </div>
              </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              {/* Contact Button */}
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleContactDriver();
                }}
                className="w-full mt-4 rounded-xl border-gray-200 dark:border-gray-600"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact {trip.driver_name?.split(' ')[0] || "Driver"}
              </Button>

              {/* Verification Badges */}
              <div className="flex items-center gap-2 flex-wrap mt-4">
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="h-3 w-3 mr-1.5" />
                Verified Driver
              </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  <Shield className="h-3 w-3 mr-1.5" />
                Background Checked
              </Badge>
              </div>
            </div>
          </div>

          {/* Passengers Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Passengers
              </h2>
              
              {bookedPassengers.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <UserCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No passengers booked yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Be the first to book this ride!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookedPassengers.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => booking.passenger?.id && handlePassengerClick(booking.passenger.id)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={booking.passenger?.avatar_url} alt={booking.passenger?.full_name} />
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {booking.passenger?.full_name?.charAt(0) || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.passenger?.full_name || "Passenger"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {booking.pickup_location || trip.departure_location} → {booking.dropoff_location || trip.arrival_location}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Vehicle Details
            </h2>
              
              {/* Vehicle Image */}
              {trip.vehicle?.images && Array.isArray(trip.vehicle.images) && trip.vehicle.images.length > 0 && (
                <div className="mb-4">
                  <img
                    src={typeof trip.vehicle.images[0] === 'string' ? trip.vehicle.images[0] : trip.vehicle.images[0]?.url}
                    alt={`${trip.vehicle?.make} ${trip.vehicle?.model}`}
                    className="w-full h-40 sm:h-48 object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            
            <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {trip.vehicle?.vehicle_type || "Car"}
                    </span>
                  </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700" />
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Model</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {trip.vehicle_name || "N/A"}
                  </span>
              </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700" />
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">License Plate</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                    {trip.vehicle?.license_plate || trip.vehicle?.registration_number || "N/A"}
                  </span>
              </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700" />
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Color</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {trip.vehicle?.color || "N/A"}
                  </span>
              </div>
              </div>
            </div>
          </div>

          {/* Amenities Card */}
          {trip.amenities && trip.amenities.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-5">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                  {trip.amenities.map((amenity, index) => {
                    const amenityConfig = amenityIcons[amenity] || { icon: null, label: amenity };
                    return (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="rounded-full px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0"
                      >
                        {amenityConfig.icon && <span className="mr-1.5">{amenityConfig.icon}</span>}
                        {amenityConfig.label}
                  </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Bottom Booking Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            {/* Show Live Tracking button if trip is active */}
            {trip.status === 'active' && (
              <Button
                size="lg"
                onClick={() => navigate(`/trip-booking/tracking/${trip.id}`)}
                className="w-full mb-3 bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl font-semibold text-base shadow-sm gap-2"
              >
                <Navigation className="h-5 w-5 animate-pulse" />
                Live Tracking
              </Button>
            )}
            
            {/* Show different content based on booking status */}
            {userBooking ? (
              // User has already booked this trip
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Booking {userBooking.booking_status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {userBooking.seats_booked} {userBooking.seats_booked === 1 ? 'seat' : 'seats'} • ₹{userBooking.total_amount}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleContactDriver}
                    className="flex-1 h-11 gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message Driver
                  </Button>
                  {trip.status === 'active' && (
                    <Button
                      onClick={() => navigate(`/trip-booking/tracking/${trip.id}`)}
                      className="flex-1 h-11 bg-[#137fec] hover:bg-[#137fec]/90 gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      Track Ride
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              // User has not booked - show booking option
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Price</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                    ₹{totalPrice}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleBookNow}
                  className="bg-[#00b3a3] hover:bg-[#00a090] text-white px-6 sm:px-8 h-11 sm:h-12 rounded-xl font-semibold text-sm sm:text-base shadow-sm"
                >
                  Request to book
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Route Map Dialog */}
        <Dialog open={showRouteMap} onOpenChange={(open) => {
          setShowRouteMap(open);
          // Fetch route when dialog opens
          if (open && !routeCoordinates && trip) {
            fetchRoute();
          }
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 overflow-hidden rounded-2xl">
            <DialogTitle className="sr-only">Route Map</DialogTitle>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Trip Route
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {trip.departure_location} → {trip.arrival_location}
              </p>
              {loadingRoute && (
                <div className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="text-center">
                    <div className="h-8 w-8 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading route...</p>
                  </div>
                </div>
              )}
              {!loadingRoute && trip.departure_location && trip.arrival_location && (
                <RouteMap
                  origin={{
                    lat: (trip as any).departure_lat || 14.4426,
                    lon: (trip as any).departure_lng || 78.8242,
                    name: trip.departure_location,
                  }}
                  destination={{
                    lat: (trip as any).arrival_lat || 17.3850,
                    lon: (trip as any).arrival_lng || 78.4867,
                    name: trip.arrival_location,
                  }}
                  route={routeCoordinates || (trip as any).route_geometry?.coordinates?.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])}
                  height="min(70vh, 500px)"
                  showRoute={true}
                  interactive={true}
                />
              )}
              <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{trip.duration_minutes ? `${Math.floor(trip.duration_minutes / 60)}h ${trip.duration_minutes % 60}m` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.distance_km ? `${trip.distance_km.toFixed(1)} km` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
