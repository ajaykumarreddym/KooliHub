import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, Eye, Share2, MapPin, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function PrivacySettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    profile_visible: true,
    show_rating: true,
    show_trip_history: false,
    location_sharing: true,
    data_collection: true,
    marketing_emails: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: "Privacy Settings Updated",
      description: "Your preferences have been saved",
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Privacy Settings
            </h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          {/* Profile Privacy */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-1">
              Profile Privacy
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <Label htmlFor="profile_visible" className="font-medium cursor-pointer">
                      Profile Visible
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Let others see your profile
                    </p>
                  </div>
                </div>
                <Switch
                  id="profile_visible"
                  checked={settings.profile_visible}
                  onCheckedChange={() => handleToggle("profile_visible")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="show_rating" className="font-medium cursor-pointer">
                    Show Rating
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Display your rating to others
                  </p>
                </div>
                <Switch
                  id="show_rating"
                  checked={settings.show_rating}
                  onCheckedChange={() => handleToggle("show_rating")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="trip_history" className="font-medium cursor-pointer">
                    Show Trip History
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Let others see your past trips
                  </p>
                </div>
                <Switch
                  id="trip_history"
                  checked={settings.show_trip_history}
                  onCheckedChange={() => handleToggle("show_trip_history")}
                />
              </div>
            </div>
          </div>

          {/* Data & Location */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-1">
              Data & Location
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <Label htmlFor="location" className="font-medium cursor-pointer">
                      Location Sharing
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share location during trips
                    </p>
                  </div>
                </div>
                <Switch
                  id="location"
                  checked={settings.location_sharing}
                  onCheckedChange={() => handleToggle("location_sharing")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="data_collection" className="font-medium cursor-pointer">
                    Data Collection
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Help improve our service
                  </p>
                </div>
                <Switch
                  id="data_collection"
                  checked={settings.data_collection}
                  onCheckedChange={() => handleToggle("data_collection")}
                />
              </div>
            </div>
          </div>

          {/* Communication */}
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-1">
              Communication
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <Label htmlFor="marketing" className="font-medium cursor-pointer">
                      Marketing Emails
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive promotional offers
                    </p>
                  </div>
                </div>
                <Switch
                  id="marketing"
                  checked={settings.marketing_emails}
                  onCheckedChange={() => handleToggle("marketing_emails")}
                />
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/trip-booking/download-data")}
            >
              <Lock className="h-4 w-4 mr-2" />
              Download My Data
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => {
                if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                  toast({
                    title: "Account Deletion Requested",
                    description: "Your request has been submitted for processing",
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </div>

          {/* Info */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Your Privacy Matters
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We're committed to protecting your privacy. Read our Privacy Policy to learn more.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

