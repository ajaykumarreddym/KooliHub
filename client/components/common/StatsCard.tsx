import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  className?: string;
  loading?: boolean;
}

export function StatsCard({
  icon: Icon,
  title,
  value,
  description,
  className,
  loading,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-5 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-1 truncate">{title}</p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {value}
              </p>
              {description && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
