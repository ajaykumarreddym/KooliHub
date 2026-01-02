import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TripWithDetails } from "@shared/api";
import { format } from "date-fns";
import { Briefcase, Car, MapPin, PawPrint, Target, Users, Zap } from "lucide-react";

interface TripWithMatchScore extends TripWithDetails {
  matchScore?: number;
  pickupDistanceKm?: number;
  dropoffDistanceKm?: number;
  matchType?: 'origin-destination' | 'stopover-destination' | 'origin-stopover' | 'stopover-stopover' | 'text-match';
  matchedFrom?: string;
  matchedTo?: string;
  // Calculated fields for stopover pricing
  segmentPrice?: number;
  segmentDurationMinutes?: number;
  estimatedDepartureTime?: string;
  estimatedArrivalTime?: string;
  priceCalculationMethod?: string;
  distance_km?: number;
}

// Calculate duration from distance (average speed ~55 km/h for Indian roads)
function calculateDurationFromDistance(distanceKm: number): { hours: number; minutes: number } {
  const AVERAGE_SPEED_KMH = 55;
  const totalMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
}

interface TripResultCardProps {
  trip: TripWithMatchScore;
  onClick: () => void;
  searchFrom?: string;
  searchTo?: string;
}

// Calculate duration from departure to arrival times
function calculateDuration(departureTime: string, arrivalTime: string): { hours: number; minutes: number; totalMinutes: number } {
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);
  
  let durationMs = arrival.getTime() - departure.getTime();
  
  // Handle negative duration (arrival time is before departure - likely next day)
  if (durationMs < 0) {
    durationMs += 24 * 60 * 60 * 1000; // Add 24 hours
  }
  
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return { hours, minutes, totalMinutes };
}

// Format duration string
function formatDuration(hours: number, minutes: number): string {
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

export function TripResultCard({ trip, onClick, searchFrom, searchTo }: TripResultCardProps) {
  // Determine if this is a stopover match
  const isStopoverMatch = trip.matchType && trip.matchType !== 'origin-destination';
  
  // Use segment-specific times for stopovers, otherwise use full trip times
  const departureTimeStr = isStopoverMatch && trip.estimatedDepartureTime 
    ? trip.estimatedDepartureTime 
    : trip.departure_time;
  const arrivalTimeStr = isStopoverMatch && trip.estimatedArrivalTime 
    ? trip.estimatedArrivalTime 
    : (trip.arrival_time || trip.departure_time);
  
  const departureTime = departureTimeStr ? new Date(departureTimeStr) : new Date();
  let arrivalTime = arrivalTimeStr ? new Date(arrivalTimeStr) : new Date();
  
  // Recalculate arrival time if it seems incorrect (same as departure or before)
  // This happens when the database arrival_time is not properly set
  if (arrivalTime.getTime() <= departureTime.getTime() || 
      (arrivalTime.getTime() - departureTime.getTime()) < 30 * 60 * 1000) {
    // Arrival seems wrong - calculate from distance if available
    if (trip.distance_km && trip.distance_km > 0) {
      const durationMs = (trip.distance_km / 55) * 60 * 60 * 1000; // 55 km/h average
      arrivalTime = new Date(departureTime.getTime() + durationMs);
    }
  }
  
  // Use segment duration if available, otherwise calculate
  let displayDuration: { hours: number; minutes: number };
  
  if (isStopoverMatch && trip.segmentDurationMinutes && trip.segmentDurationMinutes > 0) {
    // Use pre-calculated segment duration for stopover matches
    displayDuration = {
      hours: Math.floor(trip.segmentDurationMinutes / 60),
      minutes: trip.segmentDurationMinutes % 60
    };
  } else if (trip.duration_minutes && trip.duration_minutes > 0) {
    // Use trip's stored duration for full route
    displayDuration = {
      hours: Math.floor(trip.duration_minutes / 60),
      minutes: trip.duration_minutes % 60
    };
  } else if (trip.distance_km && trip.distance_km > 0) {
    // Calculate from distance if available (more reliable for long distances)
    displayDuration = calculateDurationFromDistance(trip.distance_km);
  } else {
    // Calculate from times as last fallback
    const { hours, minutes } = calculateDuration(departureTimeStr, arrivalTimeStr);
    displayDuration = { hours, minutes };
  }
  
  // Sanity check: if duration seems too short for the distance, recalculate
  const totalDisplayMinutes = displayDuration.hours * 60 + displayDuration.minutes;
  if (trip.distance_km && trip.distance_km > 100 && totalDisplayMinutes < 60) {
    // For distances > 100km, duration should be at least ~1 hour
    displayDuration = calculateDurationFromDistance(trip.distance_km);
  }
  
  const isFull = trip.available_seats === 0;
  const isLowSeats = trip.available_seats > 0 && trip.available_seats <= 2;
  const hasInstantBooking = trip.amenities?.includes("Instant Booking");
  
  // Calculate price - use segment price for stopovers, otherwise full price
  const displayPrice = isStopoverMatch && trip.segmentPrice !== undefined 
    ? trip.segmentPrice 
    : parseFloat(String(trip.price_per_seat) || "0");
  
  // Format duration string
  const durationStr = formatDuration(displayDuration.hours, displayDuration.minutes);

  // Determine display locations - show matched segment for stopovers
  const displayFrom = trip.matchedFrom || trip.departure_location || "Departure";
  const displayTo = trip.matchedTo || trip.arrival_location || "Arrival";

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer",
        isFull && "opacity-75"
      )}
    >
      {/* Main Content */}
      <div className="p-4">
        {/* Timeline Section */}
        <div className="flex items-start justify-between">
          {/* Left: Time and Route */}
          <div className="flex-1">
            {/* Timeline Header */}
            <div className="flex items-center gap-2 mb-3">
              {/* Departure Time */}
              <span className="text-base font-semibold text-gray-900 dark:text-white min-w-[45px]">
                {format(departureTime, "HH:mm")}
              </span>
              
              {/* Timeline Connector */}
              <div className="flex items-center flex-1 max-w-[200px]">
                <div className="w-2 h-2 rounded-full bg-[#054752] dark:bg-teal-400" />
                <div className="flex-1 h-[2px] bg-gray-300 dark:bg-gray-600 relative">
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1">
                    {durationStr}
              </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#054752] dark:bg-teal-400" />
          </div>

              {/* Arrival Time */}
              <span className="text-base font-semibold text-gray-900 dark:text-white min-w-[45px]">
                {format(arrivalTime, "HH:mm")}
              </span>
            </div>

            {/* Locations */}
            <div className="flex items-start justify-between">
              <div className="flex-1 max-w-[45%]">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isStopoverMatch && trip.matchedFrom 
                    ? "text-gray-900 dark:text-white" 
                    : "text-gray-900 dark:text-white"
                )}>
                  {displayFrom}
                </p>
              </div>
              <div className="flex-1 max-w-[45%] text-right">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isStopoverMatch && trip.matchedTo 
                    ? "text-gray-900 dark:text-white" 
                    : "text-gray-900 dark:text-white"
                )}>
                  {displayTo}
                </p>
              </div>
                </div>

            {/* Show original route for stopovers - grayed out */}
            {isStopoverMatch && (trip.departure_location !== displayFrom || trip.arrival_location !== displayTo) && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                <span>Full route: {trip.departure_location}</span>
                <span>→</span>
                <span>{trip.arrival_location}</span>
                </div>
              )}
            </div>

          {/* Right: Price or Full Badge */}
          <div className="ml-4 text-right min-w-[80px]">
            {isFull ? (
              <span className="text-xl font-bold text-[#054752] dark:text-teal-400">
                Full
              </span>
            ) : (
              <div>
                <span className="text-xl font-bold text-[#054752] dark:text-teal-400">
                  ₹{displayPrice.toFixed(0)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">.00</span>
              </div>
            )}
          </div>
        </div>

        {/* Driver Section */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Vehicle Icon */}
          <div className="text-[#8fb8c7] dark:text-teal-600">
            <Car className="h-5 w-5" />
      </div>

          {/* Driver Avatar */}
          <div className="relative">
            <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-700 shadow-sm">
              <AvatarImage src={trip.driver_avatar} alt={trip.driver_name} />
              <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium">
                {trip.driver_name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            {trip.driver_avatar && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00b3a3] rounded-full border-2 border-white dark:border-gray-800" />
            )}
          </div>
          
          {/* Driver Name & Rating */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {trip.driver_name || "Driver"}
              </span>
            <div className="flex items-center gap-0.5">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {trip.driver_rating?.toFixed(1) || "4.5"}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            {/* Seats */}
            {!isFull && (
              <div className="flex items-center gap-1 text-sm" title="Available seats">
                <Users className="h-4 w-4" />
                <span>Max. {trip.available_seats}</span>
              </div>
            )}

            {/* Amenity indicators */}
            {trip.amenities?.includes("Luggage Space") && (
              <span title="Luggage allowed">
                <Briefcase className="h-4 w-4" />
              </span>
            )}
            {trip.amenities?.includes("Pet Friendly") && (
              <span title="Pets allowed">
                <PawPrint className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>

        {/* Instant Booking / Match Info Row */}
        {(hasInstantBooking || trip.matchScore !== undefined) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Instant Booking Badge */}
            {hasInstantBooking && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Instant Booking</span>
        </div>
      )}
      
            {/* Match Score */}
      {trip.matchScore !== undefined && (
          <Badge 
            variant="secondary"
                className={cn(
                  "text-xs font-medium",
                  trip.matchScore >= 80 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : trip.matchScore >= 50 
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                      : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}
          >
            <Target className="h-3 w-3 mr-1" />
            {trip.matchScore}% match
          </Badge>
            )}
          
            {/* Distance indicator */}
          {trip.pickupDistanceKm !== undefined && trip.pickupDistanceKm > 0 && trip.pickupDistanceKm !== Infinity && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MapPin className="h-3 w-3 text-emerald-500" />
                <span>
                {trip.pickupDistanceKm < 1 
                  ? `${Math.round(trip.pickupDistanceKm * 1000)}m away`
                  : `${trip.pickupDistanceKm.toFixed(1)}km away`}
              </span>
            </div>
          )}
        </div>
      )}

        {/* Match Type Badge */}
        {trip.matchType && trip.matchType !== 'origin-destination' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Badge 
              variant="outline"
              className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs"
            >
              🚏 {trip.matchType === 'stopover-destination' ? 'Board at stopover' : 
                  trip.matchType === 'origin-stopover' ? 'Alight at stopover' : 
                  trip.matchType === 'stopover-stopover' ? 'Stopover to stopover' : 'Route match'}
            </Badge>
            
            {(trip.matchedFrom || trip.matchedTo) && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {trip.matchedFrom || trip.departure_location} → {trip.matchedTo || trip.arrival_location}
              </span>
            )}
          </div>
        )}

        {/* Low Seats Warning */}
      {isLowSeats && (
          <div className="mt-3">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Only {trip.available_seats} {trip.available_seats === 1 ? 'seat' : 'seats'} left!
            </span>
        </div>
      )}
      </div>
    </div>
  );
}
