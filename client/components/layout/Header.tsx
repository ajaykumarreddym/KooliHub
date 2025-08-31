import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  ShoppingCart,
  User,
  Search,
  MapPin,
  Heart,
  ChevronDown,
  Settings,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlistContext } from "@/contexts/WishlistContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserProfile } from "@/components/auth/UserProfile";
import { LocationPicker } from "@/components/location/LocationPicker";
import {
  getLocationFromStorage,
  type LocationData,
} from "@/lib/location-utils";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SearchBox } from "@/components/search/SearchBox";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    getLocationFromStorage(),
  );
  const { state } = useCart();
  const { itemCount } = state;
  const { isAuthenticated, loading, isAdminUser, user } = useAuth();
  const { count: wishlistCount } = useWishlistContext();

  const handleLocationSelect = (location: LocationData) => {
    setCurrentLocation(location);
  };

  const categories = [
    { name: "Grocery", href: "/grocery", icon: "🛒" },
    { name: "Trip Booking", href: "/trips", icon: "🚌" },
    { name: "Car Rental", href: "/car-rental", icon: "🚗" },
    { name: "Handyman", href: "/handyman", icon: "🔧" },
    { name: "Home & Kitchen", href: "/home", icon: "🏠" },
    { name: "Electronics", href: "/electronics", icon: "📱" },
    { name: "Fashion", href: "/fashion", icon: "👗" },
    { name: "Beauty", href: "/beauty", icon: "💄" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      {/* Top notification bar */}
      <div className="bg-blue-600 text-white overflow-hidden">
        <div className="py-2">
          <div className="whitespace-nowrap animate-scroll">
            <span className="text-sm font-medium inline-block">
              🎉 EXTRA 20% OFF* With your KooliHub Credit Card - Use code: KH20
              | Free delivery on orders above ₹500 | 🎉 EXTRA 20% OFF* With your
              KooliHub Credit Card - Use code: KH20
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container">
        <div className="flex items-center justify-between py-3">
          {/* Logo and Location */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-primary text-black flex items-center justify-center font-bold text-lg">
                KH
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-2xl text-gray-900">
                  KooliHub
                </span>
                <span className="text-xs text-gray-600 -mt-1">
                  Local Hands, Local Deliveries
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <span>Deliver to</span>
              <LocationPicker
                showInDialog={true}
                onLocationSelect={handleLocationSelect}
                initialLocation={currentLocation}
                className="border-0 shadow-none bg-transparent p-0 h-auto"
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <SearchBox placeholder="What are you looking for?" />
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1 text-sm">
              <span className="text-gray-600">हिंदी</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-900 font-medium">English</span>
            </div>

            {!loading &&
              (isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  {/* Admin Panel Quick Access - Only for admin users */}
                  {(isAdminUser ||
                    user?.email === "hello.krsolutions@gmail.com") && (
                    <Link to="/admin/dashboard">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden lg:flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Settings className="h-4 w-4" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <UserProfile />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-gray-700"
                  onClick={() => setShowAuthModal(true)}
                >
                  Log in
                  <User className="h-4 w-4" />
                </Button>
              ))}

            <NotificationCenter />

            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </Badge>
              )}
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="pb-4 border-b">
                    <h2 className="text-lg font-semibold">Menu</h2>
                  </div>

                  {/* Authentication section in mobile menu */}
                  <div className="pb-4 border-b">
                    {!loading &&
                      (isAuthenticated ? (
                        <div className="space-y-2">
                          <UserProfile />
                          {/* Admin Panel Quick Access for mobile */}
                          {(isAdminUser ||
                            user?.email === "hello.krsolutions@gmail.com") && (
                            <Link to="/admin/dashboard">
                              <Button
                                variant="outline"
                                className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <Settings className="h-4 w-4" />
                                Admin Panel
                              </Button>
                            </Link>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 text-gray-700"
                          onClick={() => {
                            setShowAuthModal(true);
                            setIsMenuOpen(false);
                          }}
                        >
                          <User className="h-4 w-4" />
                          Log in
                        </Button>
                      ))}
                  </div>

                  <nav className="flex flex-col space-y-2">
                    {categories.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Category navigation */}
        <div className="hidden lg:flex items-center justify-between py-2 border-t border-gray-100">
          <nav className="flex items-center space-x-6">
            {categories.map((category) => (
              <Link
                key={category.href}
                to={category.href}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors py-2"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </header>
  );
}
