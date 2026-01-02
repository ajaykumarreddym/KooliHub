-- Enable the pgcrypto extension to generate random UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('grocery', 'trips', 'car-rental', 'handyman', 'electronics', 'home-kitchen')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3,2),
    reviews_count INTEGER DEFAULT 0,
    sku TEXT,
    brand TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create serviceable_areas table
CREATE TABLE IF NOT EXISTS public.serviceable_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pincode TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    is_serviceable BOOLEAN DEFAULT true,
    service_types TEXT[] DEFAULT '{}',
    delivery_time_hours INTEGER,
    delivery_charge DECIMAL(10,2),
    coordinates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pincode)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_pincode TEXT NOT NULL,
    service_type TEXT NOT NULL,
    order_items JSONB NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_stats table for analytics
CREATE TABLE IF NOT EXISTS public.app_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
    service_type TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_serviceable_areas_pincode ON public.serviceable_areas(pincode);
CREATE INDEX IF NOT EXISTS idx_app_stats_date ON public.app_stats(date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceable_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Serviceable areas policies (public read, admin write)
CREATE POLICY "Anyone can view serviceable areas" ON public.serviceable_areas
    FOR SELECT USING (is_serviceable = true);

CREATE POLICY "Admin can manage serviceable areas" ON public.serviceable_areas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update all orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- App stats policies (admin only)
CREATE POLICY "Admin can view app stats" ON public.app_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can manage app stats" ON public.app_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to handle user registration and profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE 
            WHEN NEW.email = 'hello.krsolutions@gmail.com' THEN 'admin'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_serviceable_areas_updated_at
    BEFORE UPDATE ON public.serviceable_areas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data

-- Sample categories
INSERT INTO public.categories (name, description, service_type, sort_order) VALUES
('Fresh Vegetables', 'Farm fresh vegetables delivered to your door', 'grocery', 1),
('Fruits', 'Fresh seasonal fruits', 'grocery', 2),
('Dairy Products', 'Fresh milk, cheese, and dairy items', 'grocery', 3),
('Weekend Trips', 'Short weekend getaways', 'trips', 1),
('Adventure Tours', 'Thrilling adventure experiences', 'trips', 2),
('Economy Cars', 'Budget-friendly car rentals', 'car-rental', 1),
('Luxury Cars', 'Premium car rental experience', 'car-rental', 2),
('Home Repair', 'Professional home repair services', 'handyman', 1),
('Electrical Work', 'Expert electrical services', 'handyman', 2),
('Mobile Phones', 'Latest smartphones and accessories', 'electronics', 1),
('Laptops', 'High-performance laptops', 'electronics', 2),
('Kitchen Appliances', 'Modern kitchen essentials', 'home-kitchen', 1),
('Home Decor', 'Beautiful home decoration items', 'home-kitchen', 2)
ON CONFLICT DO NOTHING;

-- Sample serviceable areas
INSERT INTO public.serviceable_areas (pincode, city, state, service_types, delivery_time_hours, delivery_charge) VALUES
('110001', 'New Delhi', 'Delhi', '{"grocery","trips","car-rental","handyman","electronics","home-kitchen"}', 2, 50.00),
('400001', 'Mumbai', 'Maharashtra', '{"grocery","trips","car-rental","handyman","electronics","home-kitchen"}', 3, 75.00),
('560001', 'Bangalore', 'Karnataka', '{"grocery","trips","car-rental","handyman","electronics","home-kitchen"}', 2, 60.00),
('600001', 'Chennai', 'Tamil Nadu', '{"grocery","trips","car-rental","handyman","electronics","home-kitchen"}', 3, 65.00),
('700001', 'Kolkata', 'West Bengal', '{"grocery","trips","car-rental","handyman","electronics","home-kitchen"}', 4, 55.00)
ON CONFLICT (pincode) DO NOTHING;

-- Sample app stats
INSERT INTO public.app_stats (metric_name, metric_value, metric_type, service_type, date) VALUES
('total_users', 150, 'gauge', NULL, CURRENT_DATE),
('total_orders', 45, 'gauge', NULL, CURRENT_DATE),
('revenue', 12500.00, 'gauge', NULL, CURRENT_DATE),
('orders_today', 8, 'counter', NULL, CURRENT_DATE),
('grocery_orders', 20, 'counter', 'grocery', CURRENT_DATE),
('trips_orders', 10, 'counter', 'trips', CURRENT_DATE),
('car_rental_orders', 8, 'counter', 'car-rental', CURRENT_DATE),
('handyman_orders', 7, 'counter', 'handyman', CURRENT_DATE)
ON CONFLICT DO NOTHING;
