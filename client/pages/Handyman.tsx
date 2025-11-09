import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Star,
  Clock,
  CheckCircle,
  Phone,
  Calendar,
  MapPin,
  Wrench,
  Zap,
  Shield
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "@/contexts/LocationContext";

interface HandymanService {
  id: string;
  name: string;
  description: string;
  category: string;
  priceRange: string;
  basePrice: number;
  duration: string;
  rating: number;
  reviewCount: number;
  features: string[];
  image_url: string | null;
  icon: string;
}

interface RequestForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  preferredDate: string;
  preferredTime: string;
  urgency: "normal" | "urgent" | "emergency";
}

export default function Handyman() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [services, setServices] = useState<HandymanService[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<HandymanService | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState<RequestForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    preferredDate: "",
    preferredTime: "",
    urgency: "normal",
  });

  const { currentLocation, hasLocation } = useLocation();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);

      // Fetch handyman services from database
      const { data, error } = await supabase
        .from("offerings")
        .select(`
          *,
          categories!inner (
            name,
            service_type_id
          )
        `)
        .eq("categories.service_type_id", "handyman")
        .eq("is_active", true)
        .order("base_price", { ascending: true });

      if (error) {
        console.error("Error fetching services:", error);
        return;
      }

      // Transform offerings to services format
      const transformedServices: HandymanService[] = (data || []).map((offering) => {
        const basePrice = parseFloat(offering.base_price || "0");
        const priceRange = basePrice < 500 ? "₹250-500" :
                          basePrice < 1000 ? "₹500-1000" :
                          basePrice < 2000 ? "₹1000-2000" : "₹2000+";
        
        // Determine icon based on category name
        const categoryName = offering.categories?.name || "";
        const icon = categoryName.includes("AC") ? "❄️" :
                    categoryName.includes("Plumb") ? "🚰" :
                    categoryName.includes("Electric") ? "⚡" :
                    categoryName.includes("Carpen") ? "🪚" :
                    categoryName.includes("Paint") ? "🎨" : "🔧";

        return {
          id: offering.id,
          name: offering.name,
          description: offering.description || "Professional service",
          category: offering.categories?.name || "General",
          priceRange: priceRange,
          basePrice: basePrice,
          duration: basePrice < 500 ? "1-2 hours" : 
                   basePrice < 1500 ? "2-3 hours" : "3-4 hours",
          rating: 4.5 + Math.random() * 0.5,
          reviewCount: Math.floor(Math.random() * 150) + 20,
          features: [
            "Professional technician",
            "Quality assured",
            "Free consultation",
            "Warranty included"
          ],
          image_url: offering.primary_image_url,
          icon: icon
        };
      });

      setServices(transformedServices);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(transformedServices.map((s) => s.category))
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleServiceSelect = (service: HandymanService) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };

  const handleSubmitRequest = () => {
    // Simulate service request submission
    alert(
      `Service request submitted for ${selectedService?.name}!\nWe'll call you within 30 minutes with a quote.`
    );
    setIsBookingModalOpen(false);
    setRequestForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      description: "",
      preferredDate: "",
      preferredTime: "",
      urgency: "normal",
    });
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Handyman Services</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔧 Handyman Services
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>
                    {hasLocation && currentLocation
                      ? `${currentLocation.city}, ${currentLocation.state}`
                      : "Select location"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Quick estimates</span>
                </div>
              </div>
            </div>

            <Badge className="bg-orange-500 text-white self-start lg:self-center">
              ✓ Expert technicians • Quality assured
            </Badge>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
            <Shield className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Verified Experts</h3>
            <p className="text-xs text-gray-600">Background checked</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <Wrench className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Quality Service</h3>
            <p className="text-xs text-gray-600">Satisfaction guaranteed</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Quick Response</h3>
            <p className="text-xs text-gray-600">30-min callback</p>
          </div>
        </div>

        {/* Emergency banner */}
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🚨</div>
                <div>
                  <h3 className="font-semibold text-red-900 text-lg">
                    Emergency Service Available
                  </h3>
                  <p className="text-red-700 text-sm">
                    24/7 emergency repairs for urgent issues
                  </p>
                </div>
              </div>
              <Button className="bg-red-600 text-white hover:bg-red-700">
                📞 Call Emergency: 1800-HELP-123
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Service Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`${
                selectedCategory === "all"
                  ? "ring-2 ring-orange-600 bg-orange-50"
                  : "bg-white"
              } border-2 border-gray-200 hover:border-orange-300 p-4 rounded-xl text-center transition-all`}
            >
              <div className="text-3xl mb-2">🔧</div>
              <p className="text-xs font-semibold">All Services</p>
              <p className="text-xs text-gray-500">{services.length}</p>
            </button>
            {categories.map((category) => {
              const count = services.filter((s) => s.category === category).length;
              const icon = category.includes("AC") ? "❄️" :
                          category.includes("Plumb") ? "🚰" :
                          category.includes("Electric") ? "⚡" :
                          category.includes("Carpen") ? "🪚" :
                          category.includes("Paint") ? "🎨" : "🔧";
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`${
                    selectedCategory === category
                      ? "ring-2 ring-orange-600 bg-orange-50"
                      : "bg-white"
                  } border-2 border-gray-200 hover:border-orange-300 p-4 rounded-xl text-center transition-all`}
                >
                  <div className="text-3xl mb-2">{icon}</div>
                  <p className="text-xs font-semibold leading-tight line-clamp-2">
                    {category}
                  </p>
                  <p className="text-xs text-gray-500">{count}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for services (e.g., AC repair, plumbing, electrical...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-base border-2 focus:border-orange-600"
            />
          </div>
        </div>

        {/* Services grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-orange-200"
              >
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-3">{service.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    <Badge className="mb-2 bg-orange-100 text-orange-700">
                      {service.category}
                    </Badge>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Price and duration */}
                  <div className="mb-4 bg-orange-50 p-3 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {service.priceRange}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{service.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <div className="space-y-1">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1 mb-4 pb-4 border-b">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{service.rating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm">
                      ({service.reviewCount} reviews)
                    </span>
                  </div>

                  <Button
                    onClick={() => handleServiceSelect(service)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Get Quote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No services found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Choose Service</h3>
              <p className="text-gray-600 text-sm">
                Select the service you need from our catalog
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Get Quote</h3>
              <p className="text-gray-600 text-sm">
                We'll call you within 30 minutes with accurate pricing
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Schedule</h3>
              <p className="text-gray-600 text-sm">
                Book a convenient time for our expert to visit
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="font-semibold mb-2">Get Fixed</h3>
              <p className="text-gray-600 text-sm">
                Our technician completes the job with quality guarantee
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Request Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">{selectedService?.icon}</span>
              Request {selectedService?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Service Summary */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold mb-2">Estimated Price Range</h3>
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {selectedService?.priceRange}
              </div>
              <p className="text-sm text-gray-600">
                Final price will be provided after assessment. No hidden charges.
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Duration: {selectedService?.duration}</span>
              </div>
            </div>

            {/* Request Form */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={requestForm.name}
                    onChange={(e) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={requestForm.phone}
                    onChange={(e) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+91 xxxxx xxxxx"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={requestForm.email}
                  onChange={(e) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="address">Service Address *</Label>
                <Textarea
                  id="address"
                  value={requestForm.address}
                  onChange={(e) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Complete address including building, apartment number"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="description">Describe the Issue *</Label>
                <Textarea
                  id="description"
                  value={requestForm.description}
                  onChange={(e) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Please describe the problem in detail. This helps us provide accurate quotes."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Preferred Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={requestForm.preferredDate}
                    onChange={(e) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        preferredDate: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Preferred Time</Label>
                  <select
                    id="time"
                    value={requestForm.preferredTime}
                    onChange={(e) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        preferredTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option value="">Select time</option>
                    <option value="09:00-12:00">Morning (9 AM - 12 PM)</option>
                    <option value="12:00-15:00">Afternoon (12 PM - 3 PM)</option>
                    <option value="15:00-18:00">Evening (3 PM - 6 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Urgency Level</Label>
                <div className="flex gap-3 mt-2">
                  {[
                    {
                      value: "normal",
                      label: "Normal",
                      desc: "Within 2-3 days",
                    },
                    {
                      value: "urgent",
                      label: "Urgent",
                      desc: "Within 24 hours",
                    },
                    {
                      value: "emergency",
                      label: "Emergency",
                      desc: "Same day",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer flex-1"
                    >
                      <input
                        type="radio"
                        name="urgency"
                        value={option.value}
                        checked={requestForm.urgency === option.value}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            urgency: e.target.value as any,
                          }))
                        }
                        className="text-orange-600"
                      />
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500">
                          {option.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                What happens next?
              </h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>✓ Our expert will call you within 30 minutes</li>
                <li>✓ We'll provide accurate pricing after assessment</li>
                <li>✓ Schedule a convenient time for service</li>
                <li>✓ Get the job done with quality guarantee</li>
              </ul>
            </div>

            <Button
              onClick={handleSubmitRequest}
              disabled={
                !requestForm.name ||
                !requestForm.phone ||
                !requestForm.address ||
                !requestForm.description
              }
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              Submit Request - Get Quote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
