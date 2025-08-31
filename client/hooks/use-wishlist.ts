import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  category: string;
  description?: string;
  rating?: number;
  addedAt: number;
}

const WISHLIST_STORAGE_KEY = "koolihub_wishlist";

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        setWishlistItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load wishlist from storage:", error);
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (error) {
      console.error("Failed to save wishlist to storage:", error);
    }
  }, [wishlistItems]);

  const addToWishlist = (item: Omit<WishlistItem, "addedAt">) => {
    const existingItem = wishlistItems.find(
      (wishlistItem) => wishlistItem.id === item.id,
    );

    if (existingItem) {
      toast.info("Item already in wishlist");
      return false;
    }

    const newItem: WishlistItem = {
      ...item,
      addedAt: Date.now(),
    };

    setWishlistItems((prev) => [newItem, ...prev]);
    toast.success(`${item.title} added to wishlist`);
    return true;
  };

  const removeFromWishlist = (itemId: string) => {
    const item = wishlistItems.find((item) => item.id === itemId);

    if (!item) {
      toast.error("Item not found in wishlist");
      return false;
    }

    setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success(`${item.title} removed from wishlist`);
    return true;
  };

  const isInWishlist = (itemId: string): boolean => {
    return wishlistItems.some((item) => item.id === itemId);
  };

  const toggleWishlist = (item: Omit<WishlistItem, "addedAt">) => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    toast.success("Wishlist cleared");
  };

  const getWishlistCount = (): number => {
    return wishlistItems.length;
  };

  const getWishlistTotal = (): number => {
    return wishlistItems.reduce((total, item) => total + item.price, 0);
  };

  const getSortedWishlist = (
    sortBy:
      | "newest"
      | "oldest"
      | "name"
      | "price-low"
      | "price-high" = "newest",
  ): WishlistItem[] => {
    const sorted = [...wishlistItems];

    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => b.addedAt - a.addedAt);
      case "oldest":
        return sorted.sort((a, b) => a.addedAt - b.addedAt);
      case "name":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted;
    }
  };

  const getWishlistByCategory = (category: string): WishlistItem[] => {
    return wishlistItems.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase(),
    );
  };

  return {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    getWishlistCount,
    getWishlistTotal,
    getSortedWishlist,
    getWishlistByCategory,
    count: getWishlistCount(),
    total: getWishlistTotal(),
  };
};

export default useWishlist;
