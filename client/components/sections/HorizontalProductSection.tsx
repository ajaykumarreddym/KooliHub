import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/grocery/ProductCard";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  brand: string;
  image: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  inStock: boolean;
  category: string;
  unit: string;
  tags: string[];
  deliveryTime?: string;
  description?: string;
}

interface HorizontalProductSectionProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
  loading?: boolean;
}

export function HorizontalProductSection({
  title,
  products,
  viewAllLink,
  loading = false,
}: HorizontalProductSectionProps) {
  if (loading) {
    return (
      <section className="py-6 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <Button variant="ghost" size="sm" className="text-green-600 font-semibold">
              see all
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[160px] bg-gray-100 rounded-lg animate-pulse"
              >
                <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-white border-b border-gray-100">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {viewAllLink && (
            <Link to={viewAllLink}>
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 font-semibold hover:bg-green-50">
                see all
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {/* Horizontal Scrollable Product Grid */}
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[160px] md:w-[180px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

