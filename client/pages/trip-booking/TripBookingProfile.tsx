import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
    Bell,
  Calendar,
    Car,
    ChevronRight,
    CreditCard,
    Edit,
    HelpCircle,
    Lock,
    LogOut,
  MapPin,
    Shield,
  Star,
  Ticket,
  TrendingUp,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface DriverStats {
  average_rating: number;
  total_trips: number;
  total_earnings: number;
  is_verified: boolean;
  has_vehicles: boolean;
  vehicle_count: number;
}

interface UserRoleInfo {
  is_driver: boolean;
  is_passenger: boolean;
  can_become_driver: boolean;
}

interface BookingStats {
  total_bookings: number;
  upcoming_bookings: number;
  completed_bookings: number;
}

interface PublishedRideStats {
  total_published: number;
  active_rides: number;
  completed_rides: number;
}

interface RecentBooking {
  id: string;
  status: string;
  seats_booked: number;
  trip: {
    departure_time: string;
    route: {
      departure_location: string;
      arrival_location: string;
    } | null;
  } | null;
}

interface RecentPublishedRide {
  id: string;
  status: string;
  departure_time: string;
  available_seats: number;
  route: {
    departure_location: string;
    arrival_location: string;
  } | null;
}

export default function TripBookingProfile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    total_bookings: 0,
    upcoming_bookings: 0,
    completed_bookings: 0,
  });
  const [publishedStats, setPublishedStats] = useState<PublishedRideStats>({
    total_published: 0,
    active_rides: 0,
    completed_rides: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentPublished, setRecentPublished] = useState<RecentPublishedRide[]>([]);
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({
    is_driver: false,
    is_passenger: true,
    can_become_driver: true,
  });
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });

  // Fetch all data when user is available
  useEffect(() => {
    const loadAllData = async () => {
      if (!user?.id) {
        console.log("No user ID, skipping data fetch");
        setLoading(false);
        return;
      }

      console.log("Loading all data for user:", user.id);
      setLoading(true);

      try {
        // Fetch profile data directly from DB
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, phone, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileData && !profileError) {
          console.log("Profile loaded:", profileData);
      setFormData({
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
      });
        } else if (profileError) {
          console.error("Profile fetch error:", profileError);
        }

        // Fetch all stats in parallel
        await Promise.all([
          fetchDriverStats(),
          fetchBookingStats(),
          fetchPublishedRideStats(),
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
      setLoading(false);
    }
    };

    loadAllData();
  }, [user?.id]);


  const fetchDriverStats = async () => {
    if (!user?.id) {
      console.log("No user ID available");
      return;
    }

    try {
      console.log("Fetching driver stats for user:", user.id);
      
      // Fetch vehicles first (without is_active filter to catch all vehicles)
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, is_active")
        .eq("driver_id", user.id);

      if (vehiclesError) {
        console.error("Vehicles fetch error:", vehiclesError);
      }

      const totalVehicles = vehiclesData?.length || 0;
      const hasVehicles = totalVehicles > 0;
      console.log("Vehicles found:", totalVehicles);

      // Fetch driver profile
      const { data: driverData, error: driverError } = await supabase
          .from("driver_profiles")
          .select("average_rating, total_trips, total_earnings, background_check_status")
        .eq("id", user.id)
        .single();

      if (driverError && driverError.code !== 'PGRST116') {
        console.error("Driver profile fetch error:", driverError);
      }

      const hasDriverProfile = driverData !== null;
      console.log("Driver profile found:", hasDriverProfile, driverData);

      // User is a driver if they have any vehicles (active or not) OR have a driver profile
      const isDriver = hasVehicles || hasDriverProfile;

      setRoleInfo({
        is_driver: isDriver,
        is_passenger: true,
        can_become_driver: !isDriver,
      });

      // Always set driver stats if user has vehicles or driver profile
      if (isDriver) {
        setDriverStats({
          average_rating: driverData?.average_rating ? parseFloat(String(driverData.average_rating)) : 0,
          total_trips: driverData?.total_trips || 0,
          total_earnings: driverData?.total_earnings ? parseFloat(String(driverData.total_earnings)) : 0,
          is_verified: driverData?.background_check_status === "verified",
          has_vehicles: hasVehicles,
          vehicle_count: totalVehicles,
        });
        console.log("Driver stats set:", driverData);
      } else {
        setDriverStats(null);
      }
    } catch (err) {
      console.error("Error fetching driver stats:", err);
    }
  };

  const fetchBookingStats = async () => {
    if (!user?.id) {
      console.log("No user ID for booking stats");
      return;
    }

    try {
      console.log("Fetching bookings for user:", user.id);
      
      // Simplified query - fetch bookings with trip data
      const { data: bookings, error } = await supabase
        .from("trip_bookings")
        .select(`
          id,
          booking_status,
          seats_booked,
          trip_id,
          trips (
            departure_time,
            routes (
              departure_location,
              arrival_location
            )
          )
        `)
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Booking fetch error:", error);
        return;
      }

      console.log("Bookings fetched:", bookings?.length, bookings);

      const now = new Date();
      const total = bookings?.length || 0;
      
      // Transform bookings to expected format
      const transformedBookings = bookings?.map(b => {
        const trip = b.trips as any;
        const route = trip?.routes as any;
        return {
          id: b.id,
          status: b.booking_status,
          seats_booked: b.seats_booked,
          trip: trip ? {
            departure_time: trip.departure_time,
            route: route || null
          } : null
        };
      }) || [];
      
      const upcoming = transformedBookings.filter(b => {
        const depTime = b.trip?.departure_time ? new Date(b.trip.departure_time) : null;
        return depTime && depTime > now && b.status !== "cancelled";
      }).length;
      const completed = transformedBookings.filter(b => b.status === "completed").length;

      console.log("Booking stats:", { total, upcoming, completed });

      setBookingStats({
        total_bookings: total,
        upcoming_bookings: upcoming,
        completed_bookings: completed,
      });

      // Set recent bookings (first 3)
      setRecentBookings(transformedBookings.slice(0, 3) as RecentBooking[]);
    } catch (err) {
      console.error("Error fetching booking stats:", err);
    }
  };

  const fetchPublishedRideStats = async () => {
    if (!user?.id) {
      console.log("No user ID for published rides");
      return;
    }

    try {
      console.log("Fetching published rides for user:", user.id);
      
      // Fetch all published trips for the user
      const { data: trips, error } = await supabase
        .from("trips")
        .select(`
          id,
          status,
          departure_time,
          available_seats,
          routes (
            departure_location,
            arrival_location
          )
        `)
        .eq("driver_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Published rides fetch error:", error);
        return;
      }

      console.log("Published rides fetched:", trips?.length, trips);

      const now = new Date();
      const total = trips?.length || 0;
      
      // Transform trips to expected format
      const transformedTrips = trips?.map(t => {
        const route = t.routes as any;
        return {
          id: t.id,
          status: t.status,
          departure_time: t.departure_time,
          available_seats: t.available_seats,
          route: route || null
        };
      }) || [];
      
      const active = transformedTrips.filter(t => {
        const depTime = t.departure_time ? new Date(t.departure_time) : null;
        return depTime && depTime > now && (t.status === "active" || t.status === "scheduled");
      }).length;
      const completed = transformedTrips.filter(t => t.status === "completed").length;

      console.log("Published stats:", { total, active, completed });

      setPublishedStats({
        total_published: total,
        active_rides: active,
        completed_rides: completed,
      });

      // Set recent published rides (first 3)
      setRecentPublished(transformedTrips.slice(0, 3) as RecentPublishedRide[]);
    } catch (err) {
      console.error("Error fetching published ride stats:", err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (formData.full_name) {
      return formData.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  const isPhoneVerified = !!profile?.phone;

  const formatLocation = (location: string) => {
    if (!location) return "Unknown";
    const parts = location.split(",");
    return parts[0]?.trim() || location;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 pb-24">
          {/* Profile Header */}
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-4 ring-white dark:ring-gray-800 shadow-lg">
                <AvatarImage src={profile?.avatar_url} alt={formData.full_name} />
                <AvatarFallback className="text-2xl font-bold bg-[#054752] text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <button 
                aria-label="Edit profile picture"
                className="absolute bottom-0 right-0 grid h-9 w-9 place-content-center rounded-full border-2 border-white dark:border-gray-900 bg-[#137fec] text-white shadow-lg hover:bg-[#137fec]/90 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white text-center">
                {formData.full_name || profile?.full_name || "Unnamed User"}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-400 text-center">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Two Column Layout for Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
          {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
              Personal Information
            </p>
                </div>
                <div className="p-4 space-y-4">
            <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                        className="bg-gray-50 dark:bg-gray-900"
                />
              ) : (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                  {formData.full_name || "Not provided"}
                </div>
              )}
            </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                        className="bg-gray-50 dark:bg-gray-900"
                  />
                ) : (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 flex items-center justify-between">
                    <span>{formData.phone || "Not provided"}</span>
                    {isPhoneVerified && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                        Verified
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

              {/* My Booked Rides */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-[#054752]" />
                    <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                      My Booked Rides
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/trip-booking/my-bookings")}
                    className="text-sm text-[#137fec] hover:underline font-medium"
                  >
                    View All
                  </button>
                </div>
                
                {/* Booking Stats */}
                <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {bookingStats.total_bookings}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-[#054752] dark:text-teal-400">
                      {bookingStats.upcoming_bookings}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {bookingStats.completed_bookings}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => navigate(`/trip-booking/booking/${booking.id}`)}
                        className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#054752]/10 rounded-lg">
                              <MapPin className="h-4 w-4 text-[#054752]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatLocation(booking.trip?.route?.departure_location || "")} →{" "}
                                {formatLocation(booking.trip?.route?.arrival_location || "")}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {booking.trip?.departure_time 
                                  ? format(new Date(booking.trip.departure_time), "dd MMM, HH:mm")
                                  : "N/A"
                                }
                              </p>
                            </div>
                          </div>
                          <Badge 
                            className={
                              booking.status === "confirmed" 
                                ? "bg-green-100 text-green-700" 
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <Ticket className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No bookings yet
                      </p>
                      <Button
                        variant="link"
                        onClick={() => navigate("/trips")}
                        className="text-[#137fec] mt-2"
                      >
                        Find a ride
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Driver Information - Show if user has vehicles or published rides */}
              {(roleInfo.is_driver || driverStats || publishedStats.total_published > 0) ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Driver Information
                    </p>
              </div>

                  {/* Rating and Total Trips */}
                  <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <div className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {driverStats?.average_rating && driverStats.average_rating > 0 
                            ? driverStats.average_rating.toFixed(1) 
                            : "New"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {driverStats?.total_trips || publishedStats.completed_rides || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Trips</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <button
                  onClick={() => navigate("/trip-booking/vehicles")}
                      className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Vehicle Management
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                <button
                  onClick={() => navigate("/trip-booking/verification")}
                      className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Verification & ID
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
              ) : (
                /* Become a Driver CTA */
                <div className="bg-gradient-to-br from-[#054752] to-[#0a6b7a] rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Become a Driver</h3>
                      <p className="text-sm text-white/80">Earn money sharing your rides</p>
                    </div>
                  </div>
                  <p className="text-sm mb-4 text-white/70">
                  Add your vehicle and start earning by offering rides to passengers.
                </p>
                <Button
                  onClick={() => navigate("/trip-booking/add-vehicle")}
                    className="w-full bg-white text-[#054752] hover:bg-gray-100 font-semibold"
                >
                  <Car className="h-4 w-4 mr-2" />
                  Add Your First Vehicle
                </Button>
              </div>
              )}

              {/* My Published Rides */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#054752]" />
                    <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                      My Published Rides
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/trip-booking/my-rides")}
                    className="text-sm text-[#137fec] hover:underline font-medium"
                  >
                    View All
                  </button>
                </div>

                {/* Published Stats */}
                <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {publishedStats.total_published}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-[#054752] dark:text-teal-400">
                      {publishedStats.active_rides}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {publishedStats.completed_rides}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  </div>
                </div>

                {/* Recent Published Rides */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentPublished.length > 0 ? (
                    recentPublished.map((ride) => (
                      <button
                        key={ride.id}
                        onClick={() => navigate(`/trip-booking/my-trip/${ride.id}`)}
                        className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#054752]/10 rounded-lg">
                              <Car className="h-4 w-4 text-[#054752]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatLocation(ride.route?.departure_location || "")} →{" "}
                                {formatLocation(ride.route?.arrival_location || "")}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {ride.departure_time 
                                    ? format(new Date(ride.departure_time), "dd MMM, HH:mm")
                                    : "N/A"
                                  }
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {ride.available_seats} seats
                                </span>
                              </p>
                            </div>
                          </div>
                          <Badge 
                            className={
                              ride.status === "active" 
                                ? "bg-green-100 text-green-700" 
                                : ride.status === "scheduled"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {ride.status}
                          </Badge>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <Car className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No published rides yet
                      </p>
                      <Button
                        variant="link"
                        onClick={() => navigate("/trip-booking/publish-ride")}
                        className="text-[#137fec] mt-2"
                      >
                        Publish a ride
                      </Button>
            </div>
          )}
                </div>
              </div>

          {/* App Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
              App Settings
            </p>
                </div>
            
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <button
              onClick={() => navigate("/trip-booking/notifications")}
                    className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Notification Settings
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/trip-booking/payment")}
                    className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Payment Methods
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/trip-booking/privacy")}
                    className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Privacy Settings
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/trip-booking/help")}
                    className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Help & Support
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-12 flex-1 bg-[#137fec] hover:bg-[#137fec]/90 rounded-xl font-semibold"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      full_name: profile?.full_name || "",
                      phone: profile?.phone || "",
                    });
                  }}
                  className="h-12 flex-1 rounded-xl font-semibold"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="h-12 flex-1 bg-[#137fec] hover:bg-[#137fec]/90 rounded-xl font-semibold"
                >
                  Save Changes
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="h-12 flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-semibold"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Log Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
