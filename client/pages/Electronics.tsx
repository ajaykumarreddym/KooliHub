import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Star, Heart, Zap, Shield, Truck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface ElectronicsProduct {
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
  warranty: string;
}

const electronicsProducts: ElectronicsProduct[] = [
  {
    id: "iphone-15",
    name: "iPhone 15 Pro Max",
    price: 134999,
    originalPrice: 139999,
    image: "📱",
    category: "Smartphones",
    brand: "Apple",
    description: "Latest iPhone with A17 Pro chip and titanium design",
    rating: 4.9,
    reviewCount: 2340,
    discount: 6,
    inStock: true,
    warranty: "1 year"
  },
  {
    id: "macbook-air",
    name: "MacBook Air M3",
    price: 119999,
    image: "💻",
    category: "Laptops",
    brand: "Apple",
    description: "Powerful and lightweight laptop with M3 chip",
    rating: 4.8,
    reviewCount: 1890,
    inStock: true,
    warranty: "1 year"
  },
  {
    id: "samsung-tv",
    name: "Samsung 65\" QLED 4K TV",
    price: 89999,
    originalPrice: 99999,
    image: "📺",
    category: "TVs",
    brand: "Samsung",
    description: "Crystal clear 4K QLED display with smart features",
    rating: 4.7,
    reviewCount: 567,
    discount: 13,
    inStock: true,
    warranty: "2 years"
  },
  {
    id: "airpods-pro",
    name: "AirPods Pro (3rd Gen)",
    price: 24999,
    originalPrice: 27999,
    image: "🎧",
    category: "Audio",
    brand: "Apple",
    description: "Active noise cancellation and spatial audio",
    rating: 4.6,
    reviewCount: 1234,
    discount: 10,
    inStock: true,
    warranty: "1 year"
  },
  {
    id: "ps5",
    name: "PlayStation 5 Console",
    price: 54999,
    image: "🎮",
    category: "Gaming",
    brand: "Sony",
    description: "Next-gen gaming console with 4K gaming",
    rating: 4.8,
    reviewCount: 890,
    inStock: false,
    warranty: "1 year"
  },
  {
    id: "nintendo-switch",
    name: "Nintendo Switch OLED",
    price: 39999,
    originalPrice: 44999,
    image: "🕹️",
    category: "Gaming",
    brand: "Nintendo",
    description: "Portable gaming console with vibrant OLED screen",
    rating: 4.7,
    reviewCount: 456,
    discount: 12,
    inStock: true,
    warranty: "1 year"
  },
  {
    id: "camera",
    name: "Canon EOS R6 Mark II",
    price: 249999,
    image: "📷",
    category: "Cameras",
    brand: "Canon",
    description: "Professional mirrorless camera with 24MP sensor",
    rating: 4.9,
    reviewCount: 234,
    inStock: true,
    warranty: "2 years"
  },
  {
    id: "tablet",
    name: "iPad Pro 12.9\" M2",
    price: 109999,
    originalPrice: 119999,
    image: "📱",
    category: "Tablets",
    brand: "Apple",
    description: "Professional tablet with M2 chip and Liquid Retina display",
    rating: 4.8,
    reviewCount: 678,
    discount: 9,
    inStock: true,
    warranty: "1 year"
  }
];

const categories = [
  { id: "all", name: "All Electronics", icon: "⚡" },
  { id: "smartphones", name: "Smartphones", icon: "📱" },
  { id: "laptops", name: "Laptops", icon: "💻" },
  { id: "tvs", name: "TVs", icon: "📺" },
  { id: "audio", name: "Audio", icon: "🎧" },
  { id: "gaming", name: "Gaming", icon: "🎮" },
  { id: "cameras", name: "Cameras", icon: "📷" },
  { id: "tablets", name: "Tablets", icon: "📱" }
];

export default function Electronics() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const { state, dispatch } = useCart();

  const filteredProducts = electronicsProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           product.category.toLowerCase() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: ElectronicsProduct) => {
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
            <span className="text-gray-900 font-medium">Electronics</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Electronics</h1>
              <p className="text-gray-600">Discover the latest in technology and innovation</p>
            </div>
            
            <Badge className="bg-blue-500 text-white self-start lg:self-center">
              Official warranty • Fast delivery
            </Badge>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Shield className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Authorized Retailer</h3>
            <p className="text-xs text-gray-600">Official warranty included</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Truck className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Express Delivery</h3>
            <p className="text-xs text-gray-600">Same day in Dubai</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Latest Tech</h3>
            <p className="text-xs text-gray-600">Newest models available</p>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Shop by Category</h2>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-4">
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
                placeholder="Search electronics..."
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
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-48 flex items-center justify-center">
                  <span className="text-6xl opacity-80">{product.image}</span>
                  
                  {/* Discount badge */}
                  {product.discount && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold">
                      {product.discount}% OFF
                    </Badge>
                  )}

                  {/* Stock status */}
                  {!product.inStock && (
                    <Badge className="absolute top-3 right-3 bg-gray-500 text-white text-xs">
                      Out of Stock
                    </Badge>
                  )}

                  {/* Wishlist button */}
                  <button className="absolute bottom-3 right-3 p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
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

                  {/* Rating and warranty */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                      <span className="text-xs text-gray-500">({product.reviewCount})</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.warranty} warranty
                    </Badge>
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

        {/* Brand showcase */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Featured Brands</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {["Apple", "Samsung", "Sony", "Canon"].map((brand) => (
              <div key={brand} className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="text-3xl mb-3">
                  {brand === "Apple" && "🍎"}
                  {brand === "Samsung" && "📱"}
                  {brand === "Sony" && "🎮"}
                  {brand === "Canon" && "📷"}
                </div>
                <h3 className="font-bold text-lg">{brand}</h3>
                <p className="text-gray-600 text-sm">Premium electronics</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
