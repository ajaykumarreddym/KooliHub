import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorStatus } from "@shared/api";

interface VendorStatusBadgeProps {
  status: VendorStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  active: {
    label: "Active",
    variant: "default" as const,
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
    icon: CheckCircle,
    description: "Vendor is active and can process orders",
  },
  inactive: {
    label: "Inactive",
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
    icon: Pause,
    description: "Vendor is temporarily inactive",
  },
  pending_approval: {
    label: "Pending Approval",
    variant: "outline" as const,
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
    icon: Clock,
    description: "Vendor registration is pending admin approval",
  },
  suspended: {
    label: "Suspended",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
    icon: XCircle,
    description: "Vendor has been suspended from the platform",
  },
};

export function VendorStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: VendorStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center font-medium transition-colors",
        config.className,
        sizeClasses[size],
        className,
      )}
      title={config.description}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

export function VendorStatusSelect({
  value,
  onValueChange,
  disabled = false,
}: {
  value: VendorStatus;
  onValueChange: (value: VendorStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {Object.entries(statusConfig).map(([status, config]) => {
        const Icon = config.icon;
        const isSelected = value === status;

        return (
          <div
            key={status}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-border/80 hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => !disabled && onValueChange(status as VendorStatus)}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                isSelected ? "text-primary" : "text-muted-foreground",
              )}
            />
            <div className="flex-1">
              <div
                className={cn(
                  "font-medium text-sm",
                  isSelected ? "text-primary" : "text-foreground",
                )}
              >
                {config.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {config.description}
              </div>
            </div>
            {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
          </div>
        );
      })}
    </div>
  );
}
