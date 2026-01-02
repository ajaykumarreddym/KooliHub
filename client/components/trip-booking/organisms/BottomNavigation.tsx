import { cn } from "@/lib/utils";
import { MapPin, PlusCircle, Search, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function BottomNavigation() {
  const location = useLocation();

  const navItems = [
    { icon: Search, label: "Search", path: "/trips" },
    { icon: PlusCircle, label: "Publish", path: "/trip-booking/publish-ride" },
    { icon: MapPin, label: "My Trips", path: "/trip-booking/my-bookings" },
    { icon: User, label: "Profile", path: "/trip-booking/profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 flex-1 py-2 transition-colors",
                isActive
                  ? "text-[#137fec]"
                  : "text-gray-500 dark:text-gray-400 hover:text-[#137fec]"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

