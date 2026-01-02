/**
 * Domain Entity: Review
 * Clean Architecture - Domain Layer
 */

export interface Review {
  id: string;
  tripId: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewType: 'driver' | 'passenger';
  rating: number;
  reviewText?: string;
  reviewTags: string[];
  isAnonymous: boolean;
  tripDate?: Date;
  driverResponse?: string;
  driverRespondedAt?: Date;
  helpfulCount: number;
  reported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewEntity implements Review {
  id: string;
  tripId: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewType: 'driver' | 'passenger';
  rating: number;
  reviewText?: string;
  reviewTags: string[];
  isAnonymous: boolean;
  tripDate?: Date;
  driverResponse?: string;
  driverRespondedAt?: Date;
  helpfulCount: number;
  reported: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Review) {
    Object.assign(this, data);
  }

  // Business Rules
  isPositive(): boolean {
    return this.rating >= 4;
  }

  isNegative(): boolean {
    return this.rating <= 2;
  }

  canBeResponded(userId: string): boolean {
    return (
      this.reviewType === 'driver' &&
      this.revieweeId === userId &&
      !this.driverResponse
    );
  }

  hasResponse(): boolean {
    return !!this.driverResponse;
  }

  getRatingText(): string {
    const ratings = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
    return ratings[this.rating - 1] || 'Not Rated';
  }

  incrementHelpful(): void {
    this.helpfulCount++;
  }
}

export const REVIEW_TAGS = {
  POSITIVE: [
    'Punctual',
    'Friendly',
    'Safe Driving',
    'Clean Car',
    'Good Music',
    'Great Conversation',
    'Professional',
    'Comfortable'
  ],
  NEGATIVE: [
    'Late',
    'Rude',
    'Unsafe Driving',
    'Dirty Car',
    'Smoking',
    'Uncomfortable',
    'Detour',
    'Poor Vehicle Condition'
  ]
};

