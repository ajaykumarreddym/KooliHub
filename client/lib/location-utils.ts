import { toast } from "sonner";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Get current location using browser geolocation API
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: "Geolocation is not supported by this browser",
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          // Get address from coordinates
          const address = await reverseGeocode(latitude, longitude);

          resolve({
            latitude,
            longitude,
            accuracy,
            ...address,
          });
        } catch (error) {
          // Return coordinates even if reverse geocoding fails
          resolve({
            latitude,
            longitude,
            accuracy,
          });
        }
      },
      (error) => {
        const errorMessage = getGeolocationErrorMessage(error.code);
        reject({
          code: error.code,
          message: errorMessage,
        });
      },
      options,
    );
  });
};

// Watch location changes
export const watchLocation = (
  onLocationUpdate: (location: LocationData) => void,
  onError: (error: GeolocationError) => void,
): number | null => {
  if (!navigator.geolocation) {
    onError({
      code: 0,
      message: "Geolocation is not supported by this browser",
    });
    return null;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000, // 1 minute
  };

  return navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      try {
        const address = await reverseGeocode(latitude, longitude);
        onLocationUpdate({
          latitude,
          longitude,
          accuracy,
          ...address,
        });
      } catch (error) {
        onLocationUpdate({
          latitude,
          longitude,
          accuracy,
        });
      }
    },
    (error) => {
      const errorMessage = getGeolocationErrorMessage(error.code);
      onError({
        code: error.code,
        message: errorMessage,
      });
    },
    options,
  );
};

// Stop watching location
export const stopWatchingLocation = (watchId: number) => {
  if (navigator.geolocation && watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Reverse geocoding - convert coordinates to address
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<Partial<LocationData>> => {
  try {
    // Using OpenStreetMap Nominatim API (free alternative to Google)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "KooliHub/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch address");
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const address = data.address || {};

    return {
      address: data.display_name,
      city: address.city || address.town || address.village || address.county,
      state: address.state,
      country: address.country,
      pincode: address.postcode,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    throw error;
  }
};

// Forward geocoding - convert address to coordinates
export const geocodeAddress = async (
  address: string,
): Promise<LocationData[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`,
      {
        headers: {
          "User-Agent": "KooliHub/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to search address");
    }

    const data = await response.json();

    return data.map((item: any) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: item.display_name,
      city: item.address?.city || item.address?.town || item.address?.village,
      state: item.address?.state,
      country: item.address?.country,
      pincode: item.address?.postcode,
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
};

// Check if location services are available
export const isLocationAvailable = (): boolean => {
  return "geolocation" in navigator;
};

// Request location permission
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (!("permissions" in navigator)) {
      // Fallback: try to get location directly
      await getCurrentLocation();
      return true;
    }

    const permission = await navigator.permissions.query({
      name: "geolocation",
    });

    if (permission.state === "granted") {
      return true;
    }

    if (permission.state === "prompt") {
      // Try to get location to trigger permission prompt
      try {
        await getCurrentLocation();
        return true;
      } catch (error) {
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error("Location permission error:", error);
    return false;
  }
};

// Get user-friendly error messages
const getGeolocationErrorMessage = (code: number): string => {
  switch (code) {
    case 1:
      return "Location access denied. Please allow location access and try again.";
    case 2:
      return "Location information unavailable. Please check your internet connection.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "An unknown error occurred while getting your location.";
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Format location for display
export const formatLocation = (location: LocationData): string => {
  if (location.address) {
    return location.address;
  }

  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.pincode) parts.push(location.pincode);

  return parts.length > 0
    ? parts.join(", ")
    : `${location.latitude}, ${location.longitude}`;
};

// Store location in localStorage
export const saveLocationToStorage = (
  location: LocationData,
  key: string = "userLocation",
) => {
  try {
    localStorage.setItem(key, JSON.stringify(location));
  } catch (error) {
    console.error("Failed to save location to storage:", error);
  }
};

// Get location from localStorage
export const getLocationFromStorage = (
  key: string = "userLocation",
): LocationData | null => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to get location from storage:", error);
    return null;
  }
};

// Location suggestions for Indian cities
export const INDIAN_CITIES = [
  "Mumbai, Maharashtra",
  "Delhi, Delhi",
  "Bangalore, Karnataka",
  "Hyderabad, Telangana",
  "Chennai, Tamil Nadu",
  "Kolkata, West Bengal",
  "Pune, Maharashtra",
  "Ahmedabad, Gujarat",
  "Jaipur, Rajasthan",
  "Surat, Gujarat",
  "Lucknow, Uttar Pradesh",
  "Kanpur, Uttar Pradesh",
  "Nagpur, Maharashtra",
  "Indore, Madhya Pradesh",
  "Thane, Maharashtra",
  "Bhopal, Madhya Pradesh",
  "Visakhapatnam, Andhra Pradesh",
  "Pimpri-Chinchwad, Maharashtra",
  "Patna, Bihar",
  "Vadodara, Gujarat",
  "Ghaziabad, Uttar Pradesh",
  "Ludhiana, Punjab",
  "Agra, Uttar Pradesh",
  "Nashik, Maharashtra",
  "Faridabad, Haryana",
];

export default {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  reverseGeocode,
  geocodeAddress,
  isLocationAvailable,
  requestLocationPermission,
  calculateDistance,
  formatLocation,
  saveLocationToStorage,
  getLocationFromStorage,
  INDIAN_CITIES,
};
