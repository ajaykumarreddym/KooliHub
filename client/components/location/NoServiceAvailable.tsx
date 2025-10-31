import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";

interface NoServiceAvailableProps {
  locationName?: string;
  onChangeLocation?: () => void;
  variant?: "alert" | "card" | "full";
  showSuggestions?: boolean;
}

export function NoServiceAvailable({
  locationName,
  onChangeLocation,
  variant = "full",
  showSuggestions = true,
}: NoServiceAvailableProps) {
  
  // Alert variant - compact inline message
  if (variant === "alert") {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Service Not Available</AlertTitle>
        <AlertDescription className="text-orange-700">
          {locationName 
            ? `We don't currently deliver to ${locationName}. Please select a different location.`
            : "We don't currently deliver to your location. Please select a different area."}
          {onChangeLocation && (
            <Button
              variant="link"
              className="text-orange-700 underline p-0 ml-2 h-auto"
              onClick={onChangeLocation}
            >
              Change Location
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Card variant - compact card
  if (variant === "card") {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800 mb-1">
                Service Not Available
              </p>
              <p className="text-sm text-orange-700 mb-3">
                {locationName 
                  ? `We don't currently deliver to ${locationName}. Please select a different location.`
                  : "We don't currently deliver to your location. Please select a different area."}
              </p>
              {onChangeLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangeLocation}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Change Location
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant - complete empty state with suggestions
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
          <MapPin className="h-10 w-10 text-orange-600" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Service Not Available
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {locationName 
            ? `We're not currently servicing ${locationName}, but we're expanding rapidly.`
            : "We're not currently servicing your location, but we're expanding rapidly."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
        {onChangeLocation && (
          <Button onClick={onChangeLocation} size="lg">
            <MapPin className="h-5 w-5 mr-2" />
            Change Location
          </Button>
        )}
        <Button variant="outline" size="lg" asChild>
          <Link to="/">
            <Search className="h-5 w-5 mr-2" />
            Browse Other Services
          </Link>
        </Button>
      </div>

      {showSuggestions && (
        <div className="max-w-2xl mx-auto">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    We're expanding to your area soon!
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    We currently serve these cities:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-white text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                      Mumbai
                    </span>
                    <span className="text-xs bg-white text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                      Delhi
                    </span>
                    <span className="text-xs bg-white text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                      Bangalore
                    </span>
                    <span className="text-xs bg-white text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                      Chennai
                    </span>
                    <span className="text-xs bg-white text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                      Kolkata
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Want us in your city? Let us know and we'll prioritize your area!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default NoServiceAvailable;



