export const APP_CONFIG = {
  name: "KooliHub",
  tagline: "Local Hands, Local Deliveries",
  description:
    "Get groceries delivered, book car seats for trips, rent vehicles, hire handyman services, and shop premium sarees - all in one place.",
  contact: {
    phone: "+91 98765 43210",
    email: "support@koolihub.in",
  },
};

export const SERVICES = {
  GROCERY: {
    id: "grocery",
    title: "Grocery Delivery",
    description: "Fresh groceries delivered to your doorstep in 30 minutes",
    icon: "🛒",
    color: "from-green-500 to-green-600",
    features: [
      "30-min delivery",
      "Fresh products",
      "Wide selection",
    ] as string[],
  },
  TRIPS: {
    id: "trips",
    title: "Trip Booking",
    description: "Book comfortable seats for predefined routes across the city",
    icon: "🚌",
    color: "from-blue-500 to-blue-600",
    features: [
      "Comfortable seats",
      "Fixed routes",
      "Reliable timing",
    ] as string[],
  },
  CAR_RENTAL: {
    id: "car-rental",
    title: "Car Rental",
    description: "Rent cars by the hour or day for your convenience",
    icon: "🚗",
    color: "from-purple-500 to-purple-600",
    features: [
      "Hourly/daily rates",
      "Wide fleet",
      "Insurance included",
    ] as string[],
  },
  HANDYMAN: {
    id: "handyman",
    title: "Handyman Services",
    description: "Professional repair and maintenance services at your home",
    icon: "🔧",
    color: "from-orange-500 to-orange-600",
    features: [
      "Expert technicians",
      "Quick estimates",
      "Quality assured",
    ] as string[],
  },
  ELECTRONICS: {
    id: "electronics",
    title: "Electronics",
    description: "Latest gadgets and electronic devices delivered fast",
    icon: "📱",
    color: "from-indigo-500 to-indigo-600",
    features: [
      "Latest gadgets",
      "Warranty included",
      "Fast delivery",
    ] as string[],
  },
  HOME_KITCHEN: {
    id: "home-kitchen",
    title: "Home & Kitchen",
    description: "Everything you need for your home and kitchen",
    icon: "🏠",
    color: "from-rose-500 to-rose-600",
    features: [
      "Quality products",
      "Home essentials",
      "Kitchen items",
    ] as string[],
  },
  SAREES: {
    id: "sarees",
    title: "Premium Sarees",
    description: "Exquisite collection of traditional and designer sarees",
    icon: "🌺",
    color: "from-pink-500 to-pink-600",
    features: [
      "Authentic fabrics",
      "Designer collection",
      "Handloom varieties",
    ] as string[],
  },
} as const;

export const NAVIGATION_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Grocery", href: "/grocery" },
  { label: "Trips", href: "/trips" },
  { label: "Car Rental", href: "/car-rental" },
  { label: "Handyman", href: "/handyman" },
  { label: "Sarees", href: "/sarees" },
  { label: "Orders", href: "/orders" },
  { label: "Support", href: "/support" },
];

export const FOOTER_LINKS = {
  services: [
    { label: "Grocery Delivery", href: "/grocery" },
    { label: "Trip Booking", href: "/trips" },
    { label: "Car Rental", href: "/car-rental" },
    { label: "Handyman", href: "/handyman" },
    { label: "Premium Sarees", href: "/sarees" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

export const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    text: "Amazing service! Got my groceries in 25 minutes. The quality is excellent.",
    rating: 5,
    service: "Grocery",
  },
  {
    name: "Ravi Kumar",
    text: "Booked a trip seat easily. Very comfortable and punctual service.",
    rating: 5,
    service: "Trips",
  },
  {
    name: "Lakshmi Reddy",
    text: "Rented a car for the weekend. Great prices and clean vehicles.",
    rating: 5,
    service: "Car Rental",
  },
  {
    name: "Rajesh Patel",
    text: "Fixed my AC in 2 hours. Professional and affordable handyman service.",
    rating: 5,
    service: "Handyman",
  },
  {
    name: "Meera Nair",
    text: "Beautiful Kanchipuram saree with authentic silk. Quality exceeded my expectations!",
    rating: 5,
    service: "Sarees",
  },
];
