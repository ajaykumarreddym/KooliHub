import { useAuth } from '@/contexts/AuthContext';
import { useLocationCategories, useLocationServiceTypes } from '@/hooks/use-location-services';
import { useFindServiceArea } from '@/hooks/use-serviceable-areas';
import { LocationData, getLocationFromStorage, saveLocationToStorage } from '@/lib/location-utils';
import { supabase } from '@/lib/supabase';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

interface LocationContextType {
  currentLocation: LocationData | null;
  setLocation: (location: LocationData) => void;
  clearLocation: () => void;
  locationBasedProducts: any[];
  locationBasedCategories: any[];
  isLoadingProducts: boolean;
  isLoadingCategories: boolean;
  hasLocation: boolean;
  serviceAreaId: string | null;
  isServiceAvailable: boolean;
  isCheckingService: boolean;
  availableServiceTypes: string[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    () => getLocationFromStorage()
  );
  const [locationBasedProducts, setLocationBasedProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Clear location when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out, clear location
      setCurrentLocation(null);
    }
  }, [isAuthenticated]);

  // Check if service is available at current location
  const { serviceArea, isServiceable, loading: isCheckingService } = useFindServiceArea(
    currentLocation?.pincode,
    currentLocation?.city
  );

  // Get service area ID from current location or found service area
  const serviceAreaId = currentLocation?.serviceAreaId || serviceArea?.id || null;

  // Fetch location-based categories using new hook
  const { categories: locationBasedCategories, loading: isLoadingCategories } = 
    useLocationCategories(isServiceable ? serviceAreaId : null);

  // Fetch location-based service types to get available services
  const { serviceTypes } = useLocationServiceTypes(isServiceable ? serviceAreaId : null);

  // Fetch products using the database function
  const fetchLocationProducts = useCallback(async () => {
    if (!serviceAreaId || !isServiceable) {
      setLocationBasedProducts([]);
      return;
    }

    try {
      setIsLoadingProducts(true);
      const { data, error } = await supabase.rpc('get_products_by_service_area', {
        p_service_area_id: serviceAreaId,
        p_service_type: null,
        p_category_id: null,
        p_search_term: null,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;
      setLocationBasedProducts(data || []);
    } catch (err) {
      console.error('Error fetching location-based products:', err);
      setLocationBasedProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [serviceAreaId, isServiceable]);

  useEffect(() => {
    fetchLocationProducts();
  }, [fetchLocationProducts]);

  // Update location with service area ID if found
  useEffect(() => {
    if (serviceArea && currentLocation && !currentLocation.serviceAreaId) {
      const updatedLocation: LocationData = {
        ...currentLocation,
        serviceAreaId: serviceArea.id,
        pincode: serviceArea.pincode || currentLocation.pincode,
        city: serviceArea.city || currentLocation.city,
        state: serviceArea.state || currentLocation.state,
      };
      setCurrentLocation(updatedLocation);
      saveLocationToStorage(updatedLocation);
    }
  }, [serviceArea, currentLocation]);

  const setLocation = (location: LocationData) => {
    setCurrentLocation(location);
    saveLocationToStorage(location);
  };

  const clearLocation = () => {
    setCurrentLocation(null);
    localStorage.removeItem('userLocation');
    // Also clear any location-related cache
    sessionStorage.removeItem('locationCache');
  };

  const hasLocation = currentLocation !== null;
  const isServiceAvailable = hasLocation && isServiceable;
  
  // Extract available service types from the loaded service types or fallback to service area
  const availableServiceTypes = serviceTypes.length > 0 
    ? serviceTypes.map(st => st.service_type_id)
    : (serviceArea?.service_types || []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setLocation,
        clearLocation,
        locationBasedProducts,
        locationBasedCategories,
        isLoadingProducts,
        isLoadingCategories,
        hasLocation,
        serviceAreaId,
        isServiceAvailable,
        isCheckingService,
        availableServiceTypes,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

