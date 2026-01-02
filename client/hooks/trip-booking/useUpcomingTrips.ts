import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TripBooking, Trip } from "@shared/api";

export function useUpcomingTrips() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<TripBooking[]>([]);
  const [publishedTrips, setPublishedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setPublishedTrips([]);
      setLoading(false);
      return;
    }

    fetchUpcomingTrips();
  }, [user]);

  const fetchUpcomingTrips = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user's bookings - Need to use inner join filtering differently
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("trip_bookings")
        .select(`
          *,
          trip:trips!trip_bookings_trip_id_fkey(
            *,
            driver:profiles!trips_driver_id_fkey(id, full_name, avatar_url),
            route:routes!trips_route_id_fkey(departure_location, arrival_location)
          )
        `)
        .eq("passenger_id", user.id)
        .in("booking_status", ["pending", "confirmed"])
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Filter bookings to only include future trips (client-side filtering)
      const filteredBookings = (bookingsData || []).filter(booking => {
        const departureTime = booking.trip?.departure_time;
        if (!departureTime) return false;
        return new Date(departureTime) >= new Date();
      });

      // Fetch user's published trips (if they're a driver)
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select(`
          *,
          route:routes!trips_route_id_fkey(departure_location, arrival_location)
        `)
        .eq("driver_id", user.id)
        .in("status", ["scheduled", "active"])
        .gte("departure_time", new Date().toISOString())
        .order("departure_time", { ascending: true });

      if (tripsError) throw tripsError;

      setBookings(filteredBookings);
      setPublishedTrips(tripsData || []);
    } catch (err) {
      console.error("Error fetching upcoming trips:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch upcoming trips");
      setBookings([]);
      setPublishedTrips([]);
    } finally {
      setLoading(false);
    }
  };

  return { bookings, publishedTrips, loading, error, refetch: fetchUpcomingTrips };
}

