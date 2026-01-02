import { TripTracking, Trip } from "@shared/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MapPin, Navigation, Clock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

interface LiveTripTrackingProps {
  trip: Trip;
  tracking?: TripTracking;
}

export function LiveTripTracking({ trip, tracking }: LiveTripTrackingProps) {
  // Calculate ETA and progress
  const now = new Date();
  const departure = trip.departure_time ? new Date(trip.departure_time) : now;
  const arrival = trip.arrival_time ? new Date(trip.arrival_time) : now;
  const totalMinutes = differenceInMinutes(arrival, departure);
  const elapsedMinutes = differenceInMinutes(now, departure);
  const remainingMinutes = differenceInMinutes(arrival, now);
  const progress = totalMinutes > 0 ? Math.min((elapsedMinutes / totalMinutes) * 100, 100) : 0;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
      <div className="flex items-center mb-3">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={trip.driver?.avatar_url} alt={trip.driver?.full_name} />
          <AvatarFallback>{trip.driver?.full_name?.charAt(0) || "D"}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">
            Trip to {trip.route?.arrival_location || "Destination"} with {trip.driver?.full_name || "Driver"}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            En route
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-semibold text-[#137fec]">
            {remainingMinutes > 0 ? formatTime(remainingMinutes) : "Arriving"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ETA {arrival ? format(arrival, "HH:mm") : "--:--"}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Navigation className="h-4 w-4 mr-2 text-[#137fec]" />
          <span>{trip.route?.departure_location || "Departure"}</span>
          <span className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-600 mx-2"></span>
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span>{trip.route?.arrival_location || "Arrival"}</span>
        </div>
        
        <Progress value={progress} className="h-2.5" />
        
        {tracking && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            <Clock className="h-3 w-3 mr-1" />
            <span>Last updated {format(new Date(tracking.timestamp), "HH:mm")}</span>
            {tracking.speed_kmh && (
              <span className="ml-2">• {tracking.speed_kmh.toFixed(0)} km/h</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

