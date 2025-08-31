import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// Re-export the vendors hook for convenience
export { useRealtimeVendors } from './use-realtime-vendors'

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Initial fetch
      const { data: initialOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (initialOrders) {
        setOrders(initialOrders)
      }
      setLoading(false)

      // Set up real-time subscription
      channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('Order change received:', payload)
            
            if (payload.eventType === 'INSERT') {
              setOrders(prev => [payload.new as any, ...prev.slice(0, 9)])
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => 
                prev.map(order => 
                  order.id === payload.new.id ? payload.new as any : order
                )
              )
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => 
                prev.filter(order => order.id !== payload.old.id)
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
  }, [])

  return { orders, loading }
}

export function useRealtimeStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    todayOrders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channels: RealtimeChannel[] = []

    const setupRealtimeSubscriptions = async () => {
      // Initial fetch
      const fetchStats = async () => {
        try {
          const [usersResult, ordersResult, todayOrdersResult, pendingOrdersResult] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('orders').select('id', { count: 'exact', head: true }),
            supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', new Date().toISOString().split('T')[0]),
            supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending')
          ])

          setStats({
            totalUsers: usersResult.count || 0,
            totalOrders: ordersResult.count || 0,
            todayOrders: todayOrdersResult.count || 0,
            pendingOrders: pendingOrdersResult.count || 0
          })
        } catch (error) {
          console.error('Error fetching stats:', error)
        } finally {
          setLoading(false)
        }
      }

      await fetchStats()

      // Set up real-time subscriptions for live updates
      const ordersChannel = supabase
        .channel('orders-stats')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          async () => {
            // Refetch stats when orders change
            await fetchStats()
          }
        )
        .subscribe()

      const profilesChannel = supabase
        .channel('profiles-stats')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'profiles'
          },
          async () => {
            // Refetch stats when new users register
            await fetchStats()
          }
        )
        .subscribe()

      channels = [ordersChannel, profilesChannel]
    }

    setupRealtimeSubscriptions()

    return () => {
      channels.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel)
        }
      })
    }
  }, [])

  return { stats, loading }
}

export function useRealtimeInventory() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Initial fetch
      const { data: initialProducts } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            service_type
          )
        `)
        .order('created_at', { ascending: false })

      if (initialProducts) {
        setProducts(initialProducts)
      }
      setLoading(false)

      // Set up real-time subscription
      channel = supabase
        .channel('products-changes')
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

              if (newProduct) {
                setProducts(prev => [newProduct, ...prev])
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
                setProducts(prev => 
                  prev.map(product => 
                    product.id === updatedProduct.id ? updatedProduct : product
                  )
                )
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
  }, [])

  return { products, loading }
}

export function useRealtimeServiceAreas() {
  const [areas, setAreas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Initial fetch
      const { data: initialAreas } = await supabase
        .from('serviceable_areas')
        .select('*')
        .order('created_at', { ascending: false })

      if (initialAreas) {
        setAreas(initialAreas)
      }
      setLoading(false)

      // Set up real-time subscription
      channel = supabase
        .channel('areas-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'serviceable_areas'
          },
          (payload) => {
            console.log('Service area change received:', payload)
            
            if (payload.eventType === 'INSERT') {
              setAreas(prev => [payload.new as any, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              setAreas(prev => 
                prev.map(area => 
                  area.id === payload.new.id ? payload.new as any : area
                )
              )
            } else if (payload.eventType === 'DELETE') {
              setAreas(prev => 
                prev.filter(area => area.id !== payload.old.id)
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
  }, [])

  return { areas, loading }
}
