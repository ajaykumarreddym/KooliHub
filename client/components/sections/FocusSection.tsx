import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const focusItems = [
  {
    id: 1,
    title: "Elevate",
    subtitle: "Premium Services",
    description: "Experience luxury with our premium service offerings",
    cta: "EXPLORE",
    bgColor: "bg-gradient-to-br from-purple-600 to-blue-600",
    image: "✨"
  },
  {
    id: 2,
    title: "New arrivals",
    subtitle: "Latest Services",
    description: "The latest, curated just for you",
    cta: "SHOP NOW",
    bgColor: "bg-gradient-to-br from-green-500 to-blue-500",
    image: "🆕"
  },
  {
    id: 3,
    title: "Gaming Zone",
    subtitle: "Entertainment Services",
    description: "Shop gaming equipment & entertainment services",
    cta: "ENTER",
    bgColor: "bg-gradient-to-br from-red-600 to-orange-600",
    image: "🎮"
  }
];

export function FocusSection() {
  return (
    <section className="py-8">
      <div className="container">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">In focus</h2>
        </div>

        {/* Focus items grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {focusItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
              <CardContent className="p-0">
                <div className={`${item.bgColor} text-white p-8 h-64 flex flex-col justify-between relative overflow-hidden`}>
                  {/* Background decoration */}
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    {item.image}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-lg text-white/90 mb-2">{item.subtitle}</p>
                    <p className="text-sm text-white/80">{item.description}</p>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="self-start bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {item.cta}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
