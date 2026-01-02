import { Layout } from "@/components/layout/Layout";
import { LocationResult, LocationSearchInput } from "@/components/trip-booking/molecules/LocationSearchInput";
import { TripFilters, TripFiltersSidebar } from "@/components/trip-booking/molecules/TripFiltersSidebar";
import { TripResultCard } from "@/components/trip-booking/molecules/TripResultCard";
import { Button } from "@/components/ui/button";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useTripSearch } from "@/hooks/trip-booking/useTripSearch";
import { cn } from "@/lib/utils";
import { TripWithDetails } from "@shared/api";
import { format, isToday, isTomorrow } from "date-fns";
import {
  ArrowLeftRight,
  Calendar,
  Frown,
  MapPin,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function TripSearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trips, loading, searchTrips } = useTripSearch();

  // Search state - initialize from URL params
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [fromLocation, setFromLocation] = useState<LocationResult | null>(null);
  const [toLocation, setToLocation] = useState<LocationResult | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dateParam = searchParams.get("date");
    return dateParam ? new Date(dateParam) : new Date();
  });
  const [passengers, setPassengers] = useState(() => 
    parseInt(searchParams.get("passengers") || "1")
  );

  // Inline edit mode state - separate for each field
  const [isEditingFrom, setIsEditingFrom] = useState(false);
  const [isEditingTo, setIsEditingTo] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isEditingPassengers, setIsEditingPassengers] = useState(false);
  const [editFrom, setEditFrom] = useState("");
  const [editTo, setEditTo] = useState("");
  const [editFromLocation, setEditFromLocation] = useState<LocationResult | null>(null);
  const [editToLocation, setEditToLocation] = useState<LocationResult | null>(null);

  // Filter state (matching BlaBlaCar style)
  const [filters, setFilters] = useState<TripFilters>({
    vehicleTypes: [],
    priceRange: [0, 10000],
    departureTimeRange: "all",
    amenities: [],
    sortBy: "time",
    verifiedOnly: false,
  });
  const [filteredTrips, setFilteredTrips] = useState<TripWithDetails[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const vehicleType = searchParams.get("vehicleType") as any;
  
  // Get coordinates from URL params
  const fromLat = searchParams.get("fromLat");
  const fromLon = searchParams.get("fromLon");
  const toLat = searchParams.get("toLat");
  const toLon = searchParams.get("toLon");
  
  const fromCoords = fromLat && fromLon 
    ? { lat: parseFloat(fromLat), lon: parseFloat(fromLon) }
    : undefined;
  const toCoords = toLat && toLon
    ? { lat: parseFloat(toLat), lon: parseFloat(toLon) }
    : undefined;

  // Initialize from URL on mount
  useEffect(() => {
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";
    const dateParam = searchParams.get("date");
    const passengersParam = parseInt(searchParams.get("passengers") || "1");
    
    setFrom(fromParam);
    setTo(toParam);
    setPassengers(passengersParam);
    
    if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }
    
    // Initialize fromLocation and toLocation if coordinates exist
    if (fromLat && fromLon) {
      setFromLocation({
        display_name: fromParam,
        lat: fromLat,
        lon: fromLon,
        place_id: Date.now(),
        address: {}
      });
    }
    if (toLat && toLon) {
      setToLocation({
        display_name: toParam,
        lat: toLat,
        lon: toLon,
        place_id: Date.now() + 1,
        address: {}
      });
    }
  }, []);

  // Perform search on mount and when params change
  useEffect(() => {
    if (from && to) {
      performSearch();
    }
  }, [from, to, selectedDate]);

  // Calculate filter counts based on all trips (before filtering)
  const filterCounts = useMemo(() => {
    return {
      afternoon: trips.filter(trip => {
        const hour = new Date(trip.departure_time).getHours();
        return hour >= 12 && hour < 18;
      }).length,
      evening: trips.filter(trip => {
        const hour = new Date(trip.departure_time).getHours();
        return hour >= 18;
      }).length,
      verifiedProfile: trips.filter(trip => trip.driver_avatar).length, // Proxy for verified
      maxTwo: trips.filter(trip => trip.total_seats && trip.total_seats <= 4).length,
      instantBooking: trips.filter(trip => trip.amenities?.includes("Instant Booking")).length,
      smokingAllowed: trips.filter(trip => trip.amenities?.includes("Smoking Allowed")).length,
      petsAllowed: trips.filter(trip => trip.amenities?.includes("Pet Friendly")).length,
    };
  }, [trips]);

  // Apply filters whenever trips or filters change
  useEffect(() => {
    let result = [...trips];

    // Filter by vehicle type
    if (filters.vehicleTypes.length > 0) {
      result = result.filter(trip => 
        filters.vehicleTypes.some(type => 
          trip.vehicle?.vehicle_type?.toLowerCase() === type.toLowerCase()
        )
      );
    }

    // Filter by price range
    result = result.filter(trip => {
      const price = parseFloat(String(trip.price_per_seat) || "0");
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Filter by departure time
    if (filters.departureTimeRange !== "all") {
      result = result.filter(trip => {
        const hour = new Date(trip.departure_time).getHours();
        switch (filters.departureTimeRange) {
          case "morning":
            return hour >= 6 && hour < 12;
          case "afternoon":
            return hour >= 12 && hour < 18;
          case "evening":
            return hour >= 18;
          default:
            return true;
        }
      });
    }

    // Filter by verified profile
    if (filters.verifiedOnly) {
      result = result.filter(trip => trip.driver_avatar); // Proxy for verified
    }

    // Filter by amenities
    if (filters.amenities.length > 0) {
      result = result.filter(trip => 
        filters.amenities.every(amenity => {
          if (amenity === "Max 2 in back") {
            return trip.total_seats && trip.total_seats <= 4;
          }
          return trip.amenities?.includes(amenity);
        })
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "price":
        result.sort((a, b) => 
          parseFloat(String(a.price_per_seat) || "0") - parseFloat(String(b.price_per_seat) || "0")
        );
        break;
      case "departure_proximity":
        if (fromCoords) {
          result.sort((a, b) => {
            const distA = (a as any).pickupDistanceKm || Infinity;
            const distB = (b as any).pickupDistanceKm || Infinity;
            return distA - distB;
          });
        }
        break;
      case "arrival_proximity":
        if (toCoords) {
          result.sort((a, b) => {
            const distA = (a as any).dropoffDistanceKm || Infinity;
            const distB = (b as any).dropoffDistanceKm || Infinity;
            return distA - distB;
          });
        }
        break;
      case "duration":
        result.sort((a, b) => {
          const durationA = (a as any).segmentDurationMinutes || (a as any).duration_minutes || 0;
          const durationB = (b as any).segmentDurationMinutes || (b as any).duration_minutes || 0;
          return durationA - durationB;
        });
        break;
      case "time":
      default:
        result.sort((a, b) => 
          new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()
        );
    }

    setFilteredTrips(result);
  }, [trips, filters, fromCoords, toCoords]);

  const performSearch = useCallback(() => {
    searchTrips({
      from,
      to,
      date: format(selectedDate, "yyyy-MM-dd"),
      vehicleType,
      min_seats: passengers,
      fromCoords: fromLocation ? { lat: parseFloat(fromLocation.lat), lon: parseFloat(fromLocation.lon) } : fromCoords,
      toCoords: toLocation ? { lat: parseFloat(toLocation.lat), lon: parseFloat(toLocation.lon) } : toCoords,
    });
  }, [from, to, selectedDate, vehicleType, passengers, fromLocation, toLocation, fromCoords, toCoords]);

  const handleTripClick = (trip: TripWithDetails & { 
    segmentPrice?: number; 
    segmentDurationMinutes?: number;
    matchedFrom?: string;
    matchedTo?: string;
  }) => {
    // Pass search context and segment pricing to trip details
    const params = new URLSearchParams({
      searchFrom: trip.matchedFrom || from,
      searchTo: trip.matchedTo || to,
    });
    if (fromCoords) {
      params.set('fromLat', fromCoords.lat.toString());
      params.set('fromLon', fromCoords.lon.toString());
    }
    if (toCoords) {
      params.set('toLat', toCoords.lat.toString());
      params.set('toLon', toCoords.lon.toString());
    }
    // Pass segment pricing info
    if (trip.segmentPrice !== undefined) {
      params.set('segmentPrice', trip.segmentPrice.toString());
    }
    if (trip.segmentDurationMinutes !== undefined) {
      params.set('segmentDuration', trip.segmentDurationMinutes.toString());
    }
    // Pass selected passengers count
    params.set('passengers', passengers.toString());
    
    navigate(`/trip-booking/trip/${trip.id}?${params.toString()}`);
  };

  // Open inline edit for From field
  const handleOpenEditFrom = () => {
    setEditFrom(from);
    setEditFromLocation(fromLocation);
    setIsEditingFrom(true);
    setIsEditingTo(false);
    setIsEditingPassengers(false);
  };

  // Open inline edit for To field
  const handleOpenEditTo = () => {
    setEditTo(to);
    setEditToLocation(toLocation);
    setIsEditingTo(true);
    setIsEditingFrom(false);
    setIsEditingPassengers(false);
  };

  // Open inline edit for Passengers
  const handleOpenEditPassengers = () => {
    setIsEditingPassengers(true);
    setIsEditingFrom(false);
    setIsEditingTo(false);
  };

  // Close all inline editors
  const closeAllEditors = () => {
    setIsEditingFrom(false);
    setIsEditingTo(false);
    setIsEditingDate(false);
    setIsEditingPassengers(false);
  };

  // Apply From location change
  const handleApplyFrom = (location: LocationResult) => {
    setFrom(location.display_name);
    setFromLocation(location);
    setIsEditingFrom(false);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set("from", location.display_name);
    params.set("fromLat", location.lat);
    params.set("fromLon", location.lon);
    setSearchParams(params);
  };

  // Apply To location change
  const handleApplyTo = (location: LocationResult) => {
    setTo(location.display_name);
    setToLocation(location);
    setIsEditingTo(false);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set("to", location.display_name);
    params.set("toLat", location.lat);
    params.set("toLon", location.lon);
    setSearchParams(params);
  };

  // Apply Passengers change
  const handleApplyPassengers = (count: number) => {
    setPassengers(count);
    setIsEditingPassengers(false);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set("passengers", count.toString());
    setSearchParams(params);
  };

  // Extract short location names
  const fromShort = from.split(",")[0].trim();
  const toShort = to.split(",")[0].trim();

  const handleSwapLocations = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Swap from and to values
    const tempFrom = from;
    const tempTo = to;
    const tempFromLocation = fromLocation;
    const tempToLocation = toLocation;
    
    setFrom(tempTo);
    setTo(tempFrom);
    setFromLocation(tempToLocation);
    setToLocation(tempFromLocation);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set("from", tempTo);
    params.set("to", tempFrom);
    if (tempToLocation) {
      params.set("fromLat", tempToLocation.lat);
      params.set("fromLon", tempToLocation.lon);
    }
    if (tempFromLocation) {
      params.set("toLat", tempFromLocation.lat);
      params.set("toLon", tempFromLocation.lon);
    }
    setSearchParams(params);
  };

  const isTodaySelected = isToday(selectedDate);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900">
        {/* BlaBlaCar Style Search Header */}
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm">
          {/* Main Search Bar */}
          <div className="border-b border-gray-100 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
              {/* Search Bar with Individual Clickable Fields */}
              <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-700/50 rounded-full border border-gray-200 dark:border-gray-600 max-w-4xl mx-auto shadow-sm relative">
                
                {/* From Location - Clickable with Popover */}
                <Popover open={isEditingFrom} onOpenChange={setIsEditingFrom}>
                  <PopoverTrigger asChild>
                    <button
                      onClick={handleOpenEditFrom}
                      className={cn(
                        "flex items-center gap-2 flex-1 min-w-0 pl-2 sm:pl-3 pr-2 py-1.5 rounded-full transition-all",
                        isEditingFrom 
                          ? "bg-white dark:bg-gray-600 shadow-sm ring-2 ring-[#00AEB9]/30" 
                          : "hover:bg-white dark:hover:bg-gray-600"
                      )}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00AEB9] flex-shrink-0 ring-2 ring-[#00AEB9]/20" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px] sm:max-w-[140px] text-left">
                        {fromShort || "Leaving from"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[340px] sm:w-[400px] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden" 
                    align="start"
                    sideOffset={8}
                  >
                    <div className="bg-white dark:bg-gray-800 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leaving from</h3>
                        <button 
                          onClick={() => setIsEditingFrom(false)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Close"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                      <LocationSearchInput
                        value={editFrom}
                        onChange={setEditFrom}
                        onSelectLocation={(loc) => {
                          setEditFromLocation(loc);
                          handleApplyFrom(loc);
                        }}
                        placeholder="City, address, or place"
                        icon="navigation"
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-12"
                        showMapPicker={true}
                        selectedLocation={editFromLocation}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Swap Button */}
                <button
                  onClick={handleSwapLocations}
                  className="flex-shrink-0 p-1.5 rounded-full bg-white dark:bg-gray-600 shadow-sm hover:shadow transition-all hover:scale-105 border border-gray-200 dark:border-gray-500 z-10"
                  title="Swap locations"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 text-[#00AEB9]" />
                </button>

                {/* To Location - Clickable with Popover */}
                <Popover open={isEditingTo} onOpenChange={setIsEditingTo}>
                  <PopoverTrigger asChild>
                    <button
                      onClick={handleOpenEditTo}
                      className={cn(
                        "flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 rounded-full transition-all",
                        isEditingTo 
                          ? "bg-white dark:bg-gray-600 shadow-sm ring-2 ring-[#00AEB9]/30" 
                          : "hover:bg-white dark:hover:bg-gray-600"
                      )}
                    >
                      <MapPin className="h-4 w-4 text-[#054752] dark:text-teal-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px] sm:max-w-[140px] text-left">
                        {toShort || "Going to"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[340px] sm:w-[400px] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden" 
                    align="start"
                    sideOffset={8}
                  >
                    <div className="bg-white dark:bg-gray-800 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Going to</h3>
                        <button 
                          onClick={() => setIsEditingTo(false)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Close"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                      <LocationSearchInput
                        value={editTo}
                        onChange={setEditTo}
                        onSelectLocation={(loc) => {
                          setEditToLocation(loc);
                          handleApplyTo(loc);
                        }}
                        placeholder="City, address, or place"
                        icon="pin"
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-12"
                        showMapPicker={true}
                        selectedLocation={editToLocation}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Vertical Divider */}
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-500 flex-shrink-0 hidden sm:block" />

                {/* Date Selector - Clickable with Calendar Popover */}
                <Popover open={isEditingDate} onOpenChange={setIsEditingDate}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                        isEditingDate 
                          ? "bg-white dark:bg-gray-600 shadow-sm ring-2 ring-[#00AEB9]/30" 
                          : "hover:bg-white dark:hover:bg-gray-600"
                      )}
                    >
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {isToday(selectedDate) ? "Today" : isTomorrow(selectedDate) ? "Tomorrow" : format(selectedDate, "d MMM")}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 border-0 shadow-2xl rounded-2xl overflow-hidden" 
                    align="center"
                    sideOffset={8}
                  >
                    <CustomCalendar
                      value={selectedDate}
                      onChange={(d) => {
                        if (d) {
                          setSelectedDate(d);
                          // Update URL params
                          const params = new URLSearchParams(searchParams);
                          params.set("date", format(d, "yyyy-MM-dd"));
                          setSearchParams(params);
                          // Close popover after selection
                          setIsEditingDate(false);
                        }
                      }}
                      minDate={new Date()}
                    />
                  </PopoverContent>
                </Popover>

                {/* Vertical Divider */}
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-500 flex-shrink-0 hidden sm:block" />

                {/* Passengers Selector - Clickable with Popover */}
                <Popover open={isEditingPassengers} onOpenChange={setIsEditingPassengers}>
                  <PopoverTrigger asChild>
                    <button
                      onClick={handleOpenEditPassengers}
                      className={cn(
                        "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                        isEditingPassengers 
                          ? "bg-white dark:bg-gray-600 shadow-sm ring-2 ring-[#00AEB9]/30" 
                          : "hover:bg-white dark:hover:bg-gray-600"
                      )}
                    >
                      <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {passengers}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[280px] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden" 
                    align="center"
                    sideOffset={8}
                  >
                    <div className="bg-white dark:bg-gray-800 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Passengers</h3>
                        <button 
                          onClick={() => setIsEditingPassengers(false)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Close"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          {passengers} {passengers === 1 ? "passenger" : "passengers"}
                        </span>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newCount = Math.max(1, passengers - 1);
                              handleApplyPassengers(newCount);
                            }}
                            disabled={passengers <= 1}
                            className="h-9 w-9 rounded-full"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">
                            {passengers}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newCount = Math.min(10, passengers + 1);
                              handleApplyPassengers(newCount);
                            }}
                            disabled={passengers >= 10}
                            className="h-9 w-9 rounded-full"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Search Button */}
                <Button 
                  size="sm" 
                  className="rounded-full bg-[#00AEB9] hover:bg-[#009CA8] text-white px-3 sm:px-5 h-9 font-semibold flex-shrink-0 shadow-sm transition-all hover:shadow-md ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeAllEditors();
                    performSearch();
                  }}
                >
                  <Search className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
            </div>
          </div>

        </header>

        {/* Main Content with Sidebar */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-[#054752] dark:text-teal-400">
                {isTodaySelected ? "Today" : format(selectedDate, "EEEE")}
              </span>
              <span>{fromShort} → {toShort}</span>
            </div>
            <span className="text-sm font-semibold text-[#054752] dark:text-teal-400">
              {filteredTrips.length} {filteredTrips.length === 1 ? "ride" : "rides"} available
            </span>
          </div>

          {/* Two Column Layout */}
          <div className="flex gap-8">
            {/* Left Sidebar - Filters (Desktop Only) */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <TripFiltersSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  filterCounts={filterCounts}
                />
              </div>
            </aside>

            {/* Right Column - Trip Cards */}
            <main className="flex-1 min-w-0">
              {/* Mobile Filter Button */}
              <div className="lg:hidden mb-4">
                <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2 rounded-xl h-11 border-gray-200 dark:border-gray-700"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters & Sort
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
                    <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <SheetTitle className="text-lg font-bold text-[#054752] dark:text-white">
                        Filters & Sort
                      </SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-4">
                      <TripFiltersSidebar
                        filters={filters}
                        onFiltersChange={setFilters}
                        filterCounts={filterCounts}
                        className="border-0 shadow-none p-0"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        onClick={() => setShowMobileFilters(false)}
                        className="w-full h-12 bg-[#00b3a3] hover:bg-[#00a090] text-white font-semibold rounded-xl"
                      >
                        Show {filteredTrips.length} results
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Trip Cards */}
          {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredTrips.length > 0 ? (
                <div className="flex flex-col gap-3">
              {filteredTrips.map((trip) => (
                <TripResultCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip)}
                      searchFrom={from}
                      searchTo={to}
                />
              ))}
            </div>
          ) : trips.length > 0 ? (
            /* No Results After Filtering */
                <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-gray-800 p-8 text-center border border-gray-100 dark:border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <Frown className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                No trips match your filters
              </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                Try adjusting your filters to see more results.
              </p>
              <Button
                variant="outline"
                    onClick={() => setFilters({
                      vehicleTypes: [],
                      priceRange: [0, 10000],
                      departureTimeRange: "all",
                      amenities: [],
                      sortBy: "time",
                      verifiedOnly: false,
                    })}
                    className="mt-4 rounded-full"
              >
                    Clear All Filters
              </Button>
            </div>
          ) : (
            /* Empty State */
                <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-gray-800 p-8 text-center border border-gray-100 dark:border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <Frown className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                No trips found
              </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                    There are no trips for this date. Try checking another day or create a ride alert.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleOpenEditFrom}
                    className="mt-4 rounded-full"
                  >
                    Search Again
                  </Button>
                </div>
              )}

              {/* Create Ride Alert Button */}
              {!loading && filteredTrips.length === 0 && (
                <div className="mt-6 text-center">
                  <Button 
                    variant="ghost" 
                    className="text-[#00b3a3] hover:text-[#00a090] hover:bg-[#00b3a3]/10 rounded-full"
                  >
                    Create a ride alert
                  </Button>
            </div>
          )}
        </main>
          </div>
        </div>

      </div>
    </Layout>
  );
}
