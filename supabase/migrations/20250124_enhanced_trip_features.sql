-- Enhanced Trip Booking Features: Stopovers, Price Recommendations, Booking Types
-- Run this migration in Supabase SQL Editor

-- 1. Add coordinates to routes table
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS origin_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS origin_lon DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS destination_lon DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS route_geometry JSONB; -- Store the full route coordinates

-- 2. Add booking type and scheduling options to trips
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'review' CHECK (booking_type IN ('instant', 'review')),
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_publish_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS price_recommendation JSONB, -- {min, max, recommended}
ADD COLUMN IF NOT EXISTS selected_route_id TEXT;

-- 3. Create stopovers table
CREATE TABLE IF NOT EXISTS route_stopovers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stopover_order INTEGER NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  price_from_origin DECIMAL(10, 2) NOT NULL, -- Price from origin to this stopover
  estimated_arrival_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(trip_id, stopover_order)
);

-- 4. Create index for stopovers
CREATE INDEX IF NOT EXISTS idx_route_stopovers_trip_id ON route_stopovers(trip_id);
CREATE INDEX IF NOT EXISTS idx_route_stopovers_order ON route_stopovers(trip_id, stopover_order);

-- 5. Allow bookings from stopovers (not just origin)
ALTER TABLE trip_bookings
ADD COLUMN IF NOT EXISTS pickup_type TEXT DEFAULT 'origin' CHECK (pickup_type IN ('origin', 'stopover')),
ADD COLUMN IF NOT EXISTS pickup_stopover_id UUID REFERENCES route_stopovers(id),
ADD COLUMN IF NOT EXISTS dropoff_type TEXT DEFAULT 'destination' CHECK (dropoff_type IN ('destination', 'stopover')),
ADD COLUMN IF NOT EXISTS dropoff_stopover_id UUID REFERENCES route_stopovers(id);

-- 6. Add RLS policies for stopovers
ALTER TABLE route_stopovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stopovers"
  ON route_stopovers FOR SELECT
  USING (true);

CREATE POLICY "Driver can insert stopovers for their trips"
  ON route_stopovers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_id
      AND trips.driver_id = auth.uid()
    )
  );

CREATE POLICY "Driver can update their trip stopovers"
  ON route_stopovers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_id
      AND trips.driver_id = auth.uid()
    )
  );

CREATE POLICY "Driver can delete their trip stopovers"
  ON route_stopovers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_id
      AND trips.driver_id = auth.uid()
    )
  );

-- 7. Create a view for trip details with stopovers
CREATE OR REPLACE VIEW trip_details_with_stopovers AS
SELECT 
  t.*,
  json_agg(
    json_build_object(
      'id', rs.id,
      'order', rs.stopover_order,
      'location_name', rs.location_name,
      'latitude', rs.latitude,
      'longitude', rs.longitude,
      'price_from_origin', rs.price_from_origin,
      'estimated_arrival_time', rs.estimated_arrival_time
    ) ORDER BY rs.stopover_order
  ) FILTER (WHERE rs.id IS NOT NULL) AS stopovers
FROM trips t
LEFT JOIN route_stopovers rs ON t.id = rs.trip_id
GROUP BY t.id;

-- 8. Add comment for documentation
COMMENT ON TABLE route_stopovers IS 'Stores intermediate stopovers along a trip route where passengers can board or alight';
COMMENT ON COLUMN trips.booking_type IS 'instant: auto-confirm bookings, review: driver reviews each booking';
COMMENT ON COLUMN trips.is_scheduled IS 'If true, trip will be published at scheduled_publish_time';

