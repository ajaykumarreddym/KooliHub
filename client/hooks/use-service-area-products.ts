import { toast } from '@/hooks/use-toast';
import { handleError } from '@/lib/error-utils';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

interface ServiceAreaProduct {
  id: string;
  name: string;
  base_price: number;
  location_price: number | null;
  location_stock: number | null;
  is_available: boolean;
  is_featured: boolean;
  type: string;
  status: string;
  primary_image_url: string | null;
  category_name: string | null;
  service_type: string | null;
  delivery_time_hours: number | null;
}

interface UseServiceAreaProductsOptions {
  serviceAreaId: string | null;
  serviceType?: string | null;
  categoryId?: string | null;
  searchTerm?: string | null;
  limit?: number;
  offset?: number;
}

interface UseServiceAreaProductsReturn {
  products: ServiceAreaProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalCount: number;
}

/**
 * Hook to fetch and manage products for a specific service area
 * Uses the get_products_by_service_area database function for optimized querying
 */
export function useServiceAreaProducts(
  options: UseServiceAreaProductsOptions
): UseServiceAreaProductsReturn {
  const [products, setProducts] = useState<ServiceAreaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const {
    serviceAreaId,
    serviceType = null,
    categoryId = null,
    searchTerm = null,
    limit = 50,
    offset = 0,
  } = options;

  const fetchProducts = useCallback(async () => {
    if (!serviceAreaId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the database function for optimized querying
      const { data, error: fetchError } = await supabase.rpc(
        'get_products_by_service_area',
        {
          p_service_area_id: serviceAreaId,
          p_service_type: serviceType,
          p_category_id: categoryId,
          p_search_term: searchTerm,
          p_limit: limit,
          p_offset: offset,
        }
      );

      if (fetchError) throw fetchError;

      setProducts(data || []);
      setTotalCount(data?.length || 0);
    } catch (err) {
      const errorMessage = handleError(err, 'Fetching service area products');
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [serviceAreaId, serviceType, categoryId, searchTerm, limit, offset]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    totalCount,
  };
}

/**
 * Hook to check if a product is available in a specific pincode
 */
export function useProductAvailabilityByPincode(
  productId: string | null,
  pincode: string | null
) {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!productId || !pincode) {
      setIsAvailable(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: checkError } = await supabase.rpc(
        'is_product_available_in_pincode',
        {
          p_offering_id: productId,
          p_pincode: pincode,
        }
      );

      if (checkError) throw checkError;

      setIsAvailable(data || false);
    } catch (err) {
      const errorMessage = handleError(err, 'Checking product availability');
      setError(errorMessage);
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [productId, pincode]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    isAvailable,
    loading,
    error,
    recheckAvailability: checkAvailability,
  };
}

/**
 * Hook to get service area summary statistics
 */
export function useServiceAreaSummary() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('service_area_product_summary')
          .select('*')
          .order('city');

        if (fetchError) throw fetchError;

        setSummaries(data || []);
      } catch (err) {
        const errorMessage = handleError(err, 'Fetching service area summaries');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  return {
    summaries,
    loading,
    error,
  };
}

/**
 * Hook for bulk product assignment operations
 */
export function useBulkProductAssignment() {
  const [loading, setLoading] = useState(false);

  const assignProducts = async (
    serviceAreaId: string,
    productIds: string[],
    userId?: string
  ) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        'bulk_assign_products_to_service_area',
        {
          p_service_area_id: serviceAreaId,
          p_offering_ids: productIds,
          p_user_id: userId || null,
        }
      );

      if (error) throw error;

      toast({
        title: 'Success',
        description: data[0]?.message || 'Products assigned successfully',
      });

      return data;
    } catch (err) {
      const errorMessage = handleError(err, 'Assigning products');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignProducts,
    loading,
  };
}

