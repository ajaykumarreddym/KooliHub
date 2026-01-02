import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Map, MapPin, Navigation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LocationPickerMap } from "./LocationPickerMap";

export interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

// Helper function to extract clean city/town name
export function getCleanLocationName(location: LocationResult): string {
  const { address } = location;
  // Priority: city > town > village > first part of display_name
  return address.city || address.town || address.village || location.display_name.split(",")[0];
}

/**
 * Dynamic Fuzzy Matching System for Indian Location Names
 * 
 * Handles common transliteration variations without hardcoding specific cities:
 * - Vowel variations: i↔y, a↔e↔u, o↔u
 * - Silent/added 'h': Tirupati↔Tirupathi
 * - Double consonants: Kolkata↔Kolkatta
 * - Common substitutions: v↔w, b↔v
 */

// Normalize text for comparison (removes variations that are phonetically similar)
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

// Generate phonetic code (simplified Soundex-like for Indian names)
function getPhoneticCode(text: string): string {
  const normalized = normalizeForPhonetics(text);
  
  // Keep first letter, then encode consonants
  if (normalized.length === 0) return '';
  
  let code = normalized[0].toUpperCase();
  
  const consonantMap: Record<string, string> = {
    'b': '1', 'f': '1', 'p': '1', 'v': '1',
    'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2',
    'd': '3', 't': '3',
    'l': '4',
    'm': '5', 'n': '5',
    'r': '6',
  };
  
  let lastCode = consonantMap[normalized[0]] || '';
  
  for (let i = 1; i < normalized.length && code.length < 6; i++) {
    const char = normalized[i];
    const mapCode = consonantMap[char];
    
    if (mapCode && mapCode !== lastCode) {
      code += mapCode;
      lastCode = mapCode;
    } else if (!mapCode) {
      lastCode = '';
    }
  }
  
  return code.padEnd(6, '0');
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
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

// Calculate similarity score (0-1, higher is better)
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLen);
}

// Check if two strings are phonetically similar
function arePhoneticallySimilar(str1: string, str2: string): boolean {
  // First check normalized forms
  const norm1 = normalizeForPhonetics(str1);
  const norm2 = normalizeForPhonetics(str2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // One contains the other after normalization
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Phonetic code match
  if (getPhoneticCode(str1) === getPhoneticCode(str2)) return true;
  
  // High similarity on normalized forms (allow 2 edits for every 5 chars)
  const allowedEdits = Math.max(2, Math.floor(Math.max(norm1.length, norm2.length) / 3));
  if (levenshteinDistance(norm1, norm2) <= allowedEdits) return true;
  
  return false;
}

// Generate search variations dynamically
function generateSearchVariations(term: string): string[] {
  const variations = new Set<string>();
  const lowerTerm = term.toLowerCase().trim();
  
  // Original term
  variations.add(lowerTerm);
  
  // Normalized form
  variations.add(normalizeForPhonetics(lowerTerm));
  
  // Common Indian transliteration alternatives
  const alternates = [
    // Try with/without 'h' after consonants
    lowerTerm.replace(/t/g, 'th'),
    lowerTerm.replace(/th/g, 't'),
    lowerTerm.replace(/d/g, 'dh'),
    lowerTerm.replace(/dh/g, 'd'),
    // i/y swap
    lowerTerm.replace(/i/g, 'y'),
    lowerTerm.replace(/y/g, 'i'),
    // a/e swap (common in South Indian names)
    lowerTerm.replace(/a([^aeiou])/g, 'e$1'),
    // pur/puram variations
    lowerTerm.replace(/pur$/, 'puram'),
    lowerTerm.replace(/puram$/, 'pur'),
    // Remove trailing vowel
    lowerTerm.replace(/[aeiou]$/, ''),
  ];
  
  alternates.forEach(alt => {
    if (alt !== lowerTerm && alt.length >= 3) {
      variations.add(alt);
    }
  });
  
  // If multiple words, also search first word alone
  const words = lowerTerm.split(/\s+/);
  if (words.length > 1 && words[0].length >= 3) {
    variations.add(words[0]);
  }
  
  // Limit to top 4 variations to avoid too many API calls
  return Array.from(variations).slice(0, 4);
}

// Export for use in trip search
export { arePhoneticallySimilar, calculateSimilarity, normalizeForPhonetics };

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (location: LocationResult) => void;
  placeholder?: string;
  icon?: "pin" | "navigation";
  className?: string;
  disabled?: boolean;
  showMapPicker?: boolean; // Enable "Pick on Map" functionality
  selectedLocation?: LocationResult | null; // Currently selected location for map initial view
}

export function LocationSearchInput({
  value,
  onChange,
  onSelectLocation,
  placeholder = "Enter location",
  icon = "pin",
  className,
  disabled = false,
  showMapPicker = true,
  selectedLocation = null,
}: LocationSearchInputProps) {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMapPickerModal, setShowMapPickerModal] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        // Small delay to allow click events to process first
        hideTimeoutRef.current = setTimeout(() => {
          if (!isSelectingLocation) {
        setShowSuggestions(false);
          }
        }, 150);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isSelectingLocation]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setShowSuggestions(true); // Show loading state immediately
    
    // Increased debounce to respect Nominatim rate limits (1 req/sec)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Use single search query to avoid rate limiting
        // Nominatim has strict rate limits - 1 request per second
        const searchTerm = value.trim();
        const allResults: LocationResult[] = [];
        const seenPlaceIds = new Set<number>();
        
        // Single search request with better query
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?` +
              `q=${encodeURIComponent(searchTerm)}&` +
              `countrycodes=in&` + // Restrict to India
              `format=json&` +
              `addressdetails=1&` +
            `limit=8&` + // Get more results from single query
            `dedupe=1`, // Deduplicate results
              {
                headers: {
                "User-Agent": "KooliHub/1.0 (contact@koolihub.com)", // Required by Nominatim
                "Accept": "application/json",
                },
              }
            );

            if (response.ok) {
            const results = await response.json() as LocationResult[];
            for (const result of results) {
              if (!seenPlaceIds.has(result.place_id)) {
                seenPlaceIds.add(result.place_id);
                allResults.push(result);
              }
            }
          } else if (response.status === 429) {
            // Rate limited - show message
            console.warn("Nominatim rate limited, please wait...");
            }
          } catch (error) {
            console.error(`Error searching for "${searchTerm}":`, error);
          }
        
        // If no results, try with normalized term
        if (allResults.length === 0) {
          const normalizedTerm = normalizeForPhonetics(searchTerm);
          if (normalizedTerm !== searchTerm.toLowerCase()) {
            try {
              // Wait a bit before retry to respect rate limits
              await new Promise(resolve => setTimeout(resolve, 500));
        
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(normalizedTerm)}&` +
                `countrycodes=in&` +
                `format=json&` +
                `addressdetails=1&` +
                `limit=8&` +
                `dedupe=1`,
                {
                  headers: {
                    "User-Agent": "KooliHub/1.0 (contact@koolihub.com)",
                    "Accept": "application/json",
                  },
                }
              );

              if (response.ok) {
                const results = await response.json() as LocationResult[];
                for (const result of results) {
                  if (!seenPlaceIds.has(result.place_id)) {
                    seenPlaceIds.add(result.place_id);
                    allResults.push(result);
                  }
                }
              }
            } catch (error) {
              console.error(`Error with normalized search:`, error);
            }
          }
        }
        
        // Use allResults directly instead of resultsArrays
        const resultsArrays = [allResults];
        
        // Combine and deduplicate results
        for (const results of resultsArrays) {
          for (const result of results) {
            if (!seenPlaceIds.has(result.place_id)) {
              seenPlaceIds.add(result.place_id);
              allResults.push(result);
            }
          }
        }

        // Score and sort results by relevance
        const scoredResults = allResults.map(result => {
          const locationName = getCleanLocationName(result).toLowerCase();
          const searchLower = value.toLowerCase();
          
          let score = 0;
          
          // Exact match gets highest score
          if (locationName === searchLower) {
            score = 100;
          }
          // Starts with search term
          else if (locationName.startsWith(searchLower)) {
            score = 90;
          }
          // Contains search term
          else if (locationName.includes(searchLower)) {
            score = 80;
          }
          // Phonetically similar
          else if (arePhoneticallySimilar(locationName, searchLower)) {
            score = 70;
          }
          // Good string similarity
          else {
            score = calculateSimilarity(locationName, searchLower) * 60;
          }
          
          // Boost cities over towns over villages
          if (result.address.city) score += 5;
          else if (result.address.town) score += 3;
          
          return { result, score };
        });
        
        // Sort by score and take top results
        scoredResults.sort((a, b) => b.score - a.score);
        
        const topResults = scoredResults
          .filter(r => r.score >= 30) // Minimum relevance threshold
          .slice(0, 7)
          .map(r => r.result);
        
        console.log(`✅ Found ${topResults.length} relevant results`);
        
        setSuggestions(topResults);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400); // Balanced debounce - fast enough but respects rate limits

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  const handleSelectSuggestion = (location: LocationResult) => {
    // Mark that we're selecting to prevent hide timeout
    setIsSelectingLocation(true);
    
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Set clean city/town name instead of full address
    const cleanName = getCleanLocationName(location);
    onChange(cleanName);
    onSelectLocation(location);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Reset selecting flag after a short delay
    setTimeout(() => {
      setIsSelectingLocation(false);
    }, 100);
  };

  const handleMapPickerSelect = (location: LocationResult) => {
    const cleanName = getCleanLocationName(location);
    onChange(cleanName);
    onSelectLocation(location);
    setShowMapPickerModal(false);
  };

  const IconComponent = icon === "navigation" ? Navigation : MapPin;
  const iconColor = icon === "navigation" ? "text-[#10b981]" : "text-[#137fec]";
  const locationType = icon === "navigation" ? "pickup" : "dropoff";

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <IconComponent className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5", iconColor)} />
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            disabled={disabled}
            className={cn("pl-11 pr-12 h-14", className)}
          />
          {loading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
          ) : showMapPicker ? (
            <button
              type="button"
              onClick={() => setShowMapPickerModal(true)}
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Pick on map"
            >
              <Map className="h-5 w-5 text-[#137fec]" />
            </button>
          ) : null}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
            {/* Pick on Map Option - Always at top */}
            {showMapPicker && (
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  setShowMapPickerModal(true);
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-200 dark:border-gray-600 group bg-blue-50/50 dark:bg-blue-900/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#137fec]/10 flex items-center justify-center">
                    <Map className="h-4 w-4 text-[#137fec]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#137fec]">
                      Pick on Map
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Set location by moving the map
                    </p>
                  </div>
                </div>
              </button>
            )}
            
            {suggestions.map((location) => (
              <button
                key={location.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(location)}
                onMouseDown={(e) => {
                  // Prevent input blur from hiding dropdown before click processes
                  e.preventDefault();
                  setIsSelectingLocation(true);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 group-hover:text-[#137fec] transition-colors flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getCleanLocationName(location)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {[location.address.city, location.address.town, location.address.village, location.address.state, location.address.country]
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && !loading && value.length >= 2 && suggestions.length === 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Pick on Map Option when no results */}
            {showMapPicker && (
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  setShowMapPickerModal(true);
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-200 dark:border-gray-600 group bg-blue-50/50 dark:bg-blue-900/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#137fec]/10 flex items-center justify-center">
                    <Map className="h-4 w-4 text-[#137fec]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#137fec]">
                      Pick on Map
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Set location by moving the map
                    </p>
                  </div>
                </div>
              </button>
            )}
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No locations found</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Picker Modal */}
      {showMapPickerModal && (
        <LocationPickerMap
          onSelectLocation={handleMapPickerSelect}
          onClose={() => setShowMapPickerModal(false)}
          initialLocation={
            selectedLocation
              ? { lat: parseFloat(selectedLocation.lat), lon: parseFloat(selectedLocation.lon) }
              : undefined
          }
          locationType={locationType}
        />
      )}
    </>
  );
}

