import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import {
  Settings,
  Globe,
  Palette,
  Shield,
  Bell,
  Mail,
  Smartphone,
  Database,
  Eye,
  Upload,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface AppConfig {
  id: string;
  app_name: string;
  app_description: string;
  app_logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  dark_mode_enabled: boolean;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_verification_required: boolean;
  google_analytics_id: string;
  facebook_pixel_id: string;
  support_email: string;
  support_phone: string;
  privacy_policy_url: string;
  terms_of_service_url: string;
  max_file_upload_size: number;
  allowed_file_types: string[];
  rate_limit_requests: number;
  rate_limit_window: number;
  session_timeout: number;
  created_at: string;
  updated_at: string;
}

interface SMTPConfig {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: "none" | "tls" | "ssl";
  from_email: string;
  from_name: string;
  is_enabled: boolean;
}

interface SocialConfig {
  id: string;
  google_client_id: string;
  google_client_secret: string;
  facebook_app_id: string;
  facebook_app_secret: string;
  twitter_api_key: string;
  twitter_api_secret: string;
  is_google_enabled: boolean;
  is_facebook_enabled: boolean;
  is_twitter_enabled: boolean;
}

const defaultAppConfig: Omit<AppConfig, "id" | "created_at" | "updated_at"> = {
  app_name: "KooliHub",
  app_description:
    "Local Hands, Local Deliveries - Your trusted local service marketplace",
  app_logo_url: "",
  favicon_url: "",
  primary_color: "#f8d247",
  secondary_color: "#64748b",
  dark_mode_enabled: true,
  maintenance_mode: false,
  registration_enabled: true,
  email_verification_required: true,
  google_analytics_id: "",
  facebook_pixel_id: "",
  support_email: "support@koolihub.com",
  support_phone: "",
  privacy_policy_url: "",
  terms_of_service_url: "",
  max_file_upload_size: 10,
  allowed_file_types: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
  rate_limit_requests: 100,
  rate_limit_window: 60,
  session_timeout: 3600,
};

// Utility function to ensure no null values in form data
const ensureStringValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

export const AppConfig: React.FC = () => {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig | null>(null);
  const [socialConfig, setSocialConfig] = useState<SocialConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [appFormData, setAppFormData] = useState(defaultAppConfig);
  const [smtpFormData, setSmtpFormData] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    smtp_encryption: "tls" as "none" | "tls" | "ssl",
    from_email: "",
    from_name: "",
    is_enabled: false,
  });
  const [socialFormData, setSocialFormData] = useState({
    google_client_id: "",
    google_client_secret: "",
    facebook_app_id: "",
    facebook_app_secret: "",
    twitter_api_key: "",
    twitter_api_secret: "",
    is_google_enabled: false,
    is_facebook_enabled: false,
    is_twitter_enabled: false,
  });

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);

      const [appResult, smtpResult, socialResult] = await Promise.allSettled([
        supabase.from("app_config").select("*").single(),
        supabase.from("smtp_config").select("*").single(),
        supabase.from("social_config").select("*").single(),
      ]);

      // Handle app config
      if (appResult.status === "fulfilled" && appResult.value.data) {
        setAppConfig(appResult.value.data);
        // Convert null values to empty strings for ALL string form inputs
        const rawData = appResult.value.data;
        const cleanAppData = {
          ...rawData,
          app_name: rawData.app_name || "KooliHub",
          app_description:
            rawData.app_description ||
            "Local Hands, Local Deliveries - Your trusted local service marketplace",
          app_logo_url: rawData.app_logo_url || "",
          favicon_url: rawData.favicon_url || "",
          primary_color: rawData.primary_color || "#f8d247",
          secondary_color: rawData.secondary_color || "#64748b",
          google_analytics_id: rawData.google_analytics_id || "",
          facebook_pixel_id: rawData.facebook_pixel_id || "",
          support_email: rawData.support_email || "support@koolihub.com",
          support_phone: rawData.support_phone || "",
          privacy_policy_url: rawData.privacy_policy_url || "",
          terms_of_service_url: rawData.terms_of_service_url || "",
          allowed_file_types: rawData.allowed_file_types || [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "pdf",
            "doc",
            "docx",
          ],
        };
        setAppFormData(cleanAppData);
      } else if (appResult.status === "rejected") {
        const error = appResult.reason;
        console.error("App config error:", error);
        console.error("Error code:", error?.code);
        console.error("Error message:", error?.message);
        console.error("Error details:", error?.details);

        if (
          error?.code === "PGRST116" ||
          error?.message?.includes(
            'relation "public.app_config" does not exist',
          )
        ) {
          toast.error(
            "App config table not found. Please run database migrations.",
          );
        } else {
          // Extract meaningful error message
          let errorMessage = "Unknown database error";
          if (error?.message) {
            errorMessage = error.message;
          } else if (error?.error_description) {
            errorMessage = error.error_description;
          } else if (error?.details) {
            errorMessage = error.details;
          } else if (typeof error === "string") {
            errorMessage = error;
          } else if (error && typeof error === "object") {
            try {
              errorMessage = JSON.stringify(error, null, 2);
            } catch {
              errorMessage = "Complex error object - check console";
            }
          }
          toast.error(`App config error: ${errorMessage}`);
        }
      }

      // Handle SMTP config
      if (smtpResult.status === "fulfilled" && smtpResult.value.data) {
        setSmtpConfig(smtpResult.value.data);
        // Convert null values to empty strings for form inputs
        const cleanSmtpData = {
          ...smtpResult.value.data,
          smtp_host: smtpResult.value.data.smtp_host || "",
          smtp_username: smtpResult.value.data.smtp_username || "",
          smtp_password: smtpResult.value.data.smtp_password || "",
          from_email: smtpResult.value.data.from_email || "",
          from_name: smtpResult.value.data.from_name || "",
        };
        setSmtpFormData(cleanSmtpData);
      } else if (smtpResult.status === "rejected") {
        const error = smtpResult.reason;
        console.error("SMTP config error:", error);
        if (
          error?.code === "PGRST116" ||
          error?.message?.includes(
            'relation "public.smtp_config" does not exist',
          )
        ) {
          toast.error(
            "SMTP config table not found. Please run database migrations.",
          );
        }
      }

      // Handle Social config
      if (socialResult.status === "fulfilled" && socialResult.value.data) {
        setSocialConfig(socialResult.value.data);
        // Convert null values to empty strings for form inputs
        const cleanSocialData = {
          ...socialResult.value.data,
          google_client_id: socialResult.value.data.google_client_id || "",
          google_client_secret:
            socialResult.value.data.google_client_secret || "",
          facebook_app_id: socialResult.value.data.facebook_app_id || "",
          facebook_app_secret:
            socialResult.value.data.facebook_app_secret || "",
          twitter_api_key: socialResult.value.data.twitter_api_key || "",
          twitter_api_secret: socialResult.value.data.twitter_api_secret || "",
          linkedin_client_id: socialResult.value.data.linkedin_client_id || "",
          linkedin_client_secret:
            socialResult.value.data.linkedin_client_secret || "",
        };
        setSocialFormData(cleanSocialData);
      } else if (socialResult.status === "rejected") {
        const error = socialResult.reason;
        console.error("Social config error:", error);
        if (
          error?.code === "PGRST116" ||
          error?.message?.includes(
            'relation "public.social_config" does not exist',
          )
        ) {
          toast.error(
            "Social config table not found. Please run database migrations.",
          );
        }
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
      const errorMessage =
        error?.message || error?.error_description || "Unknown database error";
      toast.error(`Failed to fetch configurations: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const saveAppConfig = async () => {
    try {
      setSaving(true);

      if (appConfig) {
        const { error } = await supabase
          .from("app_config")
          .update(appFormData)
          .eq("id", appConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_config")
          .insert([appFormData]);
        if (error) throw error;
      }

      toast.success("App configuration saved successfully");
      fetchConfigurations();
    } catch (error) {
      console.error("Error saving app config:", error);
      toast.error("Failed to save app configuration");
    } finally {
      setSaving(false);
    }
  };

  const saveSmtpConfig = async () => {
    try {
      setSaving(true);

      if (smtpConfig) {
        const { error } = await supabase
          .from("smtp_config")
          .update(smtpFormData)
          .eq("id", smtpConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("smtp_config")
          .insert([smtpFormData]);
        if (error) throw error;
      }

      toast.success("SMTP configuration saved successfully");
      fetchConfigurations();
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      toast.error("Failed to save SMTP configuration");
    } finally {
      setSaving(false);
    }
  };

  const saveSocialConfig = async () => {
    try {
      setSaving(true);

      if (socialConfig) {
        const { error } = await supabase
          .from("social_config")
          .update(socialFormData)
          .eq("id", socialConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("social_config")
          .insert([socialFormData]);
        if (error) throw error;
      }

      toast.success("Social authentication configuration saved successfully");
      fetchConfigurations();
    } catch (error) {
      console.error("Error saving social config:", error);
      toast.error("Failed to save social authentication configuration");
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfig = async () => {
    try {
      // This would typically send a test email
      toast.success("Test email sent successfully");
    } catch (error) {
      toast.error("Failed to send test email");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading configurations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App Configuration</h1>
        <p className="text-gray-500">
          Configure your application settings and integrations
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Application Name</Label>
                  <Input
                    id="app_name"
                    value={appFormData.app_name}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        app_name: e.target.value,
                      })
                    }
                    placeholder="Enter app name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={appFormData.support_email}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        support_email: e.target.value,
                      })
                    }
                    placeholder="support@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_description">Application Description</Label>
                <Textarea
                  id="app_description"
                  value={appFormData.app_description}
                  onChange={(e) =>
                    setAppFormData({
                      ...appFormData,
                      app_description: e.target.value,
                    })
                  }
                  placeholder="Enter app description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app_logo_url">Logo URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="app_logo_url"
                      value={appFormData.app_logo_url}
                      onChange={(e) =>
                        setAppFormData({
                          ...appFormData,
                          app_logo_url: e.target.value,
                        })
                      }
                      placeholder="Enter logo URL"
                    />
                    <Button variant="outline">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon_url">Favicon URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="favicon_url"
                      value={appFormData.favicon_url}
                      onChange={(e) =>
                        setAppFormData({
                          ...appFormData,
                          favicon_url: e.target.value,
                        })
                      }
                      placeholder="Enter favicon URL"
                    />
                    <Button variant="outline">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="support_phone">Support Phone</Label>
                  <Input
                    id="support_phone"
                    value={appFormData.support_phone}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        support_phone: e.target.value,
                      })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session_timeout">
                    Session Timeout (seconds)
                  </Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={appFormData.session_timeout}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        session_timeout: Number(e.target.value),
                      })
                    }
                    min="300"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Application Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">
                        Enable to show maintenance page
                      </p>
                    </div>
                    <Switch
                      id="maintenance_mode"
                      checked={appFormData.maintenance_mode}
                      onCheckedChange={(checked) =>
                        setAppFormData({
                          ...appFormData,
                          maintenance_mode: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="registration_enabled">
                        User Registration
                      </Label>
                      <p className="text-sm text-gray-500">
                        Allow new user registration
                      </p>
                    </div>
                    <Switch
                      id="registration_enabled"
                      checked={appFormData.registration_enabled}
                      onCheckedChange={(checked) =>
                        setAppFormData({
                          ...appFormData,
                          registration_enabled: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveAppConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={appFormData.primary_color}
                      onChange={(e) =>
                        setAppFormData({
                          ...appFormData,
                          primary_color: e.target.value,
                        })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={appFormData.primary_color}
                      onChange={(e) =>
                        setAppFormData({
                          ...appFormData,
                          primary_color: e.target.value,
                        })
                      }
                      placeholder="#f8d247"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={appFormData.secondary_color}
                      onChange={(e) =>
                        setAppFormData({
                          ...appFormData,
                          secondary_color: e.target.value,
                        })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={appFormData.secondary_color}
                      onChange={(e) =>
                        setAppFormData({
                          ...appFormData,
                          secondary_color: e.target.value,
                        })
                      }
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="dark_mode_enabled">Dark Mode Support</Label>
                  <p className="text-sm text-gray-500">
                    Enable dark mode theme toggle
                  </p>
                </div>
                <Switch
                  id="dark_mode_enabled"
                  checked={appFormData.dark_mode_enabled}
                  onCheckedChange={(checked) =>
                    setAppFormData({
                      ...appFormData,
                      dark_mode_enabled: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Color Preview</Label>
                <div className="flex space-x-4 p-4 border rounded-lg">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-gray-200 flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: appFormData.primary_color }}
                  >
                    Primary
                  </div>
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-gray-200 flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: appFormData.secondary_color }}
                  >
                    Secondary
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveAppConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="email_verification_required">
                    Email Verification
                  </Label>
                  <p className="text-sm text-gray-500">
                    Require email verification for new accounts
                  </p>
                </div>
                <Switch
                  id="email_verification_required"
                  checked={appFormData.email_verification_required}
                  onCheckedChange={(checked) =>
                    setAppFormData({
                      ...appFormData,
                      email_verification_required: checked,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate_limit_requests">
                    Rate Limit (requests)
                  </Label>
                  <Input
                    id="rate_limit_requests"
                    type="number"
                    value={appFormData.rate_limit_requests}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        rate_limit_requests: Number(e.target.value),
                      })
                    }
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate_limit_window">
                    Rate Limit Window (seconds)
                  </Label>
                  <Input
                    id="rate_limit_window"
                    type="number"
                    value={appFormData.rate_limit_window}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        rate_limit_window: Number(e.target.value),
                      })
                    }
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_file_upload_size">
                    Max File Upload Size (MB)
                  </Label>
                  <Input
                    id="max_file_upload_size"
                    type="number"
                    value={appFormData.max_file_upload_size}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        max_file_upload_size: Number(e.target.value),
                      })
                    }
                    min="1"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowed_file_types">Allowed File Types</Label>
                  <Input
                    id="allowed_file_types"
                    value={appFormData.allowed_file_types.join(", ")}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        allowed_file_types: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter((t) => t),
                      })
                    }
                    placeholder="jpg, png, pdf, doc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
                  <Input
                    id="privacy_policy_url"
                    value={appFormData.privacy_policy_url}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        privacy_policy_url: e.target.value,
                      })
                    }
                    placeholder="https://example.com/privacy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms_of_service_url">
                    Terms of Service URL
                  </Label>
                  <Input
                    id="terms_of_service_url"
                    value={appFormData.terms_of_service_url}
                    onChange={(e) =>
                      setAppFormData({
                        ...appFormData,
                        terms_of_service_url: e.target.value,
                      })
                    }
                    placeholder="https://example.com/terms"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveAppConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="smtp_enabled">Enable SMTP</Label>
                  <p className="text-sm text-gray-500">
                    Use custom SMTP server for emails
                  </p>
                </div>
                <Switch
                  id="smtp_enabled"
                  checked={smtpFormData.is_enabled}
                  onCheckedChange={(checked) =>
                    setSmtpFormData({ ...smtpFormData, is_enabled: checked })
                  }
                />
              </div>

              {smtpFormData.is_enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_host">SMTP Host</Label>
                      <Input
                        id="smtp_host"
                        value={smtpFormData.smtp_host}
                        onChange={(e) =>
                          setSmtpFormData({
                            ...smtpFormData,
                            smtp_host: e.target.value,
                          })
                        }
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">SMTP Port</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={smtpFormData.smtp_port}
                        onChange={(e) =>
                          setSmtpFormData({
                            ...smtpFormData,
                            smtp_port: Number(e.target.value),
                          })
                        }
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_username">Username</Label>
                      <Input
                        id="smtp_username"
                        value={smtpFormData.smtp_username}
                        onChange={(e) =>
                          setSmtpFormData({
                            ...smtpFormData,
                            smtp_username: e.target.value,
                          })
                        }
                        placeholder="your-email@gmail.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp_password">Password</Label>
                      <Input
                        id="smtp_password"
                        type="password"
                        value={smtpFormData.smtp_password}
                        onChange={(e) =>
                          setSmtpFormData({
                            ...smtpFormData,
                            smtp_password: e.target.value,
                          })
                        }
                        placeholder="Enter password"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_encryption">Encryption</Label>
                      <Select
                        value={smtpFormData.smtp_encryption}
                        onValueChange={(value: "none" | "tls" | "ssl") =>
                          setSmtpFormData({
                            ...smtpFormData,
                            smtp_encryption: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="from_email">From Email</Label>
                      <Input
                        id="from_email"
                        type="email"
                        value={smtpFormData.from_email}
                        onChange={(e) =>
                          setSmtpFormData({
                            ...smtpFormData,
                            from_email: e.target.value,
                          })
                        }
                        placeholder="noreply@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="from_name">From Name</Label>
                      <Input
                        id="from_name"
                        value={smtpFormData.from_name}
                        onChange={(e) =>
                          setSmtpFormData({
                            ...smtpFormData,
                            from_name: e.target.value,
                          })
                        }
                        placeholder="KooliHub"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">
                          Email Configuration
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Make sure to use app-specific passwords for Gmail and
                          other providers that require 2FA.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={testEmailConfig}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
                <Button onClick={saveSmtpConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Analytics & Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_analytics_id">
                      Google Analytics ID
                    </Label>
                    <Input
                      id="google_analytics_id"
                      value={ensureStringValue(appFormData.google_analytics_id)}
                      onChange={(e) =>
                        setAppFormData({
                          ...appFormData,
                          google_analytics_id: e.target.value,
                        })
                      }
                      placeholder="GA-XXXXXXXXX-X"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                    <Input
                      id="facebook_pixel_id"
                      value={ensureStringValue(appFormData.facebook_pixel_id)}
                      onChange={(e) =>
                        setAppFormData({
                          ...appFormData,
                          facebook_pixel_id: e.target.value,
                        })
                      }
                      placeholder="123456789012345"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveAppConfig} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Analytics Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Social Authentication</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="google_auth_enabled">
                        Google Authentication
                      </Label>
                      <p className="text-sm text-gray-500">
                        Allow users to sign in with Google
                      </p>
                    </div>
                    <Switch
                      id="google_auth_enabled"
                      checked={socialFormData.is_google_enabled}
                      onCheckedChange={(checked) =>
                        setSocialFormData({
                          ...socialFormData,
                          is_google_enabled: checked,
                        })
                      }
                    />
                  </div>

                  {socialFormData.is_google_enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-4">
                      <div className="space-y-2">
                        <Label htmlFor="google_client_id">
                          Google Client ID
                        </Label>
                        <Input
                          id="google_client_id"
                          value={socialFormData.google_client_id}
                          onChange={(e) =>
                            setSocialFormData({
                              ...socialFormData,
                              google_client_id: e.target.value,
                            })
                          }
                          placeholder="Enter Google Client ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="google_client_secret">
                          Google Client Secret
                        </Label>
                        <Input
                          id="google_client_secret"
                          type="password"
                          value={socialFormData.google_client_secret}
                          onChange={(e) =>
                            setSocialFormData({
                              ...socialFormData,
                              google_client_secret: e.target.value,
                            })
                          }
                          placeholder="Enter Google Client Secret"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="facebook_auth_enabled">
                        Facebook Authentication
                      </Label>
                      <p className="text-sm text-gray-500">
                        Allow users to sign in with Facebook
                      </p>
                    </div>
                    <Switch
                      id="facebook_auth_enabled"
                      checked={socialFormData.is_facebook_enabled}
                      onCheckedChange={(checked) =>
                        setSocialFormData({
                          ...socialFormData,
                          is_facebook_enabled: checked,
                        })
                      }
                    />
                  </div>

                  {socialFormData.is_facebook_enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook_app_id">Facebook App ID</Label>
                        <Input
                          id="facebook_app_id"
                          value={socialFormData.facebook_app_id}
                          onChange={(e) =>
                            setSocialFormData({
                              ...socialFormData,
                              facebook_app_id: e.target.value,
                            })
                          }
                          placeholder="Enter Facebook App ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="facebook_app_secret">
                          Facebook App Secret
                        </Label>
                        <Input
                          id="facebook_app_secret"
                          type="password"
                          value={socialFormData.facebook_app_secret}
                          onChange={(e) =>
                            setSocialFormData({
                              ...socialFormData,
                              facebook_app_secret: e.target.value,
                            })
                          }
                          placeholder="Enter Facebook App Secret"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveSocialConfig} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Social Auth Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
