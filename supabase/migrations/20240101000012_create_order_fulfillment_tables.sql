-- Create delivery agents table
CREATE TABLE IF NOT EXISTS delivery_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    current_location VARCHAR(200),
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order tracking table
CREATE TABLE IF NOT EXISTS order_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    notes TEXT,
    delivery_agent_id UUID REFERENCES delivery_agents(id),
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order assignments table
CREATE TABLE IF NOT EXISTS order_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_agent_id UUID NOT NULL REFERENCES delivery_agents(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id)
);

-- Create delivery reviews table
CREATE TABLE IF NOT EXISTS delivery_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_agent_id UUID NOT NULL REFERENCES delivery_agents(id),
    customer_id UUID NOT NULL REFERENCES profiles(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    delivery_time_rating INTEGER CHECK (delivery_time_rating >= 1 AND delivery_time_rating <= 5),
    packaging_rating INTEGER CHECK (packaging_rating >= 1 AND packaging_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available ON delivery_agents(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_delivery_agents_location ON delivery_agents(current_location);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON order_tracking(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON order_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_order_assignments_order_id ON order_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_assignments_agent_id ON order_assignments(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_agent_id ON delivery_reviews(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_order_id ON delivery_reviews(order_id);

-- Enable Row Level Security
ALTER TABLE delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_reviews ENABLE ROW LEVEL SECURITY;

-- Create admin access policies
CREATE POLICY "Admin access to delivery_agents" ON delivery_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to order_tracking" ON order_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to order_assignments" ON order_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Delivery reviews can be read by admin and created by customers
CREATE POLICY "Admin read delivery_reviews" ON delivery_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Customer create delivery_reviews" ON delivery_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id
        AND EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_id 
            AND orders.user_id = auth.uid()
            AND orders.status = 'delivered'
        )
    );

-- Create trigger function for updating delivery agent ratings
CREATE OR REPLACE FUNCTION update_agent_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update agent rating based on average of all reviews
    UPDATE delivery_agents 
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM delivery_reviews 
        WHERE delivery_agent_id = NEW.delivery_agent_id
    ),
    total_deliveries = (
        SELECT COUNT(*)
        FROM delivery_reviews 
        WHERE delivery_agent_id = NEW.delivery_agent_id
    )
    WHERE id = NEW.delivery_agent_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER update_agent_rating_trigger
    AFTER INSERT OR UPDATE ON delivery_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_rating();

-- Create function to auto-update agent availability
CREATE OR REPLACE FUNCTION update_agent_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- When order is completed, mark agent as available
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        UPDATE delivery_agents 
        SET is_available = true 
        WHERE id = NEW.delivery_agent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for availability updates
CREATE TRIGGER update_agent_availability_trigger
    AFTER UPDATE ON order_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_availability();

-- Add updated_at triggers
CREATE TRIGGER update_delivery_agents_updated_at 
    BEFORE UPDATE ON delivery_agents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_assignments_updated_at 
    BEFORE UPDATE ON order_assignments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample delivery agents (optional)
INSERT INTO delivery_agents (name, phone, email, vehicle_type, license_number, current_location) VALUES
('John Smith', '+1-555-0101', 'john.smith@delivery.com', 'Motorcycle', 'DL001', 'Downtown'),
('Sarah Johnson', '+1-555-0102', 'sarah.johnson@delivery.com', 'Car', 'DL002', 'North District'),
('Mike Davis', '+1-555-0103', 'mike.davis@delivery.com', 'Bicycle', 'DL003', 'City Center'),
('Emma Wilson', '+1-555-0104', 'emma.wilson@delivery.com', 'Van', 'DL004', 'South Area')
ON CONFLICT (email) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE delivery_agents IS 'Delivery personnel managing order fulfillment';
COMMENT ON TABLE order_tracking IS 'Real-time tracking updates for orders';
COMMENT ON TABLE order_assignments IS 'Assignment of orders to delivery agents';
COMMENT ON TABLE delivery_reviews IS 'Customer reviews and ratings for delivery service';
