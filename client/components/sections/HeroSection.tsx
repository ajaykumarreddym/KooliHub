import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Shield, Star } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 lg:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ee8029\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"}></div>
      </div>

      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <div className="mb-6">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              🚀 Your one-stop service platform
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Everything You Need,
              <span className="text-primary block">All in One Place</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              {APP_CONFIG.description} Fast, reliable, and affordable services delivered right to your doorstep.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-gray-400">
                <Search className="h-5 w-5" />
                <span className="text-sm hidden sm:inline">Search</span>
              </div>
              <Input
                type="text"
                placeholder="Search for groceries, book a trip, rent a car, or find handyman services..."
                className="pl-16 pr-32 py-4 text-lg rounded-full border-2 focus:border-primary"
              />
              <Button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-8"
                size="sm"
              >
                Find Services
              </Button>
            </div>
          </div>

          {/* Key features */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Fast Delivery</h3>
              <p className="text-sm text-gray-600">30-min grocery delivery</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Trusted Service</h3>
              <p className="text-sm text-gray-600">Verified professionals</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Dubai Wide</h3>
              <p className="text-sm text-gray-600">All emirates covered</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">5-Star Rated</h3>
              <p className="text-sm text-gray-600">Customer satisfaction</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">50K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">100+</div>
                <div className="text-sm text-gray-600">Service Areas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-gray-600">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
