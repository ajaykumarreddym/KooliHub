import {
  calculateHaversineDistance,
  GeoCoordinates,
  matchTripByText,
} from "@/domain/services/TripSearchService";
import { supabase } from "@/lib/supabase";
import { TripWithDetails, VehicleType } from "@shared/api";
import { useCallback, useState } from "react";

// Search configuration - more flexible for better matching
const SEARCH_CONFIG = {
  DEFAULT_RADIUS_KM: 50, // Increased from 5km to 50km for better matching
  EXTENDED_RADIUS_KM: 100, // Extended radius for route matching
  MIN_MATCH_SCORE: 30,
};

interface TripSearchCriteria {
  from?: string;
  to?: string;
  date?: string;
  vehicleType?: VehicleType;
  min_seats?: number;
  passengers?: number;
  fromCoords?: GeoCoordinates;
  toCoords?: GeoCoordinates;
}

interface TripWithMatchScore extends TripWithDetails {
  matchScore?: number;
  pickupDistanceKm?: number;
  dropoffDistanceKm?: number;
  matchType?: 'origin-destination' | 'stopover-destination' | 'origin-stopover' | 'stopover-stopover' | 'text-match';
  matchedFrom?: string;
  matchedTo?: string;
  // Extended properties from route joins
  departure_location?: string;
  arrival_location?: string;
  departure_lat?: number;
  departure_lng?: number;
  arrival_lat?: number;
  arrival_lng?: number;
  distance_km?: number;
  duration_minutes?: number;
  driver_name?: string;
  driver_avatar?: string;
  driver_rating?: number;
  vehicle_name?: string;
  stopovers?: StopoverData[];
  // Segment-specific pricing and duration
  segmentPrice?: number;
  priceCalculationMethod?: string;
  segmentDurationMinutes?: number;
  estimatedDepartureTime?: string;
  estimatedArrivalTime?: string;
}

interface StopoverData {
  id: string;
  trip_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  stopover_order: number;
  price_from_origin?: number;
  estimated_arrival_time?: string;
  distance_from_origin_km?: number;
}

/**
 * Calculate segment price based on boarding and alighting points
 * Uses distance ratio if specific stopover prices aren't set
 */
function calculateSegmentPrice(
  fullPrice: number,
  totalDistanceKm: number,
  stopovers: StopoverData[],
  matchedFrom: string,
  matchedTo: string,
  tripOrigin: string,
  tripDestination: string
): { segmentPrice: number; priceCalculationMethod: string } {
  // If boarding at origin and alighting at destination, full price
  if (matchedFrom === tripOrigin && matchedTo === tripDestination) {
    return { segmentPrice: fullPrice, priceCalculationMethod: 'full-route' };
  }

  // Find stopover prices
  const fromStopover = stopovers.find(s => 
    s.location_name.toLowerCase().includes(matchedFrom.toLowerCase()) ||
    matchedFrom.toLowerCase().includes(s.location_name.toLowerCase())
  );
  
  const toStopover = stopovers.find(s => 
    s.location_name.toLowerCase().includes(matchedTo.toLowerCase()) ||
    matchedTo.toLowerCase().includes(s.location_name.toLowerCase())
  );

  // Case 1: Boarding at stopover, alighting at destination
  if (fromStopover && matchedTo === tripDestination) {
    if (fromStopover.price_from_origin && fromStopover.price_from_origin > 0) {
      // Use predefined stopover pricing
      const segmentPrice = fullPrice - fromStopover.price_from_origin;
      return { segmentPrice: Math.max(0, segmentPrice), priceCalculationMethod: 'stopover-price' };
    }
    // Fall back to distance ratio
    if (fromStopover.distance_from_origin_km && totalDistanceKm > 0) {
      const remainingDistance = totalDistanceKm - fromStopover.distance_from_origin_km;
      const ratio = remainingDistance / totalDistanceKm;
      return { segmentPrice: Math.round(fullPrice * ratio), priceCalculationMethod: 'distance-ratio' };
    }
    // Estimate by stopover order
    const totalStops = stopovers.length + 1; // +1 for destination
    const stopsRemaining = totalStops - fromStopover.stopover_order;
    const ratio = stopsRemaining / (totalStops + 1); // +1 for origin
    return { segmentPrice: Math.round(fullPrice * ratio), priceCalculationMethod: 'order-ratio' };
  }

  // Case 2: Boarding at origin, alighting at stopover
  if (matchedFrom === tripOrigin && toStopover) {
    if (toStopover.price_from_origin && toStopover.price_from_origin > 0) {
      return { segmentPrice: toStopover.price_from_origin, priceCalculationMethod: 'stopover-price' };
    }
    // Fall back to distance ratio
    if (toStopover.distance_from_origin_km && totalDistanceKm > 0) {
      const ratio = toStopover.distance_from_origin_km / totalDistanceKm;
      return { segmentPrice: Math.round(fullPrice * ratio), priceCalculationMethod: 'distance-ratio' };
    }
    // Estimate by stopover order
    const totalStops = stopovers.length + 1;
    const ratio = toStopover.stopover_order / (totalStops + 1);
    return { segmentPrice: Math.round(fullPrice * ratio), priceCalculationMethod: 'order-ratio' };
  }

  // Case 3: Stopover to stopover
  if (fromStopover && toStopover) {
    const fromPrice = fromStopover.price_from_origin || 0;
    const toPrice = toStopover.price_from_origin || 0;
    if (fromPrice > 0 && toPrice > 0) {
      return { segmentPrice: Math.max(0, toPrice - fromPrice), priceCalculationMethod: 'stopover-price' };
    }
    // Fall back to distance ratio
    const fromDist = fromStopover.distance_from_origin_km || 0;
    const toDist = toStopover.distance_from_origin_km || totalDistanceKm * 0.75;
    if (totalDistanceKm > 0) {
      const ratio = (toDist - fromDist) / totalDistanceKm;
      return { segmentPrice: Math.round(fullPrice * ratio), priceCalculationMethod: 'distance-ratio' };
    }
  }

  // Default: full price
  return { segmentPrice: fullPrice, priceCalculationMethod: 'default' };
}

/**
 * Calculate duration from distance using average speed
 * Average speed for Indian highways: ~55-60 km/h (accounting for traffic, stops, etc.)
 */
function calculateDurationFromDistance(distanceKm: number): number {
  const AVERAGE_SPEED_KMH = 55; // Conservative average for Indian roads
  return Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60); // Return minutes
}

/**
 * Calculate segment duration based on departure and stopover times
 */
function calculateSegmentDuration(
  totalDurationMinutes: number,
  totalDistanceKm: number,
  stopovers: StopoverData[],
  matchedFrom: string,
  matchedTo: string,
  tripOrigin: string,
  tripDestination: string,
  departureTime: string,
  arrivalTime: string
): { segmentDurationMinutes: number; estimatedDepartureTime: string; estimatedArrivalTime: string } {
  
  // If totalDurationMinutes is 0 or not set, calculate from distance
  let effectiveDuration = totalDurationMinutes;
  if (!effectiveDuration || effectiveDuration <= 0) {
    if (totalDistanceKm && totalDistanceKm > 0) {
      effectiveDuration = calculateDurationFromDistance(totalDistanceKm);
    } else {
      // Fallback: calculate from departure and arrival times
      const depTime = new Date(departureTime);
      const arrTime = new Date(arrivalTime);
      let durationMs = arrTime.getTime() - depTime.getTime();
      if (durationMs < 0) durationMs += 24 * 60 * 60 * 1000; // Handle overnight
      effectiveDuration = Math.round(durationMs / (1000 * 60));
      
      // If still seems wrong (less than 1 hour for intercity), estimate from distance
      if (effectiveDuration < 60 && totalDistanceKm > 50) {
        effectiveDuration = calculateDurationFromDistance(totalDistanceKm);
      }
    }
  }

  // If full route, use total duration
  if (matchedFrom === tripOrigin && matchedTo === tripDestination) {
    const depTime = new Date(departureTime);
    const estArrival = new Date(depTime.getTime() + effectiveDuration * 60 * 1000);
    
    return { 
      segmentDurationMinutes: effectiveDuration,
      estimatedDepartureTime: departureTime,
      estimatedArrivalTime: estArrival.toISOString()
    };
  }

  const fromStopover = stopovers.find(s => 
    s.location_name.toLowerCase().includes(matchedFrom.toLowerCase()) ||
    matchedFrom.toLowerCase().includes(s.location_name.toLowerCase())
  );
  
  const toStopover = stopovers.find(s => 
    s.location_name.toLowerCase().includes(matchedTo.toLowerCase()) ||
    matchedTo.toLowerCase().includes(s.location_name.toLowerCase())
  );

  // Calculate segment duration based on distance if available
  let segmentDuration: number;
  
  if (fromStopover?.distance_from_origin_km !== undefined && totalDistanceKm > 0) {
    // Calculate using actual distance
    const fromDistance = fromStopover.distance_from_origin_km;
    const toDistance = toStopover?.distance_from_origin_km || totalDistanceKm;
    const segmentDistance = toDistance - fromDistance;
    segmentDuration = calculateDurationFromDistance(segmentDistance);
  } else {
    // Fall back to stopover order ratio
    const totalStops = stopovers.length + 1; // including destination
    const fromOrder = fromStopover?.stopover_order || 0;
    const toOrder = toStopover?.stopover_order || (totalStops + 1);
    
    const segmentRatio = (toOrder - fromOrder) / (totalStops + 1);
    segmentDuration = Math.round(effectiveDuration * segmentRatio);
  }

  // Calculate estimated times
  const depTime = new Date(departureTime);
  const totalStops = stopovers.length + 1;
  const fromOrder = fromStopover?.stopover_order || 0;
  const fromTimeOffset = fromOrder > 0 ? Math.round(effectiveDuration * (fromOrder / (totalStops + 1))) : 0;
  const estDeparture = new Date(depTime.getTime() + fromTimeOffset * 60 * 1000);
  const estArrival = new Date(estDeparture.getTime() + segmentDuration * 60 * 1000);

  return {
    segmentDurationMinutes: Math.max(segmentDuration, 30), // Minimum 30 minutes for any segment
    estimatedDepartureTime: estDeparture.toISOString(),
    estimatedArrivalTime: estArrival.toISOString()
  };
}

export function useTripSearch() {
  const [trips, setTrips] = useState<TripWithMatchScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrips = useCallback(async (criteria: TripSearchCriteria) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Search Criteria:", criteria);

      // Fetch ALL active/scheduled trips with available seats
      let query = supabase
        .from("trips")
        .select(`
          *,
          driver:profiles!trips_driver_id_fkey(
            id, 
            full_name, 
            avatar_url,
            driver_profile:driver_profiles(average_rating)
          ),
          vehicle:vehicles!trips_vehicle_id_fkey(vehicle_type, make, model),
          route:routes!trips_route_id_fkey(
            departure_location,
            arrival_location,
            departure_lat,
            departure_lng,
            arrival_lat,
            arrival_lng,
            origin_lat,
            origin_lon,
            destination_lat,
            destination_lon,
            distance_km,
            estimated_duration_minutes
          )
        `)
        .in("status", ["active", "scheduled"])
        .gt("available_seats", 0);

      // Apply date filter - search for trips on or after the selected date
      if (criteria.date) {
        const searchDate = new Date(criteria.date);
        searchDate.setHours(0, 0, 0, 0);
        
        // Show trips for the selected date AND future dates
        query = query.gte("departure_time", searchDate.toISOString());
        
        console.log("📅 Date Filter:", { from: searchDate.toISOString() });
      } else {
        // Default to future trips only
        query = query.gte("departure_time", new Date().toISOString());
      }
      
      // Filter by minimum seats
      const requiredSeats = criteria.min_seats || criteria.passengers || 1;
      query = query.gte("available_seats", requiredSeats);

      const { data, error: queryError } = await query.order("departure_time", { ascending: true });

      if (queryError) {
        console.error("❌ Query Error:", queryError);
        throw queryError;
      }

      console.log("✅ Raw Query Results:", data?.length, "trips");

      // Fetch ALL stopovers (we'll filter trips later)
      const tripIds = (data || []).map((t: any) => t.id);
      let stopoversMap: Record<string, StopoverData[]> = {};
      
      if (tripIds.length > 0) {
        const { data: stopoversData } = await supabase
          .from("route_stopovers")
          .select("*")
          .in("trip_id", tripIds)
          .order("stopover_order", { ascending: true });
        
        if (stopoversData) {
          stopoversData.forEach((stopover: any) => {
            if (!stopoversMap[stopover.trip_id]) {
              stopoversMap[stopover.trip_id] = [];
            }
            stopoversMap[stopover.trip_id].push(stopover);
          });
        }
        console.log("📍 Loaded stopovers for", Object.keys(stopoversMap).length, "trips");
      }

      // Transform data with stopovers
      const transformedData: TripWithMatchScore[] = (data || []).map((trip: any) => {
        const depLat = trip.route?.departure_lat || trip.route?.origin_lat;
        const depLng = trip.route?.departure_lng || trip.route?.origin_lon;
        const arrLat = trip.route?.arrival_lat || trip.route?.destination_lat;
        const arrLng = trip.route?.arrival_lng || trip.route?.destination_lon;
        
        return {
          ...trip,
          departure_location: trip.route?.departure_location,
          arrival_location: trip.route?.arrival_location,
          departure_lat: depLat,
          departure_lng: depLng,
          arrival_lat: arrLat,
          arrival_lng: arrLng,
          distance_km: trip.route?.distance_km,
          duration_minutes: trip.route?.estimated_duration_minutes,
          driver_name: trip.driver?.full_name,
          driver_avatar: trip.driver?.avatar_url,
          driver_rating: trip.driver?.driver_profile?.average_rating,
          vehicle_name: trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : null,
          stopovers: stopoversMap[trip.id] || [],
        };
      });

      console.log("🔄 Transformed:", transformedData.length, "trips with stopovers");

      // Match trips - try ALL possible combinations
      const matchedTrips: TripWithMatchScore[] = [];
      const hasGeoCoords = criteria.fromCoords && criteria.toCoords;
      
      for (const trip of transformedData) {
        const stopovers = trip.stopovers || [];
        let bestMatch: {
          score: number;
          type: TripWithMatchScore['matchType'];
          pickupDistance: number;
          dropoffDistance: number;
          fromLocation: string;
          toLocation: string;
        } | null = null;

        // Build all pickup points (origin + all stopovers)
        const pickupPoints: Array<{ name: string; lat: number; lng: number; isOrigin: boolean; order: number }> = [];
        if (trip.departure_lat && trip.departure_lng) {
          pickupPoints.push({ 
            name: trip.departure_location || 'Origin', 
            lat: trip.departure_lat, 
            lng: trip.departure_lng,
            isOrigin: true,
            order: 0
          });
        }
        stopovers.forEach((s, idx) => {
          if (s.latitude && s.longitude) {
            pickupPoints.push({ 
              name: s.location_name, 
              lat: s.latitude, 
              lng: s.longitude,
              isOrigin: false,
              order: s.stopover_order || idx + 1
            });
          }
        });

        // Build all dropoff points (all stopovers + destination)
        const dropoffPoints: Array<{ name: string; lat: number; lng: number; isDestination: boolean; order: number }> = [];
        stopovers.forEach((s, idx) => {
          if (s.latitude && s.longitude) {
            dropoffPoints.push({ 
              name: s.location_name, 
              lat: s.latitude, 
              lng: s.longitude,
              isDestination: false,
              order: s.stopover_order || idx + 1
            });
          }
        });
        if (trip.arrival_lat && trip.arrival_lng) {
          dropoffPoints.push({ 
            name: trip.arrival_location || 'Destination', 
            lat: trip.arrival_lat, 
            lng: trip.arrival_lng,
            isDestination: true,
            order: 999
          });
        }

        // Try GEO-based matching first
        if (hasGeoCoords && pickupPoints.length > 0 && dropoffPoints.length > 0) {
          for (const pickup of pickupPoints) {
            const pickupDist = calculateHaversineDistance(
              criteria.fromCoords!.lat,
              criteria.fromCoords!.lon,
              pickup.lat,
              pickup.lng
            );

            // Skip if pickup is too far
            if (pickupDist > SEARCH_CONFIG.EXTENDED_RADIUS_KM) continue;

            for (const dropoff of dropoffPoints) {
              // Ensure dropoff is AFTER pickup in route order
              if (dropoff.order <= pickup.order) continue;

              const dropoffDist = calculateHaversineDistance(
                criteria.toCoords!.lat,
                criteria.toCoords!.lon,
                dropoff.lat,
                dropoff.lng
              );

              // Skip if dropoff is too far
              if (dropoffDist > SEARCH_CONFIG.EXTENDED_RADIUS_KM) continue;

              // Calculate match score - closer = higher score
              let score = 100;
              score -= (pickupDist / SEARCH_CONFIG.DEFAULT_RADIUS_KM) * 20;
              score -= (dropoffDist / SEARCH_CONFIG.DEFAULT_RADIUS_KM) * 20;

              // Determine match type
              let matchType: TripWithMatchScore['matchType'] = 'origin-destination';
              if (pickup.isOrigin && dropoff.isDestination) {
                matchType = 'origin-destination';
                score += 10; // Bonus for exact match
              } else if (pickup.isOrigin && !dropoff.isDestination) {
                matchType = 'origin-stopover';
              } else if (!pickup.isOrigin && dropoff.isDestination) {
                matchType = 'stopover-destination';
              } else {
                matchType = 'stopover-stopover';
              }

              if (!bestMatch || score > bestMatch.score) {
                bestMatch = {
                  score: Math.max(0, score),
                  type: matchType,
                  pickupDistance: pickupDist,
                  dropoffDistance: dropoffDist,
                  fromLocation: pickup.name,
                  toLocation: dropoff.name,
                };
              }
            }
          }
        }

        // ALWAYS try TEXT-based matching as fallback or additional matching
        if (!bestMatch || bestMatch.score < 70) {
          const searchFrom = (criteria.from || '').toLowerCase();
          const searchTo = (criteria.to || '').toLowerCase();

          // Check all pickup points for text match
          let fromMatched = false;
          let matchedFromLocation = '';
          
          if (!searchFrom) {
            fromMatched = true;
          } else {
            // Check origin
            if (matchTripByText(trip.departure_location || '', searchFrom)) {
              fromMatched = true;
              matchedFromLocation = trip.departure_location || '';
            }
            // Check stopovers
            if (!fromMatched) {
              for (const s of stopovers) {
                if (matchTripByText(s.location_name || '', searchFrom)) {
                  fromMatched = true;
                  matchedFromLocation = s.location_name;
                  break;
                }
              }
            }
          }

          // Check all dropoff points for text match
          let toMatched = false;
          let matchedToLocation = '';
          
          if (!searchTo) {
            toMatched = true;
          } else {
            // Check destination
            if (matchTripByText(trip.arrival_location || '', searchTo)) {
              toMatched = true;
              matchedToLocation = trip.arrival_location || '';
            }
            // Check stopovers
            if (!toMatched) {
              for (const s of stopovers) {
                if (matchTripByText(s.location_name || '', searchTo)) {
                  toMatched = true;
                  matchedToLocation = s.location_name;
                  break;
                }
              }
            }
          }

          if (fromMatched && toMatched) {
            const textScore = 75;
            if (!bestMatch || textScore > bestMatch.score) {
              bestMatch = {
                score: textScore,
                type: 'text-match',
                pickupDistance: 0,
                dropoffDistance: 0,
                fromLocation: matchedFromLocation || trip.departure_location || '',
                toLocation: matchedToLocation || trip.arrival_location || '',
              };
            }
          }
        }

        // Add trip if it matched
        if (bestMatch && bestMatch.score >= SEARCH_CONFIG.MIN_MATCH_SCORE) {
          trip.matchScore = Math.round(bestMatch.score);
          trip.matchType = bestMatch.type;
          trip.pickupDistanceKm = Math.round(bestMatch.pickupDistance * 100) / 100;
          trip.dropoffDistanceKm = Math.round(bestMatch.dropoffDistance * 100) / 100;
          trip.matchedFrom = bestMatch.fromLocation;
          trip.matchedTo = bestMatch.toLocation;
          
          // Calculate segment price
          const { segmentPrice, priceCalculationMethod } = calculateSegmentPrice(
            trip.price_per_seat || 0,
            trip.distance_km || 0,
            stopovers,
            bestMatch.fromLocation,
            bestMatch.toLocation,
            trip.departure_location || '',
            trip.arrival_location || ''
          );
          trip.segmentPrice = segmentPrice;
          trip.priceCalculationMethod = priceCalculationMethod;
          
          // Calculate segment duration
          const { segmentDurationMinutes, estimatedDepartureTime, estimatedArrivalTime } = calculateSegmentDuration(
            trip.duration_minutes || 0,
            trip.distance_km || 0,
            stopovers,
            bestMatch.fromLocation,
            bestMatch.toLocation,
            trip.departure_location || '',
            trip.arrival_location || '',
            trip.departure_time || new Date().toISOString(),
            trip.arrival_time || new Date().toISOString()
          );
          trip.segmentDurationMinutes = segmentDurationMinutes;
          trip.estimatedDepartureTime = estimatedDepartureTime;
          trip.estimatedArrivalTime = estimatedArrivalTime;
          
          matchedTrips.push(trip);
          
          console.log(`✅ Trip ${trip.id.slice(0, 8)}: ${bestMatch.type}, score=${trip.matchScore}, from="${bestMatch.fromLocation}" to="${bestMatch.toLocation}", price=₹${segmentPrice} (${priceCalculationMethod}), duration=${segmentDurationMinutes}min`);
        }
      }

      // Sort by match score (best matches first), then by departure time
      matchedTrips.sort((a, b) => {
        const scoreDiff = (b.matchScore || 0) - (a.matchScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
      });
      
      console.log("✨ Final Results:", matchedTrips.length, "trips");

      setTrips(matchedTrips);
      return matchedTrips;
    } catch (err) {
      console.error("💥 Search Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to search trips";
      setError(errorMessage);
      setTrips([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setTrips([]);
    setError(null);
  }, []);

  return { trips, loading, error, searchTrips, clearResults };
}
