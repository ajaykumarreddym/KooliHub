/**
 * Repository Interface: Vehicle
 * Clean Architecture - Domain Layer
 * Defines contract for vehicle data access
 */

import { Vehicle, VehiclePhoto, VehicleDocument } from '../entities/Vehicle';

export interface IVehicleRepository {
  // Vehicle CRUD
  getById(id: string): Promise<Vehicle | null>;
  getUserVehicles(userId: string): Promise<Vehicle[]>;
  create(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle>;
  update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle>;
  delete(id: string): Promise<void>;
  setAsDefault(userId: string, vehicleId: string): Promise<void>;
  
  // Photos
  addPhoto(photo: Omit<VehiclePhoto, 'id' | 'createdAt'>): Promise<VehiclePhoto>;
  removePhoto(photoId: string): Promise<void>;
  setPrimaryPhoto(vehicleId: string, photoId: string): Promise<void>;
  
  // Documents
  addDocument(document: Omit<VehicleDocument, 'id'>): Promise<VehicleDocument>;
  updateDocument(id: string, document: Partial<VehicleDocument>): Promise<VehicleDocument>;
  removeDocument(documentId: string): Promise<void>;
  getExpiringDocuments(userId: string, daysThreshold: number): Promise<VehicleDocument[]>;
}

