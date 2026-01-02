import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2, MapPin, Navigation, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LocationResult } from "./LocationSearchInput";

interface LocationPickerMapProps {
  onSelectLocation: (location: LocationResult) => void;
  onClose: () => void;
  initialLocation?: { lat: number; lon: number };
  locationType: "pickup" | "dropoff";
}

interface ReverseGeocodeResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}

export function LocationPickerMap({
  onSelectLocation,
  onClose,
  initialLocation,
  locationType,
}: LocationPickerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  const [loading, setLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [subAddress, setSubAddress] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lon: number;
    address: ReverseGeocodeResult | null;
  } | null>(null);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Default center (Hyderabad, India)
  const defaultCenter = initialLocation || { lat: 17.3850, lon: 78.4867 };

  const isPickup = locationType === "pickup";
  const markerColor = isPickup ? "#10b981" : "#137fec";

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: { "User-Agent": "KooliHub/1.0" } }
      );

      if (response.ok) {
        const data: ReverseGeocodeResult = await response.json();
        const address = data.address;
        
        const primaryName = address.road || 
                           address.suburb || 
                           address.neighbourhood || 
                           address.village ||
                           address.town ||
                           address.city ||
                           data.display_name.split(",")[0];
        
        const secondaryParts = [];
        if (address.suburb && address.suburb !== primaryName) secondaryParts.push(address.suburb);
        if (address.city && address.city !== primaryName) secondaryParts.push(address.city);
        else if (address.town && address.town !== primaryName) secondaryParts.push(address.town);
        else if (address.village && address.village !== primaryName) secondaryParts.push(address.village);
        if (address.state) secondaryParts.push(address.state);
        
        setCurrentAddress(primaryName);
        setSubAddress(secondaryParts.join(", "));
        setCurrentLocation({ lat, lon, address: data });
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setCurrentAddress("Unable to fetch address");
      setSubAddress("");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle map movement end
  const handleMapMoveEnd = useCallback(() => {
    setIsMapMoving(false);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (mapRef.current) {
        const center = mapRef.current.getCenter();
        reverseGeocode(center.lat, center.lng);
      }
    }, 300);
  }, [reverseGeocode]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 17, { animate: true });
        }
        setGettingCurrentLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please enable location services.");
        setGettingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Already initialized

    // Small delay to ensure container is rendered with proper dimensions
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [defaultCenter.lat, defaultCenter.lon],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        // Enable ALL interactions explicitly
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        // Enable inertia for smoother dragging
        inertia: true,
        inertiaDeceleration: 3000,
        inertiaMaxSpeed: Infinity,
        // Desktop mouse dragging options
        worldCopyJump: false,
        maxBoundsViscosity: 0,
      });
      
      // FORCE enable dragging handlers for both touch AND mouse
      map.dragging.enable();
      map.touchZoom.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();

      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Events for pin animation
      map.on("movestart", () => setIsMapMoving(true));
      map.on("move", () => setIsMapMoving(true));
      map.on("moveend", handleMapMoveEnd);
      map.on("zoomend", handleMapMoveEnd);

      // Re-enable dragging after tiles load (fixes desktop issue)
      tileLayer.on("load", () => {
        map.dragging.enable();
      });

      mapRef.current = map;
      setMapInitialized(true);

      // Force a resize after initialization
      setTimeout(() => {
        map.invalidateSize();
        reverseGeocode(defaultCenter.lat, defaultCenter.lon);
      }, 100);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [defaultCenter.lat, defaultCenter.lon, handleMapMoveEnd, reverseGeocode]);

  // Handle confirm
  const handleConfirm = () => {
    if (!currentLocation || !currentLocation.address) return;

    const address = currentLocation.address.address;
    const locationResult: LocationResult = {
      display_name: currentLocation.address.display_name,
      lat: currentLocation.lat.toString(),
      lon: currentLocation.lon.toString(),
      place_id: Date.now(),
      address: {
        city: address.city,
        town: address.town,
        village: address.village,
        state: address.state,
        country: address.country,
      },
    };

    onSelectLocation(locationResult);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900" style={{ overflow: 'hidden' }}>
      {/* Header - Fixed height */}
      <div className="absolute top-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-10 w-10"
          >
            <X className="h-6 w-6" />
          </Button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isPickup ? "Set Pickup Location" : "Set Drop-off Location"}
          </h2>
          <div className="w-10" />
        </div>

        <div className="px-4 pb-3">
          <Button
            variant="outline"
            onClick={getCurrentLocation}
            disabled={gettingCurrentLocation}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border"
          >
            {gettingCurrentLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
            <span className="text-sm">Use Current Location</span>
          </Button>
        </div>
      </div>

      {/* Map Container - Must receive all mouse/touch events */}
      <div 
        ref={mapContainerRef}
        className="absolute left-0 right-0"
        id="location-picker-map"
        style={{
          top: '110px',
          bottom: '200px',
          zIndex: 10,
        }}
      />

      {/* CENTER PIN - MUST NOT block map events */}
      <div 
        className="absolute left-1/2 pointer-events-none"
        style={{
          top: 'calc(110px + (100vh - 110px - 200px) / 2)',
          transform: 'translate(-50%, -50%)',
          zIndex: 20, /* Above map but pointer-events-none so doesn't block */
        }}
      >
        {/* Shadow on ground */}
        <div 
          className={cn(
            "absolute left-1/2 -translate-x-1/2 rounded-full bg-black/40 blur-[2px] transition-all duration-200",
            isMapMoving 
              ? "bottom-[-16px] w-8 h-3" 
              : "bottom-[-6px] w-5 h-2"
          )}
        />
        
        {/* Pin */}
        <div 
          className={cn(
            "relative transition-all duration-200 ease-out",
            isMapMoving && "-translate-y-3 scale-110"
          )}
        >
          <svg 
            width="48" 
            height="60" 
            viewBox="0 0 48 60" 
            fill="none"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
          >
            <path 
              d="M24 0C10.745 0 0 10.745 0 24C0 36 24 60 24 60C24 60 48 36 48 24C48 10.745 37.255 0 24 0Z" 
              fill={markerColor}
            />
            <circle cx="24" cy="24" r="12" fill="white"/>
            <circle cx="24" cy="24" r="7" fill={markerColor}/>
          </svg>
        </div>
      </div>

      {/* Drag instruction */}
      {isMapMoving && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-[100]"
          style={{ top: '130px' }}
        >
          <div className="bg-black/80 text-white text-sm px-4 py-2 rounded-full">
            Move map to select location
          </div>
        </div>
      )}

      {/* Bottom Panel - Fixed height */}
      <div 
        className="absolute left-0 right-0 bottom-0 z-[100] bg-white dark:bg-gray-900 rounded-t-2xl"
        style={{ 
          height: '200px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <div className="h-full flex flex-col p-4">
          {/* Address */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${markerColor}20` }}
            >
              {isPickup ? (
                <Navigation className="h-5 w-5" style={{ color: markerColor }} />
              ) : (
                <MapPin className="h-5 w-5" style={{ color: markerColor }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase" style={{ color: markerColor }}>
                {isPickup ? "Pickup" : "Drop-off"}
              </p>
              {loading || isMapMoving ? (
                <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4 mt-1" />
              ) : (
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {currentAddress || "Move map to select"}
                </p>
              )}
              {!loading && !isMapMoving && subAddress && (
                <p className="text-xs text-gray-500 truncate">{subAddress}</p>
              )}
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={loading || !currentLocation || isMapMoving}
            className={cn(
              "w-full h-12 text-white font-bold rounded-xl mb-2",
              "disabled:opacity-50",
              isPickup 
                ? "bg-[#10b981] hover:bg-[#059669]" 
                : "bg-[#137fec] hover:bg-[#0d5cb8]"
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isMapMoving ? (
              "Release to select"
            ) : (
              `Confirm ${isPickup ? "Pickup" : "Drop-off"}`
            )}
          </Button>

          {/* Search link */}
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[#137fec] flex items-center justify-center gap-1"
          >
            <Search className="h-4 w-4" />
            Search instead
          </button>
        </div>
      </div>
    </div>
  );
}
