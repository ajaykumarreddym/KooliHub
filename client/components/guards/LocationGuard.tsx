import { LocationSelectionModal } from "@/components/modals/LocationSelectionModal";
import { useLocation } from "@/contexts/LocationContext";
import { Loader2, MapPin } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

interface LocationGuardProps {
  children: ReactNode;
  /**
   * If true, shows location modal when location is not set
   * If false, shows a prompt to select location
   */
  requireLocation?: boolean;
}

/**
 * LocationGuard Component
 * Protects routes that require location to be selected
 * Shows modal overlay for location selection
 */
export function LocationGuard({ children, requireLocation = true }: LocationGuardProps) {
  const { 
    currentLocation, 
    hasLocation,
    isServiceAvailable, 
    isCheckingService,
    availableServiceTypes 
  } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    // Don't check if still loading service availability
    if (isCheckingService) return;

    // Only check if location is truly missing or invalid
    // If location exists and is serviceable, don't show modal
    const locationValid = hasLocation && currentLocation && currentLocation.serviceAreaId;
    const serviceValid = isServiceAvailable && availableServiceTypes.length > 0;

    // Check if location is needed
    const needsLocation = requireLocation && (!locationValid || !serviceValid);

    if (needsLocation) {
      // Always show modal overlay (never redirect to separate page)
      setShowLocationModal(true);
    } else {
      // Location is valid, hide modal
      setShowLocationModal(false);
    }
  }, [requireLocation, hasLocation, currentLocation, isServiceAvailable, isCheckingService, availableServiceTypes]);

  const handleLocationSelected = () => {
    setShowLocationModal(false);
  };

  // Show loading state while checking service availability
  if (isCheckingService) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Checking service availability...</p>
          <p className="text-sm text-gray-500 mt-2">
            {currentLocation?.city && `for ${currentLocation.city}, ${currentLocation.state}`}
          </p>
        </div>
      </div>
    );
  }

  // Show prompt if location not set and not requiring redirect
  if (!hasLocation && !requireLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Required</h2>
          <p className="text-gray-600 mb-6">
            Please select your location to see available services and products in your area.
          </p>
          <button
            onClick={() => setShowLocationModal(true)}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Select Location
          </button>
        </div>
      </div>
    );
  }

  // Render children with location modal overlay
  return (
    <>
      {children}
      <LocationSelectionModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        required={requireLocation && !hasLocation}
        onLocationSelected={handleLocationSelected}
      />
    </>
  );
}

