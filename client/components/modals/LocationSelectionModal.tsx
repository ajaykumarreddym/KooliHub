import { LocationPicker } from "@/components/location/LocationPicker";
import { useLocation } from "@/contexts/LocationContext";
import { LocationData } from "@/lib/location-utils";
import { MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LocationSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * If true, user cannot close the modal without selecting location
   */
  required?: boolean;
  /**
   * Callback when location is successfully selected
   */
  onLocationSelected?: () => void;
}

/**
 * LocationSelectionModal Component - Blinkit Style
 * Compact overlay positioned in top-left corner
 * Mandatory location selection before accessing the app
 */
export function LocationSelectionModal({
  open,
  onOpenChange,
  required = false,
  onLocationSelected
}: LocationSelectionModalProps) {
  const { currentLocation, setLocation } = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(currentLocation);

  // Update selected location when context changes
  useEffect(() => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
    }
  }, [currentLocation]);

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setLocation(location);
    
    // Call the callback and close modal on successful selection
    if (location.serviceAreaId) {
      toast.success(`Location set to ${location.city}!`);
      onLocationSelected?.();
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (required && !currentLocation) {
      toast.error("Please select your location to continue");
      return;
    }
    onOpenChange(false);
  };

  const handleOverlayClick = () => {
    if (!required || currentLocation) {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay - Light gray like Blinkit */}
      <div 
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] animate-in fade-in-0 duration-300 pointer-events-auto"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Modal - Positioned below "Deliver to" in header (approx 140px from top) */}
      <div 
        className="absolute left-8 top-[140px] w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 animate-in slide-in-from-left-10 fade-in-0 duration-300 pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
        aria-describedby="location-modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - only show if not required */}
        {!required && currentLocation && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-1.5 opacity-60 hover:opacity-100 hover:bg-gray-100 transition-all focus:outline-none z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="p-6">
          {/* Header - Compact like Blinkit */}
          <div className="mb-6">
            <h3 id="location-modal-title" className="text-lg font-bold text-gray-900 mb-2">
              Welcome to <span className="text-green-600">KooliHub</span>
            </h3>
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              <p id="location-modal-description" className="text-sm text-gray-600 leading-relaxed">
                Please provide your delivery location to see products at nearby store
              </p>
            </div>
          </div>

          {/* Location Selection - Compact */}
          <div className="space-y-4">
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={selectedLocation}
              showInDialog={false}
              className="border-0 shadow-none p-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
