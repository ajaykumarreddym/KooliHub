import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  User, 
  Car,
  Navigation,
  RefreshCw,
  Share2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom driver icon
const DriverIcon = L.divIcon({
  html: `<div class="driver-marker"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#137fec" stroke="white" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c0 .1-.1.2-.1.4v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  className: 'driver-marker-container',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface TripTracking {
  id: string;
  trip_id: string;
  driver_id: string;
  location_lat: number;
  location_lng: number;
  speed_kmh: number;
  heading: number;
  timestamp: string;
}

interface TripDetails {
  id: string;
  status: string;
  departure_time: string;
  driver: {
    id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
  route: {
    departure_location: string;
    arrival_location: string;
    departure_lat: number;
    departure_lng: number;
    arrival_lat: number;
    arrival_lng: number;
    distance_km: number;
    estimated_duration_minutes: number;
    route_geometry?: { coordinates: [number, number][] };
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
    license_plate: string;
  };
}

export default function LiveTracking() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [tracking, setTracking] = useState<TripTracking | null>(null);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Map refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (tripId && user) {
      fetchTripDetails();
    }

    return () => {
      // Cleanup map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [tripId, user]);

  useEffect(() => {
    if (tripDetails && mapContainerRef.current && !mapRef.current) {
      initializeMap();
    }
  }, [tripDetails]);

  useEffect(() => {
    if (tripId) {
      const cleanup = subscribeToTracking();
      return () => cleanup?.();
    }
  }, [tripId]);

  const initializeMap = () => {
    if (!mapContainerRef.current || !tripDetails) return;

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add departure marker
    const depLat = tripDetails.route.departure_lat || 14.4426;
    const depLng = tripDetails.route.departure_lng || 78.8242;
    const arrLat = tripDetails.route.arrival_lat || 17.3850;
    const arrLng = tripDetails.route.arrival_lng || 78.4867;

    L.marker([depLat, depLng], {
      icon: L.divIcon({
        html: '<div class="pickup-marker"><div class="pickup-dot"></div></div>',
        className: 'pickup-marker-container',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    })
      .addTo(mapRef.current)
      .bindPopup(`<b>Pickup</b><br/>${tripDetails.route.departure_location}`);

    // Add destination marker
    L.marker([arrLat, arrLng], {
      icon: L.divIcon({
        html: '<div class="dropoff-marker"><div class="dropoff-dot"></div></div>',
        className: 'dropoff-marker-container',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    })
      .addTo(mapRef.current)
      .bindPopup(`<b>Destination</b><br/>${tripDetails.route.arrival_location}`);

    // Add route line if available
    if (tripDetails.route.route_geometry?.coordinates) {
      const routeCoords = tripDetails.route.route_geometry.coordinates.map(
        (coord) => [coord[1], coord[0]] as [number, number]
      );
      routeLineRef.current = L.polyline(routeCoords, {
        color: "#137fec",
        weight: 4,
        opacity: 0.7,
      }).addTo(mapRef.current);
    } else {
      // Draw simple line
      routeLineRef.current = L.polyline([[depLat, depLng], [arrLat, arrLng]], {
        color: "#137fec",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(mapRef.current);
    }

    // Fit bounds
    const bounds = L.latLngBounds([
      [depLat, depLng],
      [arrLat, arrLng],
    ]);
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });

    // Add driver marker if tracking exists
    if (tracking) {
      updateDriverPosition(tracking);
    }
  };

  const updateDriverPosition = (trackingData: TripTracking) => {
    if (!mapRef.current) return;

    const { location_lat, location_lng, heading } = trackingData;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([location_lat, location_lng]);
    } else {
      driverMarkerRef.current = L.marker([location_lat, location_lng], {
        icon: DriverIcon,
        rotationAngle: heading,
      })
        .addTo(mapRef.current)
        .bindPopup(`<b>${tripDetails?.driver.full_name}</b><br/>${tripDetails?.vehicle.make} ${tripDetails?.vehicle.model}`);
    }

    // Optionally pan to driver
    // mapRef.current.panTo([location_lat, location_lng]);
  };

  const fetchTripDetails = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("trips")
        .select(`
          id,
          status,
          departure_time,
          driver:profiles!trips_driver_id_fkey(
            id,
            full_name,
            avatar_url,
            phone
          ),
          route:routes!trips_route_id_fkey(
            departure_location,
            arrival_location,
            departure_lat,
            departure_lng,
            arrival_lat,
            arrival_lng,
            origin_lat,
            origin_lon,
            destination_lat,
            destination_lon,
            distance_km,
            estimated_duration_minutes,
            route_geometry
          ),
          vehicle:vehicles!trips_vehicle_id_fkey(
            make,
            model,
            color,
            license_plate
          )
        `)
        .eq("id", tripId)
        .single();

      if (error) throw error;

      const transformedData: TripDetails = {
        ...data,
        driver: Array.isArray(data.driver) ? data.driver[0] : data.driver,
        route: {
          ...(Array.isArray(data.route) ? data.route[0] : data.route),
          departure_lat: data.route?.origin_lat || data.route?.departure_lat,
          departure_lng: data.route?.origin_lon || data.route?.departure_lng,
          arrival_lat: data.route?.destination_lat || data.route?.arrival_lat,
          arrival_lng: data.route?.destination_lon || data.route?.arrival_lng,
        },
        vehicle: Array.isArray(data.vehicle) ? data.vehicle[0] : data.vehicle,
      };

      setTripDetails(transformedData);
      calculateProgress(transformedData);

      // Fetch latest tracking
      try {
      const { data: trackingData } = await supabase
        .from("trip_tracking")
        .select("*")
        .eq("trip_id", tripId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (trackingData) {
        setTracking(trackingData);
          setLastUpdate(new Date(trackingData.timestamp));
        }
      } catch (e) {
        // No tracking data yet, that's okay
      }
    } catch (error: any) {
      console.error("Error fetching trip details:", error);
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTracking = () => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip-tracking-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_tracking",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const newTracking = payload.new as TripTracking;
          setTracking(newTracking);
          setLastUpdate(new Date(newTracking.timestamp));
          updateDriverPosition(newTracking);
          if (tripDetails) {
            calculateProgressFromLocation(newTracking, tripDetails);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const calculateProgress = (trip: TripDetails) => {
    const departureTime = new Date(trip.departure_time);
    const now = new Date();
    const totalDuration = trip.route.estimated_duration_minutes * 60 * 1000;
    const elapsed = now.getTime() - departureTime.getTime();
    const progressPercent = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    
    setProgress(progressPercent);

    // Calculate ETA
    const remainingMinutes = Math.max(
      0,
      trip.route.estimated_duration_minutes - Math.floor(elapsed / 60000)
    );
    
    if (remainingMinutes > 60) {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      setEta(`${hours}h ${mins}m`);
    } else {
      setEta(`${remainingMinutes}m`);
    }
  };

  const calculateProgressFromLocation = (trackingData: TripTracking, trip: TripDetails) => {
    // Calculate progress based on driver's current position
    const depLat = trip.route.departure_lat || 14.4426;
    const depLng = trip.route.departure_lng || 78.8242;
    const arrLat = trip.route.arrival_lat || 17.3850;
    const arrLng = trip.route.arrival_lng || 78.4867;
    
    // Calculate distances
    const totalDist = getDistanceKm(depLat, depLng, arrLat, arrLng);
    const coveredDist = getDistanceKm(depLat, depLng, trackingData.location_lat, trackingData.location_lng);
    const remainingDist = getDistanceKm(trackingData.location_lat, trackingData.location_lng, arrLat, arrLng);
    
    const progressPercent = Math.min((coveredDist / totalDist) * 100, 100);
    setProgress(progressPercent);
    
    // Calculate ETA based on remaining distance and speed
    const avgSpeed = trackingData.speed_kmh > 0 ? trackingData.speed_kmh : 40;
    const remainingMinutes = Math.round((remainingDist / avgSpeed) * 60);
    
    if (remainingMinutes > 60) {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      setEta(`${hours}h ${mins}m`);
    } else {
      setEta(`${remainingMinutes}m`);
    }
  };

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleCall = () => {
    if (tripDetails?.driver.phone) {
      window.location.href = `tel:${tripDetails.driver.phone}`;
    }
  };

  const handleMessage = () => {
    navigate(`/trip-booking/chat/${tripId}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Track my ride",
        text: `Following my trip from ${tripDetails?.route.departure_location} to ${tripDetails?.route.arrival_location}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!" });
    }
  };

  const handleRefresh = () => {
    fetchTripDetails();
    toast({ title: "Refreshing..." });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-lg mx-auto lg:max-w-3xl p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[300px] sm:h-[400px] w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!tripDetails) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Trip Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to find this trip for tracking.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
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
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-lg mx-auto lg:max-w-3xl px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Live Tracking
            </h1>
              {lastUpdate && (
                <p className="text-xs text-gray-500">
                  Updated {differenceInMinutes(new Date(), lastUpdate)} min ago
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="rounded-full h-9 w-9"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="rounded-full h-9 w-9"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Map */}
        <div className="relative h-[280px] sm:h-[350px] lg:h-[400px]">
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />
          
          {/* No tracking overlay */}
          {!tracking && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 text-center shadow-lg max-w-xs">
                <Navigation className="h-10 w-10 sm:h-12 sm:w-12 text-[#137fec] mx-auto mb-3 animate-pulse" />
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  Waiting for driver
              </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Location will appear once trip starts
              </p>
            </div>
          </div>
          )}

          {/* Speed indicator */}
          {tracking && tracking.speed_kmh > 0 && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-lg z-10">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Speed</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {Math.round(tracking.speed_kmh)} km/h
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto lg:max-w-3xl p-3 sm:p-4 space-y-4 sm:space-y-6 pb-24">
          {/* Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#137fec]" />
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                  ETA: {eta || "Calculating..."}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center justify-between mt-3 sm:mt-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 max-w-[45%]">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#137fec] shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {tripDetails.route.departure_location}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 max-w-[45%] justify-end">
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {tripDetails.route.arrival_location}
                </span>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#137fec] shrink-0" />
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-3 sm:mb-4">Your Driver</h3>
            
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              {tripDetails.driver.avatar_url ? (
                <img
                  src={tripDetails.driver.avatar_url}
                  alt={tripDetails.driver.full_name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {tripDetails.driver.full_name}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {tripDetails.vehicle.make} {tripDetails.vehicle.model}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span className="capitalize">{tripDetails.vehicle.color}</span> • {tripDetails.vehicle.license_plate}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCall}
                variant="outline"
                className="h-10 sm:h-12 gap-2 text-sm"
                disabled={!tripDetails.driver.phone}
              >
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button
                onClick={handleMessage}
                variant="outline"
                className="h-10 sm:h-12 gap-2 text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-3 sm:mb-4">Trip Details</h3>
            
            <div className="space-y-2.5 sm:space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Departure Time</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(tripDetails.departure_time), "h:mm a")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Distance</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {tripDetails.route.distance_km?.toFixed(1) || '—'} km
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  tripDetails.status === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {tripDetails.status === "active" ? "In Progress" : tripDetails.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .driver-marker-container {
          background: transparent;
        }
        .driver-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #137fec;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .pickup-marker-container,
        .dropoff-marker-container {
          background: transparent;
        }
        .pickup-dot {
          width: 14px;
          height: 14px;
          background: #137fec;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .dropoff-dot {
          width: 14px;
          height: 14px;
          background: #00c853;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </Layout>
  );
}
