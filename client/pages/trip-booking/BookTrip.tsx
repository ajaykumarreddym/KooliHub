import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { CANCELLATION_POLICIES, formatPrice } from "@/domain/services/BookingService";
import { TripForBooking, useBooking } from "@/hooks/trip-booking/useBooking";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  MapPin,
  Shield,
  Star,
  User,
  Users,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

interface TripDetails extends TripForBooking {
  amenities?: string[];
  vehicle?: {
    make: string;
    model: string;
    vehicle_type: string;
  };
}

export default function BookTrip() {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  
  // Get seats count from URL (passed from TripDetails)
  const seatsCount = parseInt(searchParams.get("seats") || "1", 10);
  
  // Payment - default to COD (Cash on Delivery)
  const selectedPayment = "cod";

  // Use the booking hook
  const { 
    loading: bookingLoading, 
    priceBreakdown, 
    calculatePrice, 
    validate,
    createBooking 
  } = useBooking();

  useEffect(() => {
    if (tripId && user) {
      fetchTripDetails();
    }
  }, [tripId, user]);

  // Calculate price whenever seats change
  useEffect(() => {
    if (tripDetails) {
      calculatePrice(
        tripDetails.price_per_seat,
        seatsCount,
        0 // No toll charges column in current schema
      );
    }
  }, [tripDetails, seatsCount, calculatePrice]);

  // Validate booking
  const validation = useMemo(() => {
    if (!tripDetails) return null;
    return validate(tripDetails, seatsCount);
  }, [tripDetails, seatsCount, validate]);

  const fetchTripDetails = async () => {
    if (!tripId) return;

    try {
      setPageLoading(true);
      const { data, error } = await supabase
        .from("trips")
        .select(`
          id,
          driver_id,
          departure_time,
          price_per_seat,
          available_seats,
          amenities,
          status,
          driver:profiles!trips_driver_id_fkey(
            id,
            full_name,
            avatar_url,
            driver_profile:driver_profiles(
              average_rating,
              total_trips
            )
          ),
          route:routes!trips_route_id_fkey(
            departure_location,
            arrival_location,
            distance_km,
            estimated_duration_minutes
          ),
          vehicle:vehicles!trips_vehicle_id_fkey(
            make,
            model,
            vehicle_type
          )
        `)
        .eq("id", tripId)
        .single();

      if (error) throw error;
      setTripDetails(data as any);
    } catch (error: any) {
      console.error("Error fetching trip details:", error);
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive",
      });
    } finally {
      setPageLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user || !tripDetails || !selectedPayment || !agreedToTerms) {
      toast({
        title: "Required fields missing",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    const result = await createBooking(
      tripDetails,
      seatsCount,
      selectedPayment
    );

    if (result.success && result.bookingId) {
      navigate(`/trip-booking/booking-confirmation/${result.bookingId}`);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4">
          <div className="max-w-lg mx-auto lg:max-w-2xl xl:max-w-3xl space-y-3 sm:space-y-4">
            <Skeleton className="h-10 sm:h-12 w-full" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
            <Skeleton className="h-28 sm:h-32 w-full rounded-xl" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!tripDetails) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Trip not found</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
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
          <div className="max-w-lg mx-auto lg:max-w-2xl xl:max-w-3xl px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex-1 text-center">
              Confirm Booking
            </h1>
            <div className="w-9 sm:w-10" />
          </div>
        </header>

        {/* Content */}
        <main className="max-w-lg mx-auto lg:max-w-2xl xl:max-w-3xl p-3 sm:p-4 pb-28 sm:pb-32 space-y-4 sm:space-y-6">
          {/* Validation Warnings */}
          {validation?.warnings && validation.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <p key={index} className="text-sm text-amber-800 dark:text-amber-200">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trip Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Trip Details</h2>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {tripDetails.route?.departure_location}
                </p>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 ml-2 my-1" />
                <p className="font-semibold text-gray-900 dark:text-white">
                  {tripDetails.route?.arrival_location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900 dark:text-white">
                {format(new Date(tripDetails.departure_time), "EEE, MMM d 'at' h:mm a")}
              </span>
            </div>
          </div>

          {/* Driver Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Driver</h2>
            
            <div className="flex items-center gap-4">
              {tripDetails.driver?.avatar_url ? (
                <img
                  src={tripDetails.driver.avatar_url}
                  alt={tripDetails.driver.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {tripDetails.driver?.full_name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tripDetails.driver?.driver_profile?.average_rating?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {tripDetails.driver?.driver_profile?.total_trips || 0} trips
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Booking Summary</h2>
            
            <div className="flex items-center justify-between p-4 bg-[#054752]/5 dark:bg-teal-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#054752]/10 dark:bg-teal-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#054752] dark:text-teal-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {seatsCount} {seatsCount === 1 ? 'Seat' : 'Seats'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ₹{tripDetails.price_per_seat} per seat
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#054752] dark:text-teal-400">
                  ₹{(tripDetails.price_per_seat * seatsCount).toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method - COD Only */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Payment Method</h2>

            <div className="flex items-center gap-3 p-4 border-2 border-[#054752] rounded-lg bg-[#054752]/5">
              <div className="w-10 h-10 rounded-full bg-[#054752]/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#054752]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Cash on Delivery</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pay when you meet the driver</p>
              </div>
              <Badge className="bg-[#054752] text-white">Selected</Badge>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              More payment options coming soon
            </p>
          </div>

          {/* Price Breakdown - ENHANCED */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-3">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Price Details</h2>
            
            {priceBreakdown && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Base fare ({seatsCount} × {formatPrice(priceBreakdown.pricePerSeat)})
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(priceBreakdown.baseFare)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Platform fee</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>5% service fee to maintain the platform</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(priceBreakdown.platformFee)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">GST (18%)</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(priceBreakdown.gst)}
                  </span>
                </div>

                {priceBreakdown.tollCharges > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Toll charges</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatPrice(priceBreakdown.tollCharges)}
                    </span>
                  </div>
                )}

                {priceBreakdown.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(priceBreakdown.discountAmount)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-xl text-[#137fec]">
                    {formatPrice(priceBreakdown.totalAmount)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Cancellation Policy */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setShowCancellationPolicy(!showCancellationPolicy)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Cancellation Policy
                </span>
              </div>
              <span className="text-sm text-[#137fec]">
                {showCancellationPolicy ? "Hide" : "View"}
              </span>
            </button>
            
            {showCancellationPolicy && (
              <div className="mt-4 space-y-3">
                {CANCELLATION_POLICIES.map((policy, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      policy.refundPercentage === 100 ? "bg-green-500" :
                      policy.refundPercentage === 50 ? "bg-amber-500" : "bg-red-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {index === 0 ? "More than 2 hours before departure" :
                         index === 1 ? "30 mins to 2 hours before departure" :
                         "Less than 30 minutes before departure"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {policy.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              I agree to the{" "}
              <button className="text-[#137fec] underline">Terms & Conditions</button> and{" "}
              <button 
                className="text-[#137fec] underline"
                onClick={(e) => {
                  e.preventDefault();
                  setShowCancellationPolicy(true);
                }}
              >
                Cancellation Policy
              </button>
            </Label>
          </div>
        </main>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 z-10">
          <div className="max-w-lg mx-auto lg:max-w-2xl xl:max-w-3xl flex items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {priceBreakdown ? formatPrice(priceBreakdown.totalAmount) : "₹0"}
              </p>
            </div>
            <Button
              onClick={handleBooking}
              disabled={
                bookingLoading || 
                !agreedToTerms || 
                !selectedPayment ||
                (validation && !validation.isValid)
              }
              className="h-11 sm:h-14 px-5 sm:px-8 bg-[#137fec] hover:bg-[#137fec]/90 text-white text-sm sm:text-base font-bold disabled:opacity-50 shrink-0"
            >
              {bookingLoading ? "Processing..." : "Confirm & Pay"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
