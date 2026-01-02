import { Button } from "@/components/ui/button";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { VehicleType } from "@shared/api";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Minus, Plus, Users } from "lucide-react";
import { useState } from "react";
import { VehicleTypeButton } from "../atoms/VehicleTypeButton";
import { LocationSearchInput, LocationResult } from "./LocationSearchInput";

interface TripSearchFormProps {
  onSearch: (criteria: {
    from: string;
    to: string;
    date: string;
    vehicleType: VehicleType;
    passengers: number;
    fromCoords?: { lat: number; lon: number };
    toCoords?: { lat: number; lon: number };
  }) => void;
}

export function TripSearchForm({ onSearch }: TripSearchFormProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date>(new Date()); // Default to today
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [passengers, setPassengers] = useState(1);
  const [fromLocation, setFromLocation] = useState<LocationResult | null>(null);
  const [toLocation, setToLocation] = useState<LocationResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ 
      from, 
      to, 
      date: date ? format(date, "yyyy-MM-dd") : "",
      vehicleType, 
      passengers,
      fromCoords: fromLocation ? { lat: parseFloat(fromLocation.lat), lon: parseFloat(fromLocation.lon) } : undefined,
      toCoords: toLocation ? { lat: parseFloat(toLocation.lat), lon: parseFloat(toLocation.lon) } : undefined,
    });
  };

  const incrementPassengers = () => {
    if (passengers < 10) {
      setPassengers(passengers + 1);
    }
  };

  const decrementPassengers = () => {
    if (passengers > 1) {
      setPassengers(passengers - 1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm space-y-3">
      {/* Leaving From */}
      <LocationSearchInput
        value={from}
        onChange={setFrom}
        onSelectLocation={setFromLocation}
        placeholder="Leaving from"
        icon="navigation"
        className="bg-gray-50 dark:bg-gray-900 border-0 focus-visible:ring-[#137fec]"
        showMapPicker={true}
        selectedLocation={fromLocation}
      />

      {/* Going To */}
      <LocationSearchInput
        value={to}
        onChange={setTo}
        onSelectLocation={setToLocation}
        placeholder="Going to"
        icon="pin"
        className="bg-gray-50 dark:bg-gray-900 border-0 focus-visible:ring-[#137fec]"
        showMapPicker={true}
        selectedLocation={toLocation}
      />

      {/* Date Picker with Calendar */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-gray-50 dark:bg-gray-900 border-0 hover:bg-gray-100 dark:hover:bg-gray-800",
              !date && "text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 shadow-2xl rounded-3xl" align="start">
          <CustomCalendar
            value={date}
            onChange={setDate}
            minDate={new Date()}
          />
        </PopoverContent>
      </Popover>

      {/* Passenger Count with Increment/Decrement */}
      <div className="relative flex items-center bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-3">
        <Users className="h-4 w-4 text-gray-400 mr-2" />
        <span className="flex-1 text-gray-900 dark:text-white">
          {passengers} {passengers === 1 ? "Passenger" : "Passengers"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decrementPassengers}
            disabled={passengers <= 1}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Decrease passengers"
          >
            <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={incrementPassengers}
            disabled={passengers >= 10}
            className="w-8 h-8 rounded-full bg-[#137fec] hover:bg-[#137fec]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Increase passengers"
          >
            <Plus className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Vehicle Type Selection */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <VehicleTypeButton
          type="car"
          label="Car"
          isSelected={vehicleType === "car"}
          onClick={() => setVehicleType("car")}
        />
        <VehicleTypeButton
          type="auto"
          label="Auto"
          isSelected={vehicleType === "auto"}
          onClick={() => setVehicleType("auto")}
        />
        <VehicleTypeButton
          type="bike"
          label="Bike"
          isSelected={vehicleType === "bike"}
          onClick={() => setVehicleType("bike")}
        />
      </div>

      {/* Search Button */}
      <Button type="submit" className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white font-semibold h-12">
        Search
      </Button>
    </form>
  );
}

