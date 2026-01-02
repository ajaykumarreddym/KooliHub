-- =====================================================
-- TRIP BOOKING SYSTEM - COMPLETE DATABASE SCHEMA
-- Clean Architecture + Real-time + India-focused
-- =====================================================

-- =====================================================
-- 1. VEHICLE PHOTOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id);
CREATE INDEX idx_vehicle_photos_primary ON vehicle_photos(vehicle_id, is_primary) WHERE is_primary = true;

-- =====================================================
-- 2. VEHICLE DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('registration', 'insurance', 'pollution', 'permit')),
  document_url TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);
CREATE INDEX idx_vehicle_documents_status ON vehicle_documents(verification_status);
CREATE INDEX idx_vehicle_documents_expiry ON vehicle_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- =====================================================
-- 3. TRIP MESSAGES TABLE (Real-time Chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES trip_bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'location', 'quick_reply')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trip_messages_trip_id ON trip_messages(trip_id);
CREATE INDEX idx_trip_messages_booking_id ON trip_messages(booking_id);
CREATE INDEX idx_trip_messages_sender ON trip_messages(sender_id);
CREATE INDEX idx_trip_messages_receiver ON trip_messages(receiver_id);
CREATE INDEX idx_trip_messages_unread ON trip_messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_trip_messages_created ON trip_messages(created_at DESC);

-- =====================================================
-- 4. BOOKING PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES trip_bookings(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'upi', 'wallet', 'cash', 'netbanking')),
  payment_provider TEXT, -- razorpay, paytm, phonepe, etc.
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  booking_fee DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  payment_details JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_payments_booking_id ON booking_payments(booking_id);
CREATE INDEX idx_booking_payments_status ON booking_payments(status);
CREATE INDEX idx_booking_payments_transaction ON booking_payments(transaction_id);

-- =====================================================
-- 5. TRIP TRACKING TABLE (Live Location)
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2), -- km/h
  heading DECIMAL(5, 2), -- degrees
  accuracy DECIMAL(5, 2), -- meters
  current_location_name TEXT,
  eta_minutes INTEGER,
  distance_remaining_km DECIMAL(8, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trip_tracking_trip_id ON trip_tracking(trip_id);
CREATE INDEX idx_trip_tracking_driver_id ON trip_tracking(driver_id);
CREATE INDEX idx_trip_tracking_created ON trip_tracking(created_at DESC);

-- =====================================================
-- 6. ENHANCE TRIP REVIEWS TABLE
-- =====================================================
ALTER TABLE trip_reviews 
  ADD COLUMN IF NOT EXISTS review_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trip_date DATE,
  ADD COLUMN IF NOT EXISTS driver_response TEXT,
  ADD COLUMN IF NOT EXISTS driver_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reported BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_trip_reviews_tags ON trip_reviews USING gin(review_tags);
CREATE INDEX IF NOT EXISTS idx_trip_reviews_rating ON trip_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_trip_reviews_helpful ON trip_reviews(helpful_count DESC);

-- =====================================================
-- 7. ROUTE STOPOVERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS route_stopovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  city_name TEXT NOT NULL,
  state_name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  stop_order INTEGER NOT NULL,
  estimated_arrival_offset_minutes INTEGER, -- minutes from origin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_route_stopovers_route_id ON route_stopovers(route_id);
CREATE INDEX idx_route_stopovers_order ON route_stopovers(route_id, stop_order);

-- =====================================================
-- 8. PAYMENT METHODS TABLE (User's saved methods)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'upi', 'wallet')),
  is_default BOOLEAN DEFAULT false,
  card_last4 TEXT,
  card_brand TEXT,
  card_expiry_month INTEGER,
  card_expiry_year INTEGER,
  upi_id TEXT,
  wallet_provider TEXT,
  payment_token TEXT, -- encrypted/tokenized
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_default ON user_payment_methods(user_id, is_default) WHERE is_default = true;

-- =====================================================
-- 9. NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  -- Channels
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  -- Passenger Notifications
  booking_confirmation BOOLEAN DEFAULT true,
  trip_reminder BOOLEAN DEFAULT true,
  driver_updates BOOLEAN DEFAULT true,
  -- Driver Notifications
  new_booking_request BOOLEAN DEFAULT true,
  passenger_cancellation BOOLEAN DEFAULT true,
  new_ratings BOOLEAN DEFAULT true,
  -- General
  special_offers BOOLEAN DEFAULT false,
  feature_updates BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =====================================================
-- 10. PRIVACY SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  profile_visibility TEXT DEFAULT 'everyone' CHECK (profile_visibility IN ('everyone', 'connections', 'private')),
  show_recent_activity BOOLEAN DEFAULT true,
  allow_messages_from TEXT DEFAULT 'connections' CHECK (allow_messages_from IN ('everyone', 'connections', 'none')),
  share_usage_data BOOLEAN DEFAULT true,
  personalized_suggestions BOOLEAN DEFAULT false,
  background_location BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_privacy_settings_user_id ON privacy_settings(user_id);

-- =====================================================
-- 11. ENHANCE VEHICLES TABLE
-- =====================================================
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
  ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
  ADD COLUMN IF NOT EXISTS pollution_expiry DATE,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_service_date DATE;

CREATE INDEX IF NOT EXISTS idx_vehicles_user_default ON vehicles(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_amenities ON vehicles USING gin(amenities);

-- =====================================================
-- 12. ENHANCE TRIPS TABLE FOR INDIA
-- =====================================================
ALTER TABLE trips 
  ADD COLUMN IF NOT EXISTS pickup_landmark TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_landmark TEXT,
  ADD COLUMN IF NOT EXISTS toll_charges DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS price_per_km DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS booking_deadline_hours INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ladies_only BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS smoking_allowed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_trips_ladies_only ON trips(ladies_only) WHERE ladies_only = true;
CREATE INDEX IF NOT EXISTS idx_trips_instant_booking ON trips(instant_booking) WHERE instant_booking = true;

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to automatically set primary photo
CREATE OR REPLACE FUNCTION set_primary_vehicle_photo()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first photo for the vehicle, make it primary
  IF NOT EXISTS (
    SELECT 1 FROM vehicle_photos 
    WHERE vehicle_id = NEW.vehicle_id AND id != NEW.id
  ) THEN
    NEW.is_primary := true;
  END IF;
  
  -- If setting as primary, unset other primary photos
  IF NEW.is_primary = true THEN
    UPDATE vehicle_photos 
    SET is_primary = false 
    WHERE vehicle_id = NEW.vehicle_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_primary_vehicle_photo ON vehicle_photos;
CREATE TRIGGER trigger_set_primary_vehicle_photo
  BEFORE INSERT OR UPDATE ON vehicle_photos
  FOR EACH ROW
  EXECUTE FUNCTION set_primary_vehicle_photo();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_receiver_id UUID,
  p_trip_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE trip_messages
  SET is_read = true, read_at = NOW()
  WHERE receiver_id = p_receiver_id 
    AND trip_id = p_trip_id 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trip earnings
CREATE OR REPLACE FUNCTION calculate_trip_earnings(p_trip_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_earnings DECIMAL;
BEGIN
  SELECT COALESCE(SUM(bp.amount), 0)
  INTO total_earnings
  FROM booking_payments bp
  JOIN trip_bookings tb ON tb.id = bp.booking_id
  WHERE tb.trip_id = p_trip_id 
    AND bp.status = 'completed';
    
  RETURN total_earnings;
END;
$$ LANGUAGE plpgsql;

-- Function to check document expiry
CREATE OR REPLACE FUNCTION check_document_expiry()
RETURNS void AS $$
BEGIN
  UPDATE vehicle_documents
  SET verification_status = 'expired'
  WHERE expiry_date < CURRENT_DATE 
    AND verification_status = 'verified';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stopovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- Vehicle Photos RLS
CREATE POLICY "Users can view vehicle photos"
  ON vehicle_photos FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their vehicle photos"
  ON vehicle_photos FOR ALL
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
  );

-- Vehicle Documents RLS
CREATE POLICY "Users can view their vehicle documents"
  ON vehicle_documents FOR SELECT
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their vehicle documents"
  ON vehicle_documents FOR ALL
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
  );

-- Trip Messages RLS
CREATE POLICY "Users can view their trip messages"
  ON trip_messages FOR SELECT
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send trip messages"
  ON trip_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Booking Payments RLS
CREATE POLICY "Users can view their booking payments"
  ON booking_payments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM trip_bookings WHERE passenger_id = auth.uid()
    )
    OR
    booking_id IN (
      SELECT tb.id FROM trip_bookings tb
      JOIN trips t ON t.id = tb.trip_id
      WHERE t.driver_id = auth.uid()
    )
  );

-- Trip Tracking RLS
CREATE POLICY "Anyone can view active trip tracking"
  ON trip_tracking FOR SELECT
  USING (
    trip_id IN (
      SELECT t.id FROM trips t
      WHERE t.status = 'active'
        AND (
          t.driver_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM trip_bookings tb
            WHERE tb.trip_id = t.id 
              AND tb.passenger_id = auth.uid()
              AND tb.booking_status = 'confirmed'
          )
        )
    )
  );

CREATE POLICY "Drivers can insert tracking data"
  ON trip_tracking FOR INSERT
  WITH CHECK (driver_id = auth.uid());

-- User Payment Methods RLS
CREATE POLICY "Users can manage their payment methods"
  ON user_payment_methods FOR ALL
  USING (user_id = auth.uid());

-- Notification Preferences RLS
CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Privacy Settings RLS
CREATE POLICY "Users can manage their privacy settings"
  ON privacy_settings FOR ALL
  USING (user_id = auth.uid());

-- Route Stopovers RLS
CREATE POLICY "Anyone can view route stopovers"
  ON route_stopovers FOR SELECT
  USING (true);

CREATE POLICY "Drivers can manage their route stopovers"
  ON route_stopovers FOR ALL
  USING (
    route_id IN (
      SELECT r.id FROM routes r
      JOIN trips t ON t.route_id = r.id
      WHERE t.driver_id = auth.uid()
    )
  );

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for chat and tracking
ALTER PUBLICATION supabase_realtime ADD TABLE trip_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Create notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences WHERE user_id = profiles.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Create privacy settings for existing users
INSERT INTO privacy_settings (user_id)
SELECT id FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM privacy_settings WHERE user_id = profiles.id
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- CRON JOBS (Run daily to check document expiry)
-- =====================================================
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('check-document-expiry', '0 0 * * *', 'SELECT check_document_expiry()');

COMMENT ON TABLE vehicle_photos IS 'Stores multiple photos for each vehicle with primary designation';
COMMENT ON TABLE vehicle_documents IS 'Vehicle registration, insurance, and other legal documents';
COMMENT ON TABLE trip_messages IS 'Real-time chat messages between drivers and passengers';
COMMENT ON TABLE booking_payments IS 'Payment transactions for trip bookings';
COMMENT ON TABLE trip_tracking IS 'Live GPS location tracking for active trips';
COMMENT ON TABLE route_stopovers IS 'Intermediate stops for trip routes';
COMMENT ON TABLE user_payment_methods IS 'Saved payment methods for quick checkout';
COMMENT ON TABLE notification_preferences IS 'User notification channel and category preferences';
COMMENT ON TABLE privacy_settings IS 'User privacy and data sharing preferences';

