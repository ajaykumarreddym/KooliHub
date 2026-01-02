import { UpcomingTripCard } from "../molecules/UpcomingTripCard";
import { TripBooking, Trip } from "@shared/api";
import { Skeleton } from "@/components/ui/skeleton";

interface UpcomingTripsSectionProps {
  bookings: TripBooking[];
  publishedTrips: Trip[];
  loading: boolean;
  onBookingClick: (booking: TripBooking) => void;
  onTripClick: (trip: Trip) => void;
}

export function UpcomingTripsSection({
  bookings,
  publishedTrips,
  loading,
  onBookingClick,
  onTripClick,
}: UpcomingTripsSectionProps) {
  const hasData = bookings.length > 0 || publishedTrips.length > 0;

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Upcoming Trips
        </h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Upcoming Trips
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No upcoming trips. Book a ride or publish your own!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Upcoming Trips
      </h2>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <UpcomingTripCard
            key={booking.id}
            booking={booking}
            type="booked"
            onClick={() => onBookingClick(booking)}
          />
        ))}
        {publishedTrips.map((trip) => (
          <UpcomingTripCard
            key={trip.id}
            trip={trip}
            type="published"
            onClick={() => onTripClick(trip)}
          />
        ))}
      </div>
    </div>
  );
}

