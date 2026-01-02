import { TripRecommendationCard } from "../molecules/TripRecommendationCard";
import { TripWithDetails } from "@shared/api";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendedTripsSectionProps {
  trips: TripWithDetails[];
  loading: boolean;
  onTripClick: (trip: TripWithDetails) => void;
}

export function RecommendedTripsSection({ trips, loading, onTripClick }: RecommendedTripsSectionProps) {
  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Personalized Ride Recommendations
        </h2>
        <div className="flex overflow-x-auto space-x-4 -mx-4 px-4 pb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-[280px] h-[120px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Personalized Ride Recommendations
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No recommended trips at the moment. Start searching to find rides!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Personalized Ride Recommendations
      </h2>
      <div className="flex overflow-x-auto space-x-4 -mx-4 px-4 pb-4 scrollbar-hide">
        {trips.map((trip) => (
          <TripRecommendationCard
            key={trip.id}
            trip={trip}
            onClick={() => onTripClick(trip)}
          />
        ))}
      </div>
    </div>
  );
}

