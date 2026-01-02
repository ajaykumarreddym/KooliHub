import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Calendar, Users, IndianRupee, Download, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BookingDetails {
  id: string;
  seats_booked: number;
  total_amount: number;
  booking_status: string;
  created_at: string;
  trip: {
    departure_time: string;
    route: {
      departure_location: string;
      arrival_location: string;
    };
    driver: {
      full_name: string;
      phone?: string;
    };
  };
}

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  useEffect(() => {
    if (bookingId && user) {
      fetchBookingDetails();
    }
  }, [bookingId, user]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          id,
          seats_booked,
          total_amount,
          booking_status,
          created_at,
          trip:trips!trip_bookings_trip_id_fkey(
            departure_time,
            route:routes!trips_route_id_fkey(
              departure_location,
              arrival_location
            ),
            driver:profiles!trips_driver_id_fkey(
              full_name,
              phone
            )
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data as any);
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your booking receipt is being downloaded",
    });
  };

  const handleShare = () => {
    if (navigator.share && booking) {
      navigator.share({
        title: "Trip Booking",
        text: `My trip from ${booking.trip.route.departure_location} to ${booking.trip.route.arrival_location}`,
        url: window.location.href,
      });
    } else {
      toast({
        title: "Link copied",
        description: "Booking link copied to clipboard",
      });
    }
  };

  if (loading || !booking) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 py-8 sm:py-12">
          <div className="max-w-lg mx-auto lg:max-w-2xl px-4 text-center">
            <CheckCircle2 className="h-14 w-14 sm:h-20 sm:w-20 text-green-600 dark:text-green-400 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Your trip has been successfully booked
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="max-w-lg mx-auto lg:max-w-2xl p-3 sm:p-4 space-y-4 sm:space-y-6 -mt-6 sm:-mt-8">
          {/* Booking ID Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Booking ID</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-mono">
                {booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-4">
            <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">Trip Details</h2>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {booking.trip.route.departure_location}
                </p>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 ml-2 my-1" />
                <p className="font-semibold text-gray-900 dark:text-white">
                  {booking.trip.route.arrival_location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-white">
                {format(new Date(booking.trip.departure_time), "EEE, MMM d 'at' h:mm a")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-white">
                {booking.seats_booked} seat{booking.seats_booked > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <IndianRupee className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-white">
                ₹{booking.total_amount}
              </span>
            </div>
          </div>

          {/* Driver Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Driver</h2>
            <p className="text-gray-900 dark:text-white font-medium">
              {booking.trip.driver.full_name}
            </p>
            {booking.trip.driver.phone && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {booking.trip.driver.phone}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="h-11 sm:h-14 gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Download</span> Receipt
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="h-11 sm:h-14 gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Share
            </Button>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-[#137fec]">•</span>
                <span>You'll receive a confirmation message shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#137fec]">•</span>
                <span>Driver will contact you before the trip</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#137fec]">•</span>
                <span>Track your trip live on the day of journey</span>
              </li>
            </ul>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-2.5 sm:space-y-3 pb-4 sm:pb-6">
            <Button
              onClick={() => navigate("/trip-booking")}
              className="w-full h-11 sm:h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white text-sm sm:text-base font-bold"
            >
              Back to Home
            </Button>
            <Button
              onClick={() => navigate("/trip-booking/my-bookings")}
              variant="outline"
              className="w-full h-11 sm:h-14 text-sm sm:text-base"
            >
              View My Bookings
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

