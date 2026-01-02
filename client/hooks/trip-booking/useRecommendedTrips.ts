import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TripWithDetails } from "@shared/api";

export function useRecommendedTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendedTrips();
  }, [user]);

  const fetchRecommendedTrips = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get recommended trips based on user's booking history or popular routes
      const { data, error: queryError } = await supabase
        .from("trips")
        .select(`
          *,
          driver:profiles!trips_driver_id_fkey(
            id, 
            full_name, 
            avatar_url,
            driver_profile:driver_profiles(average_rating)
          ),
          vehicle:vehicles!trips_vehicle_id_fkey(vehicle_type, make, model),
          route:routes!trips_route_id_fkey(
            departure_location,
            arrival_location,
            distance_km,
            estimated_duration_minutes
          )
        `)
        .eq("status", "scheduled")
        .gt("available_seats", 0)
        .gte("departure_time", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (queryError) throw queryError;

      // Transform data
      const transformedData: TripWithDetails[] = (data || []).map((trip: any) => ({
        ...trip,
        departure_location: trip.route?.departure_location,
        arrival_location: trip.route?.arrival_location,
        distance_km: trip.route?.distance_km,
        duration_minutes: trip.route?.estimated_duration_minutes,
        driver_name: trip.driver?.full_name,
        driver_avatar: trip.driver?.avatar_url,
        driver_rating: trip.driver?.driver_profile?.average_rating,
        vehicle_name: trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : null,
      }));

      setTrips(transformedData);
    } catch (err) {
      console.error("Error fetching recommended trips:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch recommended trips");
      setTrips([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  return { trips, loading, error, refetch: fetchRecommendedTrips };
}

