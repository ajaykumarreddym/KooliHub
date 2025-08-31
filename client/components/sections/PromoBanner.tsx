import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const promoSlides = [
  {
    id: 1,
    title: "30-60% OFF",
    subtitle: "Grocery, Handyman, Car Rentals & more",
    cta: "Shop Now",
    bgColor: "bg-gradient-to-r from-purple-600 to-pink-600",
    image: "🛒",
    badge: "Top brands"
  },
  {
    id: 2,
    title: "FLASH SALE",
    subtitle: "Car Rental Services",
    cta: "Book Now",
    bgColor: "bg-gradient-to-r from-blue-600 to-cyan-600", 
    image: "🚗",
    badge: "Limited time"
  },
  {
    id: 3,
    title: "HANDYMAN DEALS",
    subtitle: "Professional Services at Low Prices",
    cta: "Get Quote",
    bgColor: "bg-gradient-to-r from-orange-600 to-red-600",
    image: "🔧",
    badge: "Expert service"
  }
];

export function PromoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };

  const slide = promoSlides[currentSlide];

  return (
    <section className="relative">
      <div className="container py-4">
        <div className={`relative ${slide.bgColor} rounded-2xl overflow-hidden h-64 lg:h-80`}>
          {/* Navigation arrows */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Content */}
          <div className="flex items-center justify-between h-full px-8 lg:px-16">
            <div className="text-white max-w-md">
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                {slide.badge}
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-2">
                {slide.title}
              </h2>
              <p className="text-xl lg:text-2xl mb-6 text-white/90">
                {slide.subtitle}
              </p>
              <Button 
                size="lg"
                className="bg-primary text-black hover:bg-primary/90 font-semibold px-8"
              >
                {slide.cta}
              </Button>
            </div>
            
            {/* Decorative image/icon */}
            <div className="hidden lg:block text-8xl opacity-30">
              {slide.image}
            </div>
          </div>

          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {promoSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
