/**
 * Domain Entity: Trip
 * Clean Architecture - Domain Layer
 */

export interface RouteStopover {
  id: string;
  routeId: string;
  cityName: string;
  stateName: string;
  latitude?: number;
  longitude?: number;
  stopOrder: number;
  estimatedArrivalOffsetMinutes?: number;
}

export interface TripRoute {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  stopovers: RouteStopover[];
}

export interface Trip {
  id: string;
  driverId: string;
  vehicleId: string;
  routeId: string;
  route: TripRoute;
  departureTime: Date;
  pricePerSeat: number;
  basePrice?: number;
  pricePerKm?: number;
  availableSeats: number;
  totalSeats: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  pickupLandmark?: string;
  dropoffLandmark?: string;
  tollCharges?: number;
  bookingDeadlineHours: number;
  instantBooking: boolean;
  ladiesOnly: boolean;
  smokingAllowed: boolean;
  amenities: string[];
  cancellationPolicy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TripEntity implements Trip {
  id: string;
  driverId: string;
  vehicleId: string;
  routeId: string;
  route: TripRoute;
  departureTime: Date;
  pricePerSeat: number;
  basePrice?: number;
  pricePerKm?: number;
  availableSeats: number;
  totalSeats: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  pickupLandmark?: string;
  dropoffLandmark?: string;
  tollCharges?: number;
  bookingDeadlineHours: number;
  instantBooking: boolean;
  ladiesOnly: boolean;
  smokingAllowed: boolean;
  amenities: string[];
  cancellationPolicy?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Trip) {
    Object.assign(this, data);
  }

  // Business Rules
  canAcceptBooking(seats: number): boolean {
    return (
      this.status === 'scheduled' &&
      this.availableSeats >= seats &&
      !this.isPastBookingDeadline() &&
      new Date() < this.departureTime
    );
  }

  isPastBookingDeadline(): boolean {
    const deadline = new Date(this.departureTime);
    deadline.setHours(deadline.getHours() - this.bookingDeadlineHours);
    return new Date() > deadline;
  }

  canBeCancelled(): boolean {
    return (
      this.status === 'scheduled' &&
      new Date() < this.departureTime
    );
  }

  calculateTotalPrice(seats: number): number {
    const baseAmount = this.pricePerSeat * seats;
    const tollPerSeat = (this.tollCharges || 0) / this.totalSeats;
    return baseAmount + (tollPerSeat * seats);
  }

  getBookedSeats(): number {
    return this.totalSeats - this.availableSeats;
  }

  isFullyBooked(): boolean {
    return this.availableSeats === 0;
  }

  getOccupancyPercentage(): number {
    return ((this.getBookedSeats() / this.totalSeats) * 100);
  }

  canBeStarted(): boolean {
    const now = new Date();
    const departure = new Date(this.departureTime);
    const startWindow = 30; // minutes before departure
    
    departure.setMinutes(departure.getMinutes() - startWindow);
    
    return (
      this.status === 'scheduled' &&
      now >= departure &&
      this.getBookedSeats() > 0
    );
  }
}

