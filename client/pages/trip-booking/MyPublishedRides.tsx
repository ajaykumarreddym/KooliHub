import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Edit,
  Trash2,
  Plus,
  Clock,
  Car
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Trip {
  id: string;
  route_id: string;
  departure_time: string;
  price_per_seat: number;
  available_seats: number;
  status: string;
  route: {
    departure_location: string;
    arrival_location: string;
    distance_km: number;
    estimated_duration_minutes: number;
  };
  bookings_count?: number;
}

export default function MyPublishedRides() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [trips, setTrips] = useState<{
    upcoming: Trip[];
    completed: Trip[];
    cancelled: Trip[];
  }>({
    upcoming: [],
    completed: [],
    cancelled: [],
  });

  useEffect(() => {
    if (user) {
      fetchMyTrips();
    }
  }, [user]);

  const fetchMyTrips = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          route:routes!trips_route_id_fkey(
            departure_location,
            arrival_location,
            distance_km,
            estimated_duration_minutes
          )
        `)
        .eq("driver_id", user?.id)
        .order("departure_time", { ascending: false });

      if (error) throw error;

      const now = new Date();
      const upcoming: Trip[] = [];
      const completed: Trip[] = [];
      const cancelled: Trip[] = [];

      data?.forEach((trip: any) => {
        const tripDate = new Date(trip.departure_time);
        
        if (trip.status === "cancelled") {
          cancelled.push(trip);
        } else if (trip.status === "completed") {
          completed.push(trip);
        } else if (tripDate < now) {
          // Past trips should be in completed
          completed.push(trip);
        } else {
          // Future trips (active or scheduled)
          upcoming.push(trip);
        }
      });

      // Get booking counts for each trip
      for (const trip of [...upcoming, ...completed, ...cancelled]) {
        const { count } = await supabase
          .from("trip_bookings")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", trip.id)
          .eq("booking_status", "confirmed");
        
        trip.bookings_count = count || 0;
      }

      setTrips({ upcoming, completed, cancelled });
    } catch (err) {
      console.error("Error fetching trips:", err);
      toast({
        title: "Error",
        description: "Failed to load your trips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to cancel this trip?")) return;

    try {
      const { error } = await supabase
        .from("trips")
        .update({ status: "cancelled" })
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Trip Cancelled",
        description: "Your trip has been cancelled successfully",
      });
      fetchMyTrips();
    } catch (err) {
      console.error("Error cancelling trip:", err);
      toast({
        title: "Error",
        description: "Failed to cancel trip",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
      completed: { label: "Completed", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
    };

    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const TripCard = ({ trip }: { trip: Trip }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
            <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
              {trip.route?.departure_location} → {trip.route?.arrival_location}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>
              {format(new Date(trip.departure_time), "MMM dd, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>
        {getStatusBadge(trip.status)}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-3 border-t border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <IndianRupee className="h-4 w-4" />
            <span className="text-xs">Price</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ₹{trip.price_per_seat}
          </p>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs">Seats</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {trip.available_seats}
          </p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs">Booked</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {trip.bookings_count || 0}
          </p>
        </div>
      </div>

      {(trip.status === "active" || trip.status === "scheduled") && (
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/trip-booking/edit-trip/${trip.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={() => handleDeleteTrip(trip.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-lg mx-auto lg:max-w-3xl xl:max-w-4xl p-3 sm:p-4 space-y-3 sm:space-y-4">
            <Skeleton className="h-10 sm:h-12 w-full" />
            <Skeleton className="h-28 sm:h-32 w-full rounded-xl" />
            <Skeleton className="h-28 sm:h-32 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm">
          <div className="max-w-lg mx-auto lg:max-w-3xl xl:max-w-4xl px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex-1">
              My Published Rides
            </h1>
            <Button
              onClick={() => navigate("/trip-booking/publish-ride")}
              size="icon"
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10 bg-[#137fec] hover:bg-[#137fec]/90"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </header>

        <main className="max-w-lg mx-auto lg:max-w-3xl xl:max-w-4xl px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="upcoming">
                Upcoming ({trips.upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({trips.completed.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({trips.cancelled.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {trips.upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <Clock className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    No Upcoming Rides
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Publish a ride to start earning
                  </p>
                  <Button
                    onClick={() => navigate("/trip-booking/publish-ride")}
                    className="bg-[#137fec] hover:bg-[#137fec]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Publish a Ride
                  </Button>
                </div>
              ) : (
                trips.upcoming.map((trip) => <TripCard key={trip.id} trip={trip} />)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {trips.completed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No completed rides yet
                  </p>
                </div>
              ) : (
                trips.completed.map((trip) => <TripCard key={trip.id} trip={trip} />)
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {trips.cancelled.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No cancelled rides
                  </p>
                </div>
              ) : (
                trips.cancelled.map((trip) => <TripCard key={trip.id} trip={trip} />)
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </Layout>
  );
}

