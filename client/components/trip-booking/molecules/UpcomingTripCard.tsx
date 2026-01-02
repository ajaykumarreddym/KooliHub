import { Trip, TripBooking } from "@shared/api";
import { format } from "date-fns";
import { Armchair, Car, ChevronRight } from "lucide-react";
import { TripStatusBadge } from "../atoms/TripStatusBadge";

interface UpcomingTripCardProps {
  booking?: TripBooking;
  trip?: Trip;
  type: "booked" | "published";
  onClick: () => void;
}

export function UpcomingTripCard({ booking, trip, type, onClick }: UpcomingTripCardProps) {
  const tripData = booking?.trip || trip;
  const departureDate = tripData?.departure_time ? new Date(tripData.departure_time) : new Date();

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl flex items-center space-x-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {type === "booked" ? (
          <Armchair className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <Car className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {tripData?.route?.departure_location || "Departure"} → {tripData?.route?.arrival_location || "Arrival"}
          </h4>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {format(departureDate, "d MMM")}
          </span>
        </div>
        
        {type === "booked" && booking ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Booked with {tripData?.driver?.full_name || "Driver"}
          </p>
        ) : trip ? (
          <div className="flex items-center gap-2">
            <TripStatusBadge status={trip.status} />
            <span className="text-sm text-green-600 dark:text-green-400">
              {trip.available_seats} seats left
            </span>
          </div>
        ) : null}
      </div>
      
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </div>
  );
}

