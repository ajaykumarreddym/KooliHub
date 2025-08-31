import React from "react";
import { NotificationSettings } from "@/components/admin/NotificationSettings";

export const FirebaseNotifications: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Firebase Push Notifications
        </h1>
        <p className="text-gray-500">
          Manage Firebase Cloud Messaging and send real-time push notifications
        </p>
      </div>

      <NotificationSettings />
    </div>
  );
};

export default FirebaseNotifications;
