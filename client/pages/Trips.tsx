import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Trip Booking Components
import { PublishRideCTA } from "@/components/trip-booking/molecules/PublishRideCTA";
import { TripSearchForm } from "@/components/trip-booking/molecules/TripSearchForm";
import { BottomNavigation } from "@/components/trip-booking/organisms/BottomNavigation";
import { LiveTripTracking } from "@/components/trip-booking/organisms/LiveTripTracking";
import { RecommendedTripsSection } from "@/components/trip-booking/organisms/RecommendedTripsSection";
import { UpcomingTripsSection } from "@/components/trip-booking/organisms/UpcomingTripsSection";

// Custom Hooks
import { useLiveTracking } from "@/hooks/trip-booking/useLiveTracking";
import { useRecommendedTrips } from "@/hooks/trip-booking/useRecommendedTrips";
import { useTripSearch } from "@/hooks/trip-booking/useTripSearch";
import { useUpcomingTrips } from "@/hooks/trip-booking/useUpcomingTrips";

import { Trip, TripBooking, TripWithDetails } from "@shared/api";

export default function Trips() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Custom hooks for data
  const { searchTrips } = useTripSearch();
  const { bookings, publishedTrips, loading: upcomingLoading } = useUpcomingTrips();
  const { activeTrip, tracking, loading: trackingLoading } = useLiveTracking();
  const { trips: recommendedTrips, loading: recommendedLoading } = useRecommendedTrips();

  const handleSearch = (criteria: { 
    from: string; 
    to: string; 
    date: string; 
    vehicleType: any; 
    passengers: number;
    fromCoords?: { lat: number; lon: number };
    toCoords?: { lat: number; lon: number };
  }) => {
    searchTrips(criteria);
    
    // Build search params including coordinates for geo-matching
    const params = new URLSearchParams({
      from: criteria.from,
      to: criteria.to,
      date: criteria.date,
      passengers: criteria.passengers.toString(),
    });
    
    // Add coordinates if available for 5km radius geo-matching
    if (criteria.fromCoords) {
      params.set('fromLat', criteria.fromCoords.lat.toString());
      params.set('fromLon', criteria.fromCoords.lon.toString());
    }
    if (criteria.toCoords) {
      params.set('toLat', criteria.toCoords.lat.toString());
      params.set('toLon', criteria.toCoords.lon.toString());
    }
    
    navigate(`/trip-booking/search?${params.toString()}`);
  };

  const handleTripClick = (trip: TripWithDetails) => {
    navigate(`/trip-booking/trip/${trip.id}`);
  };

  const handleBookingClick = (booking: TripBooking) => {
    navigate(`/trip-booking/booking/${booking.id}`);
  };

  const handlePublishedTripClick = (trip: Trip) => {
    navigate(`/trip-booking/my-trip/${trip.id}`);
  };

  return (
    <>
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Where to?
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Your next adventure awaits!
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigate("/trip-booking/notifications")}
                  aria-label="Notifications"
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => navigate("/trip-booking/profile")}
                  aria-label="Profile"
                  className="rounded-full hover:ring-2 hover:ring-[#054752]/30 transition-all"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-[#054752] text-white">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>

            {/* Search Form */}
            <div className="mb-6">
              <TripSearchForm onSearch={handleSearch} />
            </div>

            {/* Publish Ride CTA */}
            <div className="mb-6">
              <PublishRideCTA />
            </div>

            {/* Live Trip Tracking */}
            {!trackingLoading && activeTrip && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Live Trip Tracking
                </h2>
                <LiveTripTracking trip={activeTrip} tracking={tracking || undefined} />
              </div>
            )}

            {/* Personalized Ride Recommendations */}
            <RecommendedTripsSection
              trips={recommendedTrips}
              loading={recommendedLoading}
              onTripClick={handleTripClick}
            />

            {/* Upcoming Trips */}
            <UpcomingTripsSection
              bookings={bookings}
              publishedTrips={publishedTrips}
              loading={upcomingLoading}
              onBookingClick={handleBookingClick}
              onTripClick={handlePublishedTripClick}
            />
          </main>
        </div>
      </Layout>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </>
  );
}
