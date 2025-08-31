export interface HandymanService {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  priceRange: string;
  duration: string;
  rating: number;
  reviewCount: number;
  features: string[];
  estimatedPrice: {
    min: number;
    max: number;
  };
}

export interface ServiceRequest {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  serviceId: string;
  description: string;
  preferredDate: string;
  preferredTime: string;
  urgency: "normal" | "urgent" | "emergency";
  status: "pending" | "quoted" | "confirmed" | "in_progress" | "completed";
  images?: string[];
}

export const handymanServices: HandymanService[] = [
  {
    id: "ac-repair",
    name: "AC Repair & Maintenance",
    category: "HVAC",
    description: "Professional air conditioning repair, maintenance, and installation services",
    icon: "❄️",
    priceRange: "₹1,200 - 4,000",
    duration: "1-3 hours",
    rating: 4.8,
    reviewCount: 342,
    features: ["Licensed technicians", "Same day service", "1 year warranty", "Free diagnosis"],
    estimatedPrice: { min: 150, max: 500 }
  },
  {
    id: "plumbing",
    name: "Plumbing Services",
    category: "Plumbing",
    description: "Complete plumbing solutions including repairs, installations, and emergency services",
    icon: "🔧",
    priceRange: "₹800 - 3,200",
    duration: "30min - 2 hours",
    rating: 4.7,
    reviewCount: 567,
    features: ["24/7 emergency", "Licensed plumbers", "Quality parts", "Transparent pricing"],
    estimatedPrice: { min: 100, max: 400 }
  },
  {
    id: "electrical",
    name: "Electrical Work",
    category: "Electrical",
    description: "Safe and reliable electrical installations, repairs, and maintenance",
    icon: "⚡",
    priceRange: "₹960 - 4,800",
    duration: "1-4 hours",
    rating: 4.9,
    reviewCount: 234,
    features: ["Certified electricians", "Safety first", "Code compliant", "Emergency service"],
    estimatedPrice: { min: 120, max: 600 }
  },
  {
    id: "painting",
    name: "Painting Services",
    category: "Painting",
    description: "Professional interior and exterior painting with premium materials",
    icon: "🎨",
    priceRange: "₹1,600 - 16,000",
    duration: "4 hours - 3 days",
    rating: 4.6,
    reviewCount: 189,
    features: ["Premium paints", "Color consultation", "Clean finish", "Furniture protection"],
    estimatedPrice: { min: 200, max: 2000 }
  },
  {
    id: "appliance-repair",
    name: "Appliance Repair",
    category: "Appliances",
    description: "Expert repair services for all home appliances",
    icon: "🔨",
    priceRange: "₹800 - 6,400",
    duration: "1-3 hours",
    rating: 4.5,
    reviewCount: 423,
    features: ["All brands", "Genuine parts", "Quick diagnosis", "Warranty included"],
    estimatedPrice: { min: 100, max: 800 }
  },
  {
    id: "furniture-assembly",
    name: "Furniture Assembly",
    category: "Assembly",
    description: "Professional furniture assembly and installation services",
    icon: "🪑",
    priceRange: "₹640 - 2,400",
    duration: "30min - 2 hours",
    rating: 4.7,
    reviewCount: 298,
    features: ["IKEA specialist", "All tools included", "Clean assembly", "Wall mounting"],
    estimatedPrice: { min: 80, max: 300 }
  },
  {
    id: "deep-cleaning",
    name: "Deep Cleaning",
    category: "Cleaning",
    description: "Thorough deep cleaning services for homes and offices",
    icon: "🧽",
    priceRange: "₹1,600 - 6,400",
    duration: "3-6 hours",
    rating: 4.8,
    reviewCount: 512,
    features: ["Eco-friendly products", "Trained cleaners", "Insurance covered", "Satisfaction guarantee"],
    estimatedPrice: { min: 200, max: 800 }
  },
  {
    id: "carpentry",
    name: "Carpentry Work",
    category: "Carpentry",
    description: "Custom carpentry and woodwork solutions",
    icon: "🪚",
    priceRange: "₹1,200 - 12,000",
    duration: "2 hours - 2 days",
    rating: 4.6,
    reviewCount: 156,
    features: ["Custom solutions", "Quality wood", "Precision work", "Design consultation"],
    estimatedPrice: { min: 150, max: 1500 }
  }
];

export const serviceCategories = [
  { id: "hvac", name: "HVAC", icon: "❄️", count: 1 },
  { id: "plumbing", name: "Plumbing", icon: "🔧", count: 1 },
  { id: "electrical", name: "Electrical", icon: "⚡", count: 1 },
  { id: "painting", name: "Painting", icon: "🎨", count: 1 },
  { id: "appliances", name: "Appliances", icon: "🔨", count: 1 },
  { id: "assembly", name: "Assembly", icon: "🪑", count: 1 },
  { id: "cleaning", name: "Cleaning", icon: "🧽", count: 1 },
  { id: "carpentry", name: "Carpentry", icon: "🪚", count: 1 }
];
