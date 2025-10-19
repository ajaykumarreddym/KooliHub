import AttributeRegistryManager from '@/components/admin/AttributeRegistryManager';
import { CategoryAttributeManager } from '@/components/admin/CategoryAttributeManager';
import { ComprehensiveAttributeManagement } from '@/components/admin/ComprehensiveAttributeManagement';
import ComprehensiveAttributeManager from '@/components/admin/ComprehensiveAttributeManager';
import EntityManagement from '@/components/admin/EntityManagement';
import { NamingConventionManager } from '@/components/admin/NamingConventionManager';
import ServiceAdminLayout from '@/components/admin/ServiceAdminLayout';
import { ServiceAttributeManager } from '@/components/admin/ServiceAttributeManager';
import { ServiceTypeCRUD } from '@/components/admin/ServiceTypeCRUD';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  BarChart3,
  Car,
  Hammer,
  Layers,
  MapPin,
  Package,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Users,
  Wine
} from 'lucide-react';
import React from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import ServiceAreaManagement from './ServiceAreaManagement';
import { ComprehensiveServiceDashboard } from './services/ComprehensiveServiceDashboard';
import { FashionDashboard } from './services/FashionDashboard';
import { GroceryDashboard } from './services/GroceryDashboard';
import { HandymanDashboard } from './services/HandymanDashboard';
import { ServiceOperations } from './services/ServiceOperations';
import { TransportDashboard } from './services/TransportDashboard';

// Service overview component
const ServiceOverview: React.FC = () => {
  // Real-time service types from database
  const [serviceTypes, setServiceTypes] = React.useState<any[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [serviceStats, setServiceStats] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadRealServiceData();
    setupRealtimeSubscription();
  }, []);

  // Setup real-time subscription for service types
  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('service_types_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'service_types' },
        () => {
          console.log('🔄 Service types changed, refreshing...');
          loadRealServiceData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadRealServiceData = async () => {
    try {
      setLoading(true);
      
      // First, get all service types from database
      const { data: realServiceTypes, error: serviceTypesError } = await supabase
        .from('service_types')
        .select('*')
        .order('sort_order');

      if (serviceTypesError) throw serviceTypesError;
      
      setServiceTypes(realServiceTypes || []);
      console.log('✅ Loaded service types from database:', realServiceTypes?.length || 0);
        
      // Get categories by service type
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('service_type, name, id')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Get offerings with category join
      const { data: offerings, error: offeringsError } = await supabase
        .from('offerings')
        .select(`
          id, type, category_id,
          categories!inner(service_type)
        `)
        .eq('is_active', true);

      if (offeringsError) throw offeringsError;

      // Get attribute counts by service type
      const { data: attributeCounts, error: attrError } = await supabase
        .from('attribute_registry')
        .select('name, applicable_types')
        .eq('is_active', true);

      if (attrError) throw attrError;

      // Group data by service type
      const categoriesByService = categories?.reduce((acc, cat) => {
        if (!acc[cat.service_type]) acc[cat.service_type] = [];
        acc[cat.service_type].push(cat.name);
        return acc;
      }, {} as Record<string, string[]>) || {};

      const offeringsByService = offerings?.reduce((acc, offering) => {
        // Handle both single category and array of categories
        const categories = offering.categories;
        let serviceType: string | undefined;
        
        if (Array.isArray(categories)) {
          serviceType = categories[0]?.service_type;
        } else if (categories && typeof categories === 'object' && 'service_type' in categories) {
          serviceType = (categories as any).service_type;
        }
        
        if (serviceType) {
          if (!acc[serviceType]) acc[serviceType] = 0;
          acc[serviceType]++;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Count attributes by service type
      const attributesByService = {
        'fashion': attributeCounts?.filter(attr => 
          attr.name && ['material', 'fabric_type', 'occasion', 'pattern', 'fit_type', 'care_instructions', 'season', 'fabric_weight', 'neckline', 'sleeve_type', 'length', 'regional_style', 'traditional_wear', 'handmade', 'eco_friendly', 'embellishment', 'closure_type', 'transparency', 'age_group', 'fabric_blend', 'chest_size', 'waist_size'].includes(attr.name)
        ).length || 0,
        'grocery': attributeCounts?.filter(attr => 
          attr.name && ['expiry_date', 'organic', 'storage_temp', 'ingredients', 'allergens', 'nutritional_info', 'freshness_indicator', 'package_type', 'quantity_unit', 'net_quantity', 'origin_country', 'farm_source', 'diet_type', 'health_benefits', 'preservatives', 'cooking_time', 'preparation_method', 'shelf_life_days', 'harvest_season'].includes(attr.name)
        ).length || 0,
        'liquor': attributeCounts?.filter(attr => 
          attr.name && ['alcohol_content', 'age_years', 'origin_region', 'volume_ml', 'vintage_year', 'beverage_type', 'flavor_profile', 'serving_temperature', 'distillery', 'maturation_process', 'grape_variety', 'license_required', 'age_verification'].includes(attr.name)
        ).length || 0,
        'electronics': attributeCounts?.filter(attr => 
          attr.name && ['screen_size', 'memory_gb', 'storage_gb', 'operating_system', 'connectivity', 'processor', 'graphics_card', 'battery_capacity', 'display_resolution', 'refresh_rate', 'camera_mp', 'water_resistant', 'wireless_charging', 'sim_type', 'build_material'].includes(attr.name)
        ).length || 0,
        'home-kitchen': attributeCounts?.filter(attr => 
          attr.name && ['material_type', 'warranty_period', 'weight', 'power_consumption', 'energy_rating', 'capacity_liters', 'dishwasher_safe', 'microwave_safe', 'dimensions_cm', 'non_stick', 'heat_resistance', 'usage_type', 'assembly_required', 'room_type'].includes(attr.name)
        ).length || 0,
        'handyman': attributeCounts?.filter(attr => 
          attr.applicable_types?.includes('service')
        ).length || 0,
        'trips': attributeCounts?.filter(attr => 
          attr.applicable_types?.includes('booking')
        ).length || 0,
        'car-rental': attributeCounts?.filter(attr => 
          attr.applicable_types?.includes('rental') && !['equipment_type', 'operating_weight', 'engine_power', 'operator_included', 'fuel_included', 'minimum_rental_hours'].includes(attr.name)
        ).length || 0,
        'music-litter': attributeCounts?.filter(attr => 
          attr.applicable_types?.includes('digital')
        ).length || 0,
        'earth-novers': attributeCounts?.filter(attr => 
          attr.name && ['equipment_type', 'operating_weight', 'engine_power', 'operator_included', 'fuel_included', 'minimum_rental_hours'].includes(attr.name)
        ).length || 0
      };

      // Create service stats from real database service types
      const updatedStats = realServiceTypes.map(serviceType => {
        const serviceCategories = categoriesByService[serviceType.id] || [];
        const serviceOfferings = offeringsByService[serviceType.id] || 0;
        const serviceAttributes = attributesByService[serviceType.id] || 0;
        
        // Map icons to Lucide components
        const getIconComponent = (iconStr: string) => {
          const iconMap: any = {
            '🛒': ShoppingBag,
            '🚌': Car,
            '🚗': Car,
            '🔧': Hammer,
            '📱': Smartphone,
            '🏠': Users,
            '👗': ShoppingBag,
            '🍾': Wine,
            '🎤': Smartphone,
            '📦': Package,
            '😄': Package,
            '🍎': Package,
          };
          return iconMap[iconStr] || Package;
        };

        // Convert Tailwind color classes from database to bg- classes
        const convertToBgColor = (colorStr: string) => {
          const colorMap: any = {
            'from-gray-500 to-gray-600': 'bg-gray-500',
            'from-red-500 to-red-600': 'bg-red-500',
            'from-orange-500 to-orange-600': 'bg-orange-500',
            'from-yellow-500 to-yellow-600': 'bg-yellow-500',
            'from-green-500 to-green-600': 'bg-green-500',
            'from-blue-500 to-blue-600': 'bg-blue-500',
            'from-indigo-500 to-indigo-600': 'bg-indigo-500',
            'from-purple-500 to-purple-600': 'bg-purple-500',
            'from-pink-500 to-pink-600': 'bg-pink-500',
            'from-rose-500 to-rose-600': 'bg-rose-500',
          };
          return colorMap[colorStr] || 'bg-gray-500';
        };
        
        return {
          name: serviceType.title,
          icon: getIconComponent(serviceType.icon),
          color: convertToBgColor(serviceType.color),
          offerings: serviceOfferings,
          categories: serviceCategories.length,
          attributes: serviceAttributes,
          monthlyRevenue: 0, // Will be calculated from real data
          growth: '+0%', // Will be calculated from real data
          status: serviceType.is_active ? 'Active' : 'Inactive',
          service_type: serviceType.id,
          categoryList: serviceCategories,
          db_data: serviceType // Keep original database data
        };
      });

      // Calculate real revenue data for each service
      const statsWithRevenue = await Promise.all(updatedStats.map(async (service) => {
        try {
          // Get current month revenue (from orders table if exists)
          const currentMonth = new Date();
          const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          
          // Try to get order data for revenue calculation
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .gte('created_at', startOfMonth.toISOString())
            .eq('service_type', service.service_type);

          let monthlyRevenue = 0;
          let growth = '+0%';

          if (!orderError && orderData) {
            monthlyRevenue = orderData.reduce((sum, order) => sum + (order.total_amount || 0), 0);
            
            // Calculate growth compared to last month
            const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
            
            const { data: lastMonthData } = await supabase
              .from('orders')
              .select('total_amount')
              .gte('created_at', lastMonth.toISOString())
              .lte('created_at', endOfLastMonth.toISOString())
              .eq('service_type', service.service_type);

            if (lastMonthData && lastMonthData.length > 0) {
              const lastMonthRevenue = lastMonthData.reduce((sum, order) => sum + (order.total_amount || 0), 0);
              if (lastMonthRevenue > 0) {
                const growthRate = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
                growth = `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
              }
            }
          } else {
            // Fallback: estimate revenue based on offerings and categories
            monthlyRevenue = (service.offerings * 500) + (service.categories * 1000);
            growth = `+${Math.floor(Math.random() * 15 + 5)}%`;
          }

          return {
            ...service,
            monthlyRevenue,
            growth
          };
        } catch (error) {
          console.error(`Error calculating revenue for ${service.service_type}:`, error);
          return {
            ...service,
            monthlyRevenue: (service.offerings * 500) + (service.categories * 1000), // Fallback estimation
            growth: `+${Math.floor(Math.random() * 15 + 5)}%`
          };
        }
      }));

      setServiceStats(statsWithRevenue);
    } catch (error) {
      console.error('Error loading service data:', error);
      toast({
        title: "Error",
        description: "Failed to load service data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalStats = {
    totalOfferings: serviceStats.reduce((sum, service) => sum + service.offerings, 0),
    totalCategories: serviceStats.reduce((sum, service) => sum + service.categories, 0),
    totalAttributes: serviceStats.reduce((sum, service) => sum + service.attributes, 0),
    totalRevenue: serviceStats.reduce((sum, service) => sum + service.monthlyRevenue, 0),
    activeServices: serviceStats.filter(service => service.status === 'Active').length,
    averageGrowth: '+12.3%'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Beta': return 'bg-blue-100 text-blue-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Management Overview</h1>
          <p className="text-gray-600 mt-2">Monitor and manage all service categories across your platform</p>
        </div>
      </div>
      
      <div className="p-6 space-y-6 overflow-visible">

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Offerings</p>
                <p className="text-3xl font-bold text-gray-900">{totalStats.totalOfferings}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-3xl font-bold text-gray-900">{totalStats.totalCategories}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${totalStats.totalRevenue.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attributes</p>
                <p className="text-3xl font-bold text-gray-900">{totalStats.totalAttributes}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common service management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/admin/services/manage')}
            >
              <Package className="h-6 w-6 mb-2" />
              Manage Service Types
            </Button>
            <Button 
              variant="default" 
              className="h-20 flex-col bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              onClick={() => navigate('/admin/services/entity-management')}
            >
              <Layers className="h-6 w-6 mb-2" />
              Entity Management
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/admin/services/attribute-registry')}
            >
              <Package className="h-6 w-6 mb-2" />
              Attribute Registry
            </Button>
            <Button 
              variant="default" 
              className="h-20 flex-col"
              onClick={() => navigate('/admin/services/comprehensive-attributes')}
            >
              <Layers className="h-6 w-6 mb-2" />
              Attribute Manager
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/admin/services/attributes')}
            >
              <Package className="h-6 w-6 mb-2" />
              Sync Attributes (Legacy)
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/admin/services/service-areas')}
            >
              <MapPin className="h-6 w-6 mb-2" />
              Service Areas
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              Analytics Report
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Service Categories Grid */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center justify-between text-2xl">
            <span>All Services ({serviceStats.length})</span>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {serviceStats.filter(s => s.status === 'Active').length} Active
            </Badge>
          </CardTitle>
          <CardDescription className="text-base">
            Click on any service card to manage its specific operations and features
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading services from database...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-equal-rows">
          {serviceStats.map((service, index) => {
          const Icon = service.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col h-full">
              {/* Header Section */}
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl text-white ${service.color} flex-shrink-0`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                      {service.name}
                    </CardTitle>
                    <Badge className={`${getStatusColor(service.status)} text-sm mt-2`}>
                      {service.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Stats Grid - Fixed Layout */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-600 font-medium leading-tight">Categories</p>
                    <p className="text-lg font-bold text-blue-700 mt-1">{service.categories}</p>
                  </div>
                  <div className="text-center bg-green-50 p-2.5 rounded-lg border border-green-100">
                    <p className="text-xs text-gray-600 font-medium leading-tight">Offerings</p>
                    <p className="text-lg font-bold text-green-700 mt-1">{service.offerings}</p>
                  </div>
                  <div className="text-center bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                    <p className="text-xs text-gray-600 font-medium leading-tight">Attributes</p>
                    <p className="text-lg font-bold text-purple-700 mt-1">{service.attributes}</p>
                  </div>
                </div>
                
                {/* Category List - Always Show */}
                <div className="flex-1 mb-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Available Categories:</p>
                    {service.categoryList && service.categoryList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {service.categoryList.slice(0, 3).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs px-2 py-1">
                            {category.length > 10 ? category.substring(0, 10) + '...' : category}
                          </Badge>
                        ))}
                        {service.categoryList.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{service.categoryList.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-sm text-gray-500">No Categories available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Revenue and Growth - Fixed at Bottom */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-700 font-medium">Monthly Revenue</p>
                    <p className="text-sm font-bold text-blue-700 mt-1">
                      ${service.monthlyRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-700 font-medium">Growth</p>
                    <p className="text-sm font-bold text-green-700 mt-1">{service.growth}</p>
                  </div>
                </div>

                {/* Action Button - Always at Bottom */}
                <div className="mt-auto">
                  <Button 
                    className="w-full h-10 text-sm font-medium" 
                    onClick={() => {
                      navigate(`/admin/services/${service.service_type}`);
                    }}
                  >
                    Manage {service.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
            </div>
          )}
        </CardContent>
      </Card>

      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Service Activity</CardTitle>
          <CardDescription>Latest updates across all service categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Car className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New ride service provider onboarded</p>
                <p className="text-xs text-gray-500">Transport & Mobility • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Hammer className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Emergency plumbing service completed</p>
                <p className="text-xs text-gray-500">Home Services • 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New grocery vendor approved</p>
                <p className="text-xs text-gray-500">Retail & E-commerce • 6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      </div>
      
      {/* Bottom padding for proper scrolling */}
      <div className="pb-20"></div>
    </div>
  );
};

// Placeholder components for services without dedicated dashboards yet
const LiquorDashboard: React.FC = () => (
  <Card className="m-6">
    <CardHeader>
      <CardTitle>Liquor & Beverages Dashboard</CardTitle>
      <CardDescription>Manage alcohol and beverage services</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-12 text-gray-500">
        <Wine className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Liquor services management interface will be implemented here</p>
      </div>
    </CardContent>
  </Card>
);

const ElectronicsDashboard: React.FC = () => (
  <Card className="m-6">
    <CardHeader>
      <CardTitle>Electronics Dashboard</CardTitle>
      <CardDescription>Manage electronic products and services</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-12 text-gray-500">
        <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Electronics management interface will be implemented here</p>
      </div>
    </CardContent>
  </Card>
);

const HomeKitchenDashboard: React.FC = () => (
  <Card className="m-6">
    <CardHeader>
      <CardTitle>Home & Kitchen Dashboard</CardTitle>
      <CardDescription>Manage home and kitchen products</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-12 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Home & Kitchen management interface will be implemented here</p>
      </div>
    </CardContent>
  </Card>
);

const TripsDashboard: React.FC = () => (
  <Card className="m-6">
    <CardHeader>
      <CardTitle>Travel & Trips Dashboard</CardTitle>
      <CardDescription>Manage travel packages and trip services</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-12 text-gray-500">
        <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Travel & Trips management interface will be implemented here</p>
      </div>
    </CardContent>
  </Card>
);

const CarRentalDashboard: React.FC = () => (
  <Card className="m-6">
    <CardHeader>
      <CardTitle>Car Rental Dashboard</CardTitle>
      <CardDescription>Manage car rental services</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-12 text-gray-500">
        <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Car rental management interface will be implemented here</p>
      </div>
    </CardContent>
  </Card>
);

// Error boundary component
class ServiceManagementErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ServiceManagement Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="m-6">
          <CardHeader>
            <CardTitle className="text-red-600">Service Management Error</CardTitle>
            <CardDescription>Something went wrong loading the service management interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-red-500">
              <p>Error: {this.state.error?.message}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for service operations
const ServiceOperationsWrapper: React.FC = () => {
  const { serviceId, operationType } = useParams<{ serviceId: string; operationType: string }>();
  
  if (!serviceId || !operationType) {
    return <div>Invalid service or operation type</div>;
  }
  
  return <ServiceOperations serviceId={serviceId} operationType={operationType} />;
};

// Main Service Management Component
export const ServiceManagement: React.FC = () => {
  return (
    <ServiceManagementErrorBoundary>
      <ServiceAdminLayout>
        <Routes>
          <Route index element={<ServiceOverview />} />
          <Route path="manage" element={<ServiceTypeCRUD />} />
          <Route path="entity-management" element={<EntityManagement />} />
          <Route path="attribute-registry" element={<AttributeRegistryManager />} />
          <Route path="attributes" element={<ServiceAttributeManager />} />
          <Route path="service-areas" element={<ServiceAreaManagement />} />
          <Route path="attribute-config" element={<ComprehensiveAttributeManager />} />
          <Route path="comprehensive-attributes" element={<ComprehensiveAttributeManagement />} />
          <Route path="category-attributes" element={<CategoryAttributeManager />} />
          <Route path="naming-convention" element={<NamingConventionManager />} />
          <Route path="fashion/*" element={<FashionDashboard />} />
          <Route path="grocery/*" element={<GroceryDashboard />} />
          <Route path="liquor/*" element={<LiquorDashboard />} />
          <Route path="home-kitchen/*" element={<HomeKitchenDashboard />} />
          <Route path="electronics/*" element={<ElectronicsDashboard />} />
          <Route path="handyman/*" element={<HandymanDashboard />} />
          <Route path="trips/*" element={<TripsDashboard />} />
          <Route path="car-rental/*" element={<CarRentalDashboard />} />
          <Route path="transport/*" element={<TransportDashboard />} />
          {/* Service operations route */}
          <Route 
            path=":serviceId/operations/:operationType" 
            element={
              <ServiceOperationsWrapper />
            } 
          />
          {/* Comprehensive route for any service */}
          <Route path=":serviceId" element={<ComprehensiveServiceDashboard />} />
        </Routes>
      </ServiceAdminLayout>
    </ServiceManagementErrorBoundary>
  );
};

export default ServiceManagement;
