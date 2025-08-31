export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  category: "economy" | "compact" | "premium" | "luxury" | "suv";
  pricePerDay: number;
  pricePerHour: number;
  image: string;
  year: number;
  transmission: "automatic" | "manual";
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  seats: number;
  doors: number;
  features: string[];
  rating: number;
  reviewCount: number;
  available: boolean;
  location: string;
  mileage: string;
}

export const vehicles: Vehicle[] = [
  {
    id: "nissan-sunny",
    name: "Nissan Sunny",
    brand: "Nissan",
    category: "economy",
    pricePerDay: 1800,
    pricePerHour: 250,
    image: "🚗",
    year: 2023,
    transmission: "automatic",
    fuelType: "petrol",
    seats: 5,
    doors: 4,
    features: ["AC", "Power Steering", "USB Charging", "Bluetooth"],
    rating: 4.5,
    reviewCount: 234,
    available: true,
    location: "Rayachoty Center",
    mileage: "15 km/l",
  },
  {
    id: "toyota-camry",
    name: "Toyota Camry",
    brand: "Toyota",
    category: "premium",
    pricePerDay: 3800,
    pricePerHour: 500,
    image: "🚙",
    year: 2024,
    transmission: "automatic",
    fuelType: "hybrid",
    seats: 5,
    doors: 4,
    features: [
      "Leather Seats",
      "Sunroof",
      "Navigation",
      "Premium Audio",
      "Parking Sensors",
    ],
    rating: 4.8,
    reviewCount: 156,
    available: true,
    location: "Madanapalle",
    mileage: "18 km/l",
  },
  {
    id: "bmw-x5",
    name: "BMW X5",
    brand: "BMW",
    category: "luxury",
    pricePerDay: 8000,
    pricePerHour: 1100,
    image: "🚗",
    year: 2024,
    transmission: "automatic",
    fuelType: "petrol",
    seats: 7,
    doors: 5,
    features: [
      "Leather Interior",
      "Panoramic Roof",
      "Premium Sound",
      "360 Camera",
      "Heated Seats",
    ],
    rating: 4.9,
    reviewCount: 89,
    available: true,
    location: "Punganur",
    mileage: "12 km/l",
  },
  {
    id: "honda-accord",
    name: "Honda Accord",
    brand: "Honda",
    category: "compact",
    pricePerDay: 2600,
    pricePerHour: 360,
    image: "🚘",
    year: 2023,
    transmission: "automatic",
    fuelType: "petrol",
    seats: 5,
    doors: 4,
    features: ["AC", "Cruise Control", "Keyless Entry", "Backup Camera"],
    rating: 4.6,
    reviewCount: 198,
    available: true,
    location: "Muddanur",
    mileage: "16 km/l",
  },
  {
    id: "range-rover",
    name: "Range Rover Sport",
    brand: "Land Rover",
    category: "luxury",
    pricePerDay: 12000,
    pricePerHour: 1700,
    image: "🚙",
    year: 2024,
    transmission: "automatic",
    fuelType: "petrol",
    seats: 5,
    doors: 5,
    features: [
      "Premium Leather",
      "Air Suspension",
      "Meridian Audio",
      "Terrain Response",
      "Massage Seats",
    ],
    rating: 4.9,
    reviewCount: 67,
    available: false,
    location: "Rayachoty Highway",
    mileage: "10 km/l",
  },
  {
    id: "tesla-model-3",
    name: "Tesla Model 3",
    brand: "Tesla",
    category: "premium",
    pricePerDay: 6000,
    pricePerHour: 850,
    image: "⚡",
    year: 2024,
    transmission: "automatic",
    fuelType: "electric",
    seats: 5,
    doors: 4,
    features: [
      "Autopilot",
      "Premium Interior",
      "Supercharging",
      "OTA Updates",
      "Glass Roof",
    ],
    rating: 4.7,
    reviewCount: 123,
    available: true,
    location: "Kamalapuram",
    mileage: "450 km range",
  },
];

export const categories = [
  {
    id: "economy",
    name: "Economy",
    icon: "🚗",
    description: "Budget-friendly options",
  },
  {
    id: "compact",
    name: "Compact",
    icon: "🚘",
    description: "Perfect for city driving",
  },
  {
    id: "premium",
    name: "Premium",
    icon: "🚙",
    description: "Comfort and style",
  },
  {
    id: "luxury",
    name: "Luxury",
    icon: "✨",
    description: "Ultimate luxury experience",
  },
  { id: "suv", name: "SUV", icon: "🚛", description: "Space and capability" },
];
