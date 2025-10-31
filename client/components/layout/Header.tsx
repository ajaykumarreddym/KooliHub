import { AuthModal } from "@/components/auth/AuthModal";
import { UserProfile } from "@/components/auth/UserProfile";
import { LocationPicker } from "@/components/location/LocationPicker";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SearchBox } from "@/components/search/SearchBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "@/contexts/LocationContext";
import { useWishlistContext } from "@/contexts/WishlistContext";
import { useLocationServiceTypes } from "@/hooks/use-location-services";
import { type LocationData } from "@/lib/location-utils";
import {
  Heart,
  Loader2,
  Menu,
  Settings,
  ShoppingCart,
  User
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const getServiceIcon = (serviceTypeId: string, iconFromDb?: string | null) => {
  if (iconFromDb) return iconFromDb;
  
  const icons: Record<string, string> = {
    grocery: "🛒",
    trips: "🚌",
    "car-rental": "🚗",
    handyman: "🔧",
    electronics: "📱",
    "home-kitchen": "🏠",
    beauty: "💄",
    fashion: "👗",
    sarees: "🥻",
    sports: "⚽",
    default: "🏪"
  };
  return icons[serviceTypeId] || icons.default;
};

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { currentLocation, setLocation, serviceAreaId } = useLocation();
  const { state } = useCart();
  const { itemCount } = state;
  const { isAuthenticated, loading, isAdminUser, user } = useAuth();
  const { count: wishlistCount } = useWishlistContext();

  // Load dynamic service types based on location
  const { serviceTypes, loading: servicesLoading } = useLocationServiceTypes(serviceAreaId);

  const handleLocationSelect = (location: LocationData) => {
    setLocation(location);
    // Force re-render by updating state
    window.dispatchEvent(new Event('locationUpdated'));
  };

  // Convert service types to navigation categories
  const categories = useMemo(() => {
    return serviceTypes.map(service => ({
      name: service.title,
      href: `/${service.service_type_id}`,
      icon: getServiceIcon(service.service_type_id, service.icon),
      count: service.product_count
    }));
  }, [serviceTypes]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b shadow-sm">
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

            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-gray-600">Deliver to</span>
              <LocationPicker
                showInDialog={true}
                onLocationSelect={handleLocationSelect}
                initialLocation={currentLocation}
                className="border-0 shadow-none bg-transparent p-0 h-auto hover:bg-gray-100 rounded-md transition-colors"
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

        {/* Category navigation - Dynamic based on location */}
        <div className="hidden lg:flex items-center justify-between py-2 border-t border-gray-100">
          <nav className="flex items-center space-x-6">
            {servicesLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading services...</span>
              </div>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.href}
                  to={category.href}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors py-2 relative"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                  {category.count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                      {category.count}
                    </Badge>
                  )}
                </Link>
              ))
            ) : (
              <div className="text-sm text-gray-500">
                {currentLocation 
                  ? `No services available in ${currentLocation.city}. Please select a different location.`
                  : "Select your location to see available services"}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </header>
  );
}
