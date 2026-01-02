import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bell, Mail, MessageSquare, Volume2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    push_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    trip_updates: true,
    booking_confirmations: true,
    payment_receipts: true,
    promotional: false,
    tips_recommendations: true,
    sound_enabled: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been saved",
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
              Notification Settings
            </h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          {/* Notification Channels */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-1">
              Notification Channels
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <Label htmlFor="push" className="font-medium cursor-pointer">
                    Push Notifications
                  </Label>
                </div>
                <Switch
                  id="push"
                  checked={settings.push_enabled}
                  onCheckedChange={() => handleToggle("push_enabled")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <Label htmlFor="email" className="font-medium cursor-pointer">
                    Email Notifications
                  </Label>
                </div>
                <Switch
                  id="email"
                  checked={settings.email_enabled}
                  onCheckedChange={() => handleToggle("email_enabled")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <Label htmlFor="sms" className="font-medium cursor-pointer">
                    SMS Notifications
                  </Label>
                </div>
                <Switch
                  id="sms"
                  checked={settings.sms_enabled}
                  onCheckedChange={() => handleToggle("sms_enabled")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <Label htmlFor="sound" className="font-medium cursor-pointer">
                    Notification Sounds
                  </Label>
                </div>
                <Switch
                  id="sound"
                  checked={settings.sound_enabled}
                  onCheckedChange={() => handleToggle("sound_enabled")}
                />
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-1">
              Notification Types
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <div className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="trip_updates" className="font-medium cursor-pointer">
                    Trip Updates
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status changes, cancellations, delays
                  </p>
                </div>
                <Switch
                  id="trip_updates"
                  checked={settings.trip_updates}
                  onCheckedChange={() => handleToggle("trip_updates")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="bookings" className="font-medium cursor-pointer">
                    Booking Confirmations
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    New bookings and ride confirmations
                  </p>
                </div>
                <Switch
                  id="bookings"
                  checked={settings.booking_confirmations}
                  onCheckedChange={() => handleToggle("booking_confirmations")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="payments" className="font-medium cursor-pointer">
                    Payment Receipts
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Payment confirmations and receipts
                  </p>
                </div>
                <Switch
                  id="payments"
                  checked={settings.payment_receipts}
                  onCheckedChange={() => handleToggle("payment_receipts")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="promo" className="font-medium cursor-pointer">
                    Promotional Offers
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Discounts, deals, and special offers
                  </p>
                </div>
                <Switch
                  id="promo"
                  checked={settings.promotional}
                  onCheckedChange={() => handleToggle("promotional")}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="tips" className="font-medium cursor-pointer">
                    Tips & Recommendations
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Helpful tips and personalized suggestions
                  </p>
                </div>
                <Switch
                  id="tips"
                  checked={settings.tips_recommendations}
                  onCheckedChange={() => handleToggle("tips_recommendations")}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

