/**
 * Repository Interface: Trip
 * Clean Architecture - Domain Layer
 */

import { Trip, TripRoute, RouteStopover } from '../entities/Trip';

export interface TripFilters {
  origin?: string;
  destination?: string;
  departureDate?: Date;
  minSeats?: number;
  maxPrice?: number;
  vehicleType?: string;
  ladiesOnly?: boolean;
  amenities?: string[];
}

export interface ITripRepository {
  // Trip CRUD
  getById(id: string): Promise<Trip | null>;
  search(filters: TripFilters): Promise<Trip[]>;
  getDriverTrips(driverId: string): Promise<Trip[]>;
  getUpcomingTrips(driverId: string): Promise<Trip[]>;
  getCompletedTrips(driverId: string): Promise<Trip[]>;
  create(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip>;
  update(id: string, trip: Partial<Trip>): Promise<Trip>;
  updateStatus(id: string, status: Trip['status']): Promise<Trip>;
  cancel(id: string, reason?: string): Promise<void>;
  
  // Seat Management
  updateAvailableSeats(tripId: string, seatsChange: number): Promise<void>;
  
  // Route Management
  createRoute(route: Omit<TripRoute, 'id'>): Promise<TripRoute>;
  addStopover(stopover: Omit<RouteStopover, 'id'>): Promise<RouteStopover>;
  removeStopover(stopoverId: string): Promise<void>;
  reorderStopovers(routeId: string, stopoverIds: string[]): Promise<void>;
}

