import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Star, Heart, Plus, Minus, Filter } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface HomeKitchenProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  brand: string;
  description: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  inStock: boolean;
}

const homeKitchenProducts: HomeKitchenProduct[] = [
  {
    id: "cooking-pot",
    name: "Non-Stick Cooking Pot Set",
    price: 2400,
    originalPrice: 3200,
    image: "🍲",
    category: "Cookware",
    brand: "KitchenPro",
    description: "Premium non-stick cooking pot set with glass lids",
    rating: 4.7,
    reviewCount: 156,
    discount: 25,
    inStock: true
  },
  {
    id: "coffee-maker",
    name: "Automatic Coffee Maker",
    price: 3600,
    originalPrice: 4400,
    image: "☕",
    category: "Appliances",
    brand: "BrewMaster",
    description: "Programmable coffee maker with thermal carafe",
    rating: 4.8,
    reviewCount: 234,
    discount: 18,
    inStock: true
  },
  {
    id: "dinner-set",
    name: "Ceramic Dinner Set",
    price: 1520,
    image: "🍽️",
    category: "Dinnerware",
    brand: "ElegantHome",
    description: "Beautiful ceramic dinner set for 6 people",
    rating: 4.6,
    reviewCount: 89,
    inStock: true
  },
  {
    id: "storage-containers",
    name: "Food Storage Container Set",
    price: 640,
    originalPrice: 800,
    image: "📦",
    category: "Storage",
    brand: "FreshKeep",
    description: "Airtight food storage containers with smart lids",
    rating: 4.5,
    reviewCount: 312,
    discount: 20,
    inStock: true
  },
  {
    id: "blender",
    name: "High-Speed Blender",
    price: 2800,
    image: "🥤",
    category: "Appliances",
    brand: "BlendTech",
    description: "Powerful blender for smoothies and food processing",
    rating: 4.9,
    reviewCount: 445,
    inStock: true
  },
  {
    id: "cutting-board",
    name: "Bamboo Cutting Board Set",
    price: 560,
    originalPrice: 720,
    image: "🪵",
    category: "Accessories",
    brand: "EcoKitchen",
    description: "Sustainable bamboo cutting boards in 3 sizes",
    rating: 4.4,
    reviewCount: 167,
    discount: 22,
    inStock: true
  }
];

const categories = [
  { id: "all", name: "All Items", icon: "🏠" },
  { id: "cookware", name: "Cookware", icon: "🍳" },
  { id: "appliances", name: "Appliances", icon: "⚡" },
  { id: "dinnerware", name: "Dinnerware", icon: "🍽️" },
  { id: "storage", name: "Storage", icon: "📦" },
  { id: "accessories", name: "Accessories", icon: "🔪" }
];

export default function HomeKitchen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const { state, dispatch } = useCart();

  const filteredProducts = homeKitchenProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           product.category.toLowerCase() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: HomeKitchenProduct) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { 
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          category: product.category,
          brand: product.brand,
          description: product.description,
          unit: "piece",
          inStock: product.inStock,
          rating: product.rating,
          reviewCount: product.reviewCount,
          discount: product.discount
        }
      }
    });
  };

  const isInCart = (productId: string) => {
    return state.items.some(item => item.product.id === productId);
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Home & Kitchen</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Home & Kitchen</h1>
              <p className="text-gray-600">Transform your home with quality kitchen essentials and home goods</p>
            </div>
            
            <Badge className="bg-green-500 text-white self-start lg:self-center">
              Free delivery on orders above ₹500
            </Badge>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Shop by Category</h2>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${selectedCategory === category.id ? "ring-2 ring-primary" : ""} 
                           bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center transition-all`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <p className="text-xs font-medium leading-tight">{category.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search home & kitchen products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                {/* Image section */}
                <div className="relative bg-gray-50 h-48 flex items-center justify-center">
                  <span className="text-6xl opacity-80">{product.image}</span>
                  
                  {/* Discount badge */}
                  {product.discount && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold">
                      {product.discount}% OFF
                    </Badge>
                  )}

                  {/* Wishlist button */}
                  <button className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
                    <Heart className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs mb-1">
                      {product.brand}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{product.rating}</span>
                    <span className="text-xs text-gray-500">({product.reviewCount})</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{product.price.toFixed(0)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.originalPrice.toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* Add to cart */}
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock || isInCart(product.id)}
                    className="w-full bg-primary text-black hover:bg-primary/90"
                    size="sm"
                  >
                    {!product.inStock ? "Out of Stock" : 
                     isInCart(product.id) ? "Added to Cart" : "Add to Cart"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Featured categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Featured Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-orange-400 to-red-500 p-8 text-white text-center">
                  <div className="text-4xl mb-4">👨‍🍳</div>
                  <h3 className="text-xl font-bold mb-2">Chef's Collection</h3>
                  <p className="text-orange-100 mb-4">Professional-grade cookware for serious cooking</p>
                  <Button variant="secondary" size="sm">
                    Shop Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-green-400 to-blue-500 p-8 text-white text-center">
                  <div className="text-4xl mb-4">🏠</div>
                  <h3 className="text-xl font-bold mb-2">Smart Home</h3>
                  <p className="text-green-100 mb-4">Modern appliances for the connected home</p>
                  <Button variant="secondary" size="sm">
                    Explore
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-8 text-white text-center">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-xl font-bold mb-2">Premium Line</h3>
                  <p className="text-purple-100 mb-4">Luxury kitchen essentials for discerning taste</p>
                  <Button variant="secondary" size="sm">
                    Discover
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
