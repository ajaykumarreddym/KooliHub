import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Trip, TripTracking } from "@shared/api";

export function useLiveTracking() {
  const { user } = useAuth();
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [tracking, setTracking] = useState<TripTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setActiveTrip(null);
      setTracking(null);
      setLoading(false);
      return;
    }

    fetchActiveTrip();

    // Subscribe to real-time tracking updates
    const trackingSubscription = supabase
      .channel("trip-tracking")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_tracking",
        },
        (payload) => {
          if (activeTrip && payload.new.trip_id === activeTrip.id) {
            setTracking(payload.new as TripTracking);
          }
        }
      )
      .subscribe();

    return () => {
      trackingSubscription.unsubscribe();
    };
  }, [user, activeTrip?.id]);

  const fetchActiveTrip = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check for active trip as passenger
      const { data: bookingsData } = await supabase
        .from("trip_bookings")
        .select(`
          *,
          trip:trips!trip_bookings_trip_id_fkey(
            *,
            driver:profiles!trips_driver_id_fkey(id, full_name, avatar_url),
            route:routes!trips_route_id_fkey(*)
          )
        `)
        .eq("passenger_id", user.id)
        .eq("booking_status", "confirmed")
        .eq("trip.status", "active")
        .single();

      if (bookingsData?.trip) {
        setActiveTrip(bookingsData.trip as Trip);
        
        // Fetch latest tracking
        const { data: trackingData } = await supabase
          .from("trip_tracking")
          .select("*")
          .eq("trip_id", bookingsData.trip.id)
          .order("timestamp", { ascending: false })
          .limit(1)
          .single();

        if (trackingData) {
          setTracking(trackingData);
        }
      }
    } catch (err) {
      console.error("Error fetching active trip:", err);
    } finally {
      setLoading(false);
    }
  };

  return { activeTrip, tracking, loading };
}

