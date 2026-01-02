import { Layout } from "@/components/layout/Layout";
import { LocationSelectionModal } from "@/components/modals/LocationSelectionModal";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { HorizontalProductSection } from "@/components/sections/HorizontalProductSection";
import { PromoBanner } from "@/components/sections/PromoBanner";
import { useLocation } from "@/contexts/LocationContext";
import { initializeDemoNotifications } from "@/lib/demo-notifications";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Index() {
  const { currentLocation, hasLocation, isServiceAvailable, serviceAreaId } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [dairyProducts, setDairyProducts] = useState<any[]>([]);
  const [snacksProducts, setSnacksProducts] = useState<any[]>([]);
  const [freshProducts, setFreshProducts] = useState<any[]>([]);
  const [beveragesProducts, setBeveragesProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch category-wise products
  useEffect(() => {
    if (serviceAreaId) {
      fetchCategoryProducts();
    }
  }, [serviceAreaId]);

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);

      // Fetch products for different categories
      const { data: allProducts, error } = await supabase.rpc(
        'get_products_by_service_area',
        {
          p_service_area_id: serviceAreaId,
          p_service_type: 'grocery',
          p_category_id: null,
          p_search_term: null,
          p_limit: 50,
          p_offset: 0,
        }
      );

      if (!error && allProducts) {
        // Transform products
        const transformed = allProducts.map((p: any) => ({
          id: p.offering_id || p.product_id,
          name: p.offering_name,
          price: p.location_price,
          originalPrice: p.location_price !== p.base_price ? p.base_price : undefined,
          brand: p.vendor_name || 'Generic',
          image: p.primary_image_url || '/placeholder.svg',
          rating: 4.5,
          reviewCount: Math.floor(Math.random() * 100),
          discount: p.location_price !== p.base_price ? Math.round(((p.base_price - p.location_price) / p.base_price) * 100) : undefined,
          inStock: p.location_stock > 0,
          category: p.category_name || 'Product',
          unit: 'each',
          tags: [],
          description: '',
          deliveryTime: '15 mins',
        }));

        // Split products into different categories (you can customize this logic)
        const dairy = transformed.filter((p: any) => 
          p.name.toLowerCase().includes('milk') || 
          p.name.toLowerCase().includes('butter') || 
          p.name.toLowerCase().includes('cheese') ||
          p.name.toLowerCase().includes('egg') ||
          p.name.toLowerCase().includes('yogurt') ||
          p.name.toLowerCase().includes('paneer')
        ).slice(0, 8);

        const snacks = transformed.filter((p: any) => 
          p.name.toLowerCase().includes('chips') || 
          p.name.toLowerCase().includes('snack') || 
          p.name.toLowerCase().includes('biscuit') ||
          p.name.toLowerCase().includes('cookie') ||
          p.name.toLowerCase().includes('namkeen')
        ).slice(0, 8);

        const fresh = transformed.filter((p: any) => 
          p.name.toLowerCase().includes('vegetable') || 
          p.name.toLowerCase().includes('fruit') || 
          p.name.toLowerCase().includes('tomato') ||
          p.name.toLowerCase().includes('potato') ||
          p.name.toLowerCase().includes('onion')
        ).slice(0, 8);

        const beverages = transformed.filter((p: any) => 
          p.name.toLowerCase().includes('juice') || 
          p.name.toLowerCase().includes('drink') || 
          p.name.toLowerCase().includes('coffee') ||
          p.name.toLowerCase().includes('tea') ||
          p.name.toLowerCase().includes('cola')
        ).slice(0, 8);

        setDairyProducts(dairy);
        setSnacksProducts(snacks);
        setFreshProducts(fresh);
        setBeveragesProducts(beverages);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* Horizontal Product Sections - Blinkit Style */}
        <HorizontalProductSection
          title="Dairy, Bread & Eggs"
          products={dairyProducts}
          viewAllLink="/grocery"
          loading={loading}
        />
        
        <HorizontalProductSection
          title="Snacks & Munchies"
          products={snacksProducts}
          viewAllLink="/grocery"
          loading={loading}
        />
        
        <HorizontalProductSection
          title="Fruits & Vegetables"
          products={freshProducts}
          viewAllLink="/grocery"
          loading={loading}
        />
        
        <HorizontalProductSection
          title="Tea, Coffee & Health Drink"
          products={beveragesProducts}
          viewAllLink="/grocery"
          loading={loading}
        />
      </Layout>
    </>
  );
}
