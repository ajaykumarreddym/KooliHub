import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import {
    Activity,
    BarChart3,
    Car,
    MapPin,
    Package,
    Route,
    TrendingUp,
    Truck,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://nxipkmxbvdrwdtujjlyr.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXBrbXhidmRyd2R0dWpqbHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMjk4MDUsImV4cCI6MjA3MDkwNTgwNX0.kAyJdrxXY9J2wxtzq5lgfl0HIfimkcEA7fyS1XtxmYA'
);

interface TransportStats {
  totalRides: number;
  activeDrivers: number;
  completedDeliveries: number;
  vehiclesAvailable: number;
  averageRating: number;
  totalRevenue: number;
  todayBookings: number;
  pendingRequests: number;
}

interface RecentActivity {
  id: string;
  type: 'ride' | 'delivery' | 'rental';
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp: string;
  amount?: number;
}

export const TransportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TransportStats>({
    totalRides: 0,
    activeDrivers: 0,
    completedDeliveries: 0,
    vehiclesAvailable: 0,
    averageRating: 0,
    totalRevenue: 0,
    todayBookings: 0,
    pendingRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransportData();
  }, []);

  const loadTransportData = async () => {
    try {
      setLoading(true);

      // Load transport-related offerings
      const { data: transportOfferings, error: offeringsError } = await supabase
        .from('offerings')
        .select('*')
        .in('type', ['ride', 'delivery', 'rental'])
        .eq('is_active', true);

      if (offeringsError) throw offeringsError;

      // Load merchants for vehicle count
      const { data: merchants, error: merchantsError } = await supabase
        .from('merchants')
        .select('*')
        .eq('is_active', true);

      if (merchantsError) throw merchantsError;

      // Load recent orders for transport services
      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items!inner(
            offering_id,
            offerings!inner(type)
          )
        `)
        .in('order_items.offerings.type', ['ride', 'delivery', 'rental'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      // Calculate stats
      const transportStats: TransportStats = {
        totalRides: transportOfferings?.filter(o => o.type === 'ride').length || 0,
        activeDrivers: merchants?.filter(m => m.type === 'service_center').length || 0,
        completedDeliveries: recentOrders?.filter(o => 
          o.status === 'delivered' && 
          o.order_items?.some((item: any) => item.offerings?.type === 'delivery')
        ).length || 0,
        vehiclesAvailable: transportOfferings?.filter(o => o.type === 'rental').length || 0,
        averageRating: 4.2, // This would come from a reviews table
        totalRevenue: recentOrders?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0,
        todayBookings: recentOrders?.filter(o => {
          const orderDate = new Date(o.created_at);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        }).length || 0,
        pendingRequests: recentOrders?.filter(o => o.status === 'pending').length || 0
      };

      setStats(transportStats);

      // Format recent activity
      const activity: RecentActivity[] = recentOrders?.map(order => {
        const transportItem = order.order_items?.find((item: any) => 
          ['ride', 'delivery', 'rental'].includes(item.offerings?.type)
        );
        
        const status: 'pending' | 'completed' | 'in_progress' = 
          order.status === 'delivered' ? 'completed' : 
          order.status === 'processing' ? 'in_progress' : 'pending';
        
        return {
          id: order.id,
          type: transportItem?.offerings?.type || 'ride',
          description: `${order.status === 'delivered' ? 'Completed' : 'Processing'} ${transportItem?.offerings?.type || 'service'}`,
          status,
          timestamp: order.created_at,
          amount: parseFloat(order.total_amount) || 0
        };
      }).slice(0, 5) || [];

      setRecentActivity(activity);

    } catch (error) {
      console.error('Error loading transport data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Rides',
      value: stats.totalRides,
      icon: Car,
      description: 'Active ride services',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      icon: Users,
      description: 'Available drivers',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Deliveries Today',
      value: stats.completedDeliveries,
      icon: Truck,
      description: 'Completed deliveries',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Vehicles Available',
      value: stats.vehiclesAvailable,
      icon: Package,
      description: 'For rental services',
      change: '-2%',
      trend: 'down'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ride': return Car;
      case 'delivery': return Truck;
      case 'rental': return Package;
      default: return Activity;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transport & Mobility Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage all transportation services, deliveries, and vehicle rentals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rides">Rides</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="rental">Rentals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators for transport services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Service Completion Rate</span>
                    <span>94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Customer Satisfaction</span>
                    <span>4.2/5.0</span>
                  </div>
                  <Progress value={84} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>On-Time Performance</span>
                    <span>89%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Driver Utilization</span>
                    <span>76%</span>
                  </div>
                  <Progress value={76} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest transport service activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const TypeIcon = getTypeIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <TypeIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status.replace('_', ' ')}
                          </Badge>
                          {activity.amount && (
                            <p className="text-sm text-gray-900 mt-1">
                              ${activity.amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common transport management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Manage Drivers
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Route className="h-6 w-6 mb-2" />
                  Plan Routes
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <MapPin className="h-6 w-6 mb-2" />
                  Service Areas
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rides">
          <Card>
            <CardHeader>
              <CardTitle>Ride Services Management</CardTitle>
              <CardDescription>Manage taxi, auto, and ride-sharing services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Ride services management interface will be implemented here</p>
                <Button className="mt-4">Setup Ride Services</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Services Management</CardTitle>
              <CardDescription>Manage parcel delivery and courier services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Delivery services management interface will be implemented here</p>
                <Button className="mt-4">Setup Delivery Services</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rental">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Rental Management</CardTitle>
              <CardDescription>Manage car, bike, and equipment rentals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Vehicle rental management interface will be implemented here</p>
                <Button className="mt-4">Setup Rental Services</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
