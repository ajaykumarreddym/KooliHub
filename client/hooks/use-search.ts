import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  image?: string;
  price?: number;
  rating?: number;
  type: "service" | "product" | "category";
}

// Mock search data - in a real app, this would come from an API
const mockSearchData: SearchResult[] = [
  // Services
  {
    id: "grocery-service",
    title: "Grocery Delivery",
    description: "Fresh groceries delivered to your doorstep",
    category: "Services",
    url: "/grocery",
    type: "service",
  },
  {
    id: "trip-service",
    title: "Trip Booking",
    description: "Book bus tickets and travel packages",
    category: "Services",
    url: "/trips",
    type: "service",
  },
  {
    id: "car-rental-service",
    title: "Car Rental",
    description: "Rent cars for your travel needs",
    category: "Services",
    url: "/car-rental",
    type: "service",
  },
  {
    id: "handyman-service",
    title: "Handyman Services",
    description: "Professional repair and maintenance services",
    category: "Services",
    url: "/handyman",
    type: "service",
  },
  {
    id: "electronics-service",
    title: "Electronics",
    description: "Latest gadgets and electronic devices",
    category: "Shopping",
    url: "/electronics",
    type: "service",
  },
  {
    id: "home-kitchen-service",
    title: "Home & Kitchen",
    description: "Home decor and kitchen essentials",
    category: "Shopping",
    url: "/home",
    type: "service",
  },
  // Products
  {
    id: "iphone-15",
    title: "iPhone 15 Pro",
    description: "Latest iPhone with advanced features",
    category: "Electronics",
    url: "/electronics",
    price: 134900,
    rating: 4.8,
    type: "product",
    image: "/placeholder.svg",
  },
  {
    id: "samsung-galaxy",
    title: "Samsung Galaxy S24",
    description: "Premium Android smartphone",
    category: "Electronics",
    url: "/electronics",
    price: 89999,
    rating: 4.6,
    type: "product",
    image: "/placeholder.svg",
  },
  {
    id: "organic-vegetables",
    title: "Organic Vegetables",
    description: "Fresh organic vegetables bundle",
    category: "Grocery",
    url: "/grocery",
    price: 299,
    rating: 4.5,
    type: "product",
    image: "/placeholder.svg",
  },
  {
    id: "laptop-repair",
    title: "Laptop Repair Service",
    description: "Professional laptop repair and maintenance",
    category: "Handyman",
    url: "/handyman",
    price: 999,
    rating: 4.7,
    type: "service",
  },
];

export const useSearch = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  // Filter and search logic
  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    return mockSearchData
      .filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm) ||
          item.category.toLowerCase().includes(searchTerm),
      )
      .sort((a, b) => {
        // Prioritize exact matches in title
        const aExact = a.title.toLowerCase().includes(searchTerm);
        const bExact = b.title.toLowerCase().includes(searchTerm);

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Then by type (services first)
        if (a.type === "service" && b.type === "product") return -1;
        if (a.type === "product" && b.type === "service") return 1;

        // Then by rating
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 8); // Limit to 8 results
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setQuery(searchQuery);
      setShowResults(true);

      if (searchResults.length === 0) {
        toast.info(`No results found for "${searchQuery}"`);
      } else {
        toast.success(
          `Found ${searchResults.length} results for "${searchQuery}"`,
        );
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setShowResults(false);
    setQuery("");
    toast.success(`Opening ${result.title}`);
  };

  const clearSearch = () => {
    setQuery("");
    setShowResults(false);
  };

  const getPopularSearches = () => {
    return [
      "Grocery delivery",
      "iPhone 15",
      "Car rental",
      "Handyman services",
      "Trip booking",
      "Electronics",
      "Home decor",
      "Mobile repair",
    ];
  };

  const getCategoryResults = (category: string) => {
    return mockSearchData.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase(),
    );
  };

  return {
    query,
    setQuery,
    searchResults,
    isSearching,
    showResults,
    setShowResults,
    handleSearch,
    handleResultClick,
    clearSearch,
    getPopularSearches,
    getCategoryResults,
    hasResults: searchResults.length > 0,
  };
};

export default useSearch;
