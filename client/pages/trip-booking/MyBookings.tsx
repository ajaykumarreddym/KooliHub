import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ChevronRight,
  Star,
  Phone,
  MessageSquare,
  Navigation,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { format, isPast, isFuture, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";
import { useBooking } from "@/hooks/trip-booking/useBooking";
import { formatPrice, RefundCalculation } from "@/domain/services/BookingService";

interface Booking {
  id: string;
  trip_id: string;
  seats_booked: number;
  total_amount: number;
  platform_fee: number;
  booking_status: string;
  payment_status: string;
  pickup_location?: string;
  dropoff_location?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  refund_amount?: number;
  refund_status?: string;
  created_at: string;
  trip: {
    id: string;
    departure_time: string;
    price_per_seat: number;
    status: string;
    driver: {
      id: string;
      full_name: string;
      avatar_url?: string;
      phone?: string;
    };
    route: {
      departure_location: string;
      arrival_location: string;
      distance_km: number;
    };
    vehicle: {
      make: string;
      model: string;
      vehicle_type: string;
      license_plate?: string;
    };
  };
}

const CANCELLATION_REASONS = [
  "Change of plans",
  "Found alternative transportation",
  "Personal emergency",
  "Driver requested cancellation",
  "Weather conditions",
  "Other",
];

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Cancellation dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [refundPreview, setRefundPreview] = useState<RefundCalculation | null>(null);

  const { loading: cancelLoading, cancelBooking, getRefundPreview } = useBooking();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          id,
          trip_id,
          seats_booked,
          total_amount,
          platform_fee,
          booking_status,
          payment_status,
          pickup_location,
          dropoff_location,
          cancellation_reason,
          cancelled_at,
          refund_amount,
          refund_status,
          created_at,
          trip:trips!trip_bookings_trip_id_fkey(
            id,
            departure_time,
            price_per_seat,
            status,
            driver:profiles!trips_driver_id_fkey(
              id,
              full_name,
              avatar_url,
              phone
            ),
            route:routes!trips_route_id_fkey(
              departure_location,
              arrival_location,
              distance_km
            ),
            vehicle:vehicles!trips_vehicle_id_fkey(
              make,
              model,
              vehicle_type,
              license_plate
            )
          )
        `)
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data as any || []);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelDialog = async (booking: Booking) => {
    setSelectedBooking(booking);
    setCancellationReason("");
    setCustomReason("");
    
    // Get refund preview
    const preview = await getRefundPreview(booking.id);
    setRefundPreview(preview);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancellation = async () => {
    if (!selectedBooking) return;
    
    const reason = cancellationReason === "Other" ? customReason : cancellationReason;
    
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please select or enter a cancellation reason",
        variant: "destructive",
      });
      return;
    }

    const result = await cancelBooking(selectedBooking.id, reason);
    
    if (result.success) {
      setCancelDialogOpen(false);
      fetchBookings(); // Refresh bookings
    }
  };

  // Filter bookings by status
  const upcomingBookings = bookings.filter(b => 
    b.booking_status !== "cancelled" && 
    isFuture(new Date(b.trip.departure_time))
  );

  const pastBookings = bookings.filter(b => 
    b.booking_status !== "cancelled" && 
    isPast(new Date(b.trip.departure_time))
  );

  const cancelledBookings = bookings.filter(b => 
    b.booking_status === "cancelled"
  );

  const getStatusBadge = (booking: Booking) => {
    if (booking.booking_status === "cancelled") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    }
    
    if (isPast(new Date(booking.trip.departure_time))) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Confirmed
      </Badge>
    );
  };

  const canCancelBooking = (booking: Booking) => {
    if (booking.booking_status === "cancelled") return false;
    
    const departureTime = new Date(booking.trip.departure_time);
    return isFuture(departureTime);
  };

  const renderBookingCard = (booking: Booking, showCancelButton: boolean = true) => {
    const departureTime = new Date(booking.trip.departure_time);
    const hoursUntilDeparture = differenceInHours(departureTime, new Date());
    
    return (
      <div 
        key={booking.id}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
              Booking ID: {booking.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Booked on {format(new Date(booking.created_at), "MMM d, yyyy")}
            </p>
          </div>
          {getStatusBadge(booking)}
        </div>

        {/* Route */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-[#137fec]" />
              <div className="w-0.5 h-10 bg-gray-300 dark:bg-gray-600" />
              <div className="w-3 h-3 rounded-full bg-[#137fec]" />
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(departureTime, "h:mm a")}
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.trip.route.departure_location}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.trip.route.arrival_location}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {format(departureTime, "EEE, MMM d")}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(booking.total_amount)}
              </p>
            </div>
          </div>

          {/* Trip Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{booking.seats_booked} seat(s)</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{booking.trip.route.distance_km} km</span>
            </div>
          </div>

          {/* Driver Info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              {booking.trip.driver.avatar_url ? (
                <img 
                  src={booking.trip.driver.avatar_url} 
                  alt={booking.trip.driver.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.trip.driver.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {booking.trip.vehicle.make} {booking.trip.vehicle.model}
                </p>
              </div>
            </div>

            {canCancelBooking(booking) && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/trip-booking/chat/${booking.trip.id}`)}
                  className="rounded-full h-9 w-9"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                {booking.trip.driver.phone && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`tel:${booking.trip.driver.phone}`)}
                    className="rounded-full h-9 w-9"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Cancellation Info */}
          {booking.booking_status === "cancelled" && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <span className="font-medium">Cancelled:</span>{" "}
                {booking.cancellation_reason || "No reason provided"}
              </p>
              {booking.refund_amount !== undefined && booking.refund_amount > 0 && (
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  <span className="font-medium">Refund:</span>{" "}
                  {formatPrice(booking.refund_amount)} ({booking.refund_status})
                </p>
              )}
            </div>
          )}

          {/* Upcoming Trip Notice */}
          {canCancelBooking(booking) && hoursUntilDeparture <= 24 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {hoursUntilDeparture <= 0.5 
                  ? "Trip is about to start! Cancellation not recommended."
                  : hoursUntilDeparture <= 2
                    ? "Cancelling now will result in 50% refund."
                    : `Trip starts in ${hoursUntilDeparture} hours.`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-3">
            {/* Live Tracking Button - Show for trips happening now or within 30 minutes */}
            {canCancelBooking(booking) && hoursUntilDeparture <= 0.5 && booking.trip.status === 'active' && (
              <Button
                onClick={() => navigate(`/trip-booking/tracking/${booking.trip.id}`)}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Navigation className="h-5 w-5 animate-pulse" />
                <span className="font-bold">Live Tracking</span>
              </Button>
            )}
            
            <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/trip-booking/trip/${booking.trip.id}`)}
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            
            {showCancelButton && canCancelBooking(booking) && (
              <Button
                variant="destructive"
                onClick={() => handleOpenCancelDialog(booking)}
              >
                Cancel
              </Button>
            )}

            {isPast(departureTime) && booking.booking_status !== "cancelled" && (
              <Button
                onClick={() => navigate(`/trip-booking/rate/${booking.id}`)}
                className="bg-[#137fec] hover:bg-[#137fec]/90"
              >
                <Star className="h-4 w-4 mr-1" />
                Rate Trip
              </Button>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4">
          <div className="max-w-lg mx-auto lg:max-w-3xl xl:max-w-4xl space-y-3 sm:space-y-4">
            <Skeleton className="h-10 sm:h-12 w-full" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-lg mx-auto lg:max-w-3xl xl:max-w-4xl px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex-1 text-center">
              My Bookings
            </h1>
            <div className="w-9 sm:w-10" />
          </div>
        </header>

        {/* Content */}
        <main className="max-w-lg mx-auto lg:max-w-3xl xl:max-w-4xl p-3 sm:p-4 pb-20 sm:pb-24 space-y-3 sm:space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="upcoming" className="relative">
                Upcoming
                {upcomingBookings.length > 0 && (
                  <span className="ml-1 bg-[#137fec] text-white text-xs rounded-full px-1.5">
                    {upcomingBookings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="past">
                Past
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No Upcoming Bookings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You don't have any upcoming trips. Start by searching for a ride!
                  </p>
                  <Button 
                    onClick={() => navigate("/trip-booking")}
                    className="bg-[#137fec] hover:bg-[#137fec]/90"
                  >
                    Find a Ride
                  </Button>
                </div>
              ) : (
                upcomingBookings.map(booking => renderBookingCard(booking, true))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastBookings.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No Past Bookings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your completed trips will appear here.
                  </p>
                </div>
              ) : (
                pastBookings.map(booking => renderBookingCard(booking, false))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledBookings.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                  <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No Cancelled Bookings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You haven't cancelled any bookings.
                  </p>
                </div>
              ) : (
                cancelledBookings.map(booking => renderBookingCard(booking, false))
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Cancellation Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Cancel Booking
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {/* Refund Preview */}
            {refundPreview && (
              <div className={cn(
                "p-4 rounded-lg",
                refundPreview.isEligible 
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              )}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Refund Details
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Original amount:</span>
                    <span>{formatPrice(refundPreview.originalAmount)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Refund percentage:</span>
                    <span>{refundPreview.refundPercentage}%</span>
                  </p>
                  {refundPreview.serviceFee > 0 && (
                    <p className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Service fee:</span>
                      <span>-{formatPrice(refundPreview.serviceFee)}</span>
                    </p>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <p className="flex justify-between font-semibold">
                      <span>Refund amount:</span>
                      <span className={refundPreview.isEligible ? "text-green-600" : "text-red-600"}>
                        {formatPrice(refundPreview.refundAmount)}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {refundPreview.reason}
                </p>
              </div>
            )}

            {/* Cancellation Reason */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Reason for cancellation
              </label>
              <Select value={cancellationReason} onValueChange={setCancellationReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {cancellationReason === "Other" && (
                <Textarea
                  placeholder="Please specify your reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="min-h-[80px]"
                />
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancellation}
                disabled={cancelLoading || (!cancellationReason || (cancellationReason === "Other" && !customReason))}
              >
                {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

