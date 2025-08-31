# Database Schema Update Instructions

## Issue Fixed

- **Service Type Detection**: Fixed the logic so that "Electrical Work" categories (like Fan) now correctly map to "Electronics" instead of "Handyman Services"
- **Database Fields**: Added all dynamic fields to support different service types

## How to Update Your Database

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Create a new query

### Step 2: Run the Migration

Copy and paste the contents of `database-migration-dynamic-fields.sql` into the SQL editor and run it.

## New Fields Added

### Grocery Products

- `original_price` - Price before discount
- `unit` - Unit of measurement (kg, liter, piece, etc.)
- `discount` - Discount percentage
- `is_organic` - Boolean flag for organic products
- `is_fresh` - Boolean flag for fresh products

### Car Rental

- `price_per_day` - Daily rental price
- `price_per_hour` - Hourly rental price
- `year` - Vehicle year
- `vehicle_category` - Economy, luxury, etc.
- `transmission` - Automatic/manual
- `fuel_type` - Petrol, diesel, hybrid, electric
- `seats` - Number of seats
- `doors` - Number of doors
- `mileage` - Fuel efficiency
- `location` - Pickup location
- `features` - Array of features
- `available` - Availability status

### Trip Services

- `from_location` - Starting point
- `to_location` - Destination
- `departure_time` - Departure time
- `arrival_time` - Arrival time
- `duration` - Trip duration
- `bus_type` - Type of bus
- `available_seats` - Available seat count
- `operator` - Bus operator
- `amenities` - Array of amenities

### Handyman Services

- `price_range` - Service price range
- `service_category` - Plumbing, electrical, etc.
- `urgency_levels` - Array of urgency options
- `includes_materials` - Materials included flag
- `warranty_period` - Service warranty

### Electronics

- `warranty` - Warranty information
- `model_number` - Product model
- `specifications` - Technical specs
- `color_options` - Available colors
- `has_installation` - Installation service flag

### Home & Kitchen

- `material` - Product material
- `dimensions` - Product dimensions
- `weight` - Product weight
- `care_instructions` - Care instructions
- `is_dishwasher_safe` - Dishwasher safe flag
- `is_microwave_safe` - Microwave safe flag

## Service Type Detection Logic Updated

The category detection now correctly identifies:

- **Electronics**: Electrical Work, Fan, AC, Mobile, Laptop, TV, etc.
- **Handyman**: Home Repair, Plumbing, Carpentry, Painting, etc.

## After Running Migration

The form will now:

1. Correctly detect "Electrical Work" as Electronics
2. Show relevant fields for electronics (warranty, model number, specifications)
3. Store all data in the appropriate database columns
4. Allow fans, ACs, and other electrical products to be properly categorized

## Testing

1. Open the Add Product modal
2. Select "Electrical Work" category
3. Verify it shows "Electronics" fields instead of "Handyman Services"
4. Add a Fan product with electronics fields
5. Verify data is saved correctly
