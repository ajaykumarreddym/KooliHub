import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { SERVICES } from "@/lib/constants";
import { handleError } from "@/lib/error-utils";
import { MapPicker } from "./MapPicker";
import { MapPin, Edit3 } from "lucide-react";

interface GeoFence {
  type: "polygon" | "circle";
  coordinates: [number, number][];
  center?: [number, number];
  radius?: number;
}

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
  coordinates: any; // JSONB field from database
  created_at: string;
  updated_at: string;
}

interface EditServiceAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  area: ServiceArea | null;
}

export const EditServiceAreaModal: React.FC<EditServiceAreaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  area,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
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

  useEffect(() => {
    if (area) {
      setFormData({
        pincode: area.pincode,
        city: area.city,
        state: area.state,
        country: area.country,
        is_serviceable: area.is_serviceable,
        service_types: area.service_types || [],
        delivery_time_hours: area.delivery_time_hours?.toString() || "",
        delivery_charge: area.delivery_charge?.toString() || "",
      });

      // Parse existing coordinates if any
      if (area.coordinates) {
        try {
          const coords =
            typeof area.coordinates === "string"
              ? JSON.parse(area.coordinates)
              : area.coordinates;

          if (coords && coords.type) {
            setGeofence({
              type: coords.type,
              coordinates: coords.coordinates || [],
              center: coords.center,
              radius: coords.radius,
            });
          }
        } catch (error) {
          console.error("Error parsing coordinates:", error);
        }
      } else {
        setGeofence(null);
      }
    }
  }, [area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area) return;

    setLoading(true);

    try {
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
        .update({
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
        })
        .eq("id", area.id)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service area updated successfully with geo-fencing",
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = handleError(error, "Updating service area");
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

  if (!area) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Area</DialogTitle>
          <DialogDescription>
            Update the serviceable area information and geo-fencing
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="geofence" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geo-Fencing
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-pincode">Pincode *</Label>
                  <Input
                    id="edit-pincode"
                    value={formData.pincode}
                    onChange={(e) =>
                      handleInputChange("pincode", e.target.value)
                    }
                    placeholder="Enter pincode"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-city">City *</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter city name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State *</Label>
                  <Input
                    id="edit-state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Enter state name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
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
                  <Label htmlFor="edit-delivery_time">
                    Delivery Time (hours)
                  </Label>
                  <Input
                    id="edit-delivery_time"
                    type="number"
                    value={formData.delivery_time_hours}
                    onChange={(e) =>
                      handleInputChange("delivery_time_hours", e.target.value)
                    }
                    placeholder="24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-delivery_charge">Delivery Charge</Label>
                  <Input
                    id="edit-delivery_charge"
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
                <Label>Service Types</Label>
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-gray-50/50">
                  {Object.values(SERVICES).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`edit-${service.id}`}
                        checked={formData.service_types.includes(service.id)}
                        onCheckedChange={(checked) =>
                          handleServiceTypeToggle(
                            service.id,
                            checked as boolean,
                          )
                        }
                      />
                      <Label
                        htmlFor={`edit-${service.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {service.icon} {service.title}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Select the service types available in this area
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-serviceable"
                  checked={formData.is_serviceable}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_serviceable", checked)
                  }
                />
                <Label htmlFor="edit-serviceable">Currently Serviceable</Label>
              </div>

              <div className="pt-4">
                <Button
                  type="button"
                  onClick={() => setActiveTab("geofence")}
                  variant="outline"
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Edit Geo-Fencing
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="geofence" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Edit Service Coverage Area
                  </h4>
                  <p className="text-sm text-blue-700">
                    Modify the geographic area where services will be available
                    for {formData.city}, {formData.state}. You can update the
                    existing geo-fence or create a new one.
                  </p>
                  {geofence && (
                    <p className="text-sm text-blue-600 mt-2">
                      Current geo-fence: {geofence.type}
                      {geofence.type === "circle" && geofence.radius
                        ? ` (${geofence.radius}m radius)`
                        : geofence.type === "polygon"
                          ? ` (${geofence.coordinates.length} points)`
                          : ""}
                    </p>
                  )}
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
                      ✓ Geo-fence configured successfully. This area will be
                      used for precise service coverage validation.
                    </p>
                  </div>
                )}

                {!geofence && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-700">
                      ⚠ No geo-fence is currently defined. Service coverage
                      will be based on pincode only.
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
                  {loading ? "Updating..." : "Update Service Area"}
                </Button>
              </div>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
