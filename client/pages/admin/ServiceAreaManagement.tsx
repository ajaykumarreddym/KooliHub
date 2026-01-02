import { AddServiceAreaModal } from '@/components/admin/AddServiceAreaModal';
import { EditServiceAreaModal } from '@/components/admin/EditServiceAreaModal';
import { ServiceAreaProductManagement } from '@/components/admin/ServiceAreaProductManagement';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRealtimeServiceAreas } from '@/hooks/use-realtime';
import {
    Building2,
    Clock,
    DollarSign,
    MapPin,
    Navigation,
    Package,
    Plus,
    Search,
    TrendingUp
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface ServiceArea {
  id: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  is_serviceable: boolean;
  service_types: string[];
  delivery_time_hours: number | null;
  delivery_charge: number | null;
  coordinates: any;
  created_at: string;
  updated_at: string;
}

export const ServiceAreaManagement: React.FC = () => {
  const [selectedServiceArea, setSelectedServiceArea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const { areas: serviceAreas, loading } = useRealtimeServiceAreas();

  const filteredAreas = useMemo(() => 
    serviceAreas.filter(
      (area: ServiceArea) =>
        area.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.pincode.includes(searchTerm) ||
        area.state.toLowerCase().includes(searchTerm.toLowerCase())
    ), [serviceAreas, searchTerm]
  );

  // If a service area is selected, show the product management interface
  if (selectedServiceArea) {
    return (
      <ServiceAreaProductManagement 
        serviceAreaId={selectedServiceArea}
        onBack={() => setSelectedServiceArea(null)}
      />
    );
  }

  // Otherwise, show the service area selection grid
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Area Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Loading service areas...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const stats = {
    activeAreas: serviceAreas.filter((area: ServiceArea) => area.is_serviceable).length,
    totalPincodes: serviceAreas.length,
    avgDeliveryTime: Math.round(serviceAreas.reduce((sum: number, area: ServiceArea) => 
      sum + (area.delivery_time_hours || 0), 0) / (serviceAreas.filter((area: ServiceArea) => 
      area.delivery_time_hours !== null).length || 1)),
    totalStates: new Set(serviceAreas.map((area: ServiceArea) => area.state)).size,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Area Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage service coverage and product availability by location
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} size="lg" className="shadow-md">
          <Plus className="h-5 w-5 mr-2" />
          Add Service Area
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Areas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeAreas}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Serviceable locations
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pincodes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPincodes}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <Navigation className="h-3 w-3 inline mr-1" />
                  Coverage zones
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Navigation className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Delivery</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgDeliveryTime}h</p>
                <p className="text-xs text-gray-500 mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Average time
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">States Covered</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStates}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  Geographic reach
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by city, pincode, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Areas Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Areas ({filteredAreas.length})</CardTitle>
              <CardDescription className="mt-1">
                Click on a service area to manage its products and settings
              </CardDescription>
            </div>
            {filteredAreas.length > 0 && searchTerm && (
              <Badge variant="secondary" className="text-sm">
                {filteredAreas.length} results
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAreas.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No service areas found' : 'No service areas configured'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search criteria or clear the search to see all areas'
                  : 'Get started by adding your first service area to begin managing product availability by location'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddModalOpen(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Service Area
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAreas.map((area: ServiceArea) => (
                <Card 
                  key={area.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-200 border-2 hover:border-primary/50 group"
                  onClick={() => setSelectedServiceArea(area.id)}
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                          <MapPin className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{area.city}</h3>
                          <p className="text-sm text-gray-600">{area.state}</p>
                        </div>
                      </div>
                      {area.is_serviceable ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 flex-shrink-0">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex-shrink-0">Inactive</Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm bg-gray-50 px-3 py-2 rounded-lg">
                        <Navigation className="h-4 w-4 mr-2 text-gray-600 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">Pincode:</span>
                        <span className="ml-auto font-semibold text-gray-900">{area.pincode}</span>
                      </div>

                      {area.delivery_time_hours && (
                        <div className="flex items-center text-sm bg-orange-50 px-3 py-2 rounded-lg">
                          <Clock className="h-4 w-4 mr-2 text-orange-600 flex-shrink-0" />
                          <span className="text-orange-700 font-medium">Delivery:</span>
                          <span className="ml-auto font-semibold text-orange-900">{area.delivery_time_hours}h</span>
                        </div>
                      )}

                      {area.delivery_charge !== null && (
                        <div className="flex items-center text-sm bg-green-50 px-3 py-2 rounded-lg">
                          <DollarSign className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                          <span className="text-green-700 font-medium">Charge:</span>
                          <span className="ml-auto font-semibold text-green-900">
                            {area.delivery_charge === 0 ? 'FREE' : `₹${area.delivery_charge}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Service Types */}
                    {area.service_types.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-xs font-medium text-gray-600 mb-2">Available Services:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {area.service_types.slice(0, 2).map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5">
                              {type}
                            </Badge>
                          ))}
                          {area.service_types.length > 2 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-100">
                              +{area.service_types.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      className="w-full mt-5 group-hover:bg-primary group-hover:text-white transition-colors"
                      variant="outline"
                      size="lg"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Manage Products
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddServiceAreaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          // Areas will update automatically via realtime
        }}
      />

      <EditServiceAreaModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingArea(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingArea(null);
        }}
        area={editingArea}
      />
    </div>
  );
};

export default ServiceAreaManagement;
