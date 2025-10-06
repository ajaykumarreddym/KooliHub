import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
    AlertCircle,
    CheckCircle,
    Layers,
    Package,
    Plus,
    RefreshCw,
    Settings,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Service-specific attribute mappings
const SERVICE_ATTRIBUTE_MAPPINGS = {
  'grocery': [
    { name: 'expiry_date', data_type: 'date', description: 'Product expiry date', applicable_types: ['product'], scope: 'offering' },
    { name: 'organic', data_type: 'boolean', description: 'Is organic product', applicable_types: ['product'], scope: 'offering' },
    { name: 'storage_temp', data_type: 'select', description: 'Storage temperature requirement', applicable_types: ['product'], scope: 'offering' },
    { name: 'ingredients', data_type: 'textarea', description: 'Product ingredients', applicable_types: ['product'], scope: 'offering' },
    { name: 'allergens', data_type: 'text', description: 'Allergen information', applicable_types: ['product'], scope: 'offering' },
    { name: 'nutritional_info', data_type: 'textarea', description: 'Nutritional information', applicable_types: ['product'], scope: 'offering' },
    { name: 'freshness_indicator', data_type: 'select', description: 'Freshness level', applicable_types: ['product'], scope: 'offering' },
    { name: 'package_type', data_type: 'select', description: 'Packaging type', applicable_types: ['product'], scope: 'offering' },
    { name: 'quantity_unit', data_type: 'select', description: 'Unit of measurement', applicable_types: ['product'], scope: 'offering' },
    { name: 'net_quantity', data_type: 'number', description: 'Net quantity', applicable_types: ['product'], scope: 'offering' },
  ],
  'fashion': [
    { name: 'material', data_type: 'select', description: 'Fabric material', applicable_types: ['product'], scope: 'offering' },
    { name: 'fabric_type', data_type: 'select', description: 'Type of fabric', applicable_types: ['product'], scope: 'offering' },
    { name: 'occasion', data_type: 'select', description: 'Suitable occasion', applicable_types: ['product'], scope: 'offering' },
    { name: 'pattern', data_type: 'select', description: 'Pattern design', applicable_types: ['product'], scope: 'offering' },
    { name: 'fit_type', data_type: 'select', description: 'Fit style', applicable_types: ['product'], scope: 'variant' },
    { name: 'care_instructions', data_type: 'textarea', description: 'Care instructions', applicable_types: ['product'], scope: 'offering' },
    { name: 'season', data_type: 'select', description: 'Seasonal suitability', applicable_types: ['product'], scope: 'offering' },
    { name: 'fabric_weight', data_type: 'number', description: 'Fabric weight (GSM)', applicable_types: ['product'], scope: 'offering' },
    { name: 'neckline', data_type: 'select', description: 'Neckline style', applicable_types: ['product'], scope: 'variant' },
    { name: 'sleeve_type', data_type: 'select', description: 'Sleeve style', applicable_types: ['product'], scope: 'variant' },
  ],
  'electronics': [
    { name: 'screen_size', data_type: 'number', description: 'Screen size in inches', applicable_types: ['product'], scope: 'offering' },
    { name: 'memory_gb', data_type: 'number', description: 'Memory capacity in GB', applicable_types: ['product'], scope: 'offering' },
    { name: 'storage_gb', data_type: 'number', description: 'Storage capacity in GB', applicable_types: ['product'], scope: 'offering' },
    { name: 'operating_system', data_type: 'select', description: 'Operating system', applicable_types: ['product'], scope: 'offering' },
    { name: 'connectivity', data_type: 'multiselect', description: 'Connectivity options', applicable_types: ['product'], scope: 'offering' },
    { name: 'processor', data_type: 'text', description: 'Processor type', applicable_types: ['product'], scope: 'offering' },
    { name: 'graphics_card', data_type: 'text', description: 'Graphics card', applicable_types: ['product'], scope: 'offering' },
    { name: 'battery_capacity', data_type: 'number', description: 'Battery capacity (mAh)', applicable_types: ['product'], scope: 'offering' },
    { name: 'display_resolution', data_type: 'text', description: 'Display resolution', applicable_types: ['product'], scope: 'offering' },
    { name: 'refresh_rate', data_type: 'number', description: 'Display refresh rate (Hz)', applicable_types: ['product'], scope: 'offering' },
  ],
  'handyman': [
    { name: 'service_duration', data_type: 'number', description: 'Service duration in hours', applicable_types: ['service'], scope: 'offering' },
    { name: 'skill_level', data_type: 'select', description: 'Required skill level', applicable_types: ['service'], scope: 'offering' },
    { name: 'equipment_included', data_type: 'boolean', description: 'Equipment provided', applicable_types: ['service'], scope: 'offering' },
    { name: 'emergency_service', data_type: 'boolean', description: 'Emergency service available', applicable_types: ['service'], scope: 'offering' },
    { name: 'warranty_provided', data_type: 'boolean', description: 'Service warranty provided', applicable_types: ['service'], scope: 'offering' },
    { name: 'materials_included', data_type: 'boolean', description: 'Materials included in service', applicable_types: ['service'], scope: 'offering' },
    { name: 'service_area', data_type: 'text', description: 'Service coverage area', applicable_types: ['service'], scope: 'offering' },
    { name: 'minimum_hours', data_type: 'number', description: 'Minimum booking hours', applicable_types: ['service'], scope: 'offering' },
  ],
  'car-rental': [
    { name: 'vehicle_type', data_type: 'select', description: 'Type of vehicle', applicable_types: ['rental'], scope: 'offering' },
    { name: 'fuel_type', data_type: 'select', description: 'Fuel type', applicable_types: ['rental'], scope: 'offering' },
    { name: 'seating_capacity', data_type: 'number', description: 'Number of seats', applicable_types: ['rental'], scope: 'offering' },
    { name: 'transmission', data_type: 'select', description: 'Transmission type', applicable_types: ['rental'], scope: 'offering' },
    { name: 'ac_available', data_type: 'boolean', description: 'Air conditioning available', applicable_types: ['rental'], scope: 'offering' },
    { name: 'driver_included', data_type: 'boolean', description: 'Driver service included', applicable_types: ['rental'], scope: 'offering' },
    { name: 'minimum_rental_hours', data_type: 'number', description: 'Minimum rental duration', applicable_types: ['rental'], scope: 'offering' },
    { name: 'mileage_limit', data_type: 'number', description: 'Daily mileage limit', applicable_types: ['rental'], scope: 'offering' },
  ],
  'trips': [
    { name: 'departure_time', data_type: 'time', description: 'Departure time', applicable_types: ['booking'], scope: 'offering' },
    { name: 'arrival_time', data_type: 'time', description: 'Arrival time', applicable_types: ['booking'], scope: 'offering' },
    { name: 'route_stops', data_type: 'multiselect', description: 'Route stops', applicable_types: ['booking'], scope: 'offering' },
    { name: 'amenities', data_type: 'multiselect', description: 'Vehicle amenities', applicable_types: ['booking'], scope: 'offering' },
    { name: 'cancellation_policy', data_type: 'textarea', description: 'Cancellation policy', applicable_types: ['booking'], scope: 'offering' },
    { name: 'luggage_allowance', data_type: 'text', description: 'Luggage allowance', applicable_types: ['booking'], scope: 'offering' },
  ],
  'liquor': [
    { name: 'alcohol_content', data_type: 'number', description: 'Alcohol percentage', applicable_types: ['product'], scope: 'offering' },
    { name: 'age_years', data_type: 'number', description: 'Age in years', applicable_types: ['product'], scope: 'offering' },
    { name: 'origin_region', data_type: 'text', description: 'Origin region', applicable_types: ['product'], scope: 'offering' },
    { name: 'volume_ml', data_type: 'number', description: 'Volume in milliliters', applicable_types: ['product'], scope: 'offering' },
    { name: 'vintage_year', data_type: 'number', description: 'Vintage year', applicable_types: ['product'], scope: 'offering' },
    { name: 'beverage_type', data_type: 'select', description: 'Type of beverage', applicable_types: ['product'], scope: 'offering' },
    { name: 'flavor_profile', data_type: 'textarea', description: 'Flavor profile description', applicable_types: ['product'], scope: 'offering' },
    { name: 'serving_temperature', data_type: 'text', description: 'Recommended serving temperature', applicable_types: ['product'], scope: 'offering' },
  ],
  'home-kitchen': [
    { name: 'material_type', data_type: 'select', description: 'Material composition', applicable_types: ['product'], scope: 'offering' },
    { name: 'power_consumption', data_type: 'number', description: 'Power consumption (watts)', applicable_types: ['product'], scope: 'offering' },
    { name: 'energy_rating', data_type: 'select', description: 'Energy efficiency rating', applicable_types: ['product'], scope: 'offering' },
    { name: 'capacity_liters', data_type: 'number', description: 'Capacity in liters', applicable_types: ['product'], scope: 'offering' },
    { name: 'dishwasher_safe', data_type: 'boolean', description: 'Dishwasher safe', applicable_types: ['product'], scope: 'offering' },
    { name: 'microwave_safe', data_type: 'boolean', description: 'Microwave safe', applicable_types: ['product'], scope: 'offering' },
    { name: 'dimensions_cm', data_type: 'text', description: 'Dimensions (L x W x H)', applicable_types: ['product'], scope: 'offering' },
    { name: 'non_stick', data_type: 'boolean', description: 'Non-stick coating', applicable_types: ['product'], scope: 'offering' },
  ],
  'earth-novers': [
    { name: 'equipment_type', data_type: 'select', description: 'Type of equipment', applicable_types: ['rental'], scope: 'offering' },
    { name: 'operating_weight', data_type: 'number', description: 'Operating weight in tons', applicable_types: ['rental'], scope: 'offering' },
    { name: 'engine_power', data_type: 'number', description: 'Engine power (HP)', applicable_types: ['rental'], scope: 'offering' },
    { name: 'operator_included', data_type: 'boolean', description: 'Operator service included', applicable_types: ['rental'], scope: 'offering' },
    { name: 'fuel_included', data_type: 'boolean', description: 'Fuel cost included', applicable_types: ['rental'], scope: 'offering' },
    { name: 'minimum_rental_hours', data_type: 'number', description: 'Minimum rental hours', applicable_types: ['rental'], scope: 'offering' },
  ],
  'music-litter': [
    { name: 'genre', data_type: 'select', description: 'Music genre', applicable_types: ['digital'], scope: 'offering' },
    { name: 'duration_minutes', data_type: 'number', description: 'Duration in minutes', applicable_types: ['digital'], scope: 'offering' },
    { name: 'language', data_type: 'select', description: 'Language', applicable_types: ['digital'], scope: 'offering' },
    { name: 'quality', data_type: 'select', description: 'Audio quality', applicable_types: ['digital'], scope: 'offering' },
    { name: 'artist', data_type: 'text', description: 'Artist name', applicable_types: ['digital'], scope: 'offering' },
    { name: 'album', data_type: 'text', description: 'Album name', applicable_types: ['digital'], scope: 'offering' },
  ]
};

interface ServiceAttribute {
  name: string;
  data_type: string;
  description: string;
  applicable_types: string[];
  scope: string;
}

interface ServiceType {
  id: string;
  title: string;
  is_active: boolean;
}

export const ServiceAttributeManager: React.FC = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [existingAttributes, setExistingAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [attributeStats, setAttributeStats] = useState<any>({});

  useEffect(() => {
    Promise.all([
      fetchServiceTypes(),
      fetchExistingAttributes(),
    ]).finally(() => setLoading(false));
  }, []);

  const fetchServiceTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("service_types")
        .select("id, title, is_active")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      setServiceTypes(data || []);
    } catch (error) {
      console.error('❌ Error fetching service types:', error);
    }
  }, []);

  const fetchExistingAttributes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("attribute_registry")
        .select("*");

      if (error) throw error;
      setExistingAttributes(data || []);
      
      // Calculate stats
      const stats: any = {};
      serviceTypes.forEach(service => {
        const serviceAttributes = data?.filter(attr => 
          attr.applicable_types?.some((type: string) => 
            SERVICE_ATTRIBUTE_MAPPINGS[service.id as keyof typeof SERVICE_ATTRIBUTE_MAPPINGS]?.some(mapping => 
              mapping.applicable_types.includes(type)
            )
          )
        ) || [];
        stats[service.id] = serviceAttributes.length;
      });
      setAttributeStats(stats);
    } catch (error) {
      console.error('❌ Error fetching attributes:', error);
    }
  }, [serviceTypes]);

  const syncAttributesForService = async (serviceId: string) => {
    setSyncLoading(true);
    try {
      const attributeMappings = SERVICE_ATTRIBUTE_MAPPINGS[serviceId as keyof typeof SERVICE_ATTRIBUTE_MAPPINGS];
      if (!attributeMappings) {
        toast({
          title: "Info",
          description: `No predefined attributes for service: ${serviceId}`,
        });
        return;
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const attr of attributeMappings) {
        const existingAttr = existingAttributes.find(existing => existing.name === attr.name);
        
        const attributeData = {
          name: attr.name,
          data_type: attr.data_type,
          description: attr.description,
          applicable_types: attr.applicable_types,
          scope: attr.scope,
          is_active: true,
          validation_rules: {},
          default_value: null,
          is_required: false,
          display_order: 0,
        };

        if (existingAttr) {
          // Update existing attribute to include new applicable types
          const updatedTypes = [...new Set([...existingAttr.applicable_types, ...attr.applicable_types])];
          
          if (JSON.stringify(updatedTypes.sort()) !== JSON.stringify(existingAttr.applicable_types.sort())) {
            const { error } = await supabase
              .from("attribute_registry")
              .update({ 
                applicable_types: updatedTypes,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingAttr.id);

            if (error) throw error;
            updatedCount++;
          }
        } else {
          // Create new attribute
          const { error } = await supabase
            .from("attribute_registry")
            .insert([attributeData]);

          if (error) throw error;
          createdCount++;
        }
      }

      toast({
        title: "Success",
        description: `Synced attributes for ${serviceId}: ${createdCount} created, ${updatedCount} updated`,
      });

      // Refresh data
      await fetchExistingAttributes();
    } catch (error: any) {
      console.error('❌ Error syncing attributes:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync attributes",
        variant: "destructive",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const syncAllAttributes = async () => {
    setSyncLoading(true);
    let totalCreated = 0;
    let totalUpdated = 0;

    try {
      for (const serviceType of serviceTypes) {
        const attributeMappings = SERVICE_ATTRIBUTE_MAPPINGS[serviceType.id as keyof typeof SERVICE_ATTRIBUTE_MAPPINGS];
        if (!attributeMappings) continue;

        for (const attr of attributeMappings) {
          const existingAttr = existingAttributes.find(existing => existing.name === attr.name);
          
          const attributeData = {
            name: attr.name,
            data_type: attr.data_type,
            description: attr.description,
            applicable_types: attr.applicable_types,
            scope: attr.scope,
            is_active: true,
            validation_rules: {},
            default_value: null,
            is_required: false,
            display_order: 0,
          };

          if (existingAttr) {
            // Update existing attribute to include new applicable types
            const updatedTypes = [...new Set([...existingAttr.applicable_types, ...attr.applicable_types])];
            
            if (JSON.stringify(updatedTypes.sort()) !== JSON.stringify(existingAttr.applicable_types.sort())) {
              const { error } = await supabase
                .from("attribute_registry")
                .update({ 
                  applicable_types: updatedTypes,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingAttr.id);

              if (error) throw error;
              totalUpdated++;
            }
          } else {
            // Create new attribute
            const { error } = await supabase
              .from("attribute_registry")
              .insert([attributeData]);

            if (error) throw error;
            totalCreated++;
          }
        }
      }

      toast({
        title: "Success",
        description: `Synced all attributes: ${totalCreated} created, ${totalUpdated} updated`,
      });

      // Refresh data
      await fetchExistingAttributes();
    } catch (error: any) {
      console.error('❌ Error syncing all attributes:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync all attributes",
        variant: "destructive",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading attribute manager...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Service Attribute Manager</h2>
          <p className="text-muted-foreground">
            Manage dynamic attributes for different service types
          </p>
        </div>
        <Button 
          onClick={syncAllAttributes}
          disabled={syncLoading}
        >
          {syncLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
          <Settings className="h-4 w-4 mr-2" />
          Sync All Attributes
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{serviceTypes.length}</div>
            <p className="text-xs text-muted-foreground">Active Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{existingAttributes.length}</div>
            <p className="text-xs text-muted-foreground">Total Attributes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Object.values(SERVICE_ATTRIBUTE_MAPPINGS).reduce((total, attrs) => total + attrs.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Predefined Attributes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Object.values(attributeStats).reduce((total: number, count: any) => total + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Configured Attributes</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Types and their Attributes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {serviceTypes.map((serviceType) => {
          const predefinedAttrs = SERVICE_ATTRIBUTE_MAPPINGS[serviceType.id as keyof typeof SERVICE_ATTRIBUTE_MAPPINGS] || [];
          const configuredCount = attributeStats[serviceType.id] || 0;
          const progress = predefinedAttrs.length > 0 ? (configuredCount / predefinedAttrs.length) * 100 : 100;
          
          return (
            <Card key={serviceType.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{serviceType.title}</CardTitle>
                  <Badge variant={progress === 100 ? "default" : "secondary"}>
                    {progress === 100 ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Complete</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" /> {Math.round(progress)}%</>
                    )}
                  </Badge>
                </div>
                <CardDescription>
                  Service ID: {serviceType.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Predefined</p>
                    <p className="font-semibold text-lg">{predefinedAttrs.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Configured</p>
                    <p className="font-semibold text-lg">{configuredCount}</p>
                  </div>
                </div>

                {predefinedAttrs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Sample Attributes:</p>
                    <div className="flex flex-wrap gap-1">
                      {predefinedAttrs.slice(0, 3).map((attr) => (
                        <Badge key={attr.name} variant="outline" className="text-xs">
                          {attr.name.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {predefinedAttrs.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{predefinedAttrs.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  variant={progress === 100 ? "outline" : "default"}
                  onClick={() => syncAttributesForService(serviceType.id)}
                  disabled={syncLoading || predefinedAttrs.length === 0}
                >
                  {syncLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {progress === 100 ? 'Re-sync Attributes' : 'Sync Attributes'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Attribute Management
          </CardTitle>
          <CardDescription>
            Automatic attribute generation based on service types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">How it works:</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Each service type has predefined attributes relevant to that service</li>
                <li>• Attributes are automatically created in the database when you sync</li>
                <li>• Existing attributes are updated to support additional service types</li>
                <li>• All attributes follow the current database schema requirements</li>
              </ul>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <Layers className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium">Dynamic Fields</p>
                <p className="text-sm text-gray-600">Attributes adapt to service needs</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <RefreshCw className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium">Real-time Sync</p>
                <p className="text-sm text-gray-600">Updates reflect immediately</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium">Schema Compliant</p>
                <p className="text-sm text-gray-600">Follows database standards</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


