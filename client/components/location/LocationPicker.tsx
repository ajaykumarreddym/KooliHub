import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  geocodeAddress,
  getCurrentLocation,
  getLocationFromStorage,
  saveLocationToStorage,
  type GeolocationError,
  type LocationData
} from "@/lib/location-utils";
import {
  AlertCircle,
  Loader2,
  MapPin,
  Navigation,
  Search
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface LocationPickerProps {
  onLocationSelect?: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  showInDialog?: boolean;
  placeholder?: string;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  showInDialog = false,
  placeholder = "Search for location...",
  className = "",
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    initialLocation || getLocationFromStorage(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [noStoreAvailable, setNoStoreAvailable] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load saved location on mount and when it changes
    const loadLocation = () => {
      const saved = getLocationFromStorage();
      if (saved && saved.serviceAreaId) {
        setCurrentLocation(saved);
      }
    };

    loadLocation();

    // Listen for location updates
    const handleLocationUpdate = () => {
      loadLocation();
    };

    window.addEventListener('locationUpdated', handleLocationUpdate);
    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate);
    };
  }, []);

  // Update when initialLocation changes
  useEffect(() => {
    if (initialLocation && initialLocation.serviceAreaId) {
      setCurrentLocation(initialLocation);
    }
  }, [initialLocation]);

  // Memoize the search function to prevent re-creation on every render
  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const results = await geocodeAddress(query);
      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    // Debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  const checkStoreAvailability = useCallback(async (location: LocationData): Promise<boolean> => {
    try {
      setCheckingAvailability(true);
      setNoStoreAvailable(false);

      // Check if stores are available in this location using Supabase
      const { data, error } = await import('@/lib/supabase').then(mod => mod.supabase
        .rpc('find_service_area_by_location', {
          p_pincode: location.pincode || null,
          p_city: location.city || null,
        })
      );

      if (error) throw error;

      // If no service area found or not serviceable
      if (!data || data.length === 0 || !data[0]?.is_serviceable) {
        setNoStoreAvailable(true);
        return false;
      }

      // Update location with service area ID
      const serviceArea = data[0];
      location.serviceAreaId = serviceArea.service_area_id;
      
      return true;
    } catch (error) {
      console.error('Error checking store availability:', error);
      setNoStoreAvailable(true);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  }, []);

  const handleGetCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      
      // Check if stores are available
      const isAvailable = await checkStoreAvailability(location);
      
      if (isAvailable) {
        setCurrentLocation(location);
        saveLocationToStorage(location);
        onLocationSelect?.(location);
        toast.success("Location updated successfully");
        setShowLocationDialog(false);
        
        // Trigger location update event for other components
        window.dispatchEvent(new Event('locationUpdated'));
      } else {
        toast.error("Sorry, we don't service this area yet");
      }
    } catch (error) {
      const err = error as GeolocationError;
      console.error("Location error:", err);
      toast.error(err.message || "Failed to get current location");
    } finally {
      setIsGettingLocation(false);
    }
  }, [onLocationSelect, checkStoreAvailability]);

  const handleLocationSelect = useCallback(async (location: LocationData) => {
    // Check if stores are available
    const isAvailable = await checkStoreAvailability(location);
    
    if (isAvailable) {
      setCurrentLocation(location);
      saveLocationToStorage(location);
      onLocationSelect?.(location);
      setSearchQuery("");
      setSearchResults([]);
      setShowLocationDialog(false);
      toast.success("Location updated");
      
      // Trigger location update event for other components
      window.dispatchEvent(new Event('locationUpdated'));
    } else {
      toast.error("Sorry, we don't service this area yet");
    }
  }, [onLocationSelect, checkStoreAvailability]);

  const LocationPickerContent = useMemo(() => (
    <div className="space-y-5">
      {/* No Store Available Message */}
      {noStoreAvailable && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            {/* Illustration placeholder */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="80" r="40" fill="#FCD34D" />
                <rect x="60" y="120" width="80" height="60" rx="4" fill="#FCD34D" />
                <circle cx="85" cy="70" r="8" fill="#78350F" />
                <circle cx="115" cy="70" r="8" fill="#78350F" />
                <path d="M 80 95 Q 100 85 120 95" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
                <text x="100" y="155" fontSize="24" fontWeight="bold" textAnchor="middle" fill="#78350F">:(</text>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
              <p className="text-gray-700 mb-1">
                We are not available at this location at the moment.
              </p>
              <p className="text-sm text-gray-600">
                Please select a different location.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setNoStoreAvailable(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="mt-2"
            >
              Try Another Location
            </Button>
          </div>
        </div>
      )}

      {!noStoreAvailable && (
        <div className="space-y-5">
          {/* Detect Location Button */}
          <div className="space-y-3">
            <Button
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation || checkingAvailability}
              className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {isGettingLocation || checkingAvailability ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {checkingAvailability ? 'Checking availability...' : 'Detecting location...'}
                </>
              ) : (
                <>
                  <Navigation className="h-5 w-5 mr-2" />
                  Detect my location
                </>
              )}
            </Button>
            <p className="text-center text-sm text-gray-500">
              Find nearby stores from your current location
            </p>
          </div>

          <div className="flex items-center gap-3 my-5">
            <Separator className="flex-1" />
            <span className="text-sm text-gray-500 font-medium">OR</span>
            <Separator className="flex-1" />
          </div>

          {/* Search Location Section */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="location-search" className="text-base font-semibold text-gray-900">
                Search for stores by location
              </Label>
              <p className="text-sm text-gray-600">
                Enter your city, area, or pincode
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
              <Input
                key="location-search-input"
                id="location-search"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                autoComplete="off"
                disabled={checkingAvailability}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-gray-400" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !checkingAvailability && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Search Results</Label>
                <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg">
                  {searchResults.map((location, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 text-left hover:bg-gray-50 rounded-none border-b last:border-b-0"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <MapPin className="h-5 w-5 mr-3 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">
                          {location.city || "Unknown City"}
                          {location.state && `, ${location.state}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {location.address}
                        </p>
                        {location.pincode && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            PIN: {location.pincode}
                          </p>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No locations found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  ), [
    noStoreAvailable,
    isGettingLocation,
    checkingAvailability,
    handleGetCurrentLocation,
    placeholder,
    searchQuery,
    isSearching,
    searchResults,
    handleLocationSelect,
  ]);

  if (showInDialog) {
    return (
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            className={`${className} font-semibold text-gray-900 hover:bg-gray-100 px-2 py-1`}
          >
            <MapPin className="h-4 w-4 mr-1.5 text-green-600" />
            <span className="max-w-[150px] truncate">
              {currentLocation && currentLocation.city
                ? `${currentLocation.city}${currentLocation.pincode ? ` - ${currentLocation.pincode}` : ''}`
                : "Select Location"}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Welcome to KooliHub</DialogTitle>
            <DialogDescription className="text-base">
              Please provide your delivery location to see products at nearby store
            </DialogDescription>
          </DialogHeader>
          {LocationPickerContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Location Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {LocationPickerContent}
      </CardContent>
    </Card>
  );
};

export default LocationPicker;
