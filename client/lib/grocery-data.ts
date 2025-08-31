export interface GroceryProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  brand: string;
  description: string;
  unit: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  discount?: number;
  isOrganic?: boolean;
  isFresh?: boolean;
}

export interface GroceryCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const groceryCategories: GroceryCategory[] = [
  { id: "fruits", name: "Fresh Fruits", icon: "🍎", color: "bg-red-50" },
  { id: "vegetables", name: "Vegetables", icon: "🥬", color: "bg-green-50" },
  { id: "dairy", name: "Dairy & Eggs", icon: "🥛", color: "bg-blue-50" },
  { id: "meat", name: "Meat & Seafood", icon: "🥩", color: "bg-red-50" },
  { id: "bakery", name: "Bakery", icon: "🍞", color: "bg-yellow-50" },
  { id: "beverages", name: "Beverages", icon: "🥤", color: "bg-purple-50" },
  { id: "snacks", name: "Snacks", icon: "🍿", color: "bg-orange-50" },
  { id: "frozen", name: "Frozen Foods", icon: "🧊", color: "bg-cyan-50" }
];

export const groceryProducts: GroceryProduct[] = [
  {
    id: "1",
    name: "Organic Red Apples",
    price: 180,
    originalPrice: 220,
    image: "🍎",
    category: "fruits",
    brand: "Fresh Valley",
    description: "Sweet and crispy organic red apples, perfect for snacking",
    unit: "per kg",
    inStock: true,
    rating: 4.8,
    reviewCount: 245,
    discount: 19,
    isOrganic: true,
    isFresh: true
  },
  {
    id: "2", 
    name: "Fresh Bananas",
    price: 60,
    originalPrice: 80,
    image: "🍌",
    category: "fruits",
    brand: "Tropical Fresh",
    description: "Ripe yellow bananas, great source of potassium",
    unit: "per kg",
    inStock: true,
    rating: 4.6,
    reviewCount: 189,
    discount: 15,
    isFresh: true
  },
  {
    id: "3",
    name: "Organic Baby Spinach",
    price: 150,
    originalPrice: 180,
    image: "🥬",
    category: "vegetables", 
    brand: "Green Garden",
    description: "Fresh organic baby spinach leaves, pre-washed",
    unit: "300g pack",
    inStock: true,
    rating: 4.9,
    reviewCount: 156,
    discount: 16,
    isOrganic: true,
    isFresh: true
  },
  {
    id: "4",
    name: "Fresh Tomatoes",
    price: 80,
    image: "🍅",
    category: "vegetables",
    brand: "Farm Fresh",
    description: "Juicy red tomatoes, perfect for salads and cooking",
    unit: "per kg",
    inStock: true,
    rating: 4.5,
    reviewCount: 234
  },
  {
    id: "5",
    name: "Whole Milk",
    price: 45,
    image: "🥛",
    category: "dairy",
    brand: "Pure Dairy",
    description: "Fresh whole milk, rich and creamy",
    unit: "1L bottle",
    inStock: true,
    rating: 4.7,
    reviewCount: 312
  },
  {
    id: "6",
    name: "Free Range Eggs",
    price: 120,
    originalPrice: 150,
    image: "🥚",
    category: "dairy",
    brand: "Happy Farm",
    description: "Free range chicken eggs, dozen pack",
    unit: "12 pieces",
    inStock: true,
    rating: 4.8,
    reviewCount: 198,
    discount: 17
  },
  {
    id: "7",
    name: "Fresh Salmon Fillet",
    price: 850,
    originalPrice: 950,
    image: "🐟",
    category: "meat",
    brand: "Ocean Fresh",
    description: "Premium Norwegian salmon fillet",
    unit: "per kg",
    inStock: true,
    rating: 4.9,
    reviewCount: 87,
    discount: 10,
    isFresh: true
  },
  {
    id: "8",
    name: "Artisan Bread",
    price: 65,
    image: "🍞",
    category: "bakery",
    brand: "Baker's Choice",
    description: "Freshly baked artisan bread, whole wheat",
    unit: "1 loaf",
    inStock: true,
    rating: 4.6,
    reviewCount: 145
  },
  {
    id: "9",
    name: "Orange Juice",
    price: 95,
    image: "🧃",
    category: "beverages",
    brand: "Pure Squeeze",
    description: "100% pure orange juice, no added sugar",
    unit: "1L carton",
    inStock: true,
    rating: 4.4,
    reviewCount: 267
  },
  {
    id: "10",
    name: "Mixed Nuts",
    price: 320,
    originalPrice: 380,
    image: "🥜",
    category: "snacks",
    brand: "Nutty Delights",
    description: "Premium mixed nuts, roasted and salted",
    unit: "500g pack",
    inStock: true,
    rating: 4.7,
    reviewCount: 123,
    discount: 17
  }
];
