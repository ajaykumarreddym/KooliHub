import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Service Type with counts from database
 */
export interface LocationServiceType {
  service_type_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  image_url: string | null;
  sort_order: number;
  category_count: number;
  product_count: number;
}

/**
 * Category with location-specific data
 */
export interface LocationCategory {
  category_id: string;
  category_name: string;
  category_description: string | null;
  service_type_id: string;
  service_type_name: string;
  icon: string | null;
  color: string | null;
  image_url: string | null;
  sort_order: number;
  product_count: number;
  is_active: boolean;
}

/**
 * Service Area Summary
 */
export interface ServiceAreaSummary {
  service_area_id: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  is_serviceable: boolean;
  delivery_time_hours: number | null;
  delivery_charge: number | null;
  service_types: string[];
  total_services: number;
  total_categories: number;
  total_products: number;
}

/**
 * Hook to get service types available in a location
 * Only returns service types that have actual products available
 */
export function useLocationServiceTypes(serviceAreaId: string | null) {
  const [serviceTypes, setServiceTypes] = useState<LocationServiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchServiceTypes = useCallback(async () => {
    if (!serviceAreaId) {
      setServiceTypes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_service_types_by_area', {
        p_service_area_id: serviceAreaId,
      });

      if (rpcError) throw rpcError;

      setServiceTypes(data || []);
    } catch (err) {
      console.error('Error fetching location service types:', err);
      setError(err as Error);
      toast.error('Failed to load available services');
      setServiceTypes([]);
    } finally {
      setLoading(false);
    }
  }, [serviceAreaId]);

  useEffect(() => {
    fetchServiceTypes();
  }, [fetchServiceTypes]);

  return {
    serviceTypes,
    loading,
    error,
    refetch: fetchServiceTypes,
  };
}

/**
 * Hook to get categories available in a location
 * Optionally filter by service type
 */
export function useLocationCategories(
  serviceAreaId: string | null,
  serviceTypeId?: string | null
) {
  const [categories, setCategories] = useState<LocationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!serviceAreaId) {
      setCategories([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_categories_by_area', {
        p_service_area_id: serviceAreaId,
        p_service_type_id: serviceTypeId || null,
      });

      if (rpcError) throw rpcError;

      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching location categories:', err);
      setError(err as Error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [serviceAreaId, serviceTypeId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

/**
 * Hook to get service area summary with counts
 */
export function useServiceAreaSummary(serviceAreaId: string | null) {
  const [summary, setSummary] = useState<ServiceAreaSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!serviceAreaId) {
      setSummary(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_service_area_summary', {
        p_service_area_id: serviceAreaId,
      });

      if (rpcError) throw rpcError;

      setSummary(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error('Error fetching service area summary:', err);
      setError(err as Error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [serviceAreaId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}

/**
 * Hook to search serviceable areas
 */
export function useSearchServiceableAreas(searchTerm?: string, limit = 10) {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('search_serviceable_areas', {
        p_search_term: searchTerm || null,
        p_limit: limit,
      });

      if (rpcError) throw rpcError;

      setAreas(data || []);
    } catch (err) {
      console.error('Error searching serviceable areas:', err);
      setError(err as Error);
      setAreas([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, limit]);

  useEffect(() => {
    searchAreas();
  }, [searchAreas]);

  return {
    areas,
    loading,
    error,
    refetch: searchAreas,
  };
}

