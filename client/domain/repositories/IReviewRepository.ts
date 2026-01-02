/**
 * Repository Interface: Review
 * Clean Architecture - Domain Layer
 */

import { Review } from '../entities/Review';

export interface IReviewRepository {
  // Review CRUD
  getById(id: string): Promise<Review | null>;
  getDriverReviews(driverId: string, limit?: number): Promise<Review[]>;
  getPassengerReviews(passengerId: string, limit?: number): Promise<Review[]>;
  getTripReview(tripId: string, reviewerId: string): Promise<Review | null>;
  create(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review>;
  addResponse(reviewId: string, response: string): Promise<void>;
  incrementHelpful(reviewId: string): Promise<void>;
  report(reviewId: string): Promise<void>;
  
  // Statistics
  getAverageRating(userId: string): Promise<number>;
  getRatingDistribution(userId: string): Promise<Record<number, number>>;
}

