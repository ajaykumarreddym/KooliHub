import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TripWithDetails } from "@shared/api";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";

interface TripRecommendationCardProps {
  trip: TripWithDetails;
  onClick: () => void;
}

export function TripRecommendationCard({ trip, onClick }: TripRecommendationCardProps) {
  const departureDate = trip.departure_time ? new Date(trip.departure_time) : new Date();
  
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[280px] bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {trip.departure_location} → {trip.arrival_location}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(departureDate, "EEEE, d MMM")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#137fec]">₹{trip.price_per_seat}</p>
          <p className="text-xs text-gray-500">/seat</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={trip.driver_avatar} alt={trip.driver_name} />
            <AvatarFallback>{trip.driver_name?.charAt(0) || "D"}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            with {trip.driver_name || "Driver"}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

