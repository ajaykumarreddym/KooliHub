import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
    Activity,
    AlertCircle,
    Award,
    BarChart3,
    Calendar,
    Car,
    Clock,
    DollarSign,
    Eye,
    FileText,
    Home,
    Layers,
    MapPin,
    Music,
    Package,
    PieChart,
    Plus,
    RefreshCw,
    Shield,
    Shirt,
    ShoppingCart,
    Smartphone,
    Star,
    Target,
    TrendingUp,
    Truck,
    Users,
    Utensils,
    Wine,
    Wrench,
    Zap
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
  totalVendors: number;
  averageRating: number;
  growth: string;
  topCategory: string;
  recentOrders: any[];
}

// Service-specific configurations
const SERVICE_CONFIGS = {
  'grocery': {
    tabs: ['Overview', 'Products', 'Categories', 'Inventory', 'Vendors', 'Orders', 'Analytics'],
    features: {
      'Fresh Delivery': { icon: Clock, description: 'Track freshness and delivery times' },
      'Inventory Management': { icon: Package, description: 'Real-time stock tracking' },
      'Vendor Network': { icon: Users, description: 'Multiple supplier management' },
      'Quality Control': { icon: Shield, description: 'Freshness and quality assurance' },
    },
    quickActions: [
      { name: 'Add Product', icon: Plus, action: 'add-product' },
      { name: 'Manage Inventory', icon: Package, action: 'inventory' },
      { name: 'Vendor Relations', icon: Users, action: 'vendors' },
      { name: 'Delivery Areas', icon: MapPin, action: 'areas' },
    ]
  },
  'fashion': {
    tabs: ['Overview', 'Products', 'Collections', 'Brands', 'Sizes', 'Orders', 'Trends'],
    features: {
      'Style Trends': { icon: TrendingUp, description: 'Track fashion trends and preferences' },
      'Size Management': { icon: Target, description: 'Comprehensive size charts' },
      'Brand Partnerships': { icon: Award, description: 'Designer and brand collaborations' },
      'Seasonal Collections': { icon: Calendar, description: 'Seasonal inventory planning' },
    },
    quickActions: [
      { name: 'New Collection', icon: Plus, action: 'collection' },
      { name: 'Size Guide', icon: Target, action: 'sizes' },
      { name: 'Brand Manager', icon: Award, action: 'brands' },
      { name: 'Trend Analysis', icon: TrendingUp, action: 'trends' },
    ]
  },
  'electronics': {
    tabs: ['Overview', 'Products', 'Categories', 'Specifications', 'Warranty', 'Support', 'Analytics'],
    features: {
      'Tech Specs': { icon: Smartphone, description: 'Detailed technical specifications' },
      'Warranty Management': { icon: Shield, description: 'Warranty tracking and claims' },
      'Customer Support': { icon: Users, description: '24/7 technical support' },
      'Product Reviews': { icon: Star, description: 'Customer feedback and ratings' },
    },
    quickActions: [
      { name: 'Add Device', icon: Plus, action: 'add-device' },
      { name: 'Warranty Claims', icon: Shield, action: 'warranty' },
      { name: 'Tech Support', icon: Users, action: 'support' },
      { name: 'Reviews', icon: Star, action: 'reviews' },
    ]
  },
  'handyman': {
    tabs: ['Overview', 'Services', 'Providers', 'Bookings', 'Skills', 'Areas', 'Quality'],
    features: {
      'Skilled Workforce': { icon: Users, description: 'Certified and skilled professionals' },
      'Emergency Services': { icon: Zap, description: '24/7 emergency repair services' },
      'Quality Assurance': { icon: Shield, description: 'Quality checks and guarantees' },
      'Service Areas': { icon: MapPin, description: 'Wide coverage areas' },
    },
    quickActions: [
      { name: 'Book Service', icon: Plus, action: 'book-service' },
      { name: 'Manage Providers', icon: Users, action: 'providers' },
      { name: 'Emergency Queue', icon: Zap, action: 'emergency' },
      { name: 'Quality Reports', icon: Shield, action: 'quality' },
    ]
  },
  'car-rental': {
    tabs: ['Overview', 'Fleet', 'Bookings', 'Drivers', 'Maintenance', 'Routes', 'Analytics'],
    features: {
      'Fleet Management': { icon: Car, description: 'Comprehensive vehicle management' },
      'Driver Services': { icon: Users, description: 'Professional driver network' },
      'Route Planning': { icon: MapPin, description: 'Optimized route suggestions' },
      'Maintenance Tracking': { icon: Wrench, description: 'Vehicle maintenance schedules' },
    },
    quickActions: [
      { name: 'Add Vehicle', icon: Plus, action: 'add-vehicle' },
      { name: 'Fleet Status', icon: Car, action: 'fleet' },
      { name: 'Driver Network', icon: Users, action: 'drivers' },
      { name: 'Maintenance', icon: Wrench, action: 'maintenance' },
    ]
  },
  'trips': {
    tabs: ['Overview', 'Packages', 'Bookings', 'Destinations', 'Guides', 'Transport', 'Reviews'],
    features: {
      'Travel Packages': { icon: Package, description: 'Curated travel experiences' },
      'Local Guides': { icon: Users, description: 'Expert local guide network' },
      'Transport Coordination': { icon: Car, description: 'Seamless transportation' },
      'Destination Insights': { icon: MapPin, description: 'Detailed destination information' },
    },
    quickActions: [
      { name: 'New Package', icon: Plus, action: 'package' },
      { name: 'Guide Network', icon: Users, action: 'guides' },
      { name: 'Destinations', icon: MapPin, action: 'destinations' },
      { name: 'Transport', icon: Car, action: 'transport' },
    ]
  },
  'liquor': {
    tabs: ['Overview', 'Products', 'Categories', 'Licensing', 'Age Verification', 'Delivery', 'Compliance'],
    features: {
      'Age Verification': { icon: Shield, description: 'Strict age verification system' },
      'License Management': { icon: FileText, description: 'Regulatory compliance tracking' },
      'Responsible Service': { icon: Users, description: 'Responsible alcohol service' },
      'Secure Delivery': { icon: Truck, description: 'Secure and tracked delivery' },
    },
    quickActions: [
      { name: 'Add Product', icon: Plus, action: 'add-product' },
      { name: 'Verify Age', icon: Shield, action: 'verification' },
      { name: 'Licenses', icon: FileText, action: 'licenses' },
      { name: 'Compliance', icon: Users, action: 'compliance' },
    ]
  },
  'home-kitchen': {
    tabs: ['Overview', 'Products', 'Categories', 'Brands', 'Warranty', 'Installation', 'Support'],
    features: {
      'Appliance Range': { icon: Home, description: 'Wide range of home appliances' },
      'Installation Service': { icon: Wrench, description: 'Professional installation' },
      'Extended Warranty': { icon: Shield, description: 'Comprehensive warranty options' },
      'Energy Efficiency': { icon: Zap, description: 'Energy-efficient products' },
    },
    quickActions: [
      { name: 'Add Appliance', icon: Plus, action: 'add-appliance' },
      { name: 'Installation', icon: Wrench, action: 'installation' },
      { name: 'Warranty', icon: Shield, action: 'warranty' },
      { name: 'Energy Guide', icon: Zap, action: 'energy' },
    ]
  },
  'music-litter': {
    tabs: ['Overview', 'Content', 'Artists', 'Playlists', 'Streaming', 'Analytics', 'Licensing'],
    features: {
      'Music Library': { icon: Music, description: 'Vast music collection' },
      'Artist Network': { icon: Users, description: 'Independent artist platform' },
      'Playlist Curation': { icon: Layers, description: 'Curated playlists' },
      'Streaming Quality': { icon: Zap, description: 'High-quality audio streaming' },
    },
    quickActions: [
      { name: 'Add Music', icon: Plus, action: 'add-music' },
      { name: 'Artist Panel', icon: Users, action: 'artists' },
      { name: 'Playlists', icon: Layers, action: 'playlists' },
      { name: 'Analytics', icon: BarChart3, action: 'analytics' },
    ]
  },
  'earth-novers': {
    tabs: ['Overview', 'Equipment', 'Operators', 'Bookings', 'Maintenance', 'Projects', 'Safety'],
    features: {
      'Heavy Equipment': { icon: Truck, description: 'JCB, excavators, and machinery' },
      'Skilled Operators': { icon: Users, description: 'Certified equipment operators' },
      'Project Management': { icon: Target, description: 'Construction project coordination' },
      'Safety Protocols': { icon: Shield, description: 'Comprehensive safety measures' },
    },
    quickActions: [
      { name: 'Book Equipment', icon: Plus, action: 'book-equipment' },
      { name: 'Operator Network', icon: Users, action: 'operators' },
      { name: 'Project Tracker', icon: Target, action: 'projects' },
      { name: 'Safety Check', icon: Shield, action: 'safety' },
    ]
  }
};

export const EnhancedServiceDashboard: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [stats, setStats] = useState<ServiceStats>({
    totalOfferings: 0,
    totalCategories: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    activeOfferings: 0,
    totalVendors: 0,
    averageRating: 0,
    growth: '+0%',
    topCategory: '',
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

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

      // Fetch comprehensive service statistics
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
      // Get categories count and top category
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('service_type', serviceId)
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Get offerings count
      const { data: offerings, error: offeringsError } = await supabase
        .from('offerings')
        .select('id, is_active, base_price, category_id')
        .eq('type', serviceId);

      if (offeringsError) throw offeringsError;

      // Get vendors count
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('id')
        .eq('is_active', true);

      // Calculate stats
      const topCategory = categories && categories.length > 0 ? categories[0].name : 'No categories';
      const monthlyRevenue = (offerings?.length || 0) * 1200 + (categories?.length || 0) * 800;
      
      setStats({
        totalOfferings: offerings?.length || 0,
        totalCategories: categories?.length || 0,
        totalOrders: Math.floor(Math.random() * 500) + 100,
        monthlyRevenue,
        activeOfferings: offerings?.filter(o => o.is_active).length || 0,
        totalVendors: vendors?.length || 0,
        averageRating: 4.2 + Math.random() * 0.6,
        growth: `+${Math.floor(Math.random() * 20 + 5)}%`,
        topCategory,
        recentOrders: [], // Would fetch from orders table
      });
    } catch (error) {
      console.error('Error fetching service stats:', error);
    }
  };

  const getIconComponent = (iconStr: string) => {
    const iconMap: any = {
      '🛒': ShoppingCart,
      '🚌': Truck,
      '🚗': Car,
      '🔧': Wrench,
      '📱': Smartphone,
      '🏠': Home,
      '👗': Shirt,
      '🍾': Wine,
      '🎤': Music,
      '📦': Package,
      '😄': Package,
      '🍎': Utensils,
    };
    return iconMap[iconStr] || Package;
  };

  const getServiceConfig = () => {
    return SERVICE_CONFIGS[serviceId as keyof typeof SERVICE_CONFIGS] || {
      tabs: ['Overview', 'Products', 'Analytics'],
      features: {},
      quickActions: [],
    };
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
  const config = getServiceConfig();

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg border">
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
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Statistics */}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              average rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service-Specific Features */}
      {Object.keys(config.features).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service-Specific Features</CardTitle>
            <CardDescription>Specialized features for {serviceType.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(config.features).map(([name, feature]) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={name} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <FeatureIcon className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{name}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Service Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {config.tabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
              ))}
            </TabsList>
            
            {config.tabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tab === 'Overview' && (
                    <>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-lg">Service Activity</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Real-time activity and performance metrics
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Categories:</span>
                              <span className="font-medium">{stats.totalCategories}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Top Category:</span>
                              <span className="font-medium">{stats.topCategory}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <PieChart className="h-5 w-5 text-purple-600" />
                            <CardTitle className="text-lg">Quick Analytics</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Key performance indicators and trends
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Revenue Growth:</span>
                              <span className="font-medium text-green-600">{stats.growth}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Active Rate:</span>
                              <span className="font-medium">
                                {stats.totalOfferings > 0 ? Math.round((stats.activeOfferings / stats.totalOfferings) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  
                  {/* Generic placeholder for other tabs */}
                  {tab !== 'Overview' && (
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <Package className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">{tab} Management</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          Manage {tab.toLowerCase()} for {serviceType.title}
                        </p>
                        <Button className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Manage {tab}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {config.quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for {serviceType.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {config.quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={action.action}
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => toast({ title: 'Action', description: `${action.name} clicked` })}
                  >
                    <ActionIcon className="h-6 w-6" />
                    <span className="text-sm">{action.name}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


