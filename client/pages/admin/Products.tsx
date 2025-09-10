import { ProductManagement } from "@/components/admin/ProductManagement";
import React from "react";

export const Products: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Product Management</h1>
        </div>
      </div>

      <ProductManagement />
    </div>
  );
};
