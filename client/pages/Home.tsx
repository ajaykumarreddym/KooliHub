import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShoppingCart,
  Car,
  Wrench,
  Package,
  Clock,
  MapPin,
  Star,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    id: "grocery",
    name: "Grocery Delivery",
    description: "Fresh groceries delivered to your doorstep",
    icon: ShoppingCart,
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    categories: [
      "Fruits & Vegetables",
      "Dairy Products",
      "Bakery Items",
      "Beverages",
    ],
  },
  {
    id: "car-rental",
    name: "Car Rental",
    description: "Rent cars for your travel needs",
    icon: Car,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    categories: ["Economy Cars", "Luxury Cars", "SUVs", "Electric Cars"],
  },
  {
    id: "handyman",
    name: "Handyman Services",
    description: "Professional home repair and maintenance",
    icon: Wrench,
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-600",
    categories: ["Plumbing", "Electrical", "Carpentry", "Painting"],
  },
];

const stats = [
  { label: "Happy Customers", value: "10,000+", icon: Star },
  { label: "Service Areas", value: "50+", icon: MapPin },
  { label: "Products Available", value: "5,000+", icon: Package },
  { label: "Average Delivery", value: "30 min", icon: Clock },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleServiceClick = (serviceId: string) => {
    navigate(`/services/${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your One-Stop Service Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              From grocery delivery to car rentals and handyman services - we've
              got everything you need, delivered with excellence.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth/login")}>
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/auth/signup")}
                >
                  Learn More
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from our wide range of services designed to make your life
              easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`${service.color} hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => handleServiceClick(service.id)}
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center mb-4`}
                  >
                    <service.icon className={`h-6 w-6 ${service.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {service.categories.map((category, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                        {category}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full justify-between">
                    Explore Service
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their daily
            needs
          </p>
          {!isAuthenticated ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/auth/signup")}
            >
              Create Your Account
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/services")}
            >
              Browse All Services
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
