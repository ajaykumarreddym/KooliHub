-- =====================================================
-- ENHANCED BOOKING SYSTEM MIGRATION
-- Applied: 2025-01-29
-- Adds platform fees, GST, refund tracking for trip bookings
-- =====================================================

-- =====================================================
-- 1. ENHANCE TRIP_BOOKINGS TABLE
-- =====================================================
ALTER TABLE trip_bookings 
  ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS refund_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Index for refund processing
CREATE INDEX IF NOT EXISTS idx_trip_bookings_refund_status 
  ON trip_bookings(refund_status) WHERE refund_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trip_bookings_payment_status 
  ON trip_bookings(payment_status);

-- =====================================================
-- 2. USER NOTIFICATIONS TABLE (for user-specific notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Users can manage their notifications" ON user_notifications;
CREATE POLICY "Users can manage their notifications"
  ON user_notifications FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- 3. FUNCTION: CALCULATE REFUND AMOUNT
-- Cancellation Policy:
--   > 2 hours before departure: 100% refund minus ₹25 service fee
--   30 mins to 2 hours: 50% refund
--   < 30 minutes: No refund
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_refund_amount(
  p_departure_time TIMESTAMPTZ,
  p_total_amount DECIMAL,
  p_platform_fee DECIMAL DEFAULT 0
)
RETURNS TABLE (
  refund_percentage INTEGER,
  service_fee DECIMAL,
  refund_amount DECIMAL,
  policy_description TEXT
) AS $$
DECLARE
  hours_before_departure DECIMAL;
  refundable_amount DECIMAL;
BEGIN
  hours_before_departure := EXTRACT(EPOCH FROM (p_departure_time - NOW())) / 3600;
  refundable_amount := p_total_amount - COALESCE(p_platform_fee, 0);
  
  IF hours_before_departure < 0 THEN
    RETURN QUERY SELECT 0::INTEGER, 0::DECIMAL, 0::DECIMAL, 'Cannot refund past trips'::TEXT;
  ELSIF hours_before_departure >= 2 THEN
    RETURN QUERY SELECT 
      100::INTEGER, 
      25::DECIMAL, 
      GREATEST(0, refundable_amount - 25)::DECIMAL, 
      'Full refund (minus ₹25 service fee)'::TEXT;
  ELSIF hours_before_departure >= 0.5 THEN
    RETURN QUERY SELECT 
      50::INTEGER, 
      0::DECIMAL, 
      (refundable_amount * 0.5)::DECIMAL, 
      '50% refund'::TEXT;
  ELSE
    RETURN QUERY SELECT 0::INTEGER, 0::DECIMAL, 0::DECIMAL, 'No refund'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCTION: ATOMIC BOOKING CREATION
-- Prevents race conditions when booking seats
-- =====================================================
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_trip_id UUID,
  p_passenger_id UUID,
  p_seats_booked INTEGER,
  p_pickup_location TEXT,
  p_dropoff_location TEXT,
  p_total_amount DECIMAL,
  p_platform_fee DECIMAL,
  p_gst_amount DECIMAL
)
RETURNS TABLE (
  booking_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_available_seats INTEGER;
  v_booking_id UUID;
BEGIN
  SELECT available_seats INTO v_available_seats
  FROM trips
  WHERE id = p_trip_id
  FOR UPDATE;
  
  IF v_available_seats IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Trip not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_available_seats < p_seats_booked THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, format('Only %s seat(s) available', v_available_seats)::TEXT;
    RETURN;
  END IF;
  
  INSERT INTO trip_bookings (
    trip_id,
    passenger_id,
    seats_booked,
    pickup_location,
    dropoff_location,
    total_amount,
    platform_fee,
    gst_amount,
    booking_status,
    payment_status
  ) VALUES (
    p_trip_id,
    p_passenger_id,
    p_seats_booked,
    p_pickup_location,
    p_dropoff_location,
    p_total_amount,
    p_platform_fee,
    p_gst_amount,
    'confirmed',
    'completed'
  )
  RETURNING id INTO v_booking_id;
  
  UPDATE trips
  SET available_seats = available_seats - p_seats_booked
  WHERE id = p_trip_id;
  
  RETURN QUERY SELECT v_booking_id, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNCTION: CANCEL BOOKING WITH REFUND
-- =====================================================
CREATE OR REPLACE FUNCTION cancel_booking_with_refund(
  p_booking_id UUID,
  p_cancellation_reason TEXT,
  p_cancelled_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  refund_amt DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_booking RECORD;
  v_refund RECORD;
BEGIN
  SELECT 
    tb.*,
    t.departure_time,
    t.available_seats,
    t.id as trip_id_val
  INTO v_booking
  FROM trip_bookings tb
  JOIN trips t ON t.id = tb.trip_id
  WHERE tb.id = p_booking_id
  FOR UPDATE;
  
  IF v_booking IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Booking not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_booking.booking_status = 'cancelled' THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Booking is already cancelled'::TEXT;
    RETURN;
  END IF;
  
  SELECT * INTO v_refund
  FROM calculate_refund_amount(
    v_booking.departure_time,
    v_booking.total_amount,
    v_booking.platform_fee
  );
  
  UPDATE trip_bookings
  SET 
    booking_status = 'cancelled',
    cancellation_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    refund_amount = v_refund.refund_amount,
    refund_status = CASE WHEN v_refund.refund_amount > 0 THEN 'pending' ELSE 'not_eligible' END
  WHERE id = p_booking_id;
  
  UPDATE trips
  SET available_seats = available_seats + v_booking.seats_booked
  WHERE id = v_booking.trip_id;
  
  IF v_refund.refund_amount > 0 THEN
    UPDATE booking_payments
    SET 
      status = 'refunded',
      refund_amount = v_refund.refund_amount,
      refunded_at = NOW()
    WHERE booking_id = p_booking_id;
  END IF;
  
  RETURN QUERY SELECT TRUE, v_refund.refund_amount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGER: SEND BOOKING NOTIFICATIONS
-- =====================================================
CREATE OR REPLACE FUNCTION send_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    INSERT INTO user_notifications (user_id, title, body, type, data, action_url)
    VALUES (
      NEW.passenger_id,
      '🎉 Booking Confirmed!',
      format('Your trip is confirmed. %s seat(s) booked.', NEW.seats_booked),
      'booking_confirmation',
      jsonb_build_object('booking_id', NEW.id, 'trip_id', NEW.trip_id),
      format('/trip-booking/booking/%s', NEW.id)
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled' THEN
    INSERT INTO user_notifications (user_id, title, body, type, data, action_url)
    VALUES (
      NEW.passenger_id,
      '❌ Booking Cancelled',
      CASE 
        WHEN NEW.refund_amount > 0 THEN format('Refund of ₹%s will be processed within 5-7 days.', NEW.refund_amount)
        ELSE 'Your booking has been cancelled.'
      END,
      'booking_cancelled',
      jsonb_build_object('booking_id', NEW.id, 'refund_amount', COALESCE(NEW.refund_amount, 0)),
      '/trip-booking/my-bookings'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_booking_notification ON trip_bookings;
CREATE TRIGGER trigger_booking_notification
  AFTER INSERT OR UPDATE ON trip_bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_notification();

-- =====================================================
-- 7. ENABLE REALTIME
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
  END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION calculate_refund_amount IS 'Calculate refund based on cancellation policy: >2h=100% minus ₹25, 30m-2h=50%, <30m=0%';
COMMENT ON FUNCTION create_booking_atomic IS 'Atomically create booking with seat decrement to prevent overbooking';
COMMENT ON FUNCTION cancel_booking_with_refund IS 'Cancel booking and process refund according to policy';
COMMENT ON TABLE user_notifications IS 'User-specific notifications for bookings, trips, etc.';
