import React, { createContext, useContext, ReactNode } from "react";
import { useWishlist, type WishlistItem } from "@/hooks/use-wishlist";

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, "addedAt">) => boolean;
  removeFromWishlist: (itemId: string) => boolean;
  isInWishlist: (itemId: string) => boolean;
  toggleWishlist: (item: Omit<WishlistItem, "addedAt">) => void;
  clearWishlist: () => void;
  getWishlistCount: () => number;
  getWishlistTotal: () => number;
  getSortedWishlist: (
    sortBy?: "newest" | "oldest" | "name" | "price-low" | "price-high",
  ) => WishlistItem[];
  getWishlistByCategory: (category: string) => WishlistItem[];
  count: number;
  total: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const wishlistData = useWishlist();

  return (
    <WishlistContext.Provider value={wishlistData}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error(
      "useWishlistContext must be used within a WishlistProvider",
    );
  }
  return context;
};
