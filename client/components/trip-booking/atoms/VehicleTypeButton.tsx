import { cn } from "@/lib/utils";
import { VehicleType } from "@shared/api";
import { Bike, Bus, Car, Truck } from "lucide-react";

interface VehicleTypeButtonProps {
  type: VehicleType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const vehicleIcons = {
  car: Car,
  suv: Car,
  van: Bus,
  bus: Bus,
  bike: Bike,
  auto: Truck, // Using Truck icon for auto-rickshaw
};

export function VehicleTypeButton({ type, label, isSelected, onClick }: VehicleTypeButtonProps) {
  const Icon = vehicleIcons[type] || Car;

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "flex flex-col items-center justify-center space-y-1 py-3 px-4 rounded-lg transition-all",
        isSelected
          ? "bg-[#137fec] text-white shadow-md"
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

