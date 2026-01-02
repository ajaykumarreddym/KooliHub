import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookingStatus, TripStatus } from "@shared/api";

interface TripStatusBadgeProps {
  status: TripStatus | BookingStatus;
  className?: string;
}

const statusConfig = {
  // Trip statuses
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  active: { label: "En route", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  
  // Booking statuses
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  no_show: { label: "No Show", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
};

export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.scheduled;

  return (
    <Badge className={cn(config.className, "font-medium", className)}>
      {config.label}
    </Badge>
  );
}

