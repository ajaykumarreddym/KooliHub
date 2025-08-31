import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  CreditCard,
  Truck,
  Clock,
  Shield,
  Users,
  MapPin,
  MessageCircle,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Easy Mobile App",
    description: "Order anything with just a few taps on your mobile device",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Multiple payment options with bank-level security",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Quick and reliable delivery across Dubai and UAE",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    description: "Track your orders and services in real-time",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "All services verified and quality guaranteed",
  },
  {
    icon: Users,
    title: "Expert Team",
    description: "Professional and experienced service providers",
  },
  {
    icon: MapPin,
    title: "Wide Coverage",
    description: "Serving all major areas across the UAE",
  },
  {
    icon: MessageCircle,
    title: "24/7 Support",
    description: "Round-the-clock customer support and assistance",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Choose KooliHub?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're committed to providing the best service experience with
            cutting-edge technology and a customer-first approach.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-white hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-xl mb-8 text-primary-100">
              Download our app and experience the convenience of having all
              services at your fingertips.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Download App
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors">
                Browse Web Version
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
