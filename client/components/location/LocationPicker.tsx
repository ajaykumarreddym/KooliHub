import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCurrentLocation,
  geocodeAddress,
  formatLocation,
  saveLocationToStorage,
  getLocationFromStorage,
  INDIAN_CITIES,
  type LocationData,
  type GeolocationError,
} from "@/lib/location-utils";

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load saved location on mount
    if (!currentLocation) {
      const saved = getLocationFromStorage();
      if (saved) {
        setCurrentLocation(saved);
      }
    }
  }, []);

  useEffect(() => {
    // Debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      saveLocationToStorage(location);
      onLocationSelect?.(location);
      toast.success("Location updated successfully");
      setShowLocationDialog(false);
    } catch (error) {
      const err = error as GeolocationError;
      console.error("Location error:", err);
      toast.error(err.message || "Failed to get current location");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await geocodeAddress(query);
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search locations");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setCurrentLocation(location);
    saveLocationToStorage(location);
    onLocationSelect?.(location);
    setSearchQuery("");
    setSearchResults([]);
    setShowLocationDialog(false);
    setShowSuggestions(false);
    toast.success("Location updated");
  };

  const handleCitySelect = (city: string) => {
    setSearchQuery(city);
    handleSearch(city);
  };

  const LocationPickerContent = () => (
    <div className="space-y-6">
      {/* Current Location Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Current Location</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Use Current Location
          </Button>
        </div>

        {currentLocation ? (
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Location Selected
                  </p>
                  <p className="text-sm text-green-700">
                    {formatLocation(currentLocation)}
                  </p>
                  {currentLocation.accuracy && (
                    <p className="text-xs text-green-600 mt-1">
                      Accuracy: ~{Math.round(currentLocation.accuracy)}m
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">
                    No Location Selected
                  </p>
                  <p className="text-sm text-orange-700">
                    Please select your location to continue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Search Location Section */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="location-search" className="text-base font-semibold">
            Search Location
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            Search for your city, area, or landmark
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="location-search"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search Results</Label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((location, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => handleLocationSelect(location)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {location.city || "Unknown City"}
                      {location.state && `, ${location.state}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {location.address}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Cities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Popular Cities</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showSuggestions ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {showSuggestions && (
            <div className="grid grid-cols-2 gap-2">
              {INDIAN_CITIES.slice(0, 10).map((city) => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-2 text-xs"
                  onClick={() => handleCitySelect(city)}
                >
                  {city.split(",")[0]}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (showInDialog) {
    return (
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            <MapPin className="h-4 w-4 mr-2" />
            {currentLocation
              ? currentLocation.city || "Location Selected"
              : "Select Location"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your Location</DialogTitle>
            <DialogDescription>
              Choose your current location or search for a specific area
            </DialogDescription>
          </DialogHeader>
          <LocationPickerContent />
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
        <LocationPickerContent />
      </CardContent>
    </Card>
  );
};

export default LocationPicker;
