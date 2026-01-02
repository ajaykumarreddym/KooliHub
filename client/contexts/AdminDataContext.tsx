import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Types - Updated for new schema
interface Offering {
  id: string;
  name: string;
  base_price: number;
  type: 'product' | 'service' | 'ride' | 'delivery' | 'booking' | 'rental' | 'subscription' | 'digital';
  status: 'draft' | 'pending_approval' | 'active' | 'inactive' | 'out_of_stock' | 'discontinued' | 'scheduled';
  is_active: boolean;
  category_id: string;
  vendor_id: string;
  slug: string | null;
  description: string | null;
  tags: string[];
  keywords: string[];
  primary_image_url: string | null;
  gallery_urls: string[];
  created_at: string;
  updated_at: string;
  vendor?: { id: string; name: string };
  category?: { id: string; name: string; service_type: string };
  custom_attributes?: any;
  metadata?: any;
}

interface ServiceArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  is_serviceable: boolean;
  service_types: string[];
  delivery_time_hours: number | null;
  delivery_charge: number | null;
  coordinates: any;
  created_at: string;
  updated_at: string;
}

interface ServiceType {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  features: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  service_type: string;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  status: string;
  is_active: boolean;
}

interface Merchant {
  id: string;
  tenant_id?: string;
  vendor_id?: string;
  name: string;
  slug?: string;
  type?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Cache state interface - Updated to match current database schema
interface CacheState {
  offerings: Offering[];
  serviceAreas: ServiceArea[];
  serviceTypes: ServiceType[];
  categories: Category[];
  vendors: Vendor[];
  merchants: Merchant[];
}

// Loading state interface - Updated to match current database schema
interface LoadingState {
  offerings: boolean;
  serviceAreas: boolean;
  serviceTypes: boolean;
  categories: boolean;
  vendors: boolean;
  merchants: boolean;
}

// Context interface - Updated to match current database schema
interface AdminDataContextType {
  // Data
  offerings: Offering[];
  products: Offering[]; // Keep for backward compatibility
  serviceAreas: ServiceArea[];
  serviceTypes: ServiceType[];
  categories: Category[];
  vendors: Vendor[];
  merchants: Merchant[];
  
  // Loading states
  loading: LoadingState;
  
  // Refresh functions
  refreshOfferings: () => Promise<void>;
  refreshProducts: () => Promise<void>; // Keep for backward compatibility
  refreshServiceAreas: () => Promise<void>;
  refreshServiceTypes: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshVendors: () => Promise<void>;
  refreshMerchants: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Cache utilities
  isDataLoaded: boolean;
  lastUpdated: Record<string, Date>;
  getCacheStats: () => Record<string, any>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const useAdminData = (): AdminDataContextType => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isAdminUser } = useAuth();
  
  // Cache state - Updated to match current database schema
  const [cache, setCache] = useState<CacheState>({
    offerings: [],
    serviceAreas: [],
    serviceTypes: [],
    categories: [],
    vendors: [],
    merchants: [],
  });
  
  // Loading state - Updated to match current database schema
  const [loading, setLoading] = useState<LoadingState>({
    offerings: false,
    serviceAreas: false,
    serviceTypes: false,
    categories: false,
    vendors: false,
    merchants: false,
  });
  
  // Track last updated times
  const [lastUpdated, setLastUpdated] = useState<Record<string, Date>>({});
  
  // Track if initial data has been loaded
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Real-time subscriptions references
  const subscriptionsRef = useRef<{ [key: string]: any }>({});
  
  // Debounce mechanism for rapid updates
  const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // Update loading state helper
  const updateLoadingState = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Update cache helper
  const updateCache = useCallback((key: keyof CacheState, data: any[]) => {
    setCache(prev => ({ ...prev, [key]: data }));
    setLastUpdated(prev => ({ ...prev, [key]: new Date() }));
  }, []);
  
  // Debounced update helper
  const debouncedUpdate = useCallback((key: string, updateFn: () => void, delay = 500) => {
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }
    debounceTimersRef.current[key] = setTimeout(() => {
      updateFn();
      delete debounceTimersRef.current[key];
    }, delay);
  }, []);
  
  // Products fetching
  const refreshOfferings = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping offerings fetch');
      return;
    }
    
    if (loading.offerings) {
      console.log('Offerings already loading, skipping fetch');
      return;
    }
    
    try {
      updateLoadingState('offerings', true);
      console.log('🔄 Fetching offerings for admin...');
      
      let enhancedOfferings: Offering[] = [];
      
      // Try API endpoint first for admin users
      if (isAdminUser || user.email === 'hello.krsolutions@gmail.com') {
        try {
          const response = await authenticatedFetch("/api/admin/offerings?limit=1000&include=vendor,category");
          if (response.ok) {
            const apiData = await response.json();
            if (apiData.success && apiData.data?.offerings) {
              enhancedOfferings = apiData.data.offerings.map((offering: any) => ({
                ...offering,
                vendor: offering.vendors,
                category: offering.categories
              }));
              console.log('✅ Got offerings from API:', enhancedOfferings.length);
            }
          }
        } catch (apiError) {
          console.log('API failed, falling back to direct query:', apiError);
        }
      }
      
      // Fallback to direct Supabase query
      if (enhancedOfferings.length === 0) {
        const { data: offeringsData, error } = await supabase
          .from("offerings")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        if (offeringsData && offeringsData.length > 0) {
          // Fetch vendors and categories to enhance offerings
          const [vendorsResult, categoriesResult] = await Promise.all([
            supabase.from("vendors").select("id, name").is("deleted_at", null),
            supabase.from("categories").select("id, name, service_type").eq("is_active", true)
          ]);
          
          const vendorMap = new Map(vendorsResult.data?.map(v => [v.id, v]) || []);
          const categoryMap = new Map(categoriesResult.data?.map(c => [c.id, c]) || []);
          
          enhancedOfferings = offeringsData.map(offering => ({
            ...offering,
            vendor: offering.vendor_id ? vendorMap.get(offering.vendor_id) : null,
            category: offering.category_id ? categoryMap.get(offering.category_id) : null
          }));
          
          console.log('✅ Got offerings from direct query:', enhancedOfferings.length);
        }
      }
      
      updateCache('offerings', enhancedOfferings);
      
    } catch (error) {
      console.error('❌ Error fetching offerings:', error);
      toast({
        title: "Error",
        description: "Failed to load offerings. Please try again.",
        variant: "destructive",
      });
    } finally {
      updateLoadingState('offerings', false);
    }
  }, [isAuthenticated, user, isAdminUser, loading.offerings, updateLoadingState, updateCache]);
  
  // Service Areas fetching
  const refreshServiceAreas = useCallback(async () => {
    if (loading.serviceAreas) return;
    
    try {
      updateLoadingState('serviceAreas', true);
      console.log('🔄 Fetching service areas...');
      
      const { data, error } = await supabase
        .from("serviceable_areas")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      updateCache('serviceAreas', data || []);
      console.log('✅ Got service areas:', data?.length || 0);
      
    } catch (error) {
      console.error('❌ Error fetching service areas:', error);
      toast({
        title: "Error",
        description: "Failed to load service areas.",
        variant: "destructive",
      });
    } finally {
      updateLoadingState('serviceAreas', false);
    }
  }, [loading.serviceAreas, updateLoadingState, updateCache]);
  
  // Service Types fetching
  const refreshServiceTypes = useCallback(async () => {
    if (loading.serviceTypes) return;
    
    try {
      updateLoadingState('serviceTypes', true);
      console.log('🔄 Fetching service types...');
      
      const { data, error } = await supabase
        .from("service_types")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      
      updateCache('serviceTypes', data || []);
      console.log('✅ Got service types:', data?.length || 0);
      
    } catch (error) {
      console.error('❌ Error fetching service types:', error);
    } finally {
      updateLoadingState('serviceTypes', false);
    }
  }, [loading.serviceTypes, updateLoadingState, updateCache]);
  
  // Categories fetching
  const refreshCategories = useCallback(async () => {
    if (loading.categories) return;
    
    try {
      updateLoadingState('categories', true);
      console.log('🔄 Fetching categories...');
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("service_type", { ascending: true })
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      
      updateCache('categories', data || []);
      console.log('✅ Got categories:', data?.length || 0);
      
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    } finally {
      updateLoadingState('categories', false);
    }
  }, [loading.categories, updateLoadingState, updateCache]);
  
  // Vendors fetching
  const refreshVendors = useCallback(async () => {
    if (loading.vendors) return;
    
    try {
      updateLoadingState('vendors', true);
      console.log('🔄 Fetching vendors...');
      
      const response = await authenticatedFetch("/api/admin/vendors");
      if (response.ok) {
        const data = await response.json();
        updateCache('vendors', data.vendors || []);
        console.log('✅ Got vendors:', data.vendors?.length || 0);
      }
      
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
    } finally {
      updateLoadingState('vendors', false);
    }
  }, [loading.vendors, updateLoadingState, updateCache]);
  
  // Merchants fetching (physical locations/outlets for vendors)
  const refreshMerchants = useCallback(async () => {
    if (loading.merchants) return;
    
    try {
      updateLoadingState('merchants', true);
      console.log('🔄 Fetching merchants...');
      
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      updateCache('merchants', data || []);
      console.log('✅ Got merchants:', data?.length || 0);
      
    } catch (error) {
      console.error('❌ Error fetching merchants:', error);
    } finally {
      updateLoadingState('merchants', false);
    }
  }, [loading.merchants, updateLoadingState, updateCache]);
  
  // Refresh all data
  const refreshAll = useCallback(async () => {
    console.log('🔄 Refreshing all admin data...');
    await Promise.all([
      refreshOfferings(),
      refreshServiceAreas(),
      refreshServiceTypes(),
      refreshCategories(),
      refreshVendors(),
      refreshMerchants(),
    ]);
    setIsDataLoaded(true);
    console.log('✅ All admin data refreshed!');
  }, [refreshOfferings, refreshServiceAreas, refreshServiceTypes, refreshCategories, refreshVendors, refreshMerchants]);
  
  // Backward compatibility function
  const refreshProducts = useCallback(async () => {
    return refreshOfferings();
  }, [refreshOfferings]);
  
  // Setup real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    console.log('🔗 Setting up real-time subscriptions...');
    
    // Products subscription
    const productsChannel = supabase
      .channel('admin-products-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products'
      }, (payload) => {
        console.log('📦 Product change:', payload.eventType);
        debouncedUpdate('offerings', refreshOfferings);
      })
      .subscribe();
    
    // Service Areas subscription
    const areasChannel = supabase
      .channel('admin-areas-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'serviceable_areas'
      }, (payload) => {
        console.log('📍 Service area change:', payload.eventType);
        debouncedUpdate('serviceAreas', refreshServiceAreas);
      })
      .subscribe();
    
    // Categories subscription
    const categoriesChannel = supabase
      .channel('admin-categories-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories'
      }, (payload) => {
        console.log('🏷️ Category change:', payload.eventType);
        debouncedUpdate('categories', refreshCategories);
      })
      .subscribe();
    
    // Service Types subscription
    const serviceTypesChannel = supabase
      .channel('admin-service-types-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_types'
      }, (payload) => {
        console.log('⚙️ Service type change:', payload.eventType);
        debouncedUpdate('serviceTypes', refreshServiceTypes);
      })
      .subscribe();
    
    // Store subscription references
    subscriptionsRef.current = {
      offerings: productsChannel,
      areas: areasChannel,
      categories: categoriesChannel,
      serviceTypes: serviceTypesChannel,
    };
    
    return () => {
      console.log('🔌 Cleaning up real-time subscriptions...');
      Object.values(subscriptionsRef.current).forEach(channel => {
        supabase.removeChannel(channel);
      });
      subscriptionsRef.current = {};
      
      // Clear debounce timers
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
      debounceTimersRef.current = {};
    };
  }, [isAuthenticated, user, refreshOfferings, refreshServiceAreas, refreshCategories, refreshServiceTypes, debouncedUpdate]);
  
  // Initial data loading
  useEffect(() => {
    if (isAuthenticated && user && !isDataLoaded) {
      console.log('👤 User authenticated, loading initial admin data...');
      refreshAll();
    }
  }, [isAuthenticated, user, isDataLoaded, refreshAll]);
  
  // Cache stats utility
  const getCacheStats = useCallback(() => {
    return {
      offerings: {
        count: cache.offerings.length,
        lastUpdated: lastUpdated.offerings,
        loading: loading.offerings,
      },
      serviceAreas: {
        count: cache.serviceAreas.length,
        lastUpdated: lastUpdated.serviceAreas,
        loading: loading.serviceAreas,
      },
      serviceTypes: {
        count: cache.serviceTypes.length,
        lastUpdated: lastUpdated.serviceTypes,
        loading: loading.serviceTypes,
      },
      categories: {
        count: cache.categories.length,
        lastUpdated: lastUpdated.categories,
        loading: loading.categories,
      },
      vendors: {
        count: cache.vendors.length,
        lastUpdated: lastUpdated.vendors,
        loading: loading.vendors,
      },
      merchants: {
        count: cache.merchants.length,
        lastUpdated: lastUpdated.merchants,
        loading: loading.merchants,
      },
      isDataLoaded,
      totalItems: Object.values(cache).reduce((sum, arr) => sum + arr.length, 0),
    };
  }, [cache, lastUpdated, loading, isDataLoaded]);

  const contextValue: AdminDataContextType = {
    // Data from cache
    offerings: cache.offerings,
    products: cache.offerings, // Backward compatibility
    serviceAreas: cache.serviceAreas,
    serviceTypes: cache.serviceTypes,
    categories: cache.categories,
    vendors: cache.vendors,
    merchants: cache.merchants,
    
    // Loading states
    loading,
    
    // Refresh functions
    refreshOfferings,
    refreshProducts, // Backward compatibility
    refreshServiceAreas,
    refreshServiceTypes,
    refreshCategories,
    refreshVendors,
    refreshMerchants,
    refreshAll,
    
    // Cache utilities
    isDataLoaded,
    lastUpdated,
    getCacheStats,
  };
  
  return (
    <AdminDataContext.Provider value={contextValue}>
      {children}
    </AdminDataContext.Provider>
  );
};
