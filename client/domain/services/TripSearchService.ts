/**
 * Trip Search Service
 * Domain Service for searching trips with geo-matching
 * Clean Architecture - Domain Layer
 */

export interface GeoCoordinates {
  lat: number;
  lon: number;
}

export interface TripSearchCriteria {
  from?: string;
  to?: string;
  date?: string;
  vehicleType?: string;
  passengers?: number;
  fromCoords?: GeoCoordinates;
  toCoords?: GeoCoordinates;
}

export interface SearchMatchResult {
  matchScore: number;
  pickupDistanceKm: number;
  dropoffDistanceKm: number;
  isWithinRadius: boolean;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Normalize text for phonetic comparison
 * Handles common Indian transliteration variations
 */
function normalizeForPhonetics(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove common suffixes that vary
    .replace(/puram$|pur$|bad$|abad$|nagar$|pally$|palli$/i, '')
    // Normalize vowel variations common in Indian transliteration
    .replace(/y/g, 'i')           // Rayachoty → Rayachoti
    .replace(/ee/g, 'i')          // Sree → Sri
    .replace(/oo/g, 'u')          // Poona → Puna
    .replace(/aa/g, 'a')          // Raampur → Rampur
    .replace(/th/g, 't')          // Tirupathi → Tirupati
    .replace(/dh/g, 'd')          // Madhapur → Madapur
    .replace(/bh/g, 'b')          // Bharat → Barat
    .replace(/gh/g, 'g')          // Ghaziabad → Gaziabad
    .replace(/kh/g, 'k')          // Khammam → Kammam
    .replace(/ph/g, 'f')          // Phulera → Fulera
    .replace(/sh/g, 's')          // Shimla → Simla
    .replace(/ch/g, 'c')          // Chandigarh → Candigarh
    // Normalize consonant variations
    .replace(/w/g, 'v')           // Vijayawada → Vijayavada
    .replace(/z/g, 's')           // Vizag → Visag
    // Remove repeated consonants
    .replace(/(.)\1+/g, '$1')     // Kolkatta → Kolkata
    // Remove silent vowels at end
    .replace(/[aeiou]$/g, '');
}

/**
 * Calculate Levenshtein distance between two strings
 */
function getLevenshteinDistance(str1: string, str2: string): number {
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[str1.length][str2.length];
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 and 1 (1 = exact match)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getLevenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

/**
 * Check if two strings are phonetically similar
 * Handles Indian transliteration variations dynamically
 */
function arePhoneticallySimilar(str1: string, str2: string): boolean {
  const norm1 = normalizeForPhonetics(str1);
  const norm2 = normalizeForPhonetics(str2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // One contains the other after normalization
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // High similarity on normalized forms (allow 2 edits for every 5 chars)
  const allowedEdits = Math.max(2, Math.floor(Math.max(norm1.length, norm2.length) / 3));
  if (getLevenshteinDistance(norm1, norm2) <= allowedEdits) return true;
  
  return false;
}

/**
 * Check if a trip matches the search criteria within a given radius
 */
export function matchTripWithinRadius(
  tripPickup: GeoCoordinates,
  tripDropoff: GeoCoordinates,
  searchPickup: GeoCoordinates,
  searchDropoff: GeoCoordinates,
  radiusKm: number = 5
): SearchMatchResult {
  const pickupDistanceKm = calculateHaversineDistance(
    tripPickup.lat,
    tripPickup.lon,
    searchPickup.lat,
    searchPickup.lon
  );
  
  const dropoffDistanceKm = calculateHaversineDistance(
    tripDropoff.lat,
    tripDropoff.lon,
    searchDropoff.lat,
    searchDropoff.lon
  );
  
  const isWithinRadius = pickupDistanceKm <= radiusKm && dropoffDistanceKm <= radiusKm;
  
  // Calculate match score (0-100)
  // Higher score = better match
  let matchScore = 100;
  
  // Deduct points based on distance
  if (pickupDistanceKm <= radiusKm) {
    matchScore -= (pickupDistanceKm / radiusKm) * 25; // Max 25 points deduction for pickup
  } else {
    matchScore -= 50; // 50 points deduction if outside radius
  }
  
  if (dropoffDistanceKm <= radiusKm) {
    matchScore -= (dropoffDistanceKm / radiusKm) * 25; // Max 25 points deduction for dropoff
  } else {
    matchScore -= 50; // 50 points deduction if outside radius
  }
  
  return {
    matchScore: Math.max(0, matchScore),
    pickupDistanceKm: Math.round(pickupDistanceKm * 100) / 100,
    dropoffDistanceKm: Math.round(dropoffDistanceKm * 100) / 100,
    isWithinRadius,
  };
}

/**
 * Match trip by text with dynamic fuzzy matching
 * Uses phonetic algorithms to handle Indian transliteration variations
 */
export function matchTripByText(
  tripLocation: string,
  searchTerm: string,
  similarityThreshold: number = 0.65
): boolean {
  if (!tripLocation || !searchTerm) return false;
  
  const tripLower = tripLocation.toLowerCase().trim();
  const searchLower = searchTerm.toLowerCase().trim();
  
  // Extract city name (before first comma)
  const cityName = tripLower.split(',')[0].trim();
  
  // Strategy 1: Exact or substring matches
  if (tripLower.includes(searchLower)) return true;
  if (searchLower.includes(tripLower)) return true;
  if (cityName.includes(searchLower)) return true;
  if (searchLower.includes(cityName)) return true;
  
  // Strategy 2: Phonetic matching (handles i↔y, th↔t, etc.)
  if (arePhoneticallySimilar(cityName, searchLower)) return true;
  
  // Strategy 3: String similarity with threshold
  if (calculateStringSimilarity(cityName, searchLower) > similarityThreshold) return true;
  
  // Strategy 4: Normalized form matching
  const normTrip = normalizeForPhonetics(cityName);
  const normSearch = normalizeForPhonetics(searchLower);
  if (normTrip.includes(normSearch) || normSearch.includes(normTrip)) return true;
  
  // Strategy 5: Word-by-word matching for multi-word queries
  const searchWords = searchLower.split(/\s+/);
  const locationWords = tripLower.split(/[\s,]+/);
  
  for (const searchWord of searchWords) {
    if (searchWord.length < 3) continue; // Skip very short words
    
    for (const locationWord of locationWords) {
      if (locationWord.length < 3) continue;
      
      // Substring match
      if (locationWord.includes(searchWord) || searchWord.includes(locationWord)) {
        return true;
      }
      
      // Phonetic match on individual words
      if (arePhoneticallySimilar(locationWord, searchWord)) {
        return true;
      }
      
      // High similarity match
      if (calculateStringSimilarity(locationWord, searchWord) > similarityThreshold) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Configuration for trip search
 */
export const SEARCH_CONFIG = {
  DEFAULT_RADIUS_KM: 5,
  MAX_RADIUS_KM: 50,
  FUZZY_MATCH_THRESHOLD: 0.75,
  MIN_SEARCH_LENGTH: 2,
} as const;

