/**
 * Domain Entity: Booking
 * Clean Architecture - Domain Layer
 */

export interface PaymentDetails {
  id: string;
  bookingId: string;
  paymentMethod: 'card' | 'upi' | 'wallet' | 'cash' | 'netbanking';
  paymentProvider?: string;
  amount: number;
  currency: string;
  bookingFee: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  seatsBooked: number;
  totalPrice: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  pickupLocation?: string;
  dropoffLocation?: string;
  specialRequests?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  payment?: PaymentDetails;
  createdAt: Date;
  updatedAt: Date;
}

export class BookingEntity implements Booking {
  id: string;
  tripId: string;
  passengerId: string;
  seatsBooked: number;
  totalPrice: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  pickupLocation?: string;
  dropoffLocation?: string;
  specialRequests?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  payment?: PaymentDetails;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Booking) {
    Object.assign(this, data);
  }

  // Business Rules
  canBeCancelled(): boolean {
    return (
      this.bookingStatus === 'confirmed' ||
      this.bookingStatus === 'pending'
    );
  }

  isEligibleForRefund(): boolean {
    return (
      this.paymentStatus === 'completed' &&
      (this.bookingStatus === 'cancelled' || this.bookingStatus === 'pending')
    );
  }

  calculateRefundAmount(cancellationHoursBeforeTrip: number): number {
    // Cancellation policy: 
    // - More than 24 hours: 90% refund
    // - 12-24 hours: 50% refund
    // - Less than 12 hours: No refund
    
    if (cancellationHoursBeforeTrip >= 24) {
      return this.totalPrice * 0.9;
    } else if (cancellationHoursBeforeTrip >= 12) {
      return this.totalPrice * 0.5;
    }
    return 0;
  }

  isConfirmed(): boolean {
    return this.bookingStatus === 'confirmed';
  }

  isPaid(): boolean {
    return this.paymentStatus === 'completed';
  }

  requiresPayment(): boolean {
    return (
      this.bookingStatus === 'pending' &&
      this.paymentStatus === 'pending' &&
      this.payment?.paymentMethod !== 'cash'
    );
  }
}

