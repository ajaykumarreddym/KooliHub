// OpenStreetMap Routing Machine (OSRM) API utilities

/**
 * OSRM Duration Correction Factor for Indian Roads
 * 
 * OSRM calculates duration based on ideal speed limits, but Indian roads have:
 * - Heavy traffic in towns/cities
 * - Mixed traffic (trucks, buses, autos, two-wheelers)
 * - Frequent toll plazas
 * - Road conditions varying significantly
 * - Construction zones and diversions
 * 
 * Comparison: Google Maps vs OSRM for same route (Rayachoty → Hyderabad):
 * - Google Maps: 468 km, 7h 53m (≈59 km/h avg)
 * - OSRM raw: 460 km, 5h 50m (≈79 km/h avg)
 * 
 * Correction factor: 7h53m / 5h50m ≈ 1.35
 */
const INDIA_ROAD_DURATION_FACTOR = 1.35;

export interface RouteOption {
  id: string;
  distance: number; // in meters
  duration: number; // in seconds (corrected for Indian roads)
  rawDuration: number; // in seconds (original OSRM value)
  geometry: Array<[number, number]>; // Array of [lat, lon]
  description: string;
}

export interface OSRMResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Array<[number, number]>;
    };
    legs: Array<{
      distance: number;
      duration: number;
      steps: any[];
    }>;
  }>;
}

/**
 * Calculate routes between two points using OSRM
 */
export async function calculateRoutes(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  alternatives: number = 3
): Promise<RouteOption[]> {
  try {
    // Using OSRM public demo server (for production, consider self-hosting)
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?alternatives=${alternatives}&geometries=geojson&overview=full&steps=true`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to calculate routes");
    }

    const data: OSRMResponse = await response.json();

    return data.routes.map((route, index) => {
      // Apply India road correction factor to duration
      const correctedDuration = Math.round(route.duration * INDIA_ROAD_DURATION_FACTOR);
      
      return {
      id: `route-${index}`,
      distance: route.distance,
        duration: correctedDuration, // Corrected for Indian road conditions
        rawDuration: route.duration, // Keep original for reference
      geometry: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
        description: getRouteDescription(route.distance, correctedDuration, index),
      };
    });
  } catch (error) {
    console.error("Error calculating routes:", error);
    // Return a simple direct route as fallback
    const directDistance = getDirectDistance(origin, destination);
    // Use realistic Indian road speed: ~55 km/h average
    const estimatedDuration = Math.round((directDistance / 1000) / 55 * 3600); // seconds
    
    return [
      {
        id: "route-direct",
        distance: directDistance,
        duration: estimatedDuration,
        rawDuration: estimatedDuration,
        geometry: [
          [origin.lat, origin.lon],
          [destination.lat, destination.lon],
        ],
        description: "Direct Route (estimated)",
      },
    ];
  }
}

/**
 * Get a human-readable route description
 * @param distanceMeters - Distance in meters
 * @param durationSeconds - Duration in seconds (already corrected for Indian roads)
 * @param index - Route index (0 = fastest)
 */
function getRouteDescription(distanceMeters: number, durationSeconds: number, index: number): string {
  const distanceKm = (distanceMeters / 1000).toFixed(0);
  const durationMin = Math.round(durationSeconds / 60);
  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;

  let timeStr = "";
  if (hours > 0) {
    timeStr = `${hours}h ${minutes}m`;
  } else {
    timeStr = `${minutes}m`;
  }

  if (index === 0) {
    return `Fastest Route - ${distanceKm} km, ${timeStr}`;
  } else if (index === 1) {
    return `Alternative Route - ${distanceKm} km, ${timeStr}`;
  } else {
    return `Route ${index + 1} - ${distanceKm} km, ${timeStr}`;
  }
}

/**
 * Calculate direct distance between two points (Haversine formula)
 */
function getDirectDistance(
  point1: { lat: number; lon: number },
  point2: { lat: number; lon: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLon = ((point2.lon - point1.lon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate price recommendation for carpooling based on distance
 * 
 * Carpooling pricing model (India):
 * - Based on fuel cost sharing + vehicle wear
 * - Average petrol price: ₹100/L
 * - Average car fuel economy: 12-15 km/L
 * - Recommended rate: ₹2/km per seat (standard Indian carpooling rate)
 */
export function calculatePriceRecommendation(distanceMeters: number): {
  min: number;
  max: number;
  recommended: number;
  perKmRate: number;
  breakdown: {
    fuelCost: number;
    tollEstimate: number;
    driverEarning: number;
  };
} {
  const distanceKm = distanceMeters / 1000;
  
  // Standard rate: ₹2/km per seat (consistent pricing)
  const perKmRate = 2.0;
  
  // Calculate base price
  const basePrice = distanceKm * perKmRate;
  
  // Minimum fare: ₹50 for very short trips
  const minFare = 50;
  const recommendedPrice = Math.max(minFare, Math.round(basePrice));
  
  // Calculate breakdown for transparency
  const fuelCostPerKm = 7.5; // ₹100/L petrol, ~13km/L economy
  const totalFuelCost = distanceKm * fuelCostPerKm;
  const tollEstimate = distanceKm > 50 ? Math.round(distanceKm * 0.4) : 0; // Rough toll estimate
  
  return {
    min: Math.max(minFare, Math.round(recommendedPrice * 0.8)),
    max: Math.round(recommendedPrice * 1.3),
    recommended: recommendedPrice,
    perKmRate: perKmRate,
    breakdown: {
      fuelCost: Math.round(totalFuelCost / 4), // Split among 4 passengers
      tollEstimate: Math.round(tollEstimate / 4),
      driverEarning: Math.round(recommendedPrice - (totalFuelCost / 4) - (tollEstimate / 4)),
    }
  };
}

/**
 * Calculate stopover price based on distance from origin
 * Price is proportional to the distance traveled
 */
export function calculateStopoverPrice(
  originLat: number,
  originLon: number,
  stopoverLat: number,
  stopoverLon: number,
  destinationLat: number,
  destinationLon: number,
  totalPrice: number
): number {
  // Calculate distances using Haversine
  const distanceToStopover = getDirectDistance(
    { lat: originLat, lon: originLon },
    { lat: stopoverLat, lon: stopoverLon }
  );
  const totalDistance = getDirectDistance(
    { lat: originLat, lon: originLon },
    { lat: destinationLat, lon: destinationLon }
  );
  
  // Calculate proportional price (minimum 30% discount from full price)
  const proportion = Math.min(0.7, distanceToStopover / totalDistance);
  const stopoverPrice = Math.round(totalPrice * proportion);
  
  // Minimum price of ₹30
  return Math.max(30, stopoverPrice);
}

/**
 * Find potential stopovers along a route
 */
export async function findStopoversAlongRoute(
  route: Array<[number, number]>,
  maxStopovers: number = 5
): Promise<Array<{ lat: number; lon: number; name: string; index: number }>> {
  // Simple implementation: suggest points at regular intervals along the route
  const stopovers: Array<{ lat: number; lon: number; name: string; index: number }> = [];
  
  const totalPoints = route.length;
  const interval = Math.floor(totalPoints / (maxStopovers + 1));

  for (let i = 1; i <= maxStopovers; i++) {
    const index = i * interval;
    if (index < totalPoints - 1) {
      const [lat, lon] = route[index];
      
      // Try to get location name from reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
          {
            headers: {
              "User-Agent": "KooliHub/1.0",
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const name =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.display_name?.split(",")[0] ||
            `Stopover ${i}`;

          stopovers.push({ lat, lon, name, index });
        }
      } catch (error) {
        console.error("Error fetching stopover name:", error);
        stopovers.push({ lat, lon, name: `Stopover ${i}`, index });
      }
    }
  }

  return stopovers;
}

