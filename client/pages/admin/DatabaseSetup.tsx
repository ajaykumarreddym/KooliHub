import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  parseError,
  isMissingTableError,
  logDetailedError,
  debugSupabaseConnection,
} from "@/lib/debug-utils";
import { ConnectionStatus } from "@/components/admin/ConnectionStatus";
import {
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Code,
  Copy,
  Bug,
} from "lucide-react";
import { toast } from "sonner";

interface TableStatus {
  name: string;
  exists: boolean;
  error?: string;
}

const requiredTables = [
  "coupons",
  "banners",
  "notifications",
  "payment_methods",
  "payment_config",
  "app_config",
  "smtp_config",
  "social_config",
];

const createTableSQL = `
-- Create all required admin tables
-- Run this SQL in your Supabase SQL Editor if automatic creation fails

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

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to coupons" ON coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
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

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to banners" ON banners FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to notifications" ON notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
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

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to payment_methods" ON payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
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

ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to payment_config" ON payment_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

INSERT INTO payment_config (currency, tax_rate, service_fee)
SELECT 'USD', 0, 0 WHERE NOT EXISTS (SELECT 1 FROM payment_config);

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

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to app_config" ON app_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

INSERT INTO app_config (app_name, app_description, primary_color, secondary_color)
SELECT 'ServiceHub', 'Your all-in-one service marketplace', '#f8d247', '#64748b'
WHERE NOT EXISTS (SELECT 1 FROM app_config);

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

ALTER TABLE smtp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to smtp_config" ON smtp_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

INSERT INTO smtp_config (is_enabled) 
SELECT false WHERE NOT EXISTS (SELECT 1 FROM smtp_config);

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

ALTER TABLE social_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to social_config" ON social_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

INSERT INTO social_config (is_google_enabled, is_facebook_enabled, is_twitter_enabled)
SELECT false, false, false WHERE NOT EXISTS (SELECT 1 FROM social_config);
`;

export const DatabaseSetup: React.FC = () => {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [checking, setChecking] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  const checkTables = async () => {
    setChecking(true);
    const statuses: TableStatus[] = [];

    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase.from(tableName).select("id").limit(1);

        if (error) {
          logDetailedError(`Checking table ${tableName}`, error);
          statuses.push({
            name: tableName,
            exists: false,
            error: parseError(error),
          });
        } else {
          statuses.push({
            name: tableName,
            exists: true,
          });
        }
      } catch (error) {
        logDetailedError(`Exception checking table ${tableName}`, error);
        statuses.push({
          name: tableName,
          exists: false,
          error: parseError(error),
        });
      }
    }

    setTableStatuses(statuses);
    setChecking(false);
  };

  const copySQL = () => {
    navigator.clipboard.writeText(createTableSQL);
    toast.success("SQL copied to clipboard");
  };

  const getStatusIcon = (exists: boolean) => {
    return exists ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (exists: boolean) => {
    return exists ? (
      <Badge className="bg-green-500">Exists</Badge>
    ) : (
      <Badge variant="destructive">Missing</Badge>
    );
  };

  const missingTablesCount = tableStatuses.filter(
    (table) => !table.exists,
  ).length;
  const existingTablesCount = tableStatuses.filter(
    (table) => table.exists,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Database Setup</h1>
        <p className="text-gray-500">
          Check required database tables for admin features
        </p>
      </div>

      <ConnectionStatus />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requiredTables.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Existing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {existingTablesCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {missingTablesCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Tables Status</span>
            </CardTitle>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={checkTables}
                disabled={checking}
              >
                {checking ? "Checking..." : "Check Tables"}
              </Button>
              <Button variant="outline" onClick={debugSupabaseConnection}>
                <Bug className="h-4 w-4 mr-2" />
                Debug Connection
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tableStatuses.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Click "Check Tables" to verify the database setup.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {tableStatuses.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(table.exists)}
                    <div>
                      <h3 className="font-medium">{table.name}</h3>
                      {table.error && (
                        <p className="text-sm text-red-600">{table.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(table.exists)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {missingTablesCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some required tables are missing. The admin features won't work
            properly until these tables are created. Use the SQL script below to
            create the missing tables manually.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Manual SQL Setup</span>
            </CardTitle>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setShowSQL(!showSQL)}>
                {showSQL ? "Hide SQL" : "Show SQL"}
              </Button>
              {showSQL && (
                <Button variant="outline" onClick={copySQL}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy SQL
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {showSQL && (
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Copy this SQL and run it in your Supabase SQL Editor:
                  <br />
                  1. Go to your Supabase dashboard
                  <br />
                  2. Navigate to SQL Editor
                  <br />
                  3. Create a new query
                  <br />
                  4. Paste the SQL below and click "Run"
                </AlertDescription>
              </Alert>
              <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {createTableSQL}
                </pre>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
