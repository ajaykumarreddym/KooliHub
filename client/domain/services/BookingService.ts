/**
 * Booking Service
 * Domain Service for trip bookings, pricing, and cancellations
 * Clean Architecture - Domain Layer
 */

export interface BookingPriceBreakdown {
  baseFare: number;
  seatsBooked: number;
  pricePerSeat: number;
  platformFee: number;
  gst: number;
  tollCharges: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

export interface CancellationPolicy {
  hoursBeforeDeparture: number;
  refundPercentage: number;
  serviceFee: number;
  description: string;
}

export interface RefundCalculation {
  isEligible: boolean;
  originalAmount: number;
  refundPercentage: number;
  serviceFee: number;
  refundAmount: number;
  reason: string;
  policy: CancellationPolicy;
}

export interface BookingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Cancellation policies based on time before departure
 */
export const CANCELLATION_POLICIES: CancellationPolicy[] = [
  {
    hoursBeforeDeparture: 2, // More than 2 hours
    refundPercentage: 100,
    serviceFee: 25, // ₹25 service fee
    description: 'Full refund (minus ₹25 service fee)',
  },
  {
    hoursBeforeDeparture: 0.5, // 30 mins to 2 hours
    refundPercentage: 50,
    serviceFee: 0,
    description: '50% refund',
  },
  {
    hoursBeforeDeparture: 0, // Less than 30 mins
    refundPercentage: 0,
    serviceFee: 0,
    description: 'No refund',
  },
];

/**
 * Platform fee configuration
 */
export const PLATFORM_FEE_CONFIG = {
  PERCENTAGE: 5, // 5% platform fee
  MIN_FEE: 10, // Minimum ₹10
  MAX_FEE: 100, // Maximum ₹100
  GST_PERCENTAGE: 18, // 18% GST on platform fee
} as const;

/**
 * Calculate platform fee based on base fare
 */
export function calculatePlatformFee(baseFare: number): number {
  const percentageFee = (baseFare * PLATFORM_FEE_CONFIG.PERCENTAGE) / 100;
  
  // Apply min/max constraints
  const fee = Math.max(
    PLATFORM_FEE_CONFIG.MIN_FEE,
    Math.min(PLATFORM_FEE_CONFIG.MAX_FEE, percentageFee)
  );
  
  return Math.round(fee * 100) / 100;
}

/**
 * Calculate GST on platform fee
 */
export function calculateGST(platformFee: number): number {
  const gst = (platformFee * PLATFORM_FEE_CONFIG.GST_PERCENTAGE) / 100;
  return Math.round(gst * 100) / 100;
}

/**
 * Calculate complete booking price breakdown
 */
export function calculateBookingPrice(
  pricePerSeat: number,
  seatsBooked: number,
  tollCharges: number = 0,
  discountAmount: number = 0
): BookingPriceBreakdown {
  const baseFare = pricePerSeat * seatsBooked;
  const tollPerSeat = tollCharges > 0 ? tollCharges / seatsBooked : 0;
  const totalToll = tollPerSeat * seatsBooked;
  
  const platformFee = calculatePlatformFee(baseFare);
  const gst = calculateGST(platformFee);
  
  const totalAmount = baseFare + platformFee + gst + totalToll - discountAmount;
  
  return {
    baseFare,
    seatsBooked,
    pricePerSeat,
    platformFee,
    gst,
    tollCharges: totalToll,
    discountAmount,
    totalAmount: Math.round(totalAmount * 100) / 100,
    currency: 'INR',
  };
}

/**
 * Get applicable cancellation policy based on hours before departure
 */
export function getCancellationPolicy(hoursBeforeDeparture: number): CancellationPolicy {
  if (hoursBeforeDeparture >= 2) {
    return CANCELLATION_POLICIES[0]; // Full refund minus service fee
  } else if (hoursBeforeDeparture >= 0.5) {
    return CANCELLATION_POLICIES[1]; // 50% refund
  }
  return CANCELLATION_POLICIES[2]; // No refund
}

/**
 * Calculate refund amount based on cancellation time
 */
export function calculateRefund(
  departureTime: Date,
  totalAmount: number,
  platformFee: number = 0
): RefundCalculation {
  const now = new Date();
  const hoursBeforeDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Cannot cancel past trips
  if (hoursBeforeDeparture < 0) {
    return {
      isEligible: false,
      originalAmount: totalAmount,
      refundPercentage: 0,
      serviceFee: 0,
      refundAmount: 0,
      reason: 'Cannot cancel past trips',
      policy: CANCELLATION_POLICIES[2],
    };
  }
  
  const policy = getCancellationPolicy(hoursBeforeDeparture);
  
  // Calculate refundable amount (excluding platform fee which is non-refundable)
  const refundableAmount = totalAmount - platformFee;
  let refundAmount = (refundableAmount * policy.refundPercentage) / 100;
  
  // Deduct service fee if applicable
  if (policy.serviceFee > 0) {
    refundAmount = Math.max(0, refundAmount - policy.serviceFee);
  }
  
  return {
    isEligible: refundAmount > 0,
    originalAmount: totalAmount,
    refundPercentage: policy.refundPercentage,
    serviceFee: policy.serviceFee,
    refundAmount: Math.round(refundAmount * 100) / 100,
    reason: policy.description,
    policy,
  };
}

/**
 * Validate booking before creation
 */
export function validateBooking(
  availableSeats: number,
  requestedSeats: number,
  departureTime: Date,
  bookingDeadlineHours: number = 2
): BookingValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const now = new Date();
  
  // Check seat availability
  if (requestedSeats > availableSeats) {
    errors.push(`Only ${availableSeats} seat(s) available. You requested ${requestedSeats}.`);
  }
  
  // Check if trip is in the past
  if (departureTime < now) {
    errors.push('Cannot book a trip that has already departed.');
  }
  
  // Check booking deadline
  const deadlineTime = new Date(departureTime);
  deadlineTime.setHours(deadlineTime.getHours() - bookingDeadlineHours);
  
  if (now > deadlineTime) {
    errors.push(`Booking deadline has passed. Must book at least ${bookingDeadlineHours} hour(s) before departure.`);
  }
  
  // Check for minimum seats
  if (requestedSeats < 1) {
    errors.push('Must book at least 1 seat.');
  }
  
  // Warnings
  const hoursBeforeDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursBeforeDeparture < 4) {
    warnings.push('Trip departs in less than 4 hours. Please ensure you can reach the pickup point on time.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if seats are still available (for race condition handling)
 */
export async function checkSeatAvailability(
  tripId: string,
  requestedSeats: number,
  getCurrentAvailableSeats: () => Promise<number>
): Promise<{ available: boolean; currentSeats: number }> {
  const currentSeats = await getCurrentAvailableSeats();
  
  return {
    available: currentSeats >= requestedSeats,
    currentSeats,
  };
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

