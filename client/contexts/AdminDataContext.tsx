import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  category_id: string;
  vendor_id: string;
  sku: string | null;
  brand: string | null;
  tags: string[];
  status: string;
  image_url: string | null;
  created_at: string;
  vendor?: { id: string; name: string };
  category?: { id: string; name: string; service_type: string };
  variants?: any[];
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

// Cache state interface
interface CacheState {
  products: Product[];
  serviceAreas: ServiceArea[];
  serviceTypes: ServiceType[];
  categories: Category[];
  vendors: Vendor[];
  inventory: Product[];
}

// Loading state interface
interface LoadingState {
  products: boolean;
  serviceAreas: boolean;
  serviceTypes: boolean;
  categories: boolean;
  vendors: boolean;
  inventory: boolean;
}

// Context interface
interface AdminDataContextType {
  // Data
  products: Product[];
  serviceAreas: ServiceArea[];
  serviceTypes: ServiceType[];
  categories: Category[];
  vendors: Vendor[];
  inventory: Product[];
  
  // Loading states
  loading: LoadingState;
  
  // Refresh functions
  refreshProducts: () => Promise<void>;
  refreshServiceAreas: () => Promise<void>;
  refreshServiceTypes: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshVendors: () => Promise<void>;
  refreshInventory: () => Promise<void>;
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
  
  // Cache state
  const [cache, setCache] = useState<CacheState>({
    products: [],
    serviceAreas: [],
    serviceTypes: [],
    categories: [],
    vendors: [],
    inventory: [],
  });
  
  // Loading state
  const [loading, setLoading] = useState<LoadingState>({
    products: false,
    serviceAreas: false,
    serviceTypes: false,
    categories: false,
    vendors: false,
    inventory: false,
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
  const refreshProducts = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping product fetch');
      return;
    }
    
    if (loading.products) {
      console.log('Products already loading, skipping fetch');
      return;
    }
    
    try {
      updateLoadingState('products', true);
      console.log('🔄 Fetching products for admin...');
      
      let enhancedProducts: Product[] = [];
      
      // Try API endpoint first for admin users
      if (isAdminUser || user.email === 'hello.krsolutions@gmail.com') {
        try {
          const response = await authenticatedFetch("/api/admin/products?limit=1000&include=vendor");
          if (response.ok) {
            const apiData = await response.json();
            if (apiData.success && apiData.data?.products) {
              enhancedProducts = apiData.data.products.map((product: any) => ({
                ...product,
                vendor: product.vendors,
                category: product.categories
              }));
              console.log('✅ Got products from API:', enhancedProducts.length);
            }
          }
        } catch (apiError) {
          console.log('API failed, falling back to direct query:', apiError);
        }
      }
      
      // Fallback to direct Supabase query
      if (enhancedProducts.length === 0) {
        const { data: productsData, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        if (productsData && productsData.length > 0) {
          // Fetch vendors and categories to enhance products
          const [vendorsResult, categoriesResult] = await Promise.all([
            supabase.from("vendors").select("id, name"),
            supabase.from("categories").select("id, name, service_type")
          ]);
          
          const vendorMap = new Map(vendorsResult.data?.map(v => [v.id, v]) || []);
          const categoryMap = new Map(categoriesResult.data?.map(c => [c.id, c]) || []);
          
          enhancedProducts = productsData.map(product => ({
            ...product,
            vendor: product.vendor_id ? vendorMap.get(product.vendor_id) : null,
            category: product.category_id ? categoryMap.get(product.category_id) : null
          }));
          
          console.log('✅ Got products from direct query:', enhancedProducts.length);
        }
      }
      
      updateCache('products', enhancedProducts);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      updateLoadingState('products', false);
    }
  }, [isAuthenticated, user, isAdminUser, loading.products, updateLoadingState, updateCache]);
  
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
  
  // Inventory fetching (different from products - includes stock info)
  const refreshInventory = useCallback(async () => {
    if (loading.inventory) return;
    
    try {
      updateLoadingState('inventory', true);
      console.log('🔄 Fetching inventory...');
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .gte("stock_quantity", 0)
        .order("stock_quantity", { ascending: true });
      
      if (error) throw error;
      
      updateCache('inventory', data || []);
      console.log('✅ Got inventory:', data?.length || 0);
      
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
    } finally {
      updateLoadingState('inventory', false);
    }
  }, [loading.inventory, updateLoadingState, updateCache]);
  
  // Refresh all data
  const refreshAll = useCallback(async () => {
    console.log('🔄 Refreshing all admin data...');
    await Promise.all([
      refreshProducts(),
      refreshServiceAreas(),
      refreshServiceTypes(),
      refreshCategories(),
      refreshVendors(),
      refreshInventory(),
    ]);
    setIsDataLoaded(true);
    console.log('✅ All admin data refreshed!');
  }, [refreshProducts, refreshServiceAreas, refreshServiceTypes, refreshCategories, refreshVendors, refreshInventory]);
  
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
        debouncedUpdate('products', refreshProducts);
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
      products: productsChannel,
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
  }, [isAuthenticated, user, refreshProducts, refreshServiceAreas, refreshCategories, refreshServiceTypes, debouncedUpdate]);
  
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
      products: {
        count: cache.products.length,
        lastUpdated: lastUpdated.products,
        loading: loading.products,
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
      inventory: {
        count: cache.inventory.length,
        lastUpdated: lastUpdated.inventory,
        loading: loading.inventory,
      },
      isDataLoaded,
      totalItems: Object.values(cache).reduce((sum, arr) => sum + arr.length, 0),
    };
  }, [cache, lastUpdated, loading, isDataLoaded]);
  
  const contextValue: AdminDataContextType = {
    // Data from cache
    products: cache.products,
    serviceAreas: cache.serviceAreas,
    serviceTypes: cache.serviceTypes,
    categories: cache.categories,
    vendors: cache.vendors,
    inventory: cache.inventory,
    
    // Loading states
    loading,
    
    // Refresh functions
    refreshProducts,
    refreshServiceAreas,
    refreshServiceTypes,
    refreshCategories,
    refreshVendors,
    refreshInventory,
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
