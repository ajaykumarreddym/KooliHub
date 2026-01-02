import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminData } from "@/contexts/AdminDataContext";
import { toast } from "@/hooks/use-toast";
import { handleError } from "@/lib/error-utils";
import { supabase } from "@/lib/supabase";
import { Edit3, MapPin, Package } from "lucide-react";
import React, { useState } from "react";
import { MapPicker } from "./MapPicker";

interface GeoFence {
  type: "polygon" | "circle";
  coordinates: [number, number][];
  center?: [number, number];
  radius?: number;
}

interface AddServiceAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddServiceAreaModal: React.FC<AddServiceAreaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Get service types from database dynamically
  const { serviceTypes, loading: dataLoading } = useAdminData();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [pincodeValidation, setPincodeValidation] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isValid: null,
    message: "",
  });
  const [formData, setFormData] = useState({
    pincode: "",
    city: "",
    state: "",
    country: "India",
    is_serviceable: true,
    service_types: [] as string[],
    delivery_time_hours: "",
    delivery_charge: "",
  });
  const [geofence, setGeofence] = useState<GeoFence | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if pincode already exists
      const { data: existingArea, error: checkError } = await supabase
        .from("serviceable_areas")
        .select("pincode")
        .eq("pincode", formData.pincode)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingArea) {
        toast({
          title: "Pincode Already Exists",
          description: `A service area with pincode ${formData.pincode} already exists. Each pincode can only have one service area.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      // Prepare coordinates data for database
      let coordinatesData = null;
      if (geofence) {
        coordinatesData = {
          type: geofence.type,
          coordinates: geofence.coordinates,
          center: geofence.center,
          radius: geofence.radius,
        };
      }

      const { data, error } = await supabase
        .from("serviceable_areas")
        .insert([
          {
            pincode: formData.pincode,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            is_serviceable: formData.is_serviceable,
            service_types: formData.service_types,
            delivery_time_hours: formData.delivery_time_hours
              ? parseInt(formData.delivery_time_hours)
              : null,
            delivery_charge: formData.delivery_charge
              ? parseFloat(formData.delivery_charge)
              : null,
            coordinates: coordinatesData,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service area added successfully with geo-fencing",
      });

      // Reset form
      setFormData({
        pincode: "",
        city: "",
        state: "",
        country: "India",
        is_serviceable: true,
        service_types: [],
        delivery_time_hours: "",
        delivery_charge: "",
      });
      setGeofence(null);
      setActiveTab("basic");

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = handleError(error, "Adding service area");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceTypeToggle = (serviceId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      service_types: checked
        ? [...prev.service_types, serviceId]
        : prev.service_types.filter((id) => id !== serviceId),
    }));
  };

  const handleGeofenceChange = (newGeofence: GeoFence | null) => {
    setGeofence(newGeofence);
  };

  const validatePincode = async (pincode: string) => {
    if (!pincode || pincode.length < 4) {
      setPincodeValidation({
        isChecking: false,
        isValid: null,
        message: "",
      });
      return;
    }

    setPincodeValidation({
      isChecking: true,
      isValid: null,
      message: "Checking pincode availability...",
    });

    try {
      const { data: existingArea, error } = await supabase
        .from("serviceable_areas")
        .select("pincode")
        .eq("pincode", pincode)
        .maybeSingle();

      if (error) {
        setPincodeValidation({
          isChecking: false,
          isValid: null,
          message: "Error checking pincode",
        });
        return;
      }

      if (existingArea) {
        setPincodeValidation({
          isChecking: false,
          isValid: false,
          message: "This pincode is already covered by another service area",
        });
      } else {
        setPincodeValidation({
          isChecking: false,
          isValid: true,
          message: "Pincode available",
        });
      }
    } catch (error) {
      setPincodeValidation({
        isChecking: false,
        isValid: null,
        message: "Error checking pincode",
      });
    }
  };

  const canProceedToMap = formData.pincode && formData.city && formData.state;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service Area</DialogTitle>
          <DialogDescription>
            Add a new serviceable area with delivery details and geo-fencing
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger
              value="geofence"
              className="flex items-center gap-2"
              disabled={!canProceedToMap}
            >
              <MapPin className="h-4 w-4" />
              Geo-Fencing
              {!canProceedToMap && (
                <span className="text-xs text-gray-500">
                  (Complete basic info first)
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) =>
                      handleInputChange("pincode", e.target.value)
                    }
                    placeholder="Enter pincode"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter city name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Enter state name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Delivery Time (hours)</Label>
                  <Input
                    id="delivery_time"
                    type="number"
                    value={formData.delivery_time_hours}
                    onChange={(e) =>
                      handleInputChange("delivery_time_hours", e.target.value)
                    }
                    placeholder="24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_charge">Delivery Charge</Label>
                  <Input
                    id="delivery_charge"
                    type="number"
                    step="0.01"
                    value={formData.delivery_charge}
                    onChange={(e) =>
                      handleInputChange("delivery_charge", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Service Types</Label>
                  <span className="text-xs text-gray-500">
                    {serviceTypes.filter(s => s.is_active).length} available
                  </span>
                </div>
                <div className="border rounded-lg bg-gray-50/50">
                  {dataLoading.serviceTypes ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading service types...</span>
                    </div>
                  ) : serviceTypes.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <Package className="h-5 w-5 mr-2" />
                      <span className="text-sm">No service types available</span>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {serviceTypes
                          .filter(service => service.is_active)
                          .map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center space-x-2 p-2 rounded-md hover:bg-white/50 transition-colors"
                            >
                              <Checkbox
                                id={service.id}
                                checked={formData.service_types.includes(service.id)}
                                onCheckedChange={(checked) =>
                                  handleServiceTypeToggle(
                                    service.id,
                                    checked as boolean,
                                  )
                                }
                              />
                              <Label
                                htmlFor={service.id}
                                className="text-sm font-normal cursor-pointer flex items-center gap-1 min-w-0"
                              >
                                <span className="text-base">{service.icon}</span>
                                <span className="truncate">{service.title}</span>
                              </Label>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Select the service types available in this area</span>
                  <span className="text-blue-600">• Loaded from database</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="serviceable"
                  checked={formData.is_serviceable}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_serviceable", checked)
                  }
                />
                <Label htmlFor="serviceable">Currently Serviceable</Label>
              </div>

              {canProceedToMap && (
                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("geofence")}
                    variant="outline"
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Continue to Geo-Fencing (Optional)
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="geofence" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Define Service Coverage Area
                  </h4>
                  <p className="text-sm text-blue-700">
                    Draw a polygon or circle on the map to define the exact
                    geographic area where services will be available for{" "}
                    {formData.city}, {formData.state}. This is optional but
                    provides more precise coverage control than just pincode.
                  </p>
                </div>

                <MapPicker
                  onGeofenceChange={handleGeofenceChange}
                  initialGeofence={geofence}
                  center={[28.6139, 77.209]} // You might want to geocode the city/state for better centering
                  zoom={10}
                />

                {geofence && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      ✓ Geo-fence defined successfully. This area will be used
                      for precise service coverage validation.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <div className="flex justify-between space-x-2 pt-4 border-t">
              <div>
                {activeTab === "geofence" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("basic")}
                  >
                    Back to Basic Info
                  </Button>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Service Area"}
                </Button>
              </div>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
