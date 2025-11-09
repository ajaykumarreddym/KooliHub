import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Hammer,
    Star,
    TrendingUp,
    Users,
    Wrench
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://nxipkmxbvdrwdtujjlyr.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aXBrbXhidmRyd2R0dWpqbHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMjk4MDUsImV4cCI6MjA3MDkwNTgwNX0.kAyJdrxXY9J2wxtzq5lgfl0HIfimkcEA7fyS1XtxmYA'
);

interface HandymanStats {
  totalProviders: number;
  activeBookings: number;
  completedJobs: number;
  averageRating: number;
  totalRevenue: number;
  emergencyRequests: number;
  skillCategories: number;
  customerSatisfaction: number;
}

interface ServiceProvider {
  id: string;
  name: string;
  skills: string[];
  rating: number;
  completedJobs: number;
  status: 'available' | 'busy' | 'offline';
  location: string;
}

interface RecentBooking {
  id: string;
  serviceName: string;
  customerName: string;
  providerName: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledTime: string;
  amount: number;
  urgency: 'normal' | 'urgent' | 'emergency';
}

export const HandymanDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<HandymanStats>({
    totalProviders: 0,
    activeBookings: 0,
    completedJobs: 0,
    averageRating: 0,
    totalRevenue: 0,
    emergencyRequests: 0,
    skillCategories: 0,
    customerSatisfaction: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [topProviders, setTopProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHandymanData();
  }, []);

  const loadHandymanData = async () => {
    try {
      setLoading(true);

      // Load handyman offerings
      const { data: handymanOfferings, error: offeringsError } = await supabase
        .from('offerings')
        .select('*')
        .eq('type', 'service')
        .eq('is_active', true);

      if (offeringsError) throw offeringsError;

      // Load service categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('service_type', 'handyman')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Load merchants (service providers)
      const { data: providers, error: providersError } = await supabase
        .from('merchants')
        .select('*')
        .eq('type', 'service_center')
        .eq('is_active', true);

      if (providersError) throw providersError;

      // Load recent orders for handyman services
      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items!inner(
            offering_id,
            offerings!inner(type, name)
          )
        `)
        .eq('order_items.offerings.type', 'service')
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      // Calculate stats
      const handymanStats: HandymanStats = {
        totalProviders: providers?.length || 0,
        activeBookings: recentOrders?.filter(o => 
          ['confirmed', 'processing'].includes(o.status)
        ).length || 0,
        completedJobs: recentOrders?.filter(o => o.status === 'delivered').length || 0,
        averageRating: 4.3, // This would come from a reviews table
        totalRevenue: recentOrders?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0,
        emergencyRequests: Math.floor(Math.random() * 5), // Mock emergency requests
        skillCategories: categories?.length || 0,
        customerSatisfaction: 4.1 // This would come from customer feedback
      };

      setStats(handymanStats);

      // Format recent bookings
      const bookings: RecentBooking[] = recentOrders?.map((order, index) => {
        const status: 'cancelled' | 'completed' | 'scheduled' | 'in_progress' = 
          order.status === 'delivered' ? 'completed' : 
          order.status === 'processing' ? 'in_progress' : 
          order.status === 'confirmed' ? 'scheduled' : 'cancelled';
        
        const urgency: 'normal' | 'urgent' | 'emergency' = 
          index < 2 ? 'urgent' : 'normal';
        
        return {
          id: order.id,
          serviceName: order.order_items?.[0]?.offerings?.name || 'Service',
          customerName: `Customer ${index + 1}`, // This would come from user profiles
          providerName: `Provider ${index + 1}`, // This would come from merchant data
          status,
          scheduledTime: order.created_at,
          amount: parseFloat(order.total_amount) || 0,
          urgency
        };
      }).slice(0, 5) || [];

      setRecentBookings(bookings);

      // Mock top providers data
      const mockProviders: ServiceProvider[] = providers?.slice(0, 5).map((provider, index) => ({
        id: provider.id,
        name: provider.name,
        skills: ['Plumbing', 'Electrical', 'Carpentry'].slice(0, Math.floor(Math.random() * 3) + 1),
        rating: 4.0 + Math.random() * 1,
        completedJobs: Math.floor(Math.random() * 100) + 50,
        status: ['available', 'busy', 'offline'][Math.floor(Math.random() * 3)] as any,
        location: provider.city || 'City'
      })) || [];

      setTopProviders(mockProviders);

    } catch (error) {
      console.error('Error loading handyman data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Service Providers',
      value: stats.totalProviders,
      icon: Users,
      description: 'Active handyman providers',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings,
      icon: Calendar,
      description: 'Scheduled and in-progress',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs,
      icon: CheckCircle,
      description: 'Successfully completed',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Emergency Requests',
      value: stats.emergencyRequests,
      icon: AlertCircle,
      description: 'Urgent service calls',
      change: '-5%',
      trend: 'down'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900">Home Services Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage handyman services, providers, and customer bookings</p>
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
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-orange-600" />
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
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="skills">Skills & Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Service Performance</CardTitle>
                <CardDescription>Key metrics for handyman services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Job Completion Rate</span>
                    <span>96%</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Customer Satisfaction</span>
                    <span>{stats.customerSatisfaction}/5.0</span>
                  </div>
                  <Progress value={stats.customerSatisfaction * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>On-Time Arrival</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Provider Utilization</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest service appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Hammer className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{booking.serviceName}</p>
                        <p className="text-xs text-gray-500">
                          {booking.customerName} • {new Date(booking.scheduledTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                        {booking.urgency !== 'normal' && (
                          <Badge className={getUrgencyColor(booking.urgency)}>
                            {booking.urgency}
                          </Badge>
                        )}
                        <p className="text-sm text-gray-900">
                          ${booking.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common handyman service management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Manage Providers
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Schedule Service
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Wrench className="h-6 w-6 mb-2" />
                  Skill Categories
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertCircle className="h-6 w-6 mb-2" />
                  Emergency Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Service Providers</CardTitle>
              <CardDescription>Manage handyman service providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{provider.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm ml-1">{provider.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-600">{provider.completedJobs} jobs</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-600">{provider.location}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {provider.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getProviderStatusColor(provider.status)}>
                        {provider.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Service Bookings Management</CardTitle>
              <CardDescription>Manage all service appointments and scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Booking management interface will be implemented here</p>
                <Button className="mt-4">Create New Booking</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Categories Management</CardTitle>
              <CardDescription>Manage service categories and provider skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Skills and categories management interface will be implemented here</p>
                <Button className="mt-4">Add New Skill Category</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
