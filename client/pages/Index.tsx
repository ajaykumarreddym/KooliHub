import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PromoBanner } from "@/components/sections/PromoBanner";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { DealsSection } from "@/components/sections/DealsSection";
import { FocusSection } from "@/components/sections/FocusSection";
import { RecommendedSection } from "@/components/sections/RecommendedSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { initializeDemoNotifications } from "@/lib/demo-notifications";

export default function Index() {
  useEffect(() => {
    // Initialize demo notifications for new users
    initializeDemoNotifications();
  }, []);

  return (
    <Layout>
      <PromoBanner />
      <CategoryGrid />
      <DealsSection />
      <FocusSection />
      <RecommendedSection />
      <TestimonialsSection />
    </Layout>
  );
}
