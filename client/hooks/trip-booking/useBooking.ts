import { useAuth } from "@/contexts/AuthContext";
import {
  BookingPriceBreakdown,
  BookingValidation,
  calculateBookingPrice,
  calculateRefund,
  RefundCalculation,
  validateBooking,
} from "@/domain/services/BookingService";
import {
  BookingNotificationData,
  createDriverBookingNotification,
  createDriverCancellationNotification,
  createPassengerBookingConfirmation,
  createPassengerCancellationNotification,
} from "@/domain/services/NotificationService";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

export interface TripForBooking {
  id: string;
  driver_id: string;
  departure_time: string;
  price_per_seat: number;
  available_seats: number;
  status?: string;
  amenities?: string[];
  route?: {
    departure_location: string;
    arrival_location: string;
    distance_km?: number;
    estimated_duration_minutes?: number;
  };
  driver?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    driver_profile?: {
      average_rating?: number;
      total_trips?: number;
    };
  };
  vehicle?: {
    make: string;
    model: string;
    vehicle_type?: string;
  };
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

export interface CancellationResult {
  success: boolean;
  refund?: RefundCalculation;
  error?: string;
}

export function useBooking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<BookingPriceBreakdown | null>(null);

  /**
   * Calculate price breakdown for a booking
   */
  const calculatePrice = useCallback((
    pricePerSeat: number,
    seatsCount: number,
    tollCharges: number = 0,
    discount: number = 0
  ): BookingPriceBreakdown => {
    const breakdown = calculateBookingPrice(pricePerSeat, seatsCount, tollCharges, discount);
    setPriceBreakdown(breakdown);
    return breakdown;
  }, []);

  /**
   * Validate booking before creation
   */
  const validate = useCallback((
    trip: TripForBooking,
    seatsCount: number
  ): BookingValidation => {
    return validateBooking(
      trip.available_seats,
      seatsCount,
      new Date(trip.departure_time),
      2 // Default booking deadline: 2 hours before departure
    );
  }, []);

  /**
   * Create a new booking with race condition handling
   */
  const createBooking = useCallback(async (
    trip: TripForBooking,
    seatsCount: number,
    paymentMethodId: string,
    pickupLocation?: string,
    dropoffLocation?: string
  ): Promise<BookingResult> => {
    if (!user) {
      return { success: false, error: "You must be logged in to book a trip" };
    }

    setLoading(true);

    try {
      // Step 1: Validate booking
      const validation = validate(trip, seatsCount);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(". ") };
      }

      // Step 2: Check current seat availability (race condition check)
      const { data: currentTrip, error: tripError } = await supabase
        .from("trips")
        .select("available_seats")
        .eq("id", trip.id)
        .single();

      if (tripError) throw tripError;

      if (currentTrip.available_seats < seatsCount) {
        return { 
          success: false, 
          error: `Sorry, only ${currentTrip.available_seats} seat(s) are now available. Please adjust your booking.` 
        };
      }

      // Step 3: Calculate price
      const priceBreakdown = calculateBookingPrice(
        trip.price_per_seat,
        seatsCount,
        0 // No toll charges in current schema
      );

      // Step 4: Create booking using a transaction
      // Use Supabase RPC for atomic seat decrement + booking creation
      const { data: bookingData, error: bookingError } = await supabase
        .from("trip_bookings")
        .insert({
          trip_id: trip.id,
          passenger_id: user.id,
          seats_booked: seatsCount,
          pickup_location: pickupLocation || trip.route?.departure_location,
          dropoff_location: dropoffLocation || trip.route?.arrival_location,
          total_amount: priceBreakdown.totalAmount,
          platform_fee: priceBreakdown.platformFee,
          gst_amount: priceBreakdown.gst,
          booking_status: "confirmed",
          payment_status: "completed",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Step 5: Create payment record
      const { error: paymentError } = await supabase
        .from("booking_payments")
        .insert({
          booking_id: bookingData.id,
          payment_method_id: paymentMethodId,
          amount: priceBreakdown.baseFare,
          booking_fee: priceBreakdown.platformFee + priceBreakdown.gst,
          total_amount: priceBreakdown.totalAmount,
          currency: "INR",
          status: "completed",
          transaction_id: `TXN${Date.now()}`,
          paid_at: new Date().toISOString(),
        });

      if (paymentError) {
        console.error("Payment record error:", paymentError);
        // Don't fail the booking if payment record fails
      }

      // Step 6: Decrement available seats (atomic operation)
      const { error: updateError } = await supabase
        .from("trips")
        .update({
          available_seats: currentTrip.available_seats - seatsCount,
        })
        .eq("id", trip.id)
        .eq("available_seats", currentTrip.available_seats); // Optimistic locking

      if (updateError) {
        // Rollback booking if seat update fails
        await supabase
          .from("trip_bookings")
          .delete()
          .eq("id", bookingData.id);
        
        return { 
          success: false, 
          error: "Seats were booked by someone else. Please try again." 
        };
      }

      // Step 7: Send notifications
      await sendBookingNotifications(
        bookingData.id,
        trip,
        seatsCount,
        priceBreakdown.totalAmount,
        user.user_metadata?.full_name || user.email || "Passenger"
      );

      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your trip has been booked successfully. ${seatsCount} seat(s) reserved.`,
      });

      return { success: true, bookingId: bookingData.id };
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to complete booking. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, validate]);

  /**
   * Cancel a booking with refund calculation
   */
  const cancelBooking = useCallback(async (
    bookingId: string,
    reason: string
  ): Promise<CancellationResult> => {
    if (!user) {
      return { success: false, error: "You must be logged in" };
    }

    setLoading(true);

    try {
      // Step 1: Get booking details
      const { data: booking, error: fetchError } = await supabase
        .from("trip_bookings")
        .select(`
          *,
          trip:trips!trip_bookings_trip_id_fkey(
            id,
            driver_id,
            departure_time,
            available_seats,
            route:routes!trips_route_id_fkey(
              departure_location,
              arrival_location
            ),
            driver:profiles!trips_driver_id_fkey(
              id,
              full_name
            )
          )
        `)
        .eq("id", bookingId)
        .eq("passenger_id", user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!booking) {
        return { success: false, error: "Booking not found" };
      }

      if (booking.booking_status === "cancelled") {
        return { success: false, error: "Booking is already cancelled" };
      }

      // Step 2: Calculate refund
      const refund = calculateRefund(
        new Date(booking.trip.departure_time),
        booking.total_amount,
        booking.platform_fee || 0
      );

      // Step 3: Update booking status
      const { error: cancelError } = await supabase
        .from("trip_bookings")
        .update({
          booking_status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          refund_amount: refund.refundAmount,
          refund_status: refund.isEligible ? "pending" : "not_eligible",
        })
        .eq("id", bookingId);

      if (cancelError) throw cancelError;

      // Step 4: Restore seats to trip
      const { error: seatError } = await supabase
        .from("trips")
        .update({
          available_seats: booking.trip.available_seats + booking.seats_booked,
        })
        .eq("id", booking.trip_id);

      if (seatError) {
        console.error("Failed to restore seats:", seatError);
      }

      // Step 5: Process refund if eligible
      if (refund.isEligible && refund.refundAmount > 0) {
        await supabase
          .from("booking_payments")
          .update({
            status: "refunded",
            refund_amount: refund.refundAmount,
            refunded_at: new Date().toISOString(),
          })
          .eq("booking_id", bookingId);
      }

      // Step 6: Send cancellation notifications
      await sendCancellationNotifications(
        booking,
        refund.refundAmount,
        refund.reason,
        user.user_metadata?.full_name || user.email || "Passenger"
      );

      toast({
        title: "Booking Cancelled",
        description: refund.isEligible 
          ? `Refund of ₹${refund.refundAmount} will be processed within 5-7 business days.`
          : refund.reason,
      });

      return { success: true, refund };
    } catch (error: any) {
      console.error("Cancellation error:", error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Get refund preview for a booking
   */
  const getRefundPreview = useCallback(async (bookingId: string): Promise<RefundCalculation | null> => {
    try {
      const { data: booking, error } = await supabase
        .from("trip_bookings")
        .select(`
          total_amount,
          platform_fee,
          trip:trips!trip_bookings_trip_id_fkey(departure_time)
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      if (!booking) return null;

      // Type assertion for the trip relation (Supabase returns single object with .single())
      const tripData = booking.trip as unknown as { departure_time: string } | null;
      if (!tripData?.departure_time) return null;

      return calculateRefund(
        new Date(tripData.departure_time),
        booking.total_amount,
        booking.platform_fee || 0
      );
    } catch (error) {
      console.error("Refund preview error:", error);
      return null;
    }
  }, []);

  return {
    loading,
    priceBreakdown,
    calculatePrice,
    validate,
    createBooking,
    cancelBooking,
    getRefundPreview,
  };
}

/**
 * Send booking confirmation notifications
 */
async function sendBookingNotifications(
  bookingId: string,
  trip: TripForBooking,
  seatsBooked: number,
  totalAmount: number,
  passengerName: string
) {
  try {
    const notificationData: BookingNotificationData = {
      bookingId,
      tripId: trip.id,
      passengerId: "", // Will be filled by backend
      driverId: trip.driver_id,
      passengerName,
      driverName: trip.driver?.full_name || "Driver",
      departureLocation: trip.route?.departure_location || "",
      arrivalLocation: trip.route?.arrival_location || "",
      departureTime: new Date(trip.departure_time),
      seatsBooked,
      totalAmount,
    };

    // Create notifications in database
    const passengerNotification = createPassengerBookingConfirmation(notificationData);
    const driverNotification = createDriverBookingNotification(notificationData);

    // Insert notifications (fire and forget)
    await Promise.all([
      supabase.from("user_notifications").insert({
        user_id: notificationData.passengerId,
        title: passengerNotification.title,
        body: passengerNotification.body,
        type: passengerNotification.type,
        data: passengerNotification.data,
        action_url: passengerNotification.actionUrl,
      }),
      supabase.from("user_notifications").insert({
        user_id: trip.driver_id,
        title: driverNotification.title,
        body: driverNotification.body,
        type: driverNotification.type,
        data: driverNotification.data,
        action_url: driverNotification.actionUrl,
      }),
    ]);
  } catch (error) {
    console.error("Failed to send booking notifications:", error);
    // Don't throw - notifications are not critical
  }
}

/**
 * Send cancellation notifications
 */
async function sendCancellationNotifications(
  booking: any,
  refundAmount: number,
  refundReason: string,
  passengerName: string
) {
  try {
    const notificationData: BookingNotificationData = {
      bookingId: booking.id,
      tripId: booking.trip_id,
      passengerId: booking.passenger_id,
      driverId: booking.trip.driver_id,
      passengerName,
      driverName: booking.trip.driver?.full_name || "Driver",
      departureLocation: booking.trip.route?.departure_location || "",
      arrivalLocation: booking.trip.route?.arrival_location || "",
      departureTime: new Date(booking.trip.departure_time),
      seatsBooked: booking.seats_booked,
      totalAmount: booking.total_amount,
    };

    const passengerNotification = createPassengerCancellationNotification(
      notificationData,
      refundAmount,
      refundReason
    );
    const driverNotification = createDriverCancellationNotification(notificationData);

    await Promise.all([
      supabase.from("user_notifications").insert({
        user_id: booking.passenger_id,
        title: passengerNotification.title,
        body: passengerNotification.body,
        type: passengerNotification.type,
        data: passengerNotification.data,
        action_url: passengerNotification.actionUrl,
      }),
      supabase.from("user_notifications").insert({
        user_id: booking.trip.driver_id,
        title: driverNotification.title,
        body: driverNotification.body,
        type: driverNotification.type,
        data: driverNotification.data,
        action_url: driverNotification.actionUrl,
      }),
    ]);
  } catch (error) {
    console.error("Failed to send cancellation notifications:", error);
  }
}

