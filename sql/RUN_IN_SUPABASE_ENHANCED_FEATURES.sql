-- Enhanced Trip Booking Features Migration
-- Run this SQL in your Supabase SQL Editor manually

-- Step 1: Add coordinates and routing info to routes table
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS origin_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS origin_lon DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS destination_lon DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS route_geometry JSONB;

-- Step 2: Add booking type and scheduling options to trips
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'review',
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_publish_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS price_recommendation JSONB,
ADD COLUMN IF NOT EXISTS selected_route_id TEXT;

-- Step 3: Create stopovers table for intermediate pickup/drop points
CREATE TABLE IF NOT EXISTS route_stopovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stopover_order INTEGER NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  price_from_origin DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estimated_arrival_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_trip_stopover_order UNIQUE(trip_id, stopover_order)
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_route_stopovers_trip_id ON route_stopovers(trip_id);
CREATE INDEX IF NOT EXISTS idx_route_stopovers_order ON route_stopovers(trip_id, stopover_order);

-- Step 5: Add stopover pickup/dropoff support to trip_bookings
ALTER TABLE trip_bookings
ADD COLUMN IF NOT EXISTS pickup_type TEXT DEFAULT 'origin',
ADD COLUMN IF NOT EXISTS pickup_stopover_id UUID REFERENCES route_stopovers(id),
ADD COLUMN IF NOT EXISTS dropoff_type TEXT DEFAULT 'destination',
ADD COLUMN IF NOT EXISTS dropoff_stopover_id UUID REFERENCES route_stopovers(id);

-- Step 6: Enable RLS on stopovers table
ALTER TABLE route_stopovers ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view stopovers" ON route_stopovers;
DROP POLICY IF EXISTS "Driver can insert stopovers for their trips" ON route_stopovers;
DROP POLICY IF EXISTS "Driver can update their trip stopovers" ON route_stopovers;
DROP POLICY IF EXISTS "Driver can delete their trip stopovers" ON route_stopovers;

-- Step 8: Create RLS policies for stopovers
CREATE POLICY "Anyone can view stopovers"
  ON route_stopovers FOR SELECT
  USING (true);

CREATE POLICY "Driver can insert stopovers for their trips"
  ON route_stopovers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = route_stopovers.trip_id
      AND trips.driver_id = auth.uid()
    )
  );

CREATE POLICY "Driver can update their trip stopovers"
  ON route_stopovers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = route_stopovers.trip_id
      AND trips.driver_id = auth.uid()
    )
  );

CREATE POLICY "Driver can delete their trip stopovers"
  ON route_stopovers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = route_stopovers.trip_id
      AND trips.driver_id = auth.uid()
    )
  );

-- Step 9: Add constraints for new columns
ALTER TABLE trips
DROP CONSTRAINT IF EXISTS trips_booking_type_check,
ADD CONSTRAINT trips_booking_type_check CHECK (booking_type IN ('instant', 'review'));

ALTER TABLE trip_bookings
DROP CONSTRAINT IF EXISTS trip_bookings_pickup_type_check,
ADD CONSTRAINT trip_bookings_pickup_type_check CHECK (pickup_type IN ('origin', 'stopover'));

ALTER TABLE trip_bookings
DROP CONSTRAINT IF EXISTS trip_bookings_dropoff_type_check,
ADD CONSTRAINT trip_bookings_dropoff_type_check CHECK (dropoff_type IN ('destination', 'stopover'));

-- Step 10: Add helpful comments
COMMENT ON TABLE route_stopovers IS 'Stores intermediate stopovers along a trip route where passengers can board or alight';
COMMENT ON COLUMN trips.booking_type IS 'instant: auto-confirm bookings, review: driver reviews each booking';
COMMENT ON COLUMN trips.is_scheduled IS 'If true, trip will be published at scheduled_publish_time';
COMMENT ON COLUMN trips.price_recommendation IS 'JSON object with min, max, and recommended price calculated by system';

-- Migration Complete!
-- You can now use the enhanced trip booking features with:
-- - OpenStreetMap location search
-- - Route calculation with OSRM
-- - Stopover management
-- - Price recommendations
-- - Booking type selection (instant/review)
-- - Schedule publish functionality

