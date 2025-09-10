import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useVendorAuth } from "@/hooks/use-vendor-auth";
import { vendorApi } from "@/lib/api";
import {
    baseFields,
    FormField,
    getServiceTypeConfig,
    getServiceTypeFromCategory
} from "@/lib/service-field-configs";
import { supabase } from "@/lib/supabase";
import { ArrowRight, CheckCircle, Info, Package } from "lucide-react";
import React, { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  service_type: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { session } = useAuth();
  const vendorAuth = useVendorAuth();
  const [step, setStep] = useState<"category" | "details">("category");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [formData, setFormData] = useState<Record<string, any>>({
    name: "",
    description: "",
    price: "",
    category_id: "",
    vendor_id: "",
    brand: "",
    sku: "",
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchVendors();
      resetForm();
    }
  }, [isOpen]);

  // Set default vendor when vendor auth info is loaded
  useEffect(() => {
    if (!vendorAuth.loading && vendorAuth.isVendor && vendorAuth.vendorId) {
      setFormData(prev => ({
        ...prev,
        vendor_id: vendorAuth.vendorId
      }));
    }
  }, [vendorAuth]);

  const fetchVendors = async () => {
    try {
      const result = await vendorApi.getAll();
      if (result.success && result.data) {
        // Filter only active vendors
        const activeVendors = result.data.filter((vendor: any) => vendor.status === 'active');
        setVendors(activeVendors);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    }
  };

  const resetForm = () => {
    const defaultVendorId = vendorAuth.isVendor && vendorAuth.vendorId ? vendorAuth.vendorId : "";
    
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      vendor_id: defaultVendorId,
      brand: "",
      sku: "",
      is_active: true,
    });
    setSelectedServiceType("");
    setSelectedCategory(null);
    setStep("category");
  };

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories...");

      if (session?.access_token) {
        console.log("Using API endpoint with auth token");
        // Use the API endpoint which handles authentication properly
        const response = await fetch("/api/admin/categories", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const categoriesData =
            result.data?.categories || result.categories || [];
          console.log("Categories fetched from API:", categoriesData);
          setCategories(categoriesData);
          return;
        } else if (response.status === 401) {
          console.error("Authentication required for categories");
          toast({
            title: "Authentication Error",
            description: "Please login to access categories",
            variant: "destructive",
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch categories");
        }
      }

      console.log("Using direct Supabase query");
      // Fallback to direct Supabase query
      const { data, error: supabaseError } = await supabase
        .from("categories")
        .select("id, name, service_type")
        .eq("is_active", true)
        .order("service_type, name");

      if (supabaseError) throw supabaseError;
      console.log("Categories fetched from Supabase:", data);
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);

      // Add some fallback categories for testing
      const fallbackCategories = [
        { id: "1", name: "Fresh Vegetables", service_type: "grocery" },
        { id: "2", name: "Electronics", service_type: "electronics" },
        { id: "3", name: "Car Rental", service_type: "car-rental" },
        { id: "4", name: "Beauty Services", service_type: "beauty" },
        { id: "5", name: "Handyman Services", service_type: "handyman" },
      ];

      console.log("Using fallback categories:", fallbackCategories);
      setCategories(fallbackCategories);

      toast({
        title: "Categories Loaded",
        description: "Using sample categories. Check console for any errors.",
        variant: "default",
      });
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    if (!categoryId) {
      // Allow clearing the category
      setSelectedServiceType("");
      setSelectedCategory(null);
      setFormData((prev) => ({ ...prev, category_id: "" }));
      return;
    }

    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      const serviceType =
        category.service_type || getServiceTypeFromCategory(category.name);
      const previousServiceType = selectedServiceType;

      setSelectedServiceType(serviceType);
      setSelectedCategory(category);

      // If service type changed, reset service-specific fields but keep basic info
      if (serviceType !== previousServiceType) {
        const newFormData: Record<string, any> = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          category_id: categoryId,
          brand: formData.brand,
          sku: formData.sku,
          is_active: formData.is_active,
        };

        setFormData(newFormData);
      } else {
        // Same service type, just update category
        setFormData((prev) => ({ ...prev, category_id: categoryId }));
      }
    }
  };

  const handleProceedToDetails = () => {
    if (selectedCategory && selectedServiceType) {
      setStep("details");
    }
  };

  const handleBackToCategory = () => {
    setStep("category");
  };

  const getCurrentConfig = () => {
    return getServiceTypeConfig(selectedServiceType);
  };

  const getAllFields = (): FormField[] => {
    // Always show category field first
    const categoryField = baseFields.find(
      (field) => field.name === "category_id",
    );

    // If no service type selected, only show category
    if (!selectedServiceType) {
      return categoryField ? [categoryField] : [];
    }

    const config = getCurrentConfig();
    if (!config) return baseFields;

    const visibleBaseFields = baseFields.filter(
      (field) =>
        field.name !== "category_id" && config.baseFields.includes(field.name),
    );

    // Return fields in order: category first, then other base fields, then specific fields
    return categoryField
      ? [categoryField, ...visibleBaseFields, ...config.specificFields]
      : [...visibleBaseFields, ...config.specificFields];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate vendor_id is required
      if (!formData.vendor_id || formData.vendor_id.trim() === "") {
        toast({
          title: "Error",
          description: "Please select a vendor for this product.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Prepare data for insertion, handling different field types
      const insertData: Record<string, any> = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id || null,
        vendor_id: formData.vendor_id,
        brand: formData.brand || null,
        sku: formData.sku || null,
        is_active: formData.is_active,
      };

      // Handle numeric fields
      const numericFields = [
        "stock_quantity",
        "original_price",
        "discount",
        "year",
        "seats",
        "doors",
        "available_seats",
        "price_per_day",
        "price_per_hour",
      ];
      numericFields.forEach((field) => {
        if (formData[field] !== undefined && formData[field] !== "") {
          if (field === "discount" || field.includes("price")) {
            insertData[field] = parseFloat(formData[field]);
          } else {
            insertData[field] = parseInt(formData[field]);
          }
        }
      });

      // Handle boolean fields
      const booleanFields = [
        "is_organic",
        "is_fresh",
        "available",
        "includes_materials",
        "has_installation",
        "is_dishwasher_safe",
        "is_microwave_safe",
      ];
      booleanFields.forEach((field) => {
        if (formData[field] !== undefined) {
          insertData[field] = Boolean(formData[field]);
        }
      });

      // Handle array fields (features, amenities, etc.)
      const arrayFields = ["features", "amenities", "urgency_levels"];
      arrayFields.forEach((field) => {
        if (formData[field] && typeof formData[field] === "string") {
          insertData[field] = formData[field]
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean);
        }
      });

      // Handle other text fields
      const textFields = [
        "unit",
        "vehicle_category",
        "transmission",
        "fuel_type",
        "mileage",
        "location",
        "from_location",
        "to_location",
        "departure_time",
        "arrival_time",
        "duration",
        "bus_type",
        "operator",
        "price_range",
        "service_category",
        "warranty_period",
        "warranty",
        "model_number",
        "specifications",
        "color_options",
        "material",
        "dimensions",
        "weight",
        "care_instructions",
      ];
      textFields.forEach((field) => {
        if (formData[field] !== undefined && formData[field] !== "") {
          insertData[field] = formData[field];
        }
      });

      if (session?.access_token) {
        // Use the API endpoint for product creation
        const response = await fetch("/api/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(insertData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create product");
        }

        const result = await response.json();
      } else {
        // Fallback to direct Supabase insertion
        const { data, error } = await supabase
          .from("products")
          .insert([insertData])
          .select();

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${getCurrentConfig()?.name || "Product"} added successfully`,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || "";

    switch (field.type) {
      case "text":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <div className="relative">
              <Input
                id={field.name}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
              {field.unit && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  {field.unit}
                </span>
              )}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <div className="relative">
              <Input
                id={field.name}
                type="number"
                step={field.step}
                min={field.min}
                max={field.max}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
              {field.unit && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  {field.unit}
                </span>
              )}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case "select":
        if (field.name === "category_id") {
          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label} {field.required && "*"}
              </Label>
              <Select
                value={value}
                onValueChange={(newValue) => handleCategoryChange(newValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category to start" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(
                      (category) => category.id && category.id.trim() !== "",
                    )
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {!selectedServiceType && (
                <p className="text-xs text-gray-500">
                  Choose a category to see relevant fields for that service type
                </p>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) =>
                handleInputChange(field.name, newValue)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options
                  ?.filter(
                    (option) => option.value && option.value.trim() !== "",
                  )
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && "*"}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) =>
                handleInputChange(field.name, checked)
              }
            />
            <Label htmlFor={field.name}>{field.label}</Label>
            {field.description && (
              <div className="flex items-center">
                <Info className="h-4 w-4 text-gray-400 ml-2" />
                <span className="text-xs text-gray-500 ml-1">
                  {field.description}
                </span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentConfig = getCurrentConfig();
  const allFields = getAllFields();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add New Product/Service
          </DialogTitle>
          <DialogDescription>
            Create a new product or service in your inventory
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${step === "category" ? "text-primary" : selectedCategory ? "text-green-600" : "text-gray-400"}`}
            >
              {selectedCategory ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <div
                  className={`w-5 h-5 rounded-full border-2 ${step === "category" ? "border-primary bg-primary" : "border-gray-300"} flex items-center justify-center`}
                >
                  {step === "category" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              )}
              <span className="font-medium">Choose Category</span>
            </div>
            <ArrowRight
              className={`h-4 w-4 ${selectedCategory ? "text-gray-400" : "text-gray-300"}`}
            />
            <div
              className={`flex items-center space-x-2 ${step === "details" ? "text-primary" : "text-gray-400"}`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 ${step === "details" ? "border-primary bg-primary" : "border-gray-300"} flex items-center justify-center`}
              >
                {step === "details" && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="font-medium">Product Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Category Selection */}
        {step === "category" && (
          <div className="space-y-6">
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Select Product Category
                </CardTitle>
                <CardDescription>
                  Choose the category that best describes your product or
                  service. This will determine which fields you'll need to fill
                  out.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="category-select">Category *</Label>
                  <div className="text-xs text-gray-500 mb-2">
                    Available categories: {categories.length}
                  </div>
                  <Select
                    value={formData.category_id}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] max-h-64 overflow-auto">
                      {categories.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading categories...
                        </div>
                      ) : (
                        categories
                          .filter(
                            (category) =>
                              category.id && category.id.trim() !== "",
                          )
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{category.name}</span>
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  {category.service_type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Assignment</CardTitle>
                <CardDescription>
                  Choose which vendor this product belongs to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="vendor-select">
                    Vendor *
                    {vendorAuth.isVendor && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Your vendor account)
                      </span>
                    )}
                  </Label>
                  <div className="text-xs text-gray-500 mb-2">
                    Available vendors: {vendors.length}
                  </div>
                  <Select
                    value={formData.vendor_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vendor_id: value })
                    }
                    disabled={vendorAuth.isVendor && !vendorAuth.canSelectVendor}
                  >
                    <SelectTrigger className={`h-12 ${vendorAuth.isVendor && !vendorAuth.canSelectVendor ? "opacity-60" : ""}`}>
                      <SelectValue placeholder="Select a vendor..." />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] max-h-64 overflow-auto">
                      {vendorAuth.loading ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading vendors...
                        </div>
                      ) : vendorAuth.isVendor && !vendorAuth.canSelectVendor ? (
                        <SelectItem value={vendorAuth.vendorId!}>
                          <div className="flex items-center justify-between w-full">
                            <span>{vendorAuth.vendorName}</span>
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs"
                            >
                              Your account
                            </Badge>
                          </div>
                        </SelectItem>
                      ) : (
                        vendors
                          .filter(
                            (vendor) =>
                              vendor.id && vendor.id.trim() !== "",
                          )
                          .map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{vendor.name}</span>
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  {vendor.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {vendorAuth.isVendor && !vendorAuth.canSelectVendor && (
                    <p className="text-xs text-muted-foreground">
                      Products will be assigned to your vendor account automatically.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedCategory && currentConfig && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-800">
                    <span className="text-lg">{currentConfig.icon}</span>
                    {currentConfig.name} - {selectedCategory.name}
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    {currentConfig.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={handleProceedToDetails}
                    className="w-full"
                    size="lg"
                  >
                    Continue to Product Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Product Details Form */}
        {step === "details" && currentConfig && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-lg">{currentConfig.icon}</span>
                      {currentConfig.name} - {selectedCategory?.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Fill out the details for your{" "}
                      {currentConfig.name.toLowerCase()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToCategory}
                  >
                    Change Category
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAllFields()
                  .filter((field) => field.name !== "category_id") // Don't show category field again
                  .map((field) => (
                    <div
                      key={field.name}
                      className={
                        field.type === "textarea" ||
                        field.name === "description" ||
                        field.name === "specifications" ||
                        field.name === "care_instructions"
                          ? "md:col-span-2"
                          : field.type === "switch"
                            ? "md:col-span-2"
                            : "md:col-span-1"
                      }
                    >
                      {renderField(field)}
                    </div>
                  ))}
              </div>

              <div className="flex justify-between space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToCategory}
                >
                  Back to Category
                </Button>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !selectedServiceType}
                  >
                    {loading
                      ? "Adding..."
                      : currentConfig
                        ? `Add ${currentConfig.name.slice(0, -1)}`
                        : "Add Product"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
