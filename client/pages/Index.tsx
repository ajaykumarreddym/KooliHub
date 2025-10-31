import { Layout } from "@/components/layout/Layout";
import { LocationSelectionModal } from "@/components/modals/LocationSelectionModal";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { DealsSection } from "@/components/sections/DealsSection";
import { FocusSection } from "@/components/sections/FocusSection";
import { PromoBanner } from "@/components/sections/PromoBanner";
import { RecommendedSection } from "@/components/sections/RecommendedSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { useLocation } from "@/contexts/LocationContext";
import { initializeDemoNotifications } from "@/lib/demo-notifications";
import { useEffect, useState } from "react";

export default function Index() {
  const { currentLocation, hasLocation, isServiceAvailable } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    // Initialize demo notifications for new users
    initializeDemoNotifications();
  }, []);

  // Show location modal only if user doesn't have a valid serviceable location with serviceAreaId
  useEffect(() => {
    // Check if location is missing OR location exists but has no service area
    const needsLocation = !hasLocation || !currentLocation || !currentLocation.serviceAreaId || !currentLocation.city;
    
    if (needsLocation) {
      // Small delay to allow page to render first
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Valid location with serviceAreaId exists, hide modal
      setShowLocationModal(false);
    }
  }, [hasLocation, currentLocation]);

  const handleLocationSelected = () => {
    setShowLocationModal(false);
  };

  return (
    <>
      {/* Mandatory Location Selection Modal */}
      <LocationSelectionModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        required={true} // Make it mandatory - user can't close without selecting
        onLocationSelected={handleLocationSelected}
      />

      {/* Main Content - will be visible behind the modal overlay */}
      <Layout>
        <PromoBanner />
        <CategoryGrid />
        <DealsSection />
        <FocusSection />
        <RecommendedSection />
        <TestimonialsSection />
      </Layout>
    </>
  );
}
