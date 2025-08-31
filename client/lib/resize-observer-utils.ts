import React from "react";

/**
 * Utilities for handling ResizeObserver errors gracefully
 * ResizeObserver loop warnings are common in React apps and usually harmless
 */

// Debounced resize handler to prevent excessive observer callbacks
export const createDebouncedResizeHandler = (
  callback: () => void,
  delay = 16,
) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(callback);
    }, delay);
  };
};

// Safe ResizeObserver wrapper that catches and handles errors
export class SafeResizeObserver {
  private observer: ResizeObserver;
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;

    this.observer = new ResizeObserver((entries, observer) => {
      try {
        // Use requestAnimationFrame to avoid blocking the main thread
        requestAnimationFrame(() => {
          try {
            this.callback(entries, observer);
          } catch (error) {
            // Silently handle ResizeObserver errors
            if (!error.message?.includes("ResizeObserver loop")) {
              console.warn("ResizeObserver callback error:", error);
            }
          }
        });
      } catch (error) {
        // Silently handle ResizeObserver errors
        if (!error.message?.includes("ResizeObserver loop")) {
          console.warn("ResizeObserver error:", error);
        }
      }
    });
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    try {
      this.observer.observe(target, options);
    } catch (error) {
      console.warn("Failed to observe element:", error);
    }
  }

  unobserve(target: Element) {
    try {
      this.observer.unobserve(target);
    } catch (error) {
      console.warn("Failed to unobserve element:", error);
    }
  }

  disconnect() {
    try {
      this.observer.disconnect();
    } catch (error) {
      console.warn("Failed to disconnect observer:", error);
    }
  }
}

// React hook for safe resize observation
export const useSafeResizeObserver = (
  callback: ResizeObserverCallback,
  dependencies: React.DependencyList = [],
) => {
  const [observer, setObserver] = React.useState<SafeResizeObserver | null>(
    null,
  );

  React.useEffect(() => {
    const safeObserver = new SafeResizeObserver(callback);
    setObserver(safeObserver);

    return () => {
      safeObserver.disconnect();
    };
  }, dependencies);

  return observer;
};
