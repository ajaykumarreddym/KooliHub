import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  X,
  Image as ImageIcon,
  Package,
  Tag,
  DollarSign,
  Info,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  serviceTypeConfigs,
  getServiceTypeFromCategory,
  getServiceTypeConfig,
  baseFields,
  FormField,
} from "@/lib/service-field-configs";
import { productApi, uploadApi } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  service_type: string;
}

interface EnhancedProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any;
  mode?: "add" | "edit";
}

interface ImageUpload {
  file: File;
  preview: string;
}

export function EnhancedProductModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  mode = "add",
}: EnhancedProductModalProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({
    name: "",
    description: "",
    price: "",
    category_id: "",
    brand: "",
    sku: "",
    is_active: true,
  });
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [currentStep, setCurrentStep] = useState<"category" | "details">(
    "category",
  );
  const [showFieldTransition, setShowFieldTransition] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (mode === "edit" && product) {
        populateFormFromProduct();
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, product]);

  const populateFormFromProduct = () => {
    if (!product) return;

    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category_id: product.category_id || "",
      brand: product.brand || "",
      sku: product.sku || "",
      is_active: product.is_active ?? true,
      ...product, // Include any additional fields
    });

    // Set service type if category is available
    if (product.category_id) {
      const category = categories.find((c) => c.id === product.category_id);
      if (category) {
        const serviceType =
          category.service_type || getServiceTypeFromCategory(category.name);
        setSelectedServiceType(serviceType);
        setCurrentStep("details");
      }
    } else {
      setCurrentStep("category");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      brand: "",
      sku: "",
      is_active: true,
    });
    setSelectedServiceType("");
    setImages([]);
    setCurrentStep("category");
  };

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories...");

      // Direct Supabase query - this should work since the client is properly configured
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, service_type")
        .eq("is_active", true)
        .order("service_type, name");

      if (error) {
        console.error("Supabase error fetching categories:", error);
        throw error;
      }

      console.log("Categories fetched successfully:", data);
      setCategories(data || []);

      // If we have categories, the connection is working
      if (data && data.length > 0) {
        console.log(`Successfully loaded ${data.length} categories`);
        return;
      }

      // If no categories found, try the API endpoint as fallback
      console.log("No categories from Supabase, trying API fallback...");
      try {
        const response = await fetch("/api/categories", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          const categories = result.data?.categories || result.categories || [];
          console.log("Categories from API:", categories);
          setCategories(categories);
        }
      } catch (apiError) {
        console.warn("API fallback failed:", apiError);

        // Provide some fallback sample categories for testing
        const fallbackCategories = [
          {
            id: "grocery-1",
            name: "Fresh Vegetables",
            service_type: "grocery",
          },
          { id: "grocery-2", name: "Dairy Products", service_type: "grocery" },
          {
            id: "electronics-1",
            name: "Mobile Phones",
            service_type: "electronics",
          },
          {
            id: "car-rental-1",
            name: "Economy Cars",
            service_type: "car-rental",
          },
          {
            id: "handyman-1",
            name: "Plumbing Services",
            service_type: "handyman",
          },
        ];

        console.log("Using fallback categories:", fallbackCategories);
        setCategories(fallbackCategories);

        toast.error(
          "Using sample categories. Please check your database connection.",
        );
      }
    } catch (error) {
      console.error("Error fetching categories:", error);

      // Always provide fallback categories to prevent empty state
      const fallbackCategories = [
        {
          id: "fallback-1",
          name: "Sample Category 1",
          service_type: "grocery",
        },
        {
          id: "fallback-2",
          name: "Sample Category 2",
          service_type: "electronics",
        },
      ];

      setCategories(fallbackCategories);
      toast.error("Failed to load categories. Using sample data.");
    }
  };

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      if (!categoryId) {
        setSelectedServiceType("");
        setFormData((prev) => ({ ...prev, category_id: "" }));
        setCurrentStep("category");
        return;
      }

      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        const serviceType =
          category.service_type || getServiceTypeFromCategory(category.name);
        const previousServiceType = selectedServiceType;

        // Show transition animation if service type changes
        if (serviceType !== previousServiceType && previousServiceType) {
          setShowFieldTransition(true);
          setTimeout(() => {
            setSelectedServiceType(serviceType);
            setShowFieldTransition(false);
            setCurrentStep("details");
          }, 300);
        } else {
          setSelectedServiceType(serviceType);
          setCurrentStep("details");
        }

        // Reset service-specific fields when service type changes
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

          // Initialize service-specific fields with default values
          const config = getServiceTypeConfig(serviceType);
          if (config) {
            config.specificFields.forEach((field) => {
              if (field.type === "switch" || field.type === "checkbox") {
                newFormData[field.name] = false;
              } else if (field.type === "number") {
                newFormData[field.name] = "";
              } else {
                newFormData[field.name] = "";
              }
            });
          }

          setFormData(newFormData);
        } else {
          setFormData((prev) => ({ ...prev, category_id: categoryId }));
        }
      }
    },
    [categories, selectedServiceType, formData],
  );

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      files.forEach((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error("Please select valid image files");
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image size must be less than 5MB");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = event.target?.result as string;
          setImages((prev) => [...prev, { file, preview }]);
        };
        reader.readAsDataURL(file);
      });
    },
    [],
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getCurrentConfig = () => {
    if (!selectedServiceType) {
      console.warn("No service type selected");
      return null;
    }
    const config = getServiceTypeConfig(selectedServiceType);
    if (!config) {
      console.warn("No config found for service type:", selectedServiceType);
    }
    return config;
  };

  const getAllFields = (): FormField[] => {
    // Always include category field first
    const categoryField: FormField = {
      name: "category_id",
      label: "Category",
      type: "select",
      required: true,
      placeholder: "Select category",
    };

    const config = getCurrentConfig();
    if (!config) {
      console.warn("No config found for service type:", selectedServiceType);
      // Return only category field if no service type is selected
      return [categoryField];
    }

    // Get base fields filtered by config
    const filteredBaseFields = baseFields.filter(
      (field) =>
        config.baseFields.includes(field.name) && field.name !== "category_id",
    );

    const allFields = [
      categoryField,
      ...filteredBaseFields,
      ...config.specificFields,
    ];

    // Validate all fields have required properties
    const validFields = allFields.filter((field) => {
      if (!field || !field.name) {
        console.warn("Invalid field found:", field);
        return false;
      }
      return true;
    });

    console.log("getAllFields - selectedServiceType:", selectedServiceType);
    console.log("getAllFields - config:", config);
    console.log("getAllFields - validFields:", validFields);

    return validFields;
  };

  const renderField = (field: FormField | undefined) => {
    if (!field) {
      console.warn("renderField called with undefined field");
      return null;
    }
    const value = formData[field.name] || "";

    switch (field.type) {
      case "select":
        if (field.name === "category_id") {
          // Group categories by service type
          const groupedCategories = categories.reduce(
            (acc, category) => {
              const serviceType = category.service_type || "Other";
              if (!acc[serviceType]) acc[serviceType] = [];
              acc[serviceType].push(category);
              return acc;
            },
            {} as Record<string, Category[]>,
          );

          console.log(
            "Rendering category dropdown with categories:",
            categories,
          );
          console.log("Grouped categories:", groupedCategories);
          console.log("Category field value:", value);
          console.log("Form data:", formData);

          return (
            <div key={field.name} className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              <div className="text-xs text-gray-500 mb-2">
                Available categories: {categories.length}
              </div>
              <Select value={value} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={field.placeholder || "Select a category..."}
                  />
                </SelectTrigger>
                <SelectContent className="z-[9999] max-h-64 overflow-auto">
                  {categories.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading categories...
                    </div>
                  ) : (
                    Object.entries(groupedCategories).map(
                      ([serviceType, cats]) => (
                        <div key={serviceType}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {serviceTypeConfigs?.find(
                              (c) => c.id === serviceType,
                            )?.name || serviceType}
                          </div>
                          {cats.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </div>
                      ),
                    )
                  )}
                </SelectContent>
              </Select>
              {field.description && (
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              )}
            </div>
          );
        }

        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.name, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );

      case "switch":
        return (
          <div
            key={field.name}
            className="flex items-center justify-between space-y-2"
          >
            <div className="space-y-1">
              <Label>
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              {field.description && (
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              )}
            </div>
            <Switch
              checked={value}
              onCheckedChange={(checked) =>
                handleFieldChange(field.name, checked)
              }
            />
          </div>
        );

      case "number":
        return (
          <div key={field.name} className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.name === "price" && <DollarSign className="h-4 w-4" />}
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
              {field.unit && (
                <span className="text-muted-foreground">({field.unit})</span>
              )}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              step={field.step}
              min={field.min}
              max={field.max}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );

      default: // text and others
        return (
          <div key={field.name} className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.name === "name" && <Package className="h-4 w-4" />}
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              autoFocus={field.name === "name" && currentStep === "details"}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const fields = getAllFields();
      for (const field of fields) {
        if (field.required && !formData[field.name]) {
          toast.error(`${field.label} is required`);
          setLoading(false);
          return;
        }
      }

      // Prepare the data for submission
      const submitData: Record<string, any> = {
        vendor_id: "system", // Default vendor for admin-created products
        name: formData.name,
      };

      // Process all form fields
      fields.forEach((field) => {
        const value = formData[field.name];

        if (value !== undefined && value !== "") {
          if (field.type === "number") {
            submitData[field.name] = parseFloat(value) || 0;
          } else if (field.type === "switch" || field.type === "checkbox") {
            submitData[field.name] = Boolean(value);
          } else if (field.name === "tags" && typeof value === "string") {
            submitData[field.name] = value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean);
          } else {
            submitData[field.name] = value;
          }
        }
      });

      // Upload images if any
      if (images.length > 0) {
        try {
          const uploadPromises = images.map(async (img) => {
            const result = await uploadApi.productImage(img.file);
            if (result.success) {
              return result.data.url;
            } else {
              throw new Error(result.error || 'Failed to upload image');
            }
          });

          const imageUrls = await Promise.all(uploadPromises);
          submitData.image_url = imageUrls[0]; // Primary image
          submitData.images = imageUrls; // All images
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error(`Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      console.log('Submitting product data:', submitData);

      let result;
      if (mode === "edit" && product) {
        console.log('Updating product:', product.id);
        result = await productApi.update(product.id, submitData);
      } else {
        console.log('Creating new product');
        result = await productApi.create(submitData);
      }

      console.log('API result:', result);

      if (result.success) {
        toast.success(
          mode === "edit"
            ? "Product updated successfully"
            : "Product created successfully",
        );
        onSuccess();
        onClose();
      } else {
        console.error('API error:', result.error);
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error instanceof Error ? error.message : "Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const config = getCurrentConfig();
  const fields = getAllFields();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === "edit" ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === "category"
              ? "Start by selecting a category to see relevant fields"
              : `Adding ${config?.name || "product"} with specialized fields`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div
              className={`flex items-center gap-2 ${currentStep === "category" ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${currentStep === "category" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
              >
                1
              </div>
              <span className="font-medium">Select Category</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div
              className={`flex items-center gap-2 ${currentStep === "details" ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${currentStep === "details" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
              >
                2
              </div>
              <span className="font-medium">Product Details</span>
            </div>
          </div>

          {/* Category Selection Step */}
          {currentStep === "category" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Choose Product Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const categoryField = fields.find(
                      (f) => f.name === "category_id",
                    );
                    if (!categoryField) {
                      console.error(
                        "Category field not found in fields:",
                        fields,
                      );
                      // Fallback: create category field manually
                      const fallbackCategoryField: FormField = {
                        name: "category_id",
                        label: "Category",
                        type: "select",
                        required: true,
                        placeholder: "Select category",
                      };
                      return renderField(fallbackCategoryField);
                    }
                    return renderField(categoryField);
                  })()}

                  {selectedServiceType && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium text-primary">
                            {config?.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {config?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Details Step */}
          {currentStep === "details" && config && (
            <div
              className={`space-y-6 transition-all duration-300 ${showFieldTransition ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
            >
              {/* Service Type Badge */}
              {config && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-2 w-fit"
                >
                  <span>{config.icon}</span>
                  {config.name}
                </Badge>
              )}

              {/* Image Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Product Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.preview}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload images
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to 5MB each
                    </p>
                  </div>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </CardContent>
              </Card>

              {/* Dynamic Form Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const nonCategoryFields = fields.filter(
                      (field) => field && field.name !== "category_id",
                    );

                    if (nonCategoryFields.length > 0) {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {nonCategoryFields.map((field) => {
                            if (!field) {
                              console.warn(
                                "Undefined field in nonCategoryFields",
                              );
                              return null;
                            }
                            return (
                              <div
                                key={field.name}
                                className={
                                  field.type === "textarea"
                                    ? "md:col-span-2"
                                    : ""
                                }
                              >
                                {renderField(field)}
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2" />
                          <p>Please select a category to see product fields</p>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {currentStep === "details" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep("category")}
                >
                  Back to Category
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={loading}
              >
                Cancel
              </Button>

              {currentStep === "details" && (
                <Button type="submit" disabled={loading}>
                  {loading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Update Product"
                      : "Create Product"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
