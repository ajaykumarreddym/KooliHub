import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  MapPin, 
  Navigation, 
  Timer, 
  Zap, 
  Shield, 
  Cigarette, 
  PawPrint,
  Users,
  BadgeCheck,
  Banknote
} from "lucide-react";

export interface TripFilters {
  vehicleTypes: string[];
  priceRange: [number, number];
  departureTimeRange: string;
  amenities: string[];
  sortBy: "time" | "price" | "departure_proximity" | "arrival_proximity" | "duration";
  verifiedOnly: boolean;
}

interface FilterCount {
  afternoon: number;
  evening: number;
  verifiedProfile: number;
  maxTwo: number;
  instantBooking: number;
  smokingAllowed: number;
  petsAllowed: number;
}

interface TripFiltersSidebarProps {
  filters: TripFilters;
  onFiltersChange: (filters: TripFilters) => void;
  filterCounts: FilterCount;
  className?: string;
}

export function TripFiltersSidebar({
  filters,
  onFiltersChange,
  filterCounts,
  className,
}: TripFiltersSidebarProps) {

  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    onFiltersChange({ ...filters, amenities: newAmenities });
  };

  const handleClearAll = () => {
    onFiltersChange({
      vehicleTypes: [],
      priceRange: [0, 10000],
      departureTimeRange: "all",
      amenities: [],
      sortBy: "time",
      verifiedOnly: false,
    });
  };

  const hasActiveFilters = 
    filters.vehicleTypes.length > 0 ||
    filters.departureTimeRange !== "all" ||
    filters.amenities.length > 0 ||
    filters.verifiedOnly ||
    filters.sortBy !== "time";

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5", className)}>
      {/* Sort By Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#054752] dark:text-white">Sort by</h3>
          {hasActiveFilters && (
            <button 
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-[#00b3a3] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        
        <RadioGroup
          value={filters.sortBy}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, sortBy: value as TripFilters["sortBy"] })
          }
          className="space-y-2.5"
        >
          <label 
            className={cn(
              "flex items-center gap-3 cursor-pointer group",
              filters.sortBy === "time" && "text-[#00b3a3]"
            )}
          >
            <RadioGroupItem 
              value="time" 
              id="sort-time" 
              className="border-gray-300 text-[#00b3a3] data-[state=checked]:border-[#00b3a3] data-[state=checked]:bg-[#00b3a3]"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors flex items-center gap-2">
              Earliest departure
              <Clock className="h-4 w-4 text-gray-400" />
            </span>
          </label>
          
          <label 
            className={cn(
              "flex items-center gap-3 cursor-pointer group",
              filters.sortBy === "price" && "text-[#00b3a3]"
            )}
          >
            <RadioGroupItem 
              value="price" 
              id="sort-price"
              className="border-gray-300 text-[#00b3a3] data-[state=checked]:border-[#00b3a3] data-[state=checked]:bg-[#00b3a3]"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors flex items-center gap-2">
              Lowest price
              <Banknote className="h-4 w-4 text-gray-400" />
            </span>
          </label>
          
          <label 
            className={cn(
              "flex items-center gap-3 cursor-pointer group",
              filters.sortBy === "departure_proximity" && "text-[#00b3a3]"
            )}
          >
            <RadioGroupItem 
              value="departure_proximity" 
              id="sort-departure"
              className="border-gray-300 text-[#00b3a3] data-[state=checked]:border-[#00b3a3] data-[state=checked]:bg-[#00b3a3]"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors flex items-center gap-2">
              Close to departure point
              <Navigation className="h-4 w-4 text-[#00b3a3]" />
            </span>
          </label>
          
          <label 
            className={cn(
              "flex items-center gap-3 cursor-pointer group",
              filters.sortBy === "arrival_proximity" && "text-[#00b3a3]"
            )}
          >
            <RadioGroupItem 
              value="arrival_proximity" 
              id="sort-arrival"
              className="border-gray-300 text-[#00b3a3] data-[state=checked]:border-[#00b3a3] data-[state=checked]:bg-[#00b3a3]"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors flex items-center gap-2">
              Close to arrival point
              <MapPin className="h-4 w-4 text-[#00b3a3]" />
            </span>
          </label>
          
          <label 
            className={cn(
              "flex items-center gap-3 cursor-pointer group",
              filters.sortBy === "duration" && "text-[#00b3a3]"
            )}
          >
            <RadioGroupItem 
              value="duration" 
              id="sort-duration"
              className="border-gray-300 text-[#00b3a3] data-[state=checked]:border-[#00b3a3] data-[state=checked]:bg-[#00b3a3]"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors flex items-center gap-2">
              Shortest ride
              <Timer className="h-4 w-4 text-gray-400" />
            </span>
          </label>
        </RadioGroup>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-5" />

      {/* Departure Time Section */}
      <div className="mb-6">
        <h3 className="text-base font-bold text-[#054752] dark:text-white mb-4">Departure time</h3>
        
        <div className="space-y-2.5">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <Checkbox
                id="time-afternoon"
                checked={filters.departureTimeRange === "afternoon"}
                onCheckedChange={(checked) =>
                  onFiltersChange({ 
                    ...filters, 
                    departureTimeRange: checked ? "afternoon" : "all" 
                  })
                }
                className="border-gray-300 data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors">
                12:01 - 18:00
              </span>
            </div>
            <span className="text-sm text-gray-400">{filterCounts.afternoon}</span>
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <Checkbox
                id="time-evening"
                checked={filters.departureTimeRange === "evening"}
                onCheckedChange={(checked) =>
                  onFiltersChange({ 
                    ...filters, 
                    departureTimeRange: checked ? "evening" : "all" 
                  })
                }
                className="border-gray-300 data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors">
                After 18:00
              </span>
            </div>
            <span className="text-sm text-gray-400">{filterCounts.evening}</span>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-5" />

      {/* Trust and Safety Section */}
      <div className="mb-6">
        <h3 className="text-base font-bold text-[#054752] dark:text-white mb-4">Trust and safety</h3>
        
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-3">
            <Checkbox
              id="verified-profile"
              checked={filters.verifiedOnly}
              onCheckedChange={(checked) =>
                onFiltersChange({ ...filters, verifiedOnly: !!checked })
              }
              className="border-gray-300 data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors">
              Verified Profile
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{filterCounts.verifiedProfile}</span>
            <BadgeCheck className="h-4 w-4 text-[#00b3a3]" />
          </div>
        </label>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-5" />

      {/* Amenities Section */}
      <div>
        <h3 className="text-base font-bold text-[#054752] dark:text-white mb-4">Amenities</h3>
        
        <div className="space-y-2.5">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <Checkbox
                id="max-two"
                checked={filters.amenities.includes("Max 2 in back")}
                onCheckedChange={() => handleAmenityToggle("Max 2 in back")}
                className="border-gray-300 data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors">
                Max. 2 in the back
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{filterCounts.maxTwo}</span>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <Checkbox
                id="instant-booking"
                checked={filters.amenities.includes("Instant Booking")}
                onCheckedChange={() => handleAmenityToggle("Instant Booking")}
                className="border-gray-300 data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors">
                Instant Booking
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{filterCounts.instantBooking}</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <Checkbox
                id="smoking-allowed"
                checked={filters.amenities.includes("Smoking Allowed")}
                onCheckedChange={() => handleAmenityToggle("Smoking Allowed")}
                className="border-gray-300 data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors">
                Smoking allowed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{filterCounts.smokingAllowed}</span>
              <Cigarette className="h-4 w-4 text-gray-400" />
            </div>
          </label>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <Checkbox
                id="pets-allowed"
                checked={filters.amenities.includes("Pet Friendly")}
                onCheckedChange={() => handleAmenityToggle("Pet Friendly")}
                className="border-gray-300 data-[state=checked]:bg-[#00b3a3] data-[state=checked]:border-[#00b3a3]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#00b3a3] transition-colors">
                Pets allowed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{filterCounts.petsAllowed}</span>
              <PawPrint className="h-4 w-4 text-gray-400" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

