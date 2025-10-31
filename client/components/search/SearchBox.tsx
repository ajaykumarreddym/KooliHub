import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearch, type SearchResult } from "@/hooks/use-search";
import { formatCurrency } from "@/lib/payment-utils";
import { cn } from "@/lib/utils";
import {
  Clock,
  Loader2,
  Package,
  Search,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";

interface SearchBoxProps {
  placeholder?: string;
  className?: string;
  showInPopover?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = "What are you looking for?",
  className,
  showInPopover = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    searchResults,
    isSearching,
    handleSearch,
    handleResultClick,
    getPopularSearches,
    hasResults,
  } = useSearch();

  const popularSearches = getPopularSearches();

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (value.length >= 2) {
      setIsOpen(true);
      handleSearch(value);
    } else {
      setIsOpen(false);
    }
  }, [handleSearch]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSearch(inputValue);
      setIsOpen(false);
    }
  }, [inputValue, handleSearch]);

  const handleResultSelect = useCallback((result: SearchResult) => {
    handleResultClick(result);
    setInputValue("");
    setIsOpen(false);
  }, [handleResultClick]);

  const handlePopularSearchClick = useCallback((searchTerm: string) => {
    setInputValue(searchTerm);
    handleSearch(searchTerm);
    setIsOpen(false);
  }, [handleSearch]);

  const clearInput = useCallback(() => {
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const getResultIcon = useCallback((result: SearchResult) => {
    switch (result.type) {
      case "service":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "product":
        return <Star className="h-4 w-4 text-yellow-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  const SearchContent = useMemo(() => (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <Input
          key="search-input"
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-full pl-4 pr-20 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-gray-50"
          autoComplete="off"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearInput}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            className="bg-primary text-black hover:bg-primary/90"
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          <ScrollArea className="max-h-96">
            {isSearching ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            ) : hasResults ? (
              <div className="p-2">
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500 px-2 py-1">
                    Search Results
                  </p>
                </div>

                <div className="space-y-1">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {getResultIcon(result)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {result.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {result.category}
                          </span>
                          {result.price && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs font-medium text-green-600">
                                {formatCurrency(result.price)}
                              </span>
                            </>
                          )}
                          {result.rating && (
                            <>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600">
                                  {result.rating}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : inputValue ? (
              <div className="p-4 text-center">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No results found</p>
                <p className="text-xs text-gray-500 mt-1">
                  Try different keywords or browse categories
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <p className="text-xs font-medium text-gray-500">
                      Popular Searches
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handlePopularSearchClick(search)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  ), [
    handleSubmit,
    placeholder,
    inputValue,
    handleInputChange,
    clearInput,
    isSearching,
    isOpen,
    hasResults,
    searchResults,
    handleResultSelect,
    getResultIcon,
    popularSearches,
    handlePopularSearchClick,
  ]);

  if (showInPopover) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("justify-start", className)}>
            <Search className="h-4 w-4 mr-2" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={inputValue}
              onValueChange={handleInputChange}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {hasResults && (
                <CommandGroup heading="Search Results">
                  {searchResults.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleResultSelect(result)}
                      className="flex items-center space-x-2"
                    >
                      {getResultIcon(result)}
                      <div className="flex-1">
                        <p className="font-medium">{result.title}</p>
                        <p className="text-sm text-gray-500">
                          {result.description}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!hasResults && inputValue.length < 2 && (
                <CommandGroup heading="Popular Searches">
                  {popularSearches.slice(0, 5).map((search) => (
                    <CommandItem
                      key={search}
                      onSelect={() => handlePopularSearchClick(search)}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {search}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {SearchContent}
    </div>
  );
};

export default SearchBox;
