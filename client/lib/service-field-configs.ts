// Field configurations for different service types
export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "switch";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  step?: string;
  min?: string;
  max?: string;
  rows?: number;
  unit?: string;
  description?: string;
}

export interface ServiceTypeConfig {
  id: string;
  name: string;
  icon: string;
  baseFields: string[]; // Fields that are always shown
  specificFields: FormField[]; // Service-specific fields
  description: string;
}

// Base fields that appear for all service types
export const baseFields: FormField[] = [
  {
    name: "name",
    label: "Product/Service Name",
    type: "text",
    required: true,
    placeholder: "Enter name",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    placeholder: "Enter description",
    rows: 3,
  },
  {
    name: "price",
    label: "Price",
    type: "number",
    required: true,
    placeholder: "0.00",
    step: "0.01",
    unit: "₹",
  },
  {
    name: "category_id",
    label: "Category",
    type: "select",
    required: false,
    placeholder: "Select category",
  },
  {
    name: "brand",
    label: "Brand",
    type: "text",
    required: false,
    placeholder: "Brand name",
  },
  {
    name: "sku",
    label: "SKU",
    type: "text",
    required: false,
    placeholder: "Product SKU",
  },
  {
    name: "is_active",
    label: "Active Product",
    type: "switch",
    required: false,
  },
];

// Service type configurations
export const serviceTypeConfigs: ServiceTypeConfig[] = [
  {
    id: "grocery",
    name: "Grocery Products",
    icon: "🛒",
    baseFields: [
      "name",
      "description",
      "price",
      "category_id",
      "brand",
      "sku",
      "is_active",
    ],
    description: "Add grocery products with stock and organic options",
    specificFields: [
      {
        name: "stock_quantity",
        label: "Stock Quantity",
        type: "number",
        required: true,
        placeholder: "0",
        unit: "units",
      },
      {
        name: "original_price",
        label: "Original Price",
        type: "number",
        required: false,
        placeholder: "0.00",
        step: "0.01",
        unit: "₹",
        description: "Original price before discount",
      },
      {
        name: "unit",
        label: "Unit",
        type: "select",
        required: true,
        options: [
          { value: "kg", label: "per kg" },
          { value: "gram", label: "per 100g" },
          { value: "piece", label: "per piece" },
          { value: "liter", label: "per liter" },
          { value: "ml", label: "per ml" },
          { value: "packet", label: "per packet" },
          { value: "box", label: "per box" },
        ],
      },
      {
        name: "discount",
        label: "Discount %",
        type: "number",
        required: false,
        placeholder: "0",
        min: "0",
        max: "100",
        unit: "%",
      },
      {
        name: "is_organic",
        label: "Organic Product",
        type: "switch",
        required: false,
      },
      {
        name: "is_fresh",
        label: "Fresh Product",
        type: "switch",
        required: false,
      },
    ],
  },
  {
    id: "car-rental",
    name: "Vehicle Rental",
    icon: "🚗",
    baseFields: ["name", "description", "brand", "sku", "is_active"],
    description: "Add vehicles for rental with specifications",
    specificFields: [
      {
        name: "price_per_day",
        label: "Price Per Day",
        type: "number",
        required: true,
        placeholder: "0.00",
        step: "0.01",
        unit: "₹",
      },
      {
        name: "price_per_hour",
        label: "Price Per Hour",
        type: "number",
        required: false,
        placeholder: "0.00",
        step: "0.01",
        unit: "₹",
      },
      {
        name: "year",
        label: "Year",
        type: "number",
        required: true,
        placeholder: "2024",
        min: "2000",
        max: "2030",
      },
      {
        name: "vehicle_category",
        label: "Vehicle Category",
        type: "select",
        required: true,
        options: [
          { value: "economy", label: "Economy" },
          { value: "compact", label: "Compact" },
          { value: "premium", label: "Premium" },
          { value: "luxury", label: "Luxury" },
          { value: "suv", label: "SUV" },
        ],
      },
      {
        name: "transmission",
        label: "Transmission",
        type: "select",
        required: true,
        options: [
          { value: "automatic", label: "Automatic" },
          { value: "manual", label: "Manual" },
        ],
      },
      {
        name: "fuel_type",
        label: "Fuel Type",
        type: "select",
        required: true,
        options: [
          { value: "petrol", label: "Petrol" },
          { value: "diesel", label: "Diesel" },
          { value: "hybrid", label: "Hybrid" },
          { value: "electric", label: "Electric" },
        ],
      },
      {
        name: "seats",
        label: "Number of Seats",
        type: "number",
        required: true,
        placeholder: "5",
        min: "2",
        max: "15",
      },
      {
        name: "doors",
        label: "Number of Doors",
        type: "number",
        required: false,
        placeholder: "4",
        min: "2",
        max: "6",
      },
      {
        name: "mileage",
        label: "Mileage",
        type: "text",
        required: false,
        placeholder: "15 km/l",
        unit: "km/l",
      },
      {
        name: "location",
        label: "Pickup Location",
        type: "text",
        required: true,
        placeholder: "City center, Airport, etc.",
      },
      {
        name: "features",
        label: "Features",
        type: "textarea",
        required: false,
        placeholder: "AC, GPS, Bluetooth, etc. (comma-separated)",
        rows: 2,
        description: "Enter features separated by commas",
      },
      {
        name: "available",
        label: "Currently Available",
        type: "switch",
        required: false,
      },
    ],
  },
  {
    id: "trips",
    name: "Trip Services",
    icon: "🚌",
    baseFields: [
      "name",
      "description",
      "price",
      "category_id",
      "brand",
      "is_active",
    ],
    description: "Add trip routes and bus services",
    specificFields: [
      {
        name: "from_location",
        label: "From Location",
        type: "text",
        required: true,
        placeholder: "Starting point",
      },
      {
        name: "to_location",
        label: "To Location",
        type: "text",
        required: true,
        placeholder: "Destination",
      },
      {
        name: "departure_time",
        label: "Departure Time",
        type: "text",
        required: true,
        placeholder: "09:00 AM",
      },
      {
        name: "arrival_time",
        label: "Arrival Time",
        type: "text",
        required: true,
        placeholder: "11:30 AM",
      },
      {
        name: "duration",
        label: "Duration",
        type: "text",
        required: false,
        placeholder: "2h 30m",
      },
      {
        name: "bus_type",
        label: "Bus Type",
        type: "select",
        required: true,
        options: [
          { value: "ac", label: "AC Bus" },
          { value: "non-ac", label: "Non-AC Bus" },
          { value: "sleeper", label: "Sleeper" },
          { value: "semi-sleeper", label: "Semi-Sleeper" },
          { value: "luxury", label: "Luxury" },
        ],
      },
      {
        name: "available_seats",
        label: "Available Seats",
        type: "number",
        required: true,
        placeholder: "45",
        min: "1",
        max: "100",
      },
      {
        name: "operator",
        label: "Operator",
        type: "text",
        required: false,
        placeholder: "Bus operator name",
      },
      {
        name: "amenities",
        label: "Amenities",
        type: "textarea",
        required: false,
        placeholder: "WiFi, Charging ports, etc. (comma-separated)",
        rows: 2,
        description: "Enter amenities separated by commas",
      },
    ],
  },
  {
    id: "handyman",
    name: "Handyman Services",
    icon: "🔧",
    baseFields: ["name", "description", "price", "category_id", "is_active"],
    description: "Add handyman and repair services",
    specificFields: [
      {
        name: "price_range",
        label: "Price Range",
        type: "text",
        required: false,
        placeholder: "₹500 - ₹2000",
        description: "Price range for the service",
      },
      {
        name: "duration",
        label: "Service Duration",
        type: "text",
        required: false,
        placeholder: "1-2 hours",
      },
      {
        name: "service_category",
        label: "Service Category",
        type: "select",
        required: true,
        options: [
          { value: "plumbing", label: "Plumbing" },
          { value: "electrical", label: "Electrical" },
          { value: "carpentry", label: "Carpentry" },
          { value: "painting", label: "Painting" },
          { value: "appliance-repair", label: "Appliance Repair" },
          { value: "general", label: "General Maintenance" },
        ],
      },
      {
        name: "urgency_levels",
        label: "Urgency Levels",
        type: "textarea",
        required: false,
        placeholder: "Normal, Urgent, Emergency (comma-separated)",
        rows: 2,
        description: "Available urgency levels",
      },
      {
        name: "includes_materials",
        label: "Includes Materials",
        type: "switch",
        required: false,
        description: "Whether materials are included in the price",
      },
      {
        name: "warranty_period",
        label: "Warranty Period",
        type: "text",
        required: false,
        placeholder: "30 days",
        description: "Service warranty period",
      },
    ],
  },
  {
    id: "electronics",
    name: "Electronics",
    icon: "📱",
    baseFields: [
      "name",
      "description",
      "price",
      "category_id",
      "brand",
      "sku",
      "is_active",
    ],
    description: "Add electronic devices and gadgets",
    specificFields: [
      {
        name: "stock_quantity",
        label: "Stock Quantity",
        type: "number",
        required: true,
        placeholder: "0",
        unit: "units",
      },
      {
        name: "original_price",
        label: "Original Price",
        type: "number",
        required: false,
        placeholder: "0.00",
        step: "0.01",
        unit: "₹",
      },
      {
        name: "discount",
        label: "Discount %",
        type: "number",
        required: false,
        placeholder: "0",
        min: "0",
        max: "100",
        unit: "%",
      },
      {
        name: "warranty",
        label: "Warranty Period",
        type: "text",
        required: false,
        placeholder: "1 year",
        description: "Warranty information",
      },
      {
        name: "model_number",
        label: "Model Number",
        type: "text",
        required: false,
        placeholder: "Device model number",
      },
      {
        name: "specifications",
        label: "Specifications",
        type: "textarea",
        required: false,
        placeholder: "Key specifications (one per line)",
        rows: 3,
        description: "Technical specifications",
      },
      {
        name: "color_options",
        label: "Color Options",
        type: "text",
        required: false,
        placeholder: "Black, White, Blue (comma-separated)",
        description: "Available colors",
      },
      {
        name: "has_installation",
        label: "Installation Service",
        type: "switch",
        required: false,
        description: "Includes installation service",
      },
    ],
  },
  {
    id: "home-kitchen",
    name: "Home & Kitchen",
    icon: "🏠",
    baseFields: [
      "name",
      "description",
      "price",
      "category_id",
      "brand",
      "sku",
      "is_active",
    ],
    description: "Add home and kitchen products",
    specificFields: [
      {
        name: "stock_quantity",
        label: "Stock Quantity",
        type: "number",
        required: true,
        placeholder: "0",
        unit: "units",
      },
      {
        name: "original_price",
        label: "Original Price",
        type: "number",
        required: false,
        placeholder: "0.00",
        step: "0.01",
        unit: "₹",
      },
      {
        name: "discount",
        label: "Discount %",
        type: "number",
        required: false,
        placeholder: "0",
        min: "0",
        max: "100",
        unit: "%",
      },
      {
        name: "material",
        label: "Material",
        type: "text",
        required: false,
        placeholder: "Stainless steel, Wood, Plastic, etc.",
      },
      {
        name: "dimensions",
        label: "Dimensions",
        type: "text",
        required: false,
        placeholder: "L x W x H (cm)",
        description: "Product dimensions",
      },
      {
        name: "weight",
        label: "Weight",
        type: "text",
        required: false,
        placeholder: "2.5 kg",
      },
      {
        name: "care_instructions",
        label: "Care Instructions",
        type: "textarea",
        required: false,
        placeholder: "Washing and maintenance instructions",
        rows: 2,
      },
      {
        name: "is_dishwasher_safe",
        label: "Dishwasher Safe",
        type: "switch",
        required: false,
      },
      {
        name: "is_microwave_safe",
        label: "Microwave Safe",
        type: "switch",
        required: false,
      },
    ],
  },
];

// Helper function to get service type from category
export const getServiceTypeFromCategory = (categoryName: string): string => {
  const name = categoryName.toLowerCase();

  // Electronics should be checked before handyman to avoid conflicts
  if (
    name.includes("mobile") ||
    name.includes("laptop") ||
    name.includes("phone") ||
    name.includes("electronic") ||
    name.includes("gadget") ||
    name.includes("tv") ||
    name.includes("computer") ||
    name.includes("tablet") ||
    name.includes("camera") ||
    name.includes("electrical work") ||
    name.includes("fan") ||
    name.includes("ac") ||
    name.includes("refrigerator") ||
    name.includes("washing machine") ||
    name.includes("microwave")
  ) {
    return "electronics";
  }

  if (
    name.includes("vegetable") ||
    name.includes("fruit") ||
    name.includes("dairy") ||
    name.includes("meat") ||
    name.includes("bakery") ||
    name.includes("beverage") ||
    name.includes("snack") ||
    name.includes("frozen")
  ) {
    return "grocery";
  }

  if (
    name.includes("car") ||
    name.includes("vehicle") ||
    name.includes("economy") ||
    name.includes("luxury") ||
    name.includes("rental")
  ) {
    return "car-rental";
  }

  if (
    name.includes("trip") ||
    name.includes("bus") ||
    name.includes("tour") ||
    name.includes("travel") ||
    name.includes("weekend")
  ) {
    return "trips";
  }

  // Handyman services (repair services, not electrical products)
  if (
    name.includes("repair") ||
    name.includes("plumbing") ||
    name.includes("handyman") ||
    name.includes("maintenance") ||
    name.includes("carpentry") ||
    name.includes("painting") ||
    name.includes("home repair") ||
    name.includes("fixing") ||
    name.includes("installation service")
  ) {
    return "handyman";
  }

  if (
    name.includes("kitchen") ||
    name.includes("home") ||
    name.includes("appliance") ||
    name.includes("decor") ||
    name.includes("cookware")
  ) {
    return "home-kitchen";
  }

  return "grocery"; // default
};

// Helper function to get service type config
export const getServiceTypeConfig = (
  serviceType: string,
): ServiceTypeConfig | null => {
  return serviceTypeConfigs.find((config) => config.id === serviceType) || null;
};
