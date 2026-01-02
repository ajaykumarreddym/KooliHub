import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean; // Allow explicit control
}

// Define routes where footer should be shown
const FOOTER_VISIBLE_ROUTES = [
  "/", // Main home page
  "/grocery", // Grocery service home
  "/trip-booking", // Trip booking service home
  "/fashion", // Fashion service home
  "/beauty", // Beauty service home
  "/electronics", // Electronics service home
  "/services", // Services page
  "/about", // About page
  "/contact", // Contact page
];

export function Layout({ children, showFooter }: LayoutProps) {
  const location = useLocation();
  
  // Determine if footer should be shown:
  // 1. If showFooter prop is explicitly set, use that
  // 2. Otherwise, check if current path matches footer-visible routes
  const shouldShowFooter = showFooter !== undefined 
    ? showFooter 
    : FOOTER_VISIBLE_ROUTES.includes(location.pathname);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 relative" style={{ zIndex: 10 }}>
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
