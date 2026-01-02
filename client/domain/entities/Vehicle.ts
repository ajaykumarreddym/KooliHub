/**
 * Domain Entity: Vehicle
 * Clean Architecture - Domain Layer
 * Represents a vehicle in the system with all business rules
 */

export interface VehiclePhoto {
  id: string;
  vehicleId: string;
  photoUrl: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  documentType: 'registration' | 'insurance' | 'pollution' | 'permit';
  documentUrl: string;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  rejectionReason?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  vehicleType: 'car' | 'auto' | 'bike';
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleNumber?: string;
  seatingCapacity: number;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isDefault: boolean;
  amenities: string[];
  insuranceExpiry?: Date;
  pollutionExpiry?: Date;
  lastServiceDate?: Date;
  photos: VehiclePhoto[];
  documents: VehicleDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export class VehicleEntity implements Vehicle {
  id: string;
  userId: string;
  vehicleType: 'car' | 'auto' | 'bike';
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleNumber?: string;
  seatingCapacity: number;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isDefault: boolean;
  amenities: string[];
  insuranceExpiry?: Date;
  pollutionExpiry?: Date;
  lastServiceDate?: Date;
  photos: VehiclePhoto[];
  documents: VehicleDocument[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Vehicle) {
    Object.assign(this, data);
  }

  // Business Rules
  isDocumentExpiringSoon(days: number = 30): boolean {
    const expiryDates = this.documents
      .filter(doc => doc.expiryDate && doc.verificationStatus === 'verified')
      .map(doc => doc.expiryDate!);

    if (expiryDates.length === 0) return false;

    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    return expiryDates.some(date => date <= threshold);
  }

  canPublishTrips(): boolean {
    return (
      this.isVerified &&
      this.verificationStatus === 'verified' &&
      this.photos.length > 0 &&
      this.documents.some(doc => 
        doc.documentType === 'registration' && 
        doc.verificationStatus === 'verified'
      ) &&
      this.documents.some(doc => 
        doc.documentType === 'insurance' && 
        doc.verificationStatus === 'verified'
      )
    );
  }

  getPrimaryPhoto(): VehiclePhoto | undefined {
    return this.photos.find(photo => photo.isPrimary) || this.photos[0];
  }

  getDisplayName(): string {
    return `${this.make} ${this.model} (${this.year})`;
  }

  hasAmenity(amenity: string): boolean {
    return this.amenities.includes(amenity);
  }
}

