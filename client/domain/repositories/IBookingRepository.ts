/**
 * Repository Interface: Booking
 * Clean Architecture - Domain Layer
 */

import { Booking, PaymentDetails } from '../entities/Booking';

export interface IBookingRepository {
  // Booking CRUD
  getById(id: string): Promise<Booking | null>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getTripBookings(tripId: string): Promise<Booking[]>;
  getUpcomingBookings(userId: string): Promise<Booking[]>;
  getPastBookings(userId: string): Promise<Booking[]>;
  create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking>;
  update(id: string, booking: Partial<Booking>): Promise<Booking>;
  cancel(id: string, reason: string, cancelledBy: string): Promise<void>;
  
  // Payment
  createPayment(payment: Omit<PaymentDetails, 'id'>): Promise<PaymentDetails>;
  updatePaymentStatus(
    bookingId: string,
    status: PaymentDetails['status'],
    transactionId?: string
  ): Promise<void>;
  processRefund(bookingId: string, amount: number): Promise<void>;
}

