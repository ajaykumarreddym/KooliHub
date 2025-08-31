-- Complete Database Migration for Dynamic Product Fields
-- Copy and paste this entire code into your Supabase SQL Editor and run it

-- Add new fields to products table to support different service types

-- Grocery fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount DECIMAL(5,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_fresh BOOLEAN DEFAULT false;

-- Car rental fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_per_day DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vehicle_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS transmission TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seats INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS doors INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mileage TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;

-- Trip fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS from_location TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS to_location TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS departure_time TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS arrival_time TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bus_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_seats INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS operator TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Handyman fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_range TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS service_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS urgency_levels TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS includes_materials BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty_period TEXT;

-- Electronics fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS model_number TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_options TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_installation BOOLEAN DEFAULT false;

-- Home & Kitchen fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_dishwasher_safe BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_microwave_safe BOOLEAN DEFAULT false;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_products_service_category ON public.products(service_category);
CREATE INDEX IF NOT EXISTS idx_products_vehicle_category ON public.products(vehicle_category);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(available);
CREATE INDEX IF NOT EXISTS idx_products_from_location ON public.products(from_location);
CREATE INDEX IF NOT EXISTS idx_products_to_location ON public.products(to_location);
CREATE INDEX IF NOT EXISTS idx_products_unit ON public.products(unit);
CREATE INDEX IF NOT EXISTS idx_products_warranty ON public.products(warranty);

-- Update the updated_at timestamp trigger to ensure it works with new fields
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments to document the new fields
COMMENT ON COLUMN public.products.original_price IS 'Original price before discount (for grocery/electronics)';
COMMENT ON COLUMN public.products.unit IS 'Unit of measurement (kg, liter, piece, etc.)';
COMMENT ON COLUMN public.products.discount IS 'Discount percentage';
COMMENT ON COLUMN public.products.price_per_day IS 'Daily rental price (for car rental)';
COMMENT ON COLUMN public.products.price_per_hour IS 'Hourly rental price (for car rental)';
COMMENT ON COLUMN public.products.vehicle_category IS 'Vehicle category (economy, luxury, etc.)';
COMMENT ON COLUMN public.products.from_location IS 'Starting location (for trips)';
COMMENT ON COLUMN public.products.to_location IS 'Destination location (for trips)';
COMMENT ON COLUMN public.products.service_category IS 'Type of handyman service (plumbing, electrical, etc.)';
COMMENT ON COLUMN public.products.features IS 'Array of product/service features';
COMMENT ON COLUMN public.products.amenities IS 'Array of amenities (for trips/vehicles)';
COMMENT ON COLUMN public.products.warranty IS 'Warranty information for electronics';
COMMENT ON COLUMN public.products.model_number IS 'Product model number for electronics';
COMMENT ON COLUMN public.products.specifications IS 'Technical specifications';
COMMENT ON COLUMN public.products.material IS 'Product material (for home/kitchen items)';
COMMENT ON COLUMN public.products.dimensions IS 'Product dimensions';
COMMENT ON COLUMN public.products.weight IS 'Product weight';

-- Verify the migration completed successfully
SELECT 'Migration completed successfully! ' || COUNT(*) || ' columns now exist in products table.' AS result
FROM information_schema.columns 
WHERE table_name = 'products';

-- Show the new columns that were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN (
  'original_price', 'unit', 'discount', 'is_organic', 'is_fresh',
  'price_per_day', 'price_per_hour', 'year', 'vehicle_category', 'transmission', 'fuel_type',
  'seats', 'doors', 'mileage', 'location', 'features', 'available',
  'from_location', 'to_location', 'departure_time', 'arrival_time', 'duration', 'bus_type',
  'available_seats', 'operator', 'amenities', 'price_range', 'service_category',
  'urgency_levels', 'includes_materials', 'warranty_period', 'warranty', 'model_number',
  'specifications', 'color_options', 'has_installation', 'material', 'dimensions',
  'weight', 'care_instructions', 'is_dishwasher_safe', 'is_microwave_safe'
)
ORDER BY column_name;
