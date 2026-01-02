-- Migration: Setup tables required for Edge Functions
-- Created: 2024-11-16
-- Description: Creates necessary tables and triggers for edge functions to work properly

-- ============================================================================
-- 1. Daily Analytics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_analytics (
  date DATE PRIMARY KEY,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster date range queries
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- Comment
COMMENT ON TABLE daily_analytics IS 'Stores aggregated daily analytics data from analytics-aggregator edge function';

-- ============================================================================
-- 2. FCM Tokens Table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for FCM tokens
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_updated ON fcm_tokens(updated_at);

-- Comment
COMMENT ON TABLE fcm_tokens IS 'Stores Firebase Cloud Messaging tokens for push notifications';

-- ============================================================================
-- 3. User Sessions Table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Comment
COMMENT ON TABLE user_sessions IS 'Stores user session data for authentication';

-- ============================================================================
-- 4. Upload Metadata Table (optional, for file upload tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS upload_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, uploading, completed, failed
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upload_metadata_user_id ON upload_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_metadata_status ON upload_metadata(status);
CREATE INDEX IF NOT EXISTS idx_upload_metadata_created ON upload_metadata(created_at);

-- Comment
COMMENT ON TABLE upload_metadata IS 'Tracks file upload metadata and status';

-- ============================================================================
-- 5. Notifications Table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  url TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Comment
COMMENT ON TABLE notifications IS 'Stores notification history for users';

-- ============================================================================
-- 6. Profiles Table (ensure it exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer',
  phone TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at);

-- Comment
COMMENT ON TABLE profiles IS 'User profiles created automatically by auth-webhook edge function';

-- ============================================================================
-- 7. Enable pg_net extension for HTTP requests (if not enabled)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- 8. Create function for order webhook trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_order_webhook()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  webhook_url TEXT;
BEGIN
  -- Get the edge function URL
  webhook_url := 'https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/order-webhook';
  
  -- Build payload
  payload := jsonb_build_object(
    'type', TG_OP,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );
  
  -- Call edge function asynchronously
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION notify_order_webhook() IS 'Triggers order-webhook edge function on order changes';

-- ============================================================================
-- 9. Create triggers for order webhook (only if orders table exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS order_webhook_on_insert ON orders;
    DROP TRIGGER IF EXISTS order_webhook_on_update ON orders;
    
    -- Create new triggers
    CREATE TRIGGER order_webhook_on_insert
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_webhook();
    
    CREATE TRIGGER order_webhook_on_update
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
    EXECUTE FUNCTION notify_order_webhook();
    
    RAISE NOTICE 'Order webhook triggers created successfully';
  ELSE
    RAISE NOTICE 'Orders table does not exist yet. Create it first, then run this migration again.';
  END IF;
END $$;

-- ============================================================================
-- 10. Create function to update product statistics (used by cleanup)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_product_statistics()
RETURNS void AS $$
BEGIN
  -- This is a placeholder function
  -- Add your product statistics update logic here
  -- For example: update view counts, sales counts, popularity scores, etc.
  
  RAISE NOTICE 'Product statistics updated';
  
  -- Example: Update product view counts, sales, etc.
  -- UPDATE products SET last_stats_update = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION update_product_statistics() IS 'Updates product statistics, called by scheduled-cleanup edge function';

-- ============================================================================
-- 11. Grant necessary permissions
-- ============================================================================

-- Grant access to service role
GRANT ALL ON daily_analytics TO service_role;
GRANT ALL ON fcm_tokens TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON upload_metadata TO service_role;
GRANT ALL ON notifications TO service_role;
GRANT ALL ON profiles TO service_role;

-- Grant read access to authenticated users on their own data
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON notifications TO authenticated;

-- ============================================================================
-- 12. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for FCM tokens
CREATE POLICY "Users can manage their own FCM tokens"
  ON fcm_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- DONE!
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Edge function tables and triggers setup completed!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Add environment variables in Supabase Dashboard';
  RAISE NOTICE '   2. Test edge functions';
  RAISE NOTICE '   3. Set up cron jobs for scheduled tasks';
  RAISE NOTICE '   4. Configure payment gateway webhooks';
END $$;

