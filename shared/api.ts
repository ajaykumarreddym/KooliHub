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

// Product and Catalog Types
export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  category_id?: string;
  stock_quantity: number;
  is_active: boolean;
  rating?: number;
  reviews_count: number;
  sku?: string;
  brand?: string;
  tags: string[];
  status: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  vendor?: Vendor;
  category?: Category;
  variants?: ProductVariant[];
  images?: ProductImage[];
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
