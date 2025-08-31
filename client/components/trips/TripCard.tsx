import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MapPin, Users, Wifi, Zap } from "lucide-react";

interface TripRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  price: number;
  duration: string;
  distance: string;
  departure_times: string[];
  vehicle_type: string;
  amenities: string[];
  rating: number | null;
  reviews_count: number;
  is_active: boolean;
}

interface TripCardProps {
  route: TripRoute;
  onSelect: (route: TripRoute) => void;
}

export function TripCard({ route, onSelect }: TripCardProps) {
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-3 w-3" />;
      case 'ac':
        return <span className="text-xs">❄️</span>;
      case 'usb charging':
        return <Zap className="h-3 w-3" />;
      default:
        return <span className="text-xs">✓</span>;
    }
  };

  const availableSeats = Math.floor(Math.random() * 20) + 10; // Simulate available seats

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🚌</div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{route.name}</h3>
              <p className="text-gray-600 text-sm">{route.vehicle_type}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">₹{route.price}</div>
            <div className="text-sm text-gray-500">per person</div>
          </div>
        </div>

        {/* Route details */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <MapPin className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-medium">{route.from}</div>
            <div className="text-xs text-gray-500">to {route.to}</div>
          </div>
          <div className="text-center">
            <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-medium">{route.duration}</div>
            <div className="text-xs text-gray-500">{route.distance}</div>
          </div>
          <div className="text-center">
            <Users className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-medium">{availableSeats} seats</div>
            <div className="text-xs text-gray-500">available</div>
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {route.amenities.map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                {getAmenityIcon(amenity)}
                {amenity}
              </Badge>
            ))}
          </div>
        </div>

        {/* Rating and reviews */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{route.rating ? route.rating.toFixed(1) : '4.5'}</span>
            <span className="text-gray-500 text-sm">({route.reviews_count || 0} reviews)</span>
          </div>
          <div className="text-sm text-gray-500">
            {route.departure_times.length} daily trips
          </div>
        </div>

        {/* Next departures */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Next departures today:</div>
          <div className="flex gap-2 flex-wrap">
            {route.departure_times.slice(0, 3).map((time, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs"
              >
                {time}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={() => onSelect(route)}
          className="w-full bg-primary text-black hover:bg-primary/90"
        >
          Book Seats
        </Button>
      </CardContent>
    </Card>
  );
}
