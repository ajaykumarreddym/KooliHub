-- ========================================
-- PART 3: CRITICAL PERFORMANCE INDEXES
-- Missing indexes identified in audit
-- ========================================

-- 1. PRODUCT PERFORMANCE INDEXES
-- Full-text search for products
CREATE INDEX IF NOT EXISTS idx_products_fulltext 
ON public.products USING gin(to_tsvector('english', 
    COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand, '')
));

-- Product search by vendor and status
CREATE INDEX IF NOT EXISTS idx_products_vendor_active_stock 
ON public.products (vendor_id, is_active, stock_quantity) 
WHERE deleted_at IS NULL;

-- Category and service filtering
CREATE INDEX IF NOT EXISTS idx_products_category_service 
ON public.products (category_id, is_active, created_at DESC) 
WHERE deleted_at IS NULL;

-- 2. ORDER PERFORMANCE INDEXES
-- Order management by vendor
CREATE INDEX IF NOT EXISTS idx_orders_vendor_status_date 
ON public.orders (vendor_count, status, created_at DESC);

-- User order history
CREATE INDEX IF NOT EXISTS idx_orders_user_status_date 
ON public.orders (user_id, status, created_at DESC);

-- Payment status tracking
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON public.orders (payment_status, status, created_at);

-- 3. ORDER ITEMS PERFORMANCE
-- Vendor sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_date 
ON public.order_items (vendor_id, created_at DESC);

-- Product sales tracking
CREATE INDEX IF NOT EXISTS idx_order_items_product_date 
ON public.order_items (product_id, created_at DESC);

-- Revenue calculations
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_amount 
ON public.order_items (vendor_id, total_amount, created_at);

-- 4. VENDOR PERFORMANCE INDEXES
-- Vendor filtering and search
CREATE INDEX IF NOT EXISTS idx_vendors_status_created 
ON public.vendors (status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Vendor slug lookup (unique already exists, but optimize)
CREATE INDEX IF NOT EXISTS idx_vendors_slug_active 
ON public.vendors (slug, status) 
WHERE deleted_at IS NULL;

-- 5. CATEGORY HIERARCHY INDEXES
-- Category tree navigation
CREATE INDEX IF NOT EXISTS idx_categories_parent_level 
ON public.categories (parent_id, level, sort_order);

-- Service type categories
CREATE INDEX IF NOT EXISTS idx_categories_service_active 
ON public.categories (service_type, is_active, sort_order);

-- Vendor categories
CREATE INDEX IF NOT EXISTS idx_categories_vendor_service 
ON public.categories (vendor_id, service_type, is_active);

-- 6. INVENTORY OPTIMIZATION
-- Low stock alerts
CREATE INDEX IF NOT EXISTS idx_inventory_levels_low_stock_alert 
ON public.inventory_levels (location_id, quantity, reorder_point) 
WHERE quantity <= reorder_point;

-- Inventory by location
CREATE INDEX IF NOT EXISTS idx_inventory_levels_location_variant 
ON public.inventory_levels (location_id, variant_id, quantity);

-- 7. PRICING PERFORMANCE
-- Price lookups by area
CREATE INDEX IF NOT EXISTS idx_product_area_pricing_lookup 
ON public.product_area_pricing (service_area_id, product_id, is_active, is_available);

-- Promotional pricing
CREATE INDEX IF NOT EXISTS idx_product_area_pricing_promo_active 
ON public.product_area_pricing (promotional_price, promo_start_date, promo_end_date) 
WHERE promotional_price IS NOT NULL;

-- 8. DELIVERY AND FULFILLMENT
-- Available delivery agents
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available_location 
ON public.delivery_agents (is_available, current_location, rating DESC) 
WHERE is_available = true;

-- Order assignments tracking
CREATE INDEX IF NOT EXISTS idx_order_assignments_agent_date 
ON public.order_assignments (delivery_agent_id, assigned_at DESC);

-- Fulfillment tracking
CREATE INDEX IF NOT EXISTS idx_fulfillments_vendor_status 
ON public.fulfillments (vendor_id, status, created_at DESC);

-- 9. NOTIFICATION PERFORMANCE
-- FCM token management
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_active 
ON public.fcm_tokens (user_id, is_active, created_at DESC) 
WHERE is_active = true;

-- Notification scheduling
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled 
ON public.notifications (scheduled_at, is_sent, target_audience) 
WHERE scheduled_at IS NOT NULL AND is_sent = false;

-- 10. ANALYTICS OPTIMIZATIONS
-- App stats by date and service
CREATE INDEX IF NOT EXISTS idx_app_stats_service_date 
ON public.app_stats (service_type, date DESC, metric_type);

-- Daily metrics aggregation
CREATE INDEX IF NOT EXISTS idx_app_stats_date_metric 
ON public.app_stats (date DESC, metric_name, metric_type);

-- 11. USER AND PROFILE INDEXES
-- Profile lookup optimizations
CREATE INDEX IF NOT EXISTS idx_profiles_role_active 
ON public.profiles (role, created_at DESC);

-- Address lookup by user
CREATE INDEX IF NOT EXISTS idx_addresses_user_default 
ON public.addresses (user_id, is_default, created_at DESC);

-- 12. VENDOR SPECIFIC OPTIMIZATIONS
-- Vendor service zones
CREATE INDEX IF NOT EXISTS idx_vendor_service_zones_active 
ON public.vendor_service_zones (vendor_id, is_active, zone_id);

-- Vendor users management
CREATE INDEX IF NOT EXISTS idx_vendor_users_vendor_role 
ON public.vendor_users (vendor_id, role, is_active);

-- Price list management
CREATE INDEX IF NOT EXISTS idx_price_lists_vendor_active 
ON public.price_lists (vendor_id, is_active, valid_from, valid_to);

-- Verify new indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

