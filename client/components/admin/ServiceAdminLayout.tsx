import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
    BarChart3,
    Building2,
    Calendar,
    Car,
    ChevronRight,
    Coffee,
    Cog,
    Hammer,
    Home,
    Layers,
    MapPin,
    Monitor,
    Package,
    Plane,
    Settings,
    Shirt,
    ShoppingBag,
    Smartphone,
    Store,
    Truck,
    Users,
    Wine,
    Wrench
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

// Service configuration based on actual database service types
const serviceConfig = {
  fashion: {
    title: 'Fashion & Apparel',
    icon: ShoppingBag,
    color: 'bg-pink-500',
    description: 'Manage fashion and clothing products',
    offering_types: ['product'],
    service_types: ['fashion'],
    operations: [
      { name: 'Fashion Catalog', path: '/admin/services/fashion/products', icon: ShoppingBag },
      { name: 'Saree Collection', path: '/admin/services/fashion/sarees', icon: Shirt },
      { name: 'Designer Collection', path: '/admin/services/fashion/designer', icon: Package },
      { name: 'Bridal Collection', path: '/admin/services/fashion/bridal', icon: Settings },
      { name: 'Kids Collection', path: '/admin/services/fashion/kids', icon: Users },
      { name: 'Handloom Items', path: '/admin/services/fashion/handloom', icon: Store },
      { name: 'Inventory Management', path: '/admin/services/fashion/inventory', icon: Package },
      { name: 'Fashion Analytics', path: '/admin/services/fashion/analytics', icon: BarChart3 }
    ]
  },
  grocery: {
    title: 'Grocery & Food',
    icon: Coffee,
    color: 'bg-green-500',
    description: 'Manage grocery and food products',
    offering_types: ['product'],
    service_types: ['grocery'],
    operations: [
      { name: 'Fresh Vegetables', path: '/admin/services/grocery/vegetables', icon: Coffee },
      { name: 'Fruits', path: '/admin/services/grocery/fruits', icon: Package },
      { name: 'Dairy Products', path: '/admin/services/grocery/dairy', icon: Store },
      { name: 'Bakery Items', path: '/admin/services/grocery/bakery', icon: Settings },
      { name: 'Beverages', path: '/admin/services/grocery/beverages', icon: Wine },
      { name: 'Inventory Tracking', path: '/admin/services/grocery/inventory', icon: BarChart3 },
      { name: 'Vendor Management', path: '/admin/services/grocery/vendors', icon: Building2 },
      { name: 'Order Processing', path: '/admin/services/grocery/orders', icon: Truck }
    ]
  },
  liquor: {
    title: 'Liquor & Beverages',
    icon: Wine,
    color: 'bg-red-500', 
    description: 'Manage alcohol and beverage services',
    offering_types: ['product'],
    service_types: ['liquor'],
    operations: [
      { name: 'Wine Collection', path: '/admin/services/liquor/wine', icon: Wine },
      { name: 'Beer Selection', path: '/admin/services/liquor/beer', icon: Coffee },
      { name: 'Rum & Spirits', path: '/admin/services/liquor/rum', icon: Wine },
      { name: 'Whiskey Collection', path: '/admin/services/liquor/whiskey', icon: Store },
      { name: 'Age Verification', path: '/admin/services/liquor/verification', icon: Users },
      { name: 'License Management', path: '/admin/services/liquor/licenses', icon: Settings },
      { name: 'Inventory Control', path: '/admin/services/liquor/inventory', icon: Package },
      { name: 'Sales Analytics', path: '/admin/services/liquor/analytics', icon: BarChart3 }
    ]
  },
  'home-kitchen': {
    title: 'Home & Kitchen',
    icon: Home,
    color: 'bg-blue-500',
    description: 'Manage home and kitchen products',
    offering_types: ['product'],
    service_types: ['home-kitchen'],
    operations: [
      { name: 'Home Decor', path: '/admin/services/home-kitchen/decor', icon: Home },
      { name: 'Kitchen Appliances', path: '/admin/services/home-kitchen/appliances', icon: Settings },
      { name: 'Product Catalog', path: '/admin/services/home-kitchen/products', icon: Package },
      { name: 'Inventory Management', path: '/admin/services/home-kitchen/inventory', icon: Store },
      { name: 'Vendor Relations', path: '/admin/services/home-kitchen/vendors', icon: Building2 },
      { name: 'Order Processing', path: '/admin/services/home-kitchen/orders', icon: Truck },
      { name: 'Customer Reviews', path: '/admin/services/home-kitchen/reviews', icon: BarChart3 },
      { name: 'Sales Analytics', path: '/admin/services/home-kitchen/analytics', icon: BarChart3 }
    ]
  },
  electronics: {
    title: 'Electronics',
    icon: Smartphone,
    color: 'bg-indigo-500',
    description: 'Manage electronic products',
    offering_types: ['product'],
    service_types: ['electronics'],
    operations: [
      { name: 'Mobile Phones', path: '/admin/services/electronics/mobiles', icon: Smartphone },
      { name: 'Laptops', path: '/admin/services/electronics/laptops', icon: Monitor },
      { name: 'Product Catalog', path: '/admin/services/electronics/products', icon: Package },
      { name: 'Warranty Management', path: '/admin/services/electronics/warranty', icon: Settings },
      { name: 'Inventory Tracking', path: '/admin/services/electronics/inventory', icon: Store },
      { name: 'Vendor Management', path: '/admin/services/electronics/vendors', icon: Building2 },
      { name: 'Order Processing', path: '/admin/services/electronics/orders', icon: Truck },
      { name: 'Tech Support', path: '/admin/services/electronics/support', icon: Users }
    ]
  },
  handyman: {
    title: 'Handyman Services',
    icon: Hammer,
    color: 'bg-orange-500',
    description: 'Manage handyman and home services',
    offering_types: ['service'],
    service_types: ['handyman'],
    operations: [
      { name: 'Electrical Work', path: '/admin/services/handyman/electrical', icon: Wrench },
      { name: 'Home Repair', path: '/admin/services/handyman/repair', icon: Hammer },
      { name: 'Service Providers', path: '/admin/services/handyman/providers', icon: Users },
      { name: 'Booking Management', path: '/admin/services/handyman/bookings', icon: Calendar },
      { name: 'Skills & Certifications', path: '/admin/services/handyman/skills', icon: Settings },
      { name: 'Service Areas', path: '/admin/services/handyman/areas', icon: MapPin },
      { name: 'Quality Control', path: '/admin/services/handyman/quality', icon: BarChart3 },
      { name: 'Emergency Services', path: '/admin/services/handyman/emergency', icon: Hammer }
    ]
  },
  trips: {
    title: 'Travel & Trips',
    icon: Plane,
    color: 'bg-purple-500',
    description: 'Manage travel and trip services',
    offering_types: ['booking', 'service'],
    service_types: ['trips'],
    operations: [
      { name: 'Adventure Tours', path: '/admin/services/trips/adventure', icon: Plane },
      { name: 'Weekend Trips', path: '/admin/services/trips/weekend', icon: Calendar },
      { name: 'Travel Packages', path: '/admin/services/trips/packages', icon: Package },
      { name: 'Booking Management', path: '/admin/services/trips/bookings', icon: Calendar },
      { name: 'Guide Management', path: '/admin/services/trips/guides', icon: Users },
      { name: 'Transport Coordination', path: '/admin/services/trips/transport', icon: Car },
      { name: 'Travel Analytics', path: '/admin/services/trips/analytics', icon: BarChart3 },
      { name: 'Customer Reviews', path: '/admin/services/trips/reviews', icon: BarChart3 }
    ]
  },
  'car-rental': {
    title: 'Car Rental',
    icon: Car,
    color: 'bg-blue-600',
    description: 'Manage car rental services',
    offering_types: ['rental'],
    service_types: ['car-rental'],
    operations: [
      { name: 'Luxury Cars', path: '/admin/services/car-rental/luxury', icon: Car },
      { name: 'Vehicle Fleet', path: '/admin/services/car-rental/fleet', icon: Truck },
      { name: 'Booking Management', path: '/admin/services/car-rental/bookings', icon: Calendar },
      { name: 'Driver Management', path: '/admin/services/car-rental/drivers', icon: Users },
      { name: 'Maintenance Schedule', path: '/admin/services/car-rental/maintenance', icon: Settings },
      { name: 'Pricing Management', path: '/admin/services/car-rental/pricing', icon: Cog },
      { name: 'Route Planning', path: '/admin/services/car-rental/routes', icon: MapPin },
      { name: 'Rental Analytics', path: '/admin/services/car-rental/analytics', icon: BarChart3 }
    ]
  }
};

// Interface for dynamic service types from database
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

interface ServiceAdminLayoutProps {
  children?: React.ReactNode;
}

export const ServiceAdminLayout: React.FC<ServiceAdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [dynamicServices, setDynamicServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic services from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('service_types')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        setDynamicServices(data || []);
      } catch (error) {
        console.error('❌ Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();

    // Real-time subscription
    const subscription = supabase
      .channel('service_types_sidebar')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'service_types' },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Determine current service from URL
  const currentService = React.useMemo(() => {
    const pathParts = location.pathname.split('/');
    const serviceIndex = pathParts.findIndex(part => part === 'services');
    return serviceIndex !== -1 ? pathParts[serviceIndex + 1] : null;
  }, [location.pathname]);

  React.useEffect(() => {
    if (currentService && (serviceConfig[currentService as keyof typeof serviceConfig] || dynamicServices.find(s => s.id === currentService))) {
      setSelectedService(currentService);
    }
  }, [currentService, dynamicServices]);

  // Map emoji icons to Lucide components
  const getIconComponent = (iconStr: string) => {
    const iconMap: any = {
      '🛒': ShoppingBag,
      '🚌': Car,
      '🚗': Car,
      '🔧': Hammer,
      '📱': Smartphone,
      '🏠': Home,
      '👗': ShoppingBag,
      '🍾': Wine,
      '🎤': Monitor,
      '📦': Package,
      '😄': Package,
      '🍎': Coffee,
      '⚡': Settings,
      '🌟': Settings,
      '🏆': BarChart3,
    };
    return iconMap[iconStr] || Package;
  };

  // Get operations for a service (static config or default)
  const getServiceOperations = (serviceId: string) => {
    const staticConfig = serviceConfig[serviceId as keyof typeof serviceConfig];
    if (staticConfig) {
      return staticConfig.operations;
    }
    
    // Default operations for dynamic services
    return [
      { name: 'Product Catalog', action: 'products', icon: Package },
      { name: 'Categories', action: 'categories', icon: Layers },
      { name: 'Inventory', action: 'inventory', icon: Store },
      { name: 'Orders', action: 'orders', icon: Truck },
      { name: 'Analytics', action: 'analytics', icon: BarChart3 },
      { name: 'Settings', action: 'settings', icon: Settings },
    ];
  };

  // Combine static and dynamic services
  const allServices = React.useMemo(() => {
    const dynamicServiceList = dynamicServices.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description || `Manage ${service.title.toLowerCase()} services`,
      icon: getIconComponent(service.icon),
      color: service.color.includes('bg-') ? service.color : `bg-${service.color}`,
      operations: getServiceOperations(service.id)
    }));

    return dynamicServiceList;
  }, [dynamicServices]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Service Selection Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col max-h-screen">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Service Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all service operations by category</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading services...</span>
            </div>
          ) : (
            allServices.map((service) => {
              const ServiceIcon = service.icon;
              const isActive = selectedService === service.id;
              
              return (
                <Card 
                  key={service.id} 
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    isActive ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedService(isActive ? null : service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-lg text-white", service.color)}>
                          <ServiceIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{service.title}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                      <ChevronRight 
                        className={cn(
                          "h-5 w-5 text-gray-400 transition-transform duration-200",
                          isActive && "rotate-90"
                        )} 
                      />
                    </div>

                    {/* Service Operations */}
                    {isActive && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        {service.operations.map((operation) => {
                          const OperationIcon = operation.icon;
                          const isOperationActive = location.pathname === operation.path;
                          
                        return (
                          <NavLink
                            key={operation.action || operation.name}
                            to={`/admin/services/${service.id}/operations/${operation.action || operation.name.toLowerCase().replace(' ', '-')}`}
                            className={cn(
                              "flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200",
                              isOperationActive 
                                ? "bg-blue-100 text-blue-700" 
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                          >
                            <OperationIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{operation.name}</span>
                          </NavLink>
                        );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <NavLink to="/admin/dashboard" className="block">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overall Dashboard
            </Button>
          </NavLink>
          <NavLink to="/admin/vendors" className="block">
            <Button variant="outline" className="w-full justify-start">
              <Building2 className="h-4 w-4 mr-2" />
              All Vendors
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default ServiceAdminLayout;
