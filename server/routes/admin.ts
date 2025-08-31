import { RequestHandler } from 'express'
import { supabase } from '../lib/supabase'

// Middleware to check admin access
export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Add user to request object for further use
    req.user = user
    next()
  } catch (error) {
    console.error('Admin auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

// Dashboard stats endpoint
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const [
      usersResult,
      productsResult,
      ordersResult,
      areasResult
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('serviceable_areas').select('id', { count: 'exact', head: true })
    ])

    const stats = {
      totalUsers: usersResult.count || 0,
      totalProducts: productsResult.count || 0,
      totalOrders: ordersResult.count || 0,
      serviceableAreas: areasResult.count || 0
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
}

// Analytics data endpoint
export const getAnalyticsData: RequestHandler = async (req, res) => {
  try {
    const { days = '7' } = req.query
    const daysCount = parseInt(days as string)
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - daysCount)

    // Fetch orders data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, status, created_at, service_type')
      .gte('created_at', startDate.toISOString())

    if (ordersError) throw ordersError

    // Process data for charts
    const orderTrends = new Map<string, { orders: number; revenue: number }>()
    const serviceStats = new Map<string, { orders: number; revenue: number }>()
    const statusStats = new Map<string, number>()

    orders?.forEach(order => {
      const date = order.created_at.split('T')[0]
      const serviceType = order.service_type || 'unknown'
      const status = order.status

      // Order trends
      if (!orderTrends.has(date)) {
        orderTrends.set(date, { orders: 0, revenue: 0 })
      }
      const trendData = orderTrends.get(date)!
      trendData.orders += 1
      trendData.revenue += order.total_amount

      // Service stats
      if (!serviceStats.has(serviceType)) {
        serviceStats.set(serviceType, { orders: 0, revenue: 0 })
      }
      const serviceData = serviceStats.get(serviceType)!
      serviceData.orders += 1
      serviceData.revenue += order.total_amount

      // Status stats
      statusStats.set(status, (statusStats.get(status) || 0) + 1)
    })

    const analytics = {
      trends: Array.from(orderTrends.entries()).map(([date, data]) => ({
        date,
        ...data
      })),
      services: Array.from(serviceStats.entries()).map(([service_type, data]) => ({
        service_type,
        ...data
      })),
      statuses: Array.from(statusStats.entries()).map(([status, count]) => ({
        status,
        count
      }))
    }

    res.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    res.status(500).json({ error: 'Failed to fetch analytics data' })
  }
}

// Bulk operations for products
export const bulkUpdateProducts: RequestHandler = async (req, res) => {
  try {
    const { operation, productIds, updateData } = req.body

    switch (operation) {
      case 'activate':
        await supabase
          .from('products')
          .update({ is_active: true })
          .in('id', productIds)
        break
      
      case 'deactivate':
        await supabase
          .from('products')
          .update({ is_active: false })
          .in('id', productIds)
        break
      
      case 'delete':
        await supabase
          .from('products')
          .delete()
          .in('id', productIds)
        break
      
      case 'update':
        await supabase
          .from('products')
          .update(updateData)
          .in('id', productIds)
        break
      
      default:
        return res.status(400).json({ error: 'Invalid operation' })
    }

    res.json({ success: true, message: `Bulk ${operation} completed` })
  } catch (error) {
    console.error('Error in bulk operation:', error)
    res.status(500).json({ error: 'Bulk operation failed' })
  }
}

// Export serviceable areas as CSV
export const exportServiceAreas: RequestHandler = async (req, res) => {
  try {
    const { data: areas, error } = await supabase
      .from('serviceable_areas')
      .select('*')
      .order('pincode')

    if (error) throw error

    // Convert to CSV format
    const csvHeader = 'Pincode,City,State,Country,Serviceable,ServiceTypes,DeliveryHours,DeliveryCharge\n'
    const csvRows = areas?.map(area => [
      area.pincode,
      area.city,
      area.state,
      area.country,
      area.is_serviceable,
      area.service_types.join(';'),
      area.delivery_time_hours || '',
      area.delivery_charge || ''
    ].join(','))

    const csvContent = csvHeader + csvRows?.join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=service-areas.csv')
    res.send(csvContent)
  } catch (error) {
    console.error('Error exporting service areas:', error)
    res.status(500).json({ error: 'Export failed' })
  }
}

// User management operations
export const updateUserRole: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!['admin', 'user', 'guest'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) throw error

    res.json({ success: true, message: 'User role updated successfully' })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({ error: 'Failed to update user role' })
  }
}

// Real-time notifications for admin
export const getRealtimeStats: RequestHandler = async (req, res) => {
  try {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    // Send initial data
    const sendStats = async () => {
      try {
        const [ordersResult, usersResult] = await Promise.all([
          supabase
            .from('orders')
            .select('id, status, created_at')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
        ])

        const stats = {
          todayOrders: ordersResult.data?.length || 0,
          pendingOrders: ordersResult.data?.filter(o => o.status === 'pending').length || 0,
          totalUsers: usersResult.count || 0,
          timestamp: new Date().toISOString()
        }

        res.write(`data: ${JSON.stringify(stats)}\n\n`)
      } catch (error) {
        console.error('Error sending real-time stats:', error)
      }
    }

    // Send stats immediately
    await sendStats()

    // Send stats every 30 seconds
    const interval = setInterval(sendStats, 30000)

    // Cleanup on connection close
    req.on('close', () => {
      clearInterval(interval)
    })

  } catch (error) {
    console.error('Error setting up real-time stats:', error)
    res.status(500).json({ error: 'Failed to set up real-time connection' })
  }
}
