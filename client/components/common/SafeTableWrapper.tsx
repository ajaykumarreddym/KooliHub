import React, { ErrorInfo, ReactNode, Component } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary that specifically handles ResizeObserver and table-related errors
 * This prevents ResizeObserver warnings from breaking the UI
 */
export class SafeTableWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a ResizeObserver related error
    if (
      error.message &&
      (error.message.includes("ResizeObserver") ||
        error.message.includes("loop completed with undelivered notifications"))
    ) {
      // Don't treat ResizeObserver errors as critical
      return { hasError: false };
    }

    // For other errors, show error boundary
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log non-ResizeObserver errors
    if (
      !error.message?.includes("ResizeObserver") &&
      !error.message?.includes("loop completed with undelivered notifications")
    ) {
      console.error("Table component error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center text-red-600">
            <p>Something went wrong with the table component.</p>
            <button
              className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * React functional component wrapper for easier use
 */
export const SafeTable: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  return (
    <SafeTableWrapper fallback={fallback}>
      <div className="overflow-hidden">{children}</div>
    </SafeTableWrapper>
  );
};
