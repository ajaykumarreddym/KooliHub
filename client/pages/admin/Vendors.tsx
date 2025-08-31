import React from "react";
import { VendorManagement } from "@/components/admin/VendorManagement";

export const Vendors: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Vendor Management</h1>
        </div>
      </div>
      <VendorManagement />
    </div>
  );
};
