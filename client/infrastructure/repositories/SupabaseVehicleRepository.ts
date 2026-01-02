/**
 * Supabase Implementation: Vehicle Repository
 * Infrastructure Layer - Clean Architecture
 */

import { supabase } from '@/lib/supabase';
import { IVehicleRepository } from '@/domain/repositories/IVehicleRepository';
import { Vehicle, VehiclePhoto, VehicleDocument } from '@/domain/entities/Vehicle';

export class SupabaseVehicleRepository implements IVehicleRepository {
  async getById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        photos:vehicle_photos(*),
        documents:vehicle_documents(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToVehicle(data);
  }

  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        photos:vehicle_photos(*),
        documents:vehicle_documents(*)
      `)
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToVehicle);
  }

  async create(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        user_id: vehicle.userId,
        vehicle_type: vehicle.vehicleType,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        license_plate: vehicle.licensePlate,
        vehicle_number: vehicle.vehicleNumber,
        seating_capacity: vehicle.seatingCapacity,
        is_verified: vehicle.isVerified,
        verification_status: vehicle.verificationStatus,
        is_default: vehicle.isDefault,
        amenities: vehicle.amenities,
        insurance_expiry: vehicle.insuranceExpiry,
        pollution_expiry: vehicle.pollutionExpiry,
        last_service_date: vehicle.lastServiceDate
      })
      .select(`
        *,
        photos:vehicle_photos(*),
        documents:vehicle_documents(*)
      `)
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to create vehicle');
    return this.mapToVehicle(data);
  }

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const updateData: any = {};
    
    if (vehicle.make) updateData.make = vehicle.make;
    if (vehicle.model) updateData.model = vehicle.model;
    if (vehicle.year) updateData.year = vehicle.year;
    if (vehicle.color) updateData.color = vehicle.color;
    if (vehicle.licensePlate) updateData.license_plate = vehicle.licensePlate;
    if (vehicle.vehicleNumber) updateData.vehicle_number = vehicle.vehicleNumber;
    if (vehicle.seatingCapacity) updateData.seating_capacity = vehicle.seatingCapacity;
    if (vehicle.isVerified !== undefined) updateData.is_verified = vehicle.isVerified;
    if (vehicle.verificationStatus) updateData.verification_status = vehicle.verificationStatus;
    if (vehicle.amenities) updateData.amenities = vehicle.amenities;
    if (vehicle.insuranceExpiry) updateData.insurance_expiry = vehicle.insuranceExpiry;
    if (vehicle.pollutionExpiry) updateData.pollution_expiry = vehicle.pollutionExpiry;
    if (vehicle.lastServiceDate) updateData.last_service_date = vehicle.lastServiceDate;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        photos:vehicle_photos(*),
        documents:vehicle_documents(*)
      `)
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to update vehicle');
    return this.mapToVehicle(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async setAsDefault(userId: string, vehicleId: string): Promise<void> {
    // First, unset all default vehicles for user
    await supabase
      .from('vehicles')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Then set the specified vehicle as default
    const { error } = await supabase
      .from('vehicles')
      .update({ is_default: true })
      .eq('id', vehicleId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  async addPhoto(photo: Omit<VehiclePhoto, 'id' | 'createdAt'>): Promise<VehiclePhoto> {
    const { data, error } = await supabase
      .from('vehicle_photos')
      .insert({
        vehicle_id: photo.vehicleId,
        photo_url: photo.photoUrl,
        is_primary: photo.isPrimary,
        display_order: photo.displayOrder
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to add photo');
    return this.mapToPhoto(data);
  }

  async removePhoto(photoId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw new Error(error.message);
  }

  async setPrimaryPhoto(vehicleId: string, photoId: string): Promise<void> {
    // Trigger will handle unsetting other primary photos
    const { error } = await supabase
      .from('vehicle_photos')
      .update({ is_primary: true })
      .eq('id', photoId)
      .eq('vehicle_id', vehicleId);

    if (error) throw new Error(error.message);
  }

  async addDocument(document: Omit<VehicleDocument, 'id'>): Promise<VehicleDocument> {
    const { data, error } = await supabase
      .from('vehicle_documents')
      .insert({
        vehicle_id: document.vehicleId,
        document_type: document.documentType,
        document_url: document.documentUrl,
        document_number: document.documentNumber,
        issue_date: document.issueDate,
        expiry_date: document.expiryDate,
        verification_status: document.verificationStatus || 'pending'
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to add document');
    return this.mapToDocument(data);
  }

  async updateDocument(id: string, document: Partial<VehicleDocument>): Promise<VehicleDocument> {
    const updateData: any = {};
    
    if (document.documentUrl) updateData.document_url = document.documentUrl;
    if (document.documentNumber) updateData.document_number = document.documentNumber;
    if (document.issueDate) updateData.issue_date = document.issueDate;
    if (document.expiryDate) updateData.expiry_date = document.expiryDate;
    if (document.verificationStatus) updateData.verification_status = document.verificationStatus;
    if (document.rejectionReason) updateData.rejection_reason = document.rejectionReason;

    const { data, error } = await supabase
      .from('vehicle_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to update document');
    return this.mapToDocument(data);
  }

  async removeDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw new Error(error.message);
  }

  async getExpiringDocuments(userId: string, daysThreshold: number): Promise<VehicleDocument[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('vehicle_documents')
      .select(`
        *,
        vehicle:vehicles!inner(user_id)
      `)
      .eq('vehicles.user_id', userId)
      .eq('verification_status', 'verified')
      .lte('expiry_date', thresholdDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error || !data) return [];
    return data.map(this.mapToDocument);
  }

  // Mapping helpers
  private mapToVehicle(data: any): Vehicle {
    return {
      id: data.id,
      userId: data.user_id,
      vehicleType: data.vehicle_type,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      licensePlate: data.license_plate,
      vehicleNumber: data.vehicle_number,
      seatingCapacity: data.seating_capacity,
      isVerified: data.is_verified,
      verificationStatus: data.verification_status,
      isDefault: data.is_default || false,
      amenities: data.amenities || [],
      insuranceExpiry: data.insurance_expiry ? new Date(data.insurance_expiry) : undefined,
      pollutionExpiry: data.pollution_expiry ? new Date(data.pollution_expiry) : undefined,
      lastServiceDate: data.last_service_date ? new Date(data.last_service_date) : undefined,
      photos: (data.photos || []).map(this.mapToPhoto),
      documents: (data.documents || []).map(this.mapToDocument),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapToPhoto(data: any): VehiclePhoto {
    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      photoUrl: data.photo_url,
      isPrimary: data.is_primary,
      displayOrder: data.display_order,
      createdAt: new Date(data.created_at)
    };
  }

  private mapToDocument(data: any): VehicleDocument {
    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      documentType: data.document_type,
      documentUrl: data.document_url,
      documentNumber: data.document_number,
      issueDate: data.issue_date ? new Date(data.issue_date) : undefined,
      expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
      verificationStatus: data.verification_status,
      rejectionReason: data.rejection_reason,
      verifiedAt: data.verified_at ? new Date(data.verified_at) : undefined,
      verifiedBy: data.verified_by
    };
  }
}

// Export singleton instance
export const vehicleRepository = new SupabaseVehicleRepository();

