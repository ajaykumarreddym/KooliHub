/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// User and Auth Types
export type UserRole =
  | "admin"
  | "vendor_admin"
  | "vendor_user"
  | "customer"
  | "guest";
export type VendorStatus =
  | "active"
  | "inactive"
  | "pending_approval"
  | "suspended";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "promotion"
  | "order_update";
export type DeviceType = "all" | "desktop" | "mobile" | "tablet";

// Service Area Product Types
export interface ServiceAreaProduct {
  id: string;
  service_area_id: string;
  offering_id: string;
  is_available: boolean;
  stock_quantity: number | null;
  price_override: number | null;
  delivery_time_override: number | null;
  priority_order: number;
  location_notes: string | null;
  min_order_quantity: number;
  max_order_quantity: number | null;
  is_featured: boolean;
  available_from: string | null;
  available_until: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ServiceAreaCategory {
  id: string;
  service_area_id: string;
  category_id: string;
  is_available: boolean;
  display_order: number;
  auto_include_new_products: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceAreaProductSummary {
  service_area_id: string;
  pincode: string;
  city: string;
  state: string;
  total_products: number;
  available_products: number;
  featured_products: number;
  total_categories: number;
  is_serviceable: boolean;
  service_types: string[];
}

// Vendor Types
export interface Vendor {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  business_email: string;
  business_phone?: string;
  business_address?: string;
  business_registration_number?: string;
  tax_id?: string;
  status: VendorStatus;
  is_verified: boolean;
  commission_rate: number;
  payment_terms_days: number;
  minimum_order_amount: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface VendorUser {
  id: string;
  vendor_id: string;
  user_id: string;
  role: UserRole;
  permissions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  user?: Profile;
}

// Offering and Catalog Types (Modern Architecture)
export type OfferingType = 
  | "product" 
  | "service" 
  | "ride" 
  | "delivery" 
  | "booking" 
  | "rental" 
  | "subscription" 
  | "digital";

export type OfferingStatus = 
  | "draft" 
  | "pending_approval" 
  | "active" 
  | "inactive" 
  | "out_of_stock" 
  | "discontinued" 
  | "scheduled";

export type AvailabilityType = 
  | "always" 
  | "scheduled" 
  | "on_demand" 
  | "appointment_only";

export interface Offering {
  id: string;
  tenant_id?: string;
  vendor_id?: string;
  name: string;
  slug?: string;
  description?: string;
  type: OfferingType;
  status?: OfferingStatus;
  category_path?: string;
  category_id?: string;
  base_price?: number;
  currency?: string;
  pricing_type?: string;
  primary_image_url?: string;
  gallery_urls?: string[];
  tags?: string[];
  keywords?: string[];
  brand?: string;
  sku?: string;
  image_url?: string;
  price?: number;
  stock_quantity?: number;
  availability_type?: AvailabilityType;
  is_active?: boolean;
  metadata?: Record<string, any>;
  custom_attributes?: Record<string, any>;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  vendor?: Vendor;
  category?: Category;
  variants?: OfferingVariant[];
  attributes?: OfferingAttribute[];
}

// Keep Product interface for backward compatibility where needed
export interface Product extends Offering {
  price: number;
  discount_price?: number;
  image_url?: string;
  stock_quantity: number;
  rating?: number;
  reviews_count: number;
  sku?: string;
  brand?: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface OfferingVariant {
  id: string;
  offering_id?: string;
  name: string;
  sku?: string;
  price_adjustment?: number;
  price_override?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  attributes?: Record<string, any>;
  track_inventory?: boolean;
  is_active?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  offering?: Offering;
  inventory?: MerchantInventory[];
  attributes_values?: OfferingAttribute[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  description?: string;
  unit?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  attributes: Record<string, any>;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  product?: Product;
  inventory_levels?: InventoryLevel[];
  price_list_items?: PriceListItem[];
}

export interface ProductImage {
  id: string;
  product_id?: string;
  variant_id?: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

// New Clean Schema Types
export interface AttributeRegistry {
  id: string;
  tenant_id?: string;
  name: string;
  label: string;
  data_type: string;
  scope?: string;
  applicable_types?: OfferingType[];
  validation_rules?: Record<string, any>;
  options?: Record<string, any>;
  default_value?: string;
  input_type?: string;
  placeholder?: string;
  help_text?: string;
  group_name?: string;
  sort_order?: number;
  is_required?: boolean;
  is_searchable?: boolean;
  is_filterable?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfferingAttribute {
  id: string;
  offering_id?: string;
  variant_id?: string;
  attribute_id?: string;
  value_text?: string;
  value_number?: number;
  value_boolean?: boolean;
  value_json?: Record<string, any>;
  value_date?: string;
  value_datetime?: string;
  created_at: string;
  updated_at: string;
  attribute_registry?: AttributeRegistry;
}

export interface Merchant {
  id: string;
  tenant_id?: string;
  vendor_id?: string;
  name: string;
  slug?: string;
  type?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  location?: Record<string, any>;
  business_hours?: Record<string, any>;
  delivery_zones?: string[];
  pickup_available?: boolean;
  delivery_available?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  inventory?: MerchantInventory[];
}

export interface MerchantInventory {
  id: string;
  merchant_id?: string;
  offering_id?: string;
  variant_id?: string;
  quantity?: number;
  reserved_quantity?: number;
  safety_stock?: number;
  reorder_point?: number;
  max_stock?: number;
  price_override?: number;
  discount_percentage?: number;
  is_available?: boolean;
  availability_note?: string;
  last_counted_at?: string;
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
  merchant?: Merchant;
  offering?: Offering;
  variant?: OfferingVariant;
}

export interface ZoneServiceAvailability {
  id: string;
  tenant_id?: string;
  zone_id?: string;
  pincode?: string;
  service_types?: string[];
  offering_types?: OfferingType[];
  availability_schedule?: Record<string, any>;
  is_active?: boolean;
  delivery_time_hours?: number;
  delivery_charge?: number;
  minimum_order_amount?: number;
  maximum_order_amount?: number;
  coordinates?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  service_type: string;
  vendor_id?: string;
  parent_id?: string;
  level: number;
  path?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  parent?: Category;
  children?: Category[];
}

// Geography and Service Types
export interface ServiceZone {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  areas?: ServiceableArea[];
}

export interface ServiceableArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  zone_id?: string;
  is_serviceable: boolean;
  service_types: string[];
  delivery_time_hours?: number;
  delivery_charge?: number;
  latitude?: number;
  longitude?: number;
  coordinates?: Record<string, any>;
  created_at: string;
  updated_at: string;
  zone?: ServiceZone;
}

export interface VendorServiceZone {
  id: string;
  vendor_id: string;
  zone_id: string;
  delivery_time_hours: number;
  delivery_charge: number;
  free_delivery_threshold?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  zone?: ServiceZone;
}

// Pricing Types
export interface PriceList {
  id: string;
  vendor_id: string;
  zone_id?: string;
  name: string;
  currency: string;
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  zone?: ServiceZone;
  items?: PriceListItem[];
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  variant_id: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  min_qty: number;
  max_qty?: number;
  tier_pricing?: Record<string, any>;
  created_at: string;
  updated_at: string;
  price_list?: PriceList;
  variant?: ProductVariant;
}

// Inventory Types
export interface InventoryLocation {
  id: string;
  vendor_id: string;
  name: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface InventoryLevel {
  id: string;
  variant_id: string;
  location_id: string;
  quantity: number;
  reserved_quantity: number;
  safety_stock: number;
  reorder_point: number;
  last_counted_at?: string;
  created_at: string;
  updated_at: string;
  variant?: ProductVariant;
  location?: InventoryLocation;
}

// Order Types
export interface Order {
  id: string;
  user_id?: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  vendor_count: number;
  subtotal?: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  delivery_address: string;
  delivery_pincode: string;
  service_type: string;
  order_items: any; // Legacy JSONB field
  payment_status: PaymentStatus;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  items?: OrderItem[];
  addresses?: OrderAddress[];
  adjustments?: OrderAdjustment[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  vendor_id: string;
  product_id: string;
  variant_id?: string;
  name_snapshot: string;
  sku_snapshot?: string;
  quantity: number;
  unit_price: number;
  compare_at_price?: number;
  currency: string;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  attributes_snapshot?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  order?: Order;
  vendor?: Vendor;
  product?: Product;
  variant?: ProductVariant;
}

export interface OrderAddress {
  id: string;
  order_id: string;
  type: string; // shipping, billing
  full_name: string;
  phone?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface OrderAdjustment {
  id: string;
  order_id: string;
  type: string; // coupon, tax, shipping, fee
  name: string;
  description?: string;
  amount: number;
  percentage?: number;
  reference_id?: string;
  created_at: string;
}

// User Profile Type
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// Common API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Service Type
export interface ServiceType {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  features: any[];
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Coupon Types
export interface Coupon {
  id: string;
  vendor_id?: string;
  code: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number;
  usage_limit: number;
  used_count: number;
  max_uses_per_user: number;
  applies_to: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

// Payment Types
export interface Payment {
  id: string;
  order_id: string;
  payment_method_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_gateway?: string;
  gateway_transaction_id?: string;
  gateway_response?: Record<string, any>;
  processing_fee: number;
  notes?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

// Internationalization Types
export interface Translation {
  id: string;
  resource_type: string;
  resource_id: string;
  locale: string;
  field_name: string;
  translated_value: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Locale {
  id: string;
  name: string;
  native_name: string;
  language_code: string;
  country_code: string;
  rtl: boolean;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
}

export interface LocaleSettings {
  id: string;
  locale_id: string;
  currency_code: string;
  currency_symbol: string;
  currency_position: 'before' | 'after';
  decimal_separator: string;
  thousand_separator: string;
  date_format: string;
  time_format: '12' | '24';
  number_format: Record<string, any>;
}

// Service Attribute System Types
export interface ServiceFieldDefinition {
  id: string;
  service_type_id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'datetime' | 'url' | 'email' | 'tel' | 'textarea';
  field_group?: string;
  validation_rules: Record<string, any>;
  field_options?: any[];
  default_value?: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_translatable: boolean;
  sort_order: number;
  help_text?: string;
}

export interface ProductServiceAttribute {
  id: string;
  product_id: string;
  field_definition_id: string;
  value_text?: string;
  value_number?: number;
  value_boolean?: boolean;
  value_json?: any;
  field_definition?: ServiceFieldDefinition;
}

// Enhanced Order System Types
export interface OrderWorkflow {
  id: string;
  order_id: string;
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  previous_status?: string;
  transition_reason?: string;
  transition_metadata: Record<string, any>;
  transitioned_by?: string;
  transitioned_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  state: 'initialized' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  previous_state?: string;
  gateway_transaction_id?: string;
  gateway_response?: Record<string, any>;
  idempotency_key?: string;
  amount: number;
  currency: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderPromotion {
  id: string;
  order_id: string;
  promotion_type: 'coupon' | 'discount' | 'cashback' | 'loyalty_points' | 'referral';
  promotion_code?: string;
  promotion_name: string;
  discount_type?: 'percentage' | 'fixed' | 'buy_x_get_y';
  discount_value?: number;
  max_discount?: number;
  applied_amount: number;
  created_at: string;
}

export interface DeliverySlot {
  id: string;
  zone_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  is_available: boolean;
  created_at: string;
}

export interface OrderDelivery {
  id: string;
  order_id: string;
  delivery_slot_id?: string;
  delivery_type: 'standard' | 'express' | 'same_day' | 'scheduled' | 'pickup';
  estimated_delivery?: string;
  actual_delivery?: string;
  delivery_instructions?: string;
  contact_phone?: string;
  delivery_charge: number;
  created_at: string;
  delivery_slot?: DeliverySlot;
}

// Event Sourcing Types
export interface DomainEvent {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  event_version: number;
  event_data: Record<string, any>;
  metadata: Record<string, any>;
  correlation_id?: string;
  causation_id?: string;
  occurred_at: string;
  recorded_at: string;
  user_id?: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Admin Statistics Types
export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  total_vendors: number;
  recent_orders: Order[];
  top_products: Product[];
  vendor_performance: any[];
}

// ============================================
// TRIP BOOKING TYPES
// ============================================

export type TripType = 'scheduled' | 'instant' | 'recurring';
export type TripStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type VehicleType = 'car' | 'suv' | 'van' | 'bus' | 'bike' | 'auto';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type DriverStatus = 'active' | 'inactive' | 'suspended';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

// Route interface
export interface Route {
  id: string;
  name: string;
  departure_location: string;
  departure_lat?: number;
  departure_lng?: number;
  arrival_location: string;
  arrival_lat?: number;
  arrival_lng?: number;
  waypoints?: any;
  distance_km?: number;
  estimated_duration_minutes?: number;
  route_polyline?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Driver Profile interface
export interface DriverProfile {
  id: string;
  license_number: string;
  license_expiry: string;
  license_image_url?: string;
  address_proof_type?: string;
  address_proof_url?: string;
  background_check_status: VerificationStatus;
  verification_date?: string;
  total_trips: number;
  total_earnings: number;
  average_rating?: number;
  is_available: boolean;
  status: DriverStatus;
  preferences?: any;
  created_at: string;
  updated_at: string;
  profile?: Profile; // Extended user profile
}

// Vehicle interface
export interface Vehicle {
  id: string;
  driver_id: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  seating_capacity: number;
  registration_number?: string;
  insurance_number?: string;
  insurance_expiry?: string;
  pollution_certificate_expiry?: string;
  features?: string[];
  images?: any;
  documents?: any;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  driver?: Profile;
}

// Trip interface
export interface Trip {
  id: string;
  driver_id: string;
  vehicle_id?: string;
  route_id?: string;
  trip_type: TripType;
  departure_time: string;
  arrival_time?: string;
  total_seats: number;
  available_seats: number;
  price_per_seat: number;
  status: TripStatus;
  amenities?: string[];
  recurring_config?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
  driver?: Profile;
  vehicle?: Vehicle;
  route?: Route;
  driver_profile?: DriverProfile;
}

// Trip Booking interface
export interface TripBooking {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats_booked: number;
  pickup_location?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_location?: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  total_amount: number;
  booking_status: BookingStatus;
  payment_id?: string;
  passenger_notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  passenger?: Profile;
  payment?: Payment;
}

// Trip Review interface
export interface TripReview {
  id: string;
  booking_id: string;
  trip_id?: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review_text?: string;
  categories?: any;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  reviewer?: Profile;
  reviewee?: Profile;
  booking?: TripBooking;
}

// Trip Message interface
export interface TripMessage {
  id: string;
  trip_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  read_at?: string;
  metadata?: any;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

// Trip Tracking interface
export interface TripTracking {
  id: string;
  trip_id: string;
  driver_id: string;
  location_lat: number;
  location_lng: number;
  speed_kmh?: number;
  heading?: number;
  accuracy_meters?: number;
  timestamp: string;
  created_at: string;
}

// Trip Search Criteria
export interface TripSearchCriteria {
  departure_location?: string;
  arrival_location?: string;
  departure_date?: string;
  vehicle_type?: VehicleType;
  min_seats?: number;
  max_price?: number;
}

// Trip with extended data for UI
export interface TripWithDetails extends Trip {
  distance_km?: number;
  duration_minutes?: number;
  departure_location?: string;
  arrival_location?: string;
  driver_name?: string;
  driver_avatar?: string;
  driver_rating?: number;
  vehicle_name?: string;
}

// ============================================
// ENHANCED ATTRIBUTE SYSTEM TYPES
// ============================================

// Enhanced form field with inheritance metadata
export interface EnhancedFormField {
  attribute_id: string | null;
  attribute_name: string;
  attribute_label: string;
  data_type: string;
  input_type: string;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  is_visible: boolean;
  is_editable: boolean;
  is_deletable: boolean;
  display_order: number;
  field_group: string;
  validation_rules: any;
  options: any;
  default_value: string | null;
  is_system_field: boolean;
  is_mandatory: boolean;
  inherited_from: 'default' | 'service' | 'category' | 'subcategory';
  inheritance_level: number; // 0=default, 1=service, 2=category, 3=subcategory
}

// Subcategory type (extends Category)
export interface Subcategory extends Category {
  parent_id: string;
  parent_name?: string;
  level: number;
}

// Attribute configuration with edit/delete permissions
export interface AttributeConfigExtended {
  id: string;
  entity_type: 'service' | 'category' | 'subcategory';
  entity_id: string;
  attribute_id: string;
  is_required: boolean;
  is_visible: boolean;
  is_editable: boolean;
  is_deletable: boolean;
  display_order: number;
  field_group: string;
  override_label?: string;
  override_placeholder?: string;
  override_help_text?: string;
  custom_validation_rules?: Record<string, any>;
  inherit_from_parent: boolean;
  created_at: string;
  updated_at: string;
  attribute_registry?: AttributeRegistry;
}

// Preview field structure
export interface PreviewField {
  name: string;
  label: string;
  type: string;
  value: any;
  required: boolean;
  placeholder: string;
  help_text: string;
  locked: boolean;
  inherited_from: string;
  show_in_preview: boolean;
}

// Product validation result
export interface ProductValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    type: 'required' | 'validation' | 'duplicate';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

// Enhanced API Endpoints for New Features
export interface TranslationApi {
  // Get translations for a resource
  getTranslations: (resourceType: string, resourceId: string, locale?: string) => Promise<ApiResponse<Translation[]>>;
  
  // Set translation
  setTranslation: (data: {
    resource_type: string;
    resource_id: string;
    field_name: string;
    locale: string;
    translated_value: string;
  }) => Promise<ApiResponse<Translation>>;
  
  // Get supported locales
  getLocales: () => Promise<ApiResponse<Locale[]>>;
  
  // Get locale settings
  getLocaleSettings: (localeId: string) => Promise<ApiResponse<LocaleSettings>>;
}

export interface ServiceAttributeApi {
  // Get field definitions for service type
  getServiceFields: (serviceTypeId: string) => Promise<ApiResponse<ServiceFieldDefinition[]>>;
  
  // Get product attributes
  getProductAttributes: (productId: string) => Promise<ApiResponse<Record<string, any>>>;
  
  // Set product attribute
  setProductAttribute: (data: {
    product_id: string;
    field_name: string;
    value: string;
    service_type_id: string;
  }) => Promise<ApiResponse<ProductServiceAttribute>>;
  
  // Bulk update product attributes
  updateProductAttributes: (productId: string, attributes: Record<string, any>) => Promise<ApiResponse<ProductServiceAttribute[]>>;
}

export interface OrderManagementApi {
  // Get order workflow history
  getOrderWorkflow: (orderId: string) => Promise<ApiResponse<OrderWorkflow[]>>;
  
  // Transition order status
  transitionOrder: (data: {
    order_id: string;
    new_status: string;
    reason?: string;
    metadata?: Record<string, any>;
  }) => Promise<ApiResponse<OrderWorkflow>>;
  
  // Get payment transactions
  getPaymentTransactions: (paymentId: string) => Promise<ApiResponse<PaymentTransaction[]>>;
  
  // Process payment
  processPayment: (data: {
    payment_id: string;
    new_state: string;
    gateway_transaction_id?: string;
    gateway_response?: Record<string, any>;
    failure_reason?: string;
  }) => Promise<ApiResponse<PaymentTransaction>>;
  
  // Get delivery slots
  getDeliverySlots: (zoneId: string, date: string) => Promise<ApiResponse<DeliverySlot[]>>;
  
  // Book delivery slot
  bookDeliverySlot: (data: {
    order_id: string;
    slot_id: string;
    delivery_type: string;
    instructions?: string;
  }) => Promise<ApiResponse<OrderDelivery>>;
}

export interface SpatialApi {
  // Find nearby serviceable areas
  findNearbyAreas: (lat: number, lng: number, radiusKm?: number) => Promise<ApiResponse<{
    area_id: string;
    pincode: string;
    city: string;
    state: string;
    distance_km: number;
  }[]>>;
  
  // Check if location is serviceable
  checkServiceability: (lat: number, lng: number) => Promise<ApiResponse<{
    is_serviceable: boolean;
    nearest_area?: any;
    distance_km?: number;
  }>>;
}

export interface EventSourcingApi {
  // Get domain events for aggregate
  getAggregateEvents: (aggregateType: string, aggregateId: string, fromVersion?: number) => Promise<ApiResponse<DomainEvent[]>>;
  
  // Get audit logs
  getAuditLogs: (filters: {
    table_name?: string;
    record_id?: string;
    operation?: string;
    user_id?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
  }) => Promise<ApiResponse<AuditLog[]>>;
}
