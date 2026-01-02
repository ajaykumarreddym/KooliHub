/**
 * Notification Service
 * Domain Service for sending booking notifications
 * Clean Architecture - Domain Layer
 */

export type NotificationType = 
  | 'booking_confirmation'
  | 'booking_cancelled'
  | 'trip_reminder'
  | 'driver_update'
  | 'payment_received'
  | 'refund_processed'
  | 'trip_started'
  | 'trip_completed';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

export interface BookingNotificationData {
  bookingId: string;
  tripId: string;
  passengerId: string;
  driverId: string;
  passengerName: string;
  driverName: string;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: Date;
  seatsBooked: number;
  totalAmount: number;
}

export interface RefundNotificationData extends BookingNotificationData {
  refundAmount: number;
  refundReason: string;
}

/**
 * Create booking confirmation notification for passenger
 */
export function createPassengerBookingConfirmation(
  data: BookingNotificationData
): NotificationPayload {
  const departureDate = formatNotificationDate(data.departureTime);
  
  return {
    type: 'booking_confirmation',
    title: '🎉 Booking Confirmed!',
    body: `Your trip from ${data.departureLocation} to ${data.arrivalLocation} on ${departureDate} is confirmed. ${data.seatsBooked} seat(s) booked with ${data.driverName}.`,
    data: {
      bookingId: data.bookingId,
      tripId: data.tripId,
      type: 'booking_confirmation',
    },
    actionUrl: `/trip-booking/booking/${data.bookingId}`,
  };
}

/**
 * Create booking notification for driver
 */
export function createDriverBookingNotification(
  data: BookingNotificationData
): NotificationPayload {
  const departureDate = formatNotificationDate(data.departureTime);
  
  return {
    type: 'booking_confirmation',
    title: '🚗 New Booking!',
    body: `${data.passengerName} has booked ${data.seatsBooked} seat(s) for your trip on ${departureDate}. Amount: ₹${data.totalAmount}`,
    data: {
      bookingId: data.bookingId,
      tripId: data.tripId,
      passengerId: data.passengerId,
      type: 'new_booking',
    },
    actionUrl: `/trip-booking/my-trip/${data.tripId}`,
  };
}

/**
 * Create cancellation notification for passenger
 */
export function createPassengerCancellationNotification(
  data: BookingNotificationData,
  refundAmount: number,
  cancellationReason: string
): NotificationPayload {
  return {
    type: 'booking_cancelled',
    title: '❌ Booking Cancelled',
    body: refundAmount > 0 
      ? `Your booking has been cancelled. Refund of ₹${refundAmount} will be processed within 5-7 business days.`
      : `Your booking has been cancelled. ${cancellationReason}`,
    data: {
      bookingId: data.bookingId,
      tripId: data.tripId,
      type: 'booking_cancelled',
      refundAmount,
    },
    actionUrl: `/trip-booking/profile`,
  };
}

/**
 * Create cancellation notification for driver
 */
export function createDriverCancellationNotification(
  data: BookingNotificationData
): NotificationPayload {
  return {
    type: 'booking_cancelled',
    title: '⚠️ Booking Cancelled',
    body: `${data.passengerName} has cancelled their booking for ${data.seatsBooked} seat(s).`,
    data: {
      bookingId: data.bookingId,
      tripId: data.tripId,
      type: 'booking_cancelled',
    },
    actionUrl: `/trip-booking/my-trip/${data.tripId}`,
  };
}

/**
 * Create trip reminder notification
 */
export function createTripReminderNotification(
  data: BookingNotificationData,
  hoursUntilDeparture: number
): NotificationPayload {
  const timeText = hoursUntilDeparture >= 1 
    ? `${Math.round(hoursUntilDeparture)} hour(s)`
    : `${Math.round(hoursUntilDeparture * 60)} minutes`;
  
  return {
    type: 'trip_reminder',
    title: '⏰ Trip Reminder',
    body: `Your trip to ${data.arrivalLocation} departs in ${timeText}. Don't forget to reach the pickup point!`,
    data: {
      bookingId: data.bookingId,
      tripId: data.tripId,
      type: 'trip_reminder',
    },
    actionUrl: `/trip-booking/trip/${data.tripId}`,
  };
}

/**
 * Create refund processed notification
 */
export function createRefundNotification(
  data: RefundNotificationData
): NotificationPayload {
  return {
    type: 'refund_processed',
    title: '💰 Refund Processed',
    body: `Your refund of ₹${data.refundAmount} has been initiated. It will be credited to your account within 5-7 business days.`,
    data: {
      bookingId: data.bookingId,
      refundAmount: data.refundAmount,
      type: 'refund_processed',
    },
    actionUrl: `/trip-booking/profile`,
  };
}

/**
 * Create trip started notification for passenger
 */
export function createTripStartedNotification(
  data: BookingNotificationData
): NotificationPayload {
  return {
    type: 'trip_started',
    title: '🚀 Trip Started!',
    body: `Your trip from ${data.departureLocation} to ${data.arrivalLocation} has started. Track your journey live!`,
    data: {
      bookingId: data.bookingId,
      tripId: data.tripId,
      type: 'trip_started',
    },
    actionUrl: `/trip-booking/live/${data.tripId}`,
  };
}

/**
 * Create trip completed notification
 */
export function createTripCompletedNotification(
  data: BookingNotificationData
): NotificationPayload {
  return {
    type: 'trip_completed',
    title: '✅ Trip Completed',
    body: `You've arrived at ${data.arrivalLocation}. Rate your trip experience!`,
    data: {
      bookingId: data.bookingId,
      tripId: data.tripId,
      type: 'trip_completed',
    },
    actionUrl: `/trip-booking/rate/${data.bookingId}`,
  };
}

/**
 * Format date for notifications
 */
function formatNotificationDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleDateString('en-IN', options);
}

/**
 * Notification channels
 */
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

/**
 * Get notification channels for a notification type
 */
export function getNotificationChannels(type: NotificationType): NotificationChannel[] {
  switch (type) {
    case 'booking_confirmation':
    case 'booking_cancelled':
      return ['push', 'email', 'in_app'];
    
    case 'trip_reminder':
    case 'trip_started':
      return ['push', 'in_app'];
    
    case 'refund_processed':
      return ['push', 'email', 'in_app'];
    
    case 'payment_received':
      return ['push', 'in_app'];
    
    case 'trip_completed':
      return ['push', 'in_app'];
    
    default:
      return ['in_app'];
  }
}

