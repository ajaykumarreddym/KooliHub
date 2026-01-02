import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  MapPin, 
  Navigation, 
  Timer, 
  Zap, 
  Cigarette, 
  PawPrint,
  Users,
  BadgeCheck,
  Banknote
} from "lucide-react";

// Re-export from sidebar for compatibility
export { TripFilters } from "./TripFiltersSidebar";
import { TripFilters } from "./TripFiltersSidebar";

interface TripFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TripFilters;
  onFiltersChange: (filters: TripFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export function TripFiltersDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: TripFiltersDialogProps) {
  const [localFilters, setLocalFilters] = useState<TripFilters>(filters);

  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = localFilters.amenities.includes(amenity)
      ? localFilters.amenities.filter(a => a !== amenity)
      : [...localFilters.amenities, amenity];
    setLocalFilters({ ...localFilters, amenities: newAmenities });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaultFilters: TripFilters = {
      vehicleTypes: [],
      priceRange: [0, 10000],
      departureTimeRange: "all",
      amenities: [],
      sortBy: "time",
      verifiedOnly: false,
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    onReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#054752]">Filters & Sort</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Sort By */}
          <div>
            <Label className="text-base font-semibold mb-3 block text-[#054752]">Sort by</Label>
            <RadioGroup
              value={localFilters.sortBy}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, sortBy: value as TripFilters["sortBy"] })
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="time" id="sort-time" className="text-[#00b3a3]" />
                <Label htmlFor="sort-time" className="font-normal cursor-pointer flex items-center gap-2">
                  Earliest departure
                  <Clock className="h-4 w-4 text-gray-400" />
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="price" id="sort-price" className="text-[#00b3a3]" />
                <Label htmlFor="sort-price" className="font-normal cursor-pointer flex items-center gap-2">
                  Lowest price
                  <Banknote className="h-4 w-4 text-gray-400" />
                </Label>
            </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="departure_proximity" id="sort-departure" className="text-[#00b3a3]" />
                <Label htmlFor="sort-departure" className="font-normal cursor-pointer flex items-center gap-2">
                  Close to departure point
                  <Navigation className="h-4 w-4 text-[#00b3a3]" />
                </Label>
          </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="arrival_proximity" id="sort-arrival" className="text-[#00b3a3]" />
                <Label htmlFor="sort-arrival" className="font-normal cursor-pointer flex items-center gap-2">
                  Close to arrival point
                  <MapPin className="h-4 w-4 text-[#00b3a3]" />
            </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="duration" id="sort-duration" className="text-[#00b3a3]" />
                <Label htmlFor="sort-duration" className="font-normal cursor-pointer flex items-center gap-2">
                  Shortest ride
                  <Timer className="h-4 w-4 text-gray-400" />
                </Label>
            </div>
            </RadioGroup>
          </div>

          {/* Departure Time */}
          <div>
            <Label className="text-base font-semibold mb-3 block text-[#054752]">Departure Time</Label>
            <RadioGroup
              value={localFilters.departureTimeRange}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, departureTimeRange: value })
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="all" id="time-all" className="text-[#00b3a3]" />
                <Label htmlFor="time-all" className="font-normal cursor-pointer">Any time</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="morning" id="time-morning" className="text-[#00b3a3]" />
                <Label htmlFor="time-morning" className="font-normal cursor-pointer">Before 12:00</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="afternoon" id="time-afternoon" className="text-[#00b3a3]" />
                <Label htmlFor="time-afternoon" className="font-normal cursor-pointer">12:01 - 18:00</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="evening" id="time-evening" className="text-[#00b3a3]" />
                <Label htmlFor="time-evening" className="font-normal cursor-pointer">After 18:00</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Trust & Safety */}
          <div>
            <Label className="text-base font-semibold mb-3 block text-[#054752]">Trust and safety</Label>
            <div className="flex items-center space-x-3">
                  <Checkbox
                id="verified-profile"
                checked={localFilters.verifiedOnly}
                onCheckedChange={(checked) =>
                  setLocalFilters({ ...localFilters, verifiedOnly: !!checked })
                }
                className="data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
                  />
              <Label htmlFor="verified-profile" className="font-normal cursor-pointer flex items-center gap-2">
                Verified Profile
                <BadgeCheck className="h-4 w-4 text-[#00b3a3]" />
                  </Label>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <Label className="text-base font-semibold mb-3 block text-[#054752]">Amenities</Label>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="max-two"
                  checked={localFilters.amenities.includes("Max 2 in back")}
                  onCheckedChange={() => handleAmenityToggle("Max 2 in back")}
                  className="data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
                />
                <Label htmlFor="max-two" className="font-normal cursor-pointer flex items-center gap-2">
                  Max. 2 in the back
                  <Users className="h-4 w-4 text-gray-400" />
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="instant-booking"
                  checked={localFilters.amenities.includes("Instant Booking")}
                  onCheckedChange={() => handleAmenityToggle("Instant Booking")}
                  className="data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
                />
                <Label htmlFor="instant-booking" className="font-normal cursor-pointer flex items-center gap-2">
                  Instant Booking
                  <Zap className="h-4 w-4 text-amber-500" />
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="smoking-allowed"
                  checked={localFilters.amenities.includes("Smoking Allowed")}
                  onCheckedChange={() => handleAmenityToggle("Smoking Allowed")}
                  className="data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
                />
                <Label htmlFor="smoking-allowed" className="font-normal cursor-pointer flex items-center gap-2">
                  Smoking allowed
                  <Cigarette className="h-4 w-4 text-gray-400" />
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="pets-allowed"
                  checked={localFilters.amenities.includes("Pet Friendly")}
                  onCheckedChange={() => handleAmenityToggle("Pet Friendly")}
                  className="data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
                />
                <Label htmlFor="pets-allowed" className="font-normal cursor-pointer flex items-center gap-2">
                  Pets allowed
                  <PawPrint className="h-4 w-4 text-gray-400" />
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1 rounded-xl">
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-[#00b3a3] hover:bg-[#00a090] rounded-xl">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
