-- ========================================
-- PART 2: SPATIAL INDEXES AND GEOGRAPHY OPTIMIZATION
-- Critical P1 Fix for Location Performance
-- ========================================

-- 1. ENABLE POSTGIS EXTENSION (if available)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. ADD PROPER GEOMETRY COLUMNS
-- Add proper geometry column to serviceable_areas
ALTER TABLE public.serviceable_areas 
ADD COLUMN IF NOT EXISTS geom GEOMETRY(POINT, 4326);

-- Update existing coordinates to geometry
UPDATE public.serviceable_areas 
SET geom = ST_SetSRID(ST_MakePoint(
    (coordinates->>'lng')::float, 
    (coordinates->>'lat')::float
), 4326)
WHERE coordinates IS NOT NULL 
AND coordinates->>'lat' IS NOT NULL 
AND coordinates->>'lng' IS NOT NULL
AND geom IS NULL;

-- 3. CREATE SPATIAL INDEXES
CREATE INDEX IF NOT EXISTS idx_serviceable_areas_geom 
ON public.serviceable_areas USING GIST (geom);

-- Spatial index for proximity searches
CREATE INDEX IF NOT EXISTS idx_serviceable_areas_geom_geography 
ON public.serviceable_areas USING GIST (CAST(geom AS geography));

-- 4. ADD GEOMETRY COLUMNS TO OTHER TABLES
-- Vendor locations
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS location_geom GEOMETRY(POINT, 4326);

-- Update vendor locations if coordinates exist in business_address
CREATE INDEX IF NOT EXISTS idx_vendors_location_geom 
ON public.vendors USING GIST (location_geom) 
WHERE location_geom IS NOT NULL;

-- Inventory locations
ALTER TABLE public.inventory_locations 
ADD COLUMN IF NOT EXISTS geom GEOMETRY(POINT, 4326);

UPDATE public.inventory_locations 
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
AND longitude IS NOT NULL
AND geom IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_locations_geom 
ON public.inventory_locations USING GIST (geom);

-- 5. SPATIAL QUERY FUNCTIONS
CREATE OR REPLACE FUNCTION find_nearby_areas(
    p_lat FLOAT,
    p_lng FLOAT,
    p_radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
    area_id UUID,
    pincode TEXT,
    city TEXT,
    state TEXT,
    distance_km FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id as area_id,
        sa.pincode,
        sa.city,
        sa.state,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            sa.geom::geography
        ) / 1000 as distance_km
    FROM public.serviceable_areas sa
    WHERE sa.is_serviceable = true
    AND sa.geom IS NOT NULL
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        sa.geom::geography,
        p_radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. OPTIMIZE COORDINATE QUERIES
-- Create function to update geometry when coordinates change
CREATE OR REPLACE FUNCTION update_serviceable_area_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coordinates IS NOT NULL 
    AND NEW.coordinates->>'lat' IS NOT NULL 
    AND NEW.coordinates->>'lng' IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(
            (NEW.coordinates->>'lng')::float, 
            (NEW.coordinates->>'lat')::float
        ), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_serviceable_area_geom_trigger ON public.serviceable_areas;
CREATE TRIGGER update_serviceable_area_geom_trigger
    BEFORE INSERT OR UPDATE ON public.serviceable_areas
    FOR EACH ROW EXECUTE FUNCTION update_serviceable_area_geom();

