import { useState } from "react";
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
} from "lucide-react";
import {
  handymanServices,
  serviceCategories,
  HandymanService,
} from "@/lib/handyman-data";

export default function Handyman() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedService, setSelectedService] =
    useState<HandymanService | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    preferredDate: "",
    preferredTime: "",
    urgency: "normal" as "normal" | "urgent" | "emergency",
  });

  const filteredServices = handymanServices.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      service.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleServiceSelect = (service: HandymanService) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };

  const handleSubmitRequest = () => {
    // Simulate service request submission
    alert(
      `Service request submitted for ${selectedService?.name}. We'll call you within 30 minutes with a quote!`,
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
                Handyman Services
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Rayachoty, Annamayya District</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Quick estimates</span>
                </div>
              </div>
            </div>

            <Badge className="bg-orange-500 text-white self-start lg:self-center">
              Expert technicians • Quality assured
            </Badge>
          </div>
        </div>

        {/* Emergency banner */}
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🚨</div>
              <div>
                <h3 className="font-semibold text-red-900">
                  Emergency Service Available
                </h3>
                <p className="text-red-700 text-sm">
                  24/7 emergency repairs for urgent issues
                </p>
              </div>
            </div>
            <Button className="bg-red-600 text-white hover:bg-red-700">
              Call Emergency: 1800-HELP-123
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Service Categories</h2>
          <div className="grid grid-cols-4 lg:grid-cols-9 gap-4">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`${selectedCategory === "all" ? "ring-2 ring-primary" : ""} 
                         bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center transition-all`}
            >
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-xs font-medium">All Services</p>
            </button>
            {serviceCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`${selectedCategory === category.name ? "ring-2 ring-primary" : ""} 
                           bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center transition-all`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <p className="text-xs font-medium leading-tight">
                  {category.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for services (e.g., AC repair, plumbing, electrical...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">{service.icon}</div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <Badge className="mb-2">{service.category}</Badge>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Price and duration */}
                <div className="mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
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
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{service.rating}</span>
                  <span className="text-gray-500 text-sm">
                    ({service.reviewCount} reviews)
                  </span>
                </div>

                <Button
                  onClick={() => handleServiceSelect(service)}
                  className="w-full bg-primary text-black hover:bg-primary/90"
                >
                  Get Quote
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Choose Service</h3>
              <p className="text-gray-600 text-sm">
                Select the service you need from our catalog
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Get Quote</h3>
              <p className="text-gray-600 text-sm">
                We'll call you within 30 minutes with accurate pricing
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-semibold mb-2">Schedule</h3>
              <p className="text-gray-600 text-sm">
                Book a convenient time for our expert to visit
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">4️⃣</span>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedService?.icon}</span>
              Request {selectedService?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Estimated Price Range</h3>
              <div className="text-2xl font-bold text-primary">
                {selectedService?.priceRange}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Final price will be provided after assessment. No hidden
                charges.
              </p>
            </div>

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
                    placeholder="+971 xx xxx xxxx"
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
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select time</option>
                    <option value="09:00-12:00">Morning (9 AM - 12 PM)</option>
                    <option value="12:00-15:00">
                      Afternoon (12 PM - 3 PM)
                    </option>
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
                      className="flex items-center space-x-2 cursor-pointer"
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
                        className="text-primary"
                      />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">
                          {option.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                What happens next?
              </h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Our expert will call you within 30 minutes</li>
                <li>• We'll provide accurate pricing after assessment</li>
                <li>• Schedule a convenient time for service</li>
                <li>• Get the job done with quality guarantee</li>
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
              className="w-full bg-primary text-black hover:bg-primary/90"
            >
              Submit Request - Get Quote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
