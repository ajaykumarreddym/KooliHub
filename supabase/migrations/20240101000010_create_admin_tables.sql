-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    usage_limit INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position VARCHAR(20) CHECK (position IN ('hero', 'middle', 'footer', 'sidebar')) NOT NULL,
    device_type VARCHAR(20) CHECK (device_type IN ('all', 'desktop', 'mobile')) DEFAULT 'all',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('info', 'success', 'warning', 'error', 'promotion')) DEFAULT 'info',
    target_audience VARCHAR(20) CHECK (target_audience IN ('all', 'customers', 'vendors', 'admins')) DEFAULT 'all',
    delivery_method VARCHAR(20) CHECK (delivery_method IN ('in_app', 'email', 'sms', 'push')) DEFAULT 'in_app',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_sent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    action_url TEXT,
    action_text VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('card', 'wallet', 'bank', 'crypto')) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    api_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    webhook_url TEXT,
    sandbox_mode BOOLEAN DEFAULT true,
    supported_currencies TEXT[] DEFAULT ARRAY['USD'],
    fees_percentage DECIMAL(5,2) DEFAULT 2.9,
    fees_fixed DECIMAL(10,2) DEFAULT 0.30,
    min_amount DECIMAL(10,2) DEFAULT 0.50,
    max_amount DECIMAL(10,2) DEFAULT 10000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_config table
CREATE TABLE IF NOT EXISTS payment_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency VARCHAR(3) DEFAULT 'USD',
    tax_rate DECIMAL(5,2) DEFAULT 0,
    service_fee DECIMAL(5,2) DEFAULT 0,
    auto_capture BOOLEAN DEFAULT true,
    refund_policy_days INTEGER DEFAULT 30,
    webhook_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_name VARCHAR(100) DEFAULT 'ServiceHub',
    app_description TEXT DEFAULT 'Your all-in-one service marketplace',
    app_logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#f8d247',
    secondary_color VARCHAR(7) DEFAULT '#64748b',
    dark_mode_enabled BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    registration_enabled BOOLEAN DEFAULT true,
    email_verification_required BOOLEAN DEFAULT true,
    google_analytics_id VARCHAR(50),
    facebook_pixel_id VARCHAR(50),
    support_email VARCHAR(100) DEFAULT 'support@servicehub.com',
    support_phone VARCHAR(20),
    privacy_policy_url TEXT,
    terms_of_service_url TEXT,
    max_file_upload_size INTEGER DEFAULT 10,
    allowed_file_types TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    rate_limit_requests INTEGER DEFAULT 100,
    rate_limit_window INTEGER DEFAULT 60,
    session_timeout INTEGER DEFAULT 3600,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create smtp_config table
CREATE TABLE IF NOT EXISTS smtp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    smtp_host VARCHAR(100),
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(100),
    smtp_password TEXT,
    smtp_encryption VARCHAR(10) CHECK (smtp_encryption IN ('none', 'tls', 'ssl')) DEFAULT 'tls',
    from_email VARCHAR(100),
    from_name VARCHAR(100),
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_config table
CREATE TABLE IF NOT EXISTS social_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    google_client_id TEXT,
    google_client_secret TEXT,
    facebook_app_id TEXT,
    facebook_app_secret TEXT,
    twitter_api_key TEXT,
    twitter_api_secret TEXT,
    is_google_enabled BOOLEAN DEFAULT false,
    is_facebook_enabled BOOLEAN DEFAULT false,
    is_twitter_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_banners_priority ON banners(priority);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_audience ON notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(is_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_enabled ON payment_methods(is_enabled) WHERE is_enabled = true;

-- Create RLS policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE smtp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_config ENABLE ROW LEVEL SECURITY;

-- Admin access policies (only admins can access these tables)
CREATE POLICY "Admin access to coupons" ON coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to banners" ON banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to payment_methods" ON payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to payment_config" ON payment_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to app_config" ON app_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to smtp_config" ON smtp_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin access to social_config" ON social_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default configurations if they don't exist
INSERT INTO app_config (app_name, app_description, primary_color, secondary_color)
SELECT 'ServiceHub', 'Your all-in-one service marketplace', '#f8d247', '#64748b'
WHERE NOT EXISTS (SELECT 1 FROM app_config);

INSERT INTO payment_config (currency, tax_rate, service_fee)
SELECT 'USD', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM payment_config);

INSERT INTO smtp_config (is_enabled)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM smtp_config);

INSERT INTO social_config (is_google_enabled, is_facebook_enabled, is_twitter_enabled)
SELECT false, false, false
WHERE NOT EXISTS (SELECT 1 FROM social_config);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_config_updated_at BEFORE UPDATE ON payment_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_smtp_config_updated_at BEFORE UPDATE ON smtp_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_config_updated_at BEFORE UPDATE ON social_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE coupons IS 'Discount coupons and promotional codes';
COMMENT ON TABLE banners IS 'Marketing banners and advertisements';
COMMENT ON TABLE notifications IS 'System notifications and announcements';
COMMENT ON TABLE payment_methods IS 'Available payment processing methods';
COMMENT ON TABLE payment_config IS 'Global payment configuration settings';
COMMENT ON TABLE app_config IS 'Application-wide configuration settings';
COMMENT ON TABLE smtp_config IS 'Email server configuration';
COMMENT ON TABLE social_config IS 'Social authentication provider settings';
