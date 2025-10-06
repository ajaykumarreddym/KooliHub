import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft,
    BarChart3,
    FileText,
    Package,
    Settings,
    Users
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ServiceOperationsProps {
  serviceId: string;
  operationType: string;
}

export const ServiceOperations: React.FC<ServiceOperationsProps> = ({ 
  serviceId, 
  operationType 
}) => {
  const navigate = useNavigate();
  const [serviceData, setServiceData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadServiceData();
  }, [serviceId]);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      setServiceData(data);
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

  const operationTypes = {
    'inventory': {
      title: 'Inventory Management',
      description: 'Manage stock levels and product availability',
      icon: Package,
      actions: [
        { label: 'View Stock Levels', action: () => {} },
        { label: 'Add New Items', action: () => {} },
        { label: 'Update Quantities', action: () => {} },
        { label: 'Low Stock Alerts', action: () => {} },
      ]
    },
    'providers': {
      title: 'Service Providers',
      description: 'Manage service providers and vendors',
      icon: Users,
      actions: [
        { label: 'View Providers', action: () => {} },
        { label: 'Add New Provider', action: () => {} },
        { label: 'Provider Ratings', action: () => {} },
        { label: 'Performance Metrics', action: () => {} },
      ]
    },
    'analytics': {
      title: 'Analytics & Reports',
      description: 'View service performance and insights',
      icon: BarChart3,
      actions: [
        { label: 'Performance Dashboard', action: () => {} },
        { label: 'Revenue Reports', action: () => {} },
        { label: 'Customer Insights', action: () => {} },
        { label: 'Export Data', action: () => {} },
      ]
    },
    'settings': {
      title: 'Service Settings',
      description: 'Configure service-specific settings',
      icon: Settings,
      actions: [
        { label: 'General Settings', action: () => {} },
        { label: 'Pricing Rules', action: () => {} },
        { label: 'Service Areas', action: () => {} },
        { label: 'Notifications', action: () => {} },
      ]
    },
    'orders': {
      title: 'Order Management',
      description: 'Manage service orders and bookings',
      icon: FileText,
      actions: [
        { label: 'Active Orders', action: () => {} },
        { label: 'Order History', action: () => {} },
        { label: 'Refunds & Returns', action: () => {} },
        { label: 'Bulk Actions', action: () => {} },
      ]
    }
  };

  const currentOperation = operationTypes[operationType as keyof typeof operationTypes] || operationTypes.settings;
  const OperationIcon = currentOperation.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/admin/services/${serviceId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentOperation.title}
              </h1>
              <p className="text-gray-600 mt-1">
                {serviceData?.title} • {currentOperation.description}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {operationType}
          </Badge>
        </div>

        {/* Operation Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <OperationIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>{currentOperation.title}</CardTitle>
                <CardDescription>{currentOperation.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentOperation.actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={action.action}
                >
                  <div className="text-left">
                    <p className="font-medium">{action.label}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Active Operations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for operation-specific content */}
        <Card>
          <CardHeader>
            <CardTitle>Operation Details</CardTitle>
            <CardDescription>
              Detailed {operationType} operations will be displayed here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <p>This operation interface is under development</p>
              <p className="text-sm mt-2">
                Service ID: {serviceId} | Operation: {operationType}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceOperations;
