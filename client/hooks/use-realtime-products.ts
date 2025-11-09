import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Product {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  rating: number | null;
  reviews_count: number;
  is_active: boolean;
  brand?: string;
  sku?: string;
  vendor_id?: string | null;
  category_id?: string | null;
  tags?: string[];
  status?: string;
  created_at?: string;
  stock_quantity?: number;
  categories: {
    name: string;
    service_type: string;
  } | null;
  category?: {
    name: string;
    service_type: string;
  } | null;
  vendor?: {
    id: string;
    name: string;
  } | null;
  variants?: any[];
}

export function useRealtimeProducts(serviceType?: string, limit?: number) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Initial fetch
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            service_type
          )
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false })

      if (serviceType) {
        query = query.eq('categories.service_type', serviceType)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data: initialProducts } = await query

      if (initialProducts) {
        setProducts(initialProducts)
      }
      setLoading(false)

      // Set up real-time subscription
      channel = supabase
        .channel('products-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          async (payload) => {
            console.log('Product change received:', payload)
            
            if (payload.eventType === 'INSERT') {
              // Fetch the complete product with category info
              const { data: newProduct } = await supabase
                .from('products')
                .select(`
                  *,
                  categories (
                    name,
                    service_type
                  )
                `)
                .eq('id', payload.new.id)
                .single()

              if (newProduct && newProduct.is_active) {
                // Check if it matches the service type filter
                if (!serviceType || newProduct.categories?.service_type === serviceType) {
                  setProducts(prev => [newProduct, ...prev.slice(0, (limit || 100) - 1)])
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              // Fetch the updated product with category info
              const { data: updatedProduct } = await supabase
                .from('products')
                .select(`
                  *,
                  categories (
                    name,
                    service_type
                  )
                `)
                .eq('id', payload.new.id)
                .single()

              if (updatedProduct) {
                if (updatedProduct.is_active && (!serviceType || updatedProduct.categories?.service_type === serviceType)) {
                  setProducts(prev => 
                    prev.map(product => 
                      product.id === updatedProduct.id ? updatedProduct : product
                    )
                  )
                } else {
                  // Remove if no longer active or doesn't match filter
                  setProducts(prev => 
                    prev.filter(product => product.id !== updatedProduct.id)
                  )
                }
              }
            } else if (payload.eventType === 'DELETE') {
              setProducts(prev => 
                prev.filter(product => product.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [serviceType, limit])

  return { products, loading }
}

export function useRealtimeCategories(serviceType?: string) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Initial fetch
      let query = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (serviceType) {
        query = query.eq('service_type', serviceType)
      }

      const { data: initialCategories } = await query

      if (initialCategories) {
        setCategories(initialCategories)
      }
      setLoading(false)

      // Set up real-time subscription
      channel = supabase
        .channel('categories-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'categories'
          },
          (payload) => {
            console.log('Category change received:', payload)
            
            if (payload.eventType === 'INSERT') {
              const newCategory = payload.new as any
              if (newCategory.is_active && (!serviceType || newCategory.service_type === serviceType)) {
                setCategories(prev => [...prev, newCategory].sort((a, b) => a.sort_order - b.sort_order))
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedCategory = payload.new as any
              if (updatedCategory.is_active && (!serviceType || updatedCategory.service_type === serviceType)) {
                setCategories(prev => 
                  prev.map(category => 
                    category.id === updatedCategory.id ? updatedCategory : category
                  ).sort((a, b) => a.sort_order - b.sort_order)
                )
              } else {
                setCategories(prev => 
                  prev.filter(category => category.id !== updatedCategory.id)
                )
              }
            } else if (payload.eventType === 'DELETE') {
              setCategories(prev => 
                prev.filter(category => category.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [serviceType])

  return { categories, loading }
}
