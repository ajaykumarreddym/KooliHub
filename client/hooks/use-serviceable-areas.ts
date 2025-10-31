import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface ServiceableArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  is_serviceable: boolean;
  service_types: string[];
  delivery_time_hours: number | null;
  delivery_charge: number | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ServiceAreaFilters {
  city?: string;
  state?: string;
  pincode?: string;
  is_serviceable?: boolean;
  service_type?: string;
}

/**
 * Hook to fetch and manage serviceable areas
 */
export function useServiceableAreas(filters?: ServiceAreaFilters) {
  const [areas, setAreas] = useState<ServiceableArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('serviceable_areas')
        .select('*')
        .order('city', { ascending: true });

      // Apply filters
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.state) {
        query = query.ilike('state', `%${filters.state}%`);
      }
      if (filters?.pincode) {
        query = query.eq('pincode', filters.pincode);
      }
      if (filters?.is_serviceable !== undefined) {
        query = query.eq('is_serviceable', filters.is_serviceable);
      }
      if (filters?.service_type) {
        query = query.contains('service_types', [filters.service_type]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setAreas(data || []);
    } catch (err) {
      console.error('Error fetching serviceable areas:', err);
      setError(err as Error);
      toast.error('Failed to load serviceable areas');
    } finally {
      setLoading(false);
    }
  }, [filters?.city, filters?.state, filters?.pincode, filters?.is_serviceable, filters?.service_type]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  return {
    areas,
    loading,
    error,
    refetch: fetchAreas,
  };
}

/**
 * Hook to get areas for a specific city
 */
export function useAreasByCity(city: string | null) {
  const [areas, setAreas] = useState<ServiceableArea[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) {
      setAreas([]);
      return;
    }

    const fetchAreasByCity = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('serviceable_areas')
          .select('*')
          .ilike('city', `%${city}%`)
          .eq('is_serviceable', true)
          .order('pincode', { ascending: true });

        if (error) throw error;

        setAreas(data || []);
      } catch (err) {
        console.error('Error fetching areas by city:', err);
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAreasByCity();
  }, [city]);

  return { areas, loading };
}

/**
 * Hook to get location-based products/offerings
 */
export function useLocationBasedProducts(serviceAreaId: string | null, serviceType?: string) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceAreaId) {
      setProducts([]);
      return;
    }

    const fetchLocationProducts = async () => {
      try {
        setLoading(true);

        // Call the Postgres function to get location-specific products
        const { data, error } = await supabase.rpc('get_products_by_service_area', {
          p_service_area_id: serviceAreaId,
          p_service_type: serviceType || null,
          p_category_id: null,
          p_search_term: null,
          p_limit: 100,
          p_offset: 0,
        });

        if (error) throw error;

        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching location-based products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationProducts();
  }, [serviceAreaId, serviceType]);

  return { products, loading };
}

/**
 * Hook to get categories available in a service area
 */
export function useLocationBasedCategories(serviceAreaId: string | null) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceAreaId) {
      setCategories([]);
      return;
    }

    const fetchLocationCategories = async () => {
      try {
        setLoading(true);

        // Get categories from service_area_categories table
        const { data, error } = await supabase
          .from('service_area_categories')
          .select(`
            *,
            categories:category_id (
              id,
              name,
              description,
              service_type,
              icon_name,
              sort_order
            )
          `)
          .eq('service_area_id', serviceAreaId)
          .eq('is_available', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching location-based categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationCategories();
  }, [serviceAreaId]);

  return { categories, loading };
}

/**
 * Hook to get serviceable cities (for popular cities dropdown)
 */
export function useServiceableCities(limit: number = 8) {
  const [cities, setCities] = useState<Array<{ city: string; state: string; area_count: number; service_types: string[] }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchServiceableCities = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase.rpc('get_serviceable_cities', {
          p_limit: limit,
        });

        if (error) throw error;

        setCities(data || []);
      } catch (err) {
        console.error('Error fetching serviceable cities:', err);
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceableCities();
  }, [limit]);

  return { cities, loading };
}

/**
 * Hook to find service area by location (pincode or city)
 */
export function useFindServiceArea(pincode?: string, city?: string) {
  const [serviceArea, setServiceArea] = useState<ServiceableArea | null>(null);
  const [loading, setLoading] = useState(false);
  const [isServiceable, setIsServiceable] = useState(false);

  useEffect(() => {
    if (!pincode && !city) {
      setServiceArea(null);
      setIsServiceable(false);
      return;
    }

    const findServiceArea = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase.rpc('find_service_area_by_location', {
          p_pincode: pincode || null,
          p_city: city || null,
        });

        if (error) throw error;

        if (data && data.length > 0) {
          const area = data[0];
          setServiceArea({
            id: area.service_area_id,
            city: area.city,
            state: area.state,
            pincode: area.pincode,
            country: 'India',
            is_serviceable: area.is_serviceable,
            service_types: area.service_types || [],
            delivery_time_hours: area.delivery_time_hours,
            delivery_charge: area.delivery_charge,
            created_at: '',
            updated_at: '',
          });
          setIsServiceable(area.is_serviceable);
        } else {
          setServiceArea(null);
          setIsServiceable(false);
        }
      } catch (err) {
        console.error('Error finding service area:', err);
        setServiceArea(null);
        setIsServiceable(false);
      } finally {
        setLoading(false);
      }
    };

    findServiceArea();
  }, [pincode, city]);

  return { serviceArea, isServiceable, loading };
}

