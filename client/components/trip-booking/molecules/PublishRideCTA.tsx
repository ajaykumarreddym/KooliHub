import { ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function PublishRideCTA() {
  return (
    <Link
      to="/trip-booking/publish-ride"
      className="flex items-center justify-between w-full bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group"
    >
      <div className="flex items-center">
        <div className="flex items-center justify-center w-12 h-12 bg-[#137fec] rounded-lg mr-4 group-hover:scale-110 transition-transform">
          <Plus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-left text-[#137fec] dark:text-blue-300">
            Publish a Ride
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
            Share your journey and costs
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-[#137fec] dark:text-blue-300 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

