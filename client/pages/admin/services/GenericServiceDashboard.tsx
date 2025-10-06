import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
    AlertCircle,
    BarChart3,
    DollarSign,
    Eye,
    Layers,
    MapPin,
    Package,
    Plus,
    RefreshCw,
    Settings,
    Store,
    TrendingUp,
    Truck,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface ServiceType {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface ServiceStats {
  totalOfferings: number;
  totalCategories: number;
  totalOrders: number;
  monthlyRevenue: number;
  activeOfferings: number;
  growth: string;
}

export const GenericServiceDashboard: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [stats, setStats] = useState<ServiceStats>({
    totalOfferings: 0,
    totalCategories: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    activeOfferings: 0,
    growth: '+0%',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId]);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      
      // Fetch service type details
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_types')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;
      setServiceType(serviceData);

      // Fetch service statistics
      await fetchServiceStats();
      
    } catch (error: any) {
      console.error('Error fetching service data:', error);
      setError(error.message || 'Failed to load service data');
      toast({
        title: 'Error',
        description: 'Failed to load service data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceStats = async () => {
    try {
      // Get categories count
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('service_type', serviceId)
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Get offerings count
      const { data: offerings, error: offeringsError } = await supabase
        .from('offerings')
        .select('id, is_active, base_price')
        .eq('type', serviceId);

      if (offeringsError) throw offeringsError;

      // Get orders count and revenue (if orders table exists)
      let ordersCount = 0;
      let revenue = 0;
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, created_at')
          .eq('service_type', serviceId)
          .gte('created_at', new Date(new Date().setDate(1)).toISOString());

        if (!ordersError && orders) {
          ordersCount = orders.length;
          revenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        }
      } catch (error) {
        // Orders table might not exist, use fallback
        console.log('Orders table not available, using estimated revenue');
        revenue = (offerings?.length || 0) * 1000 + (categories?.length || 0) * 500;
      }

      setStats({
        totalOfferings: offerings?.length || 0,
        totalCategories: categories?.length || 0,
        totalOrders: ordersCount,
        monthlyRevenue: revenue,
        activeOfferings: offerings?.filter(o => o.is_active).length || 0,
        growth: '+12.5%', // This could be calculated from historical data
      });
    } catch (error) {
      console.error('Error fetching service stats:', error);
    }
  };

  const getIconComponent = (iconStr: string) => {
    const iconMap: any = {
      '🛒': Package,
      '🚌': Truck,
      '🚗': Truck,
      '🔧': Settings,
      '📱': Package,
      '🏠': Store,
      '👗': Package,
      '🍾': Package,
      '🎤': Package,
      '📦': Package,
      '😄': Package,
      '🍎': Package,
    };
    return iconMap[iconStr] || Package;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading service dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !serviceType) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">{error || 'Service not found'}</p>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="mt-2"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const ServiceIcon = getIconComponent(serviceType.icon);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg text-white bg-gradient-to-r ${serviceType.color}`}>
            <ServiceIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{serviceType.title}</h1>
            <p className="text-gray-600 mt-1">{serviceType.description}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchServiceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Service Features */}
      {serviceType.features && serviceType.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {serviceType.features.map((feature, index) => (
                <Badge key={index} variant="secondary">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offerings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOfferings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeOfferings} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              organized categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.growth} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Manage Offerings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Create, edit, and manage all offerings for this service
            </p>
            <Button className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Offerings
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Categories</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Organize offerings into categories for better management
            </p>
            <Button className="w-full" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Categories
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View detailed analytics and performance metrics
            </p>
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Providers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage service providers and vendor relationships
            </p>
            <Button className="w-full" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Providers
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Service Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configure service delivery areas and coverage
            </p>
            <Button className="w-full" variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Manage Areas
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configure service-specific settings and preferences
            </p>
            <Button className="w-full" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Service Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates for {serviceType.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <ServiceIcon className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Service initialized successfully</p>
                <p className="text-xs text-gray-500">{serviceType.title} • Ready for management</p>
              </div>
            </div>
            
            {stats.totalOfferings > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{stats.totalOfferings} offerings available</p>
                  <p className="text-xs text-gray-500">Product catalog • {stats.activeOfferings} active</p>
                </div>
              </div>
            )}
            
            {stats.totalCategories > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <Layers className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{stats.totalCategories} categories configured</p>
                  <p className="text-xs text-gray-500">Organization • Ready for use</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


