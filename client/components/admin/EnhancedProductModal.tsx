import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getCustomFieldValues, saveCustomFieldValues, useCustomFields } from "@/hooks/use-custom-fields";
import { useVendorAuth } from "@/hooks/use-vendor-auth";
import { productApi, uploadApi, vendorApi } from "@/lib/api";
import {
  baseFields,
  FormField,
  getServiceTypeConfig,
  getServiceTypeFromCategory,
  serviceTypeConfigs,
} from "@/lib/service-field-configs";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  DollarSign,
  Image as ImageIcon,
  Info,
  Package,
  Sparkles,
  Tag,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  const vendorAuth = useVendorAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({
    name: "",
    description: "",
    price: "",
    category_id: "",
    subcategory_id: "", // NEW: Optional subcategory field
    vendor_id: "",
    brand: "",
    sku: "",
    is_active: true,
  });
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [currentStep, setCurrentStep] = useState<"category" | "details">(
    "category",
  );
  const [showFieldTransition, setShowFieldTransition] = useState(false);
  
  // Custom fields hook - dynamically load fields from database
  const { 
    customFields, 
    formFields: dynamicFormFields, 
    loading: customFieldsLoading,
    error: customFieldsError 
  } = useCustomFields(selectedServiceType);

  // Debug logging
  useEffect(() => {
    console.log('🔍 EnhancedProductModal - selectedServiceType:', selectedServiceType);
    console.log('🔍 EnhancedProductModal - customFields:', customFields);
    console.log('🔍 EnhancedProductModal - dynamicFormFields:', dynamicFormFields);
    console.log('🔍 EnhancedProductModal - customFieldsLoading:', customFieldsLoading);
    console.log('🔍 EnhancedProductModal - customFieldsError:', customFieldsError);
    
    // Find and log measurement_unit field specifically
    const measurementField = dynamicFormFields.find(f => f.name === 'measurement_unit');
    if (measurementField) {
      console.log('📊 MEASUREMENT UNIT FIELD:', {
        name: measurementField.name,
        label: measurementField.label,
        options: measurementField.options,
        optionsCount: measurementField.options?.length || 0
      });
    }
  }, [selectedServiceType, customFields, dynamicFormFields, customFieldsLoading, customFieldsError]);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchVendors();
      if (mode === "edit" && product) {
        populateFormFromProduct();
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, product]);

  // Set default vendor when vendor auth info is loaded
  useEffect(() => {
    if (!vendorAuth.loading && vendorAuth.isVendor && vendorAuth.vendorId) {
      setFormData(prev => ({
        ...prev,
        vendor_id: vendorAuth.vendorId
      }));
    }
  }, [vendorAuth]);

  const populateFormFromProduct = async () => {
    if (!product) return;

    const baseData = {
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category_id: product.category_id || "",
      vendor_id: product.vendor_id || "",
      brand: product.brand || "",
      sku: product.sku || "",
      is_active: product.is_active ?? true,
      ...product, // Include any additional fields
    };

    // Set service type if category is available
    if (product.category_id) {
      const category = categories.find((c) => c.id === product.category_id);
      if (category) {
        const serviceType =
          category.service_type || getServiceTypeFromCategory(category.name);
        setSelectedServiceType(serviceType);
        setCurrentStep("details");
        
        // Load custom field values for this product
        try {
          const customFieldValues = await getCustomFieldValues(product.id);
          setFormData({
            ...baseData,
            ...customFieldValues,
          });
          console.log("✅ Loaded custom field values:", customFieldValues);
        } catch (error) {
          console.error("❌ Error loading custom field values:", error);
          setFormData(baseData);
        }
      }
    } else {
      setCurrentStep("category");
      setFormData(baseData);
    }
  };

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
      subcategory_id: "", // Reset subcategory
      vendor_id: defaultVendorId,
      brand: "",
      sku: "",
      is_active: true,
    });
    setSelectedServiceType("");
    setSubcategories([]); // Clear subcategories
    setImages([]);
    setCurrentStep("category");
  };

  // NEW: Fetch subcategories when category is selected
  const fetchSubcategories = async (categoryId: string) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [SUBCATEGORIES] Fetching subcategories');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 Category ID:', categoryId);
    
    try {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, description, icon, color")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.error('❌ [SUBCATEGORIES ERROR]', error);
        console.error('  ├─ Code:', error.code);
        console.error('  ├─ Message:', error.message);
        console.error('  └─ Details:', error.details);
        setSubcategories([]);
        toast.error('Failed to load subcategories');
        return;
      }

      console.log('✅ [SUBCATEGORIES SUCCESS]');
      console.log('  ├─ Count:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('  └─ Subcategories:');
        data.forEach((sub, index) => {
          console.log(`      [${index + 1}] ${sub.icon || '📁'} ${sub.name} (${sub.id})`);
        });
      } else {
        console.log('  └─ No subcategories found for this category');
      }
      
      setSubcategories(data || []);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      console.error('\n❌ [SUBCATEGORIES EXCEPTION]', error);
      if (error instanceof Error) {
        console.error('  ├─ Message:', error.message);
        console.error('  └─ Stack:', error.stack);
      }
      setSubcategories([]);
      toast.error('An error occurred while loading subcategories');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
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
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 [CATEGORY CHANGE] Handler triggered');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (!categoryId) {
        console.log('❌ No category ID - resetting form');
        setSelectedServiceType("");
        setFormData((prev) => ({ ...prev, category_id: "", subcategory_id: "" }));
        setSubcategories([]);
        setCurrentStep("category");
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return;
      }

      const category = categories.find((c) => c.id === categoryId);
      
      if (!category) {
        console.error('❌ Category not found in categories array!');
        console.error('  ├─ Requested ID:', categoryId);
        console.error('  └─ Available categories:', categories.length);
        toast.error('Selected category not found');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return;
      }
      
      console.log('📋 Category details:');
      console.log('  ├─ ID:', categoryId);
      console.log('  ├─ Name:', category.name);
      console.log('  └─ Service Type:', category.service_type || '(not set)');
      
      const serviceType = category.service_type || getServiceTypeFromCategory(category.name);
      const previousServiceType = selectedServiceType;
      
      console.log('\n🔍 Service Type Resolution:');
      console.log('  ├─ From category.service_type:', category.service_type || '(not set)');
      console.log('  ├─ Derived from name:', getServiceTypeFromCategory(category.name));
      console.log('  ├─ Final service type:', serviceType);
      console.log('  └─ Previous service type:', previousServiceType || '(none)');

      // NEW: Fetch subcategories for the selected category
      console.log('\n📂 Fetching subcategories...');
      fetchSubcategories(categoryId);

      // Show transition animation if service type changes
      if (serviceType !== previousServiceType && previousServiceType) {
        console.log('\n⏱️  Service type changed - applying transition');
        setShowFieldTransition(true);
        setTimeout(() => {
          console.log('🔄 Applying new service type after transition:', serviceType);
          setSelectedServiceType(serviceType);
          setShowFieldTransition(false);
          setCurrentStep("details");
        }, 300);
      } else {
        console.log('\n✅ Setting service type immediately:', serviceType);
        setSelectedServiceType(serviceType);
        setCurrentStep("details");
      }

      // Reset service-specific fields when service type changes
      if (serviceType !== previousServiceType) {
        console.log('\n🔄 Service type changed - resetting form fields');
        
        const newFormData: Record<string, any> = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          category_id: categoryId,
          subcategory_id: "", // Reset subcategory when category changes
          vendor_id: formData.vendor_id, // Preserve vendor selection
          brand: formData.brand,
          sku: formData.sku,
          is_active: formData.is_active,
        };

        // Initialize service-specific fields with default values
        const config = getServiceTypeConfig(serviceType);
        if (config) {
          console.log('  ├─ Found config for:', serviceType);
          console.log('  └─ Initializing', config.specificFields.length, 'service-specific fields');
          
          config.specificFields.forEach((field) => {
            if (field.type === "switch" || field.type === "checkbox") {
              newFormData[field.name] = false;
            } else if (field.type === "number") {
              newFormData[field.name] = "";
            } else {
              newFormData[field.name] = "";
            }
          });
        } else {
          console.warn('  ⚠️  No config found for service type:', serviceType);
        }

        setFormData(newFormData);
      } else {
        console.log('\n✅ Same service type - updating category only');
        setFormData((prev) => ({ ...prev, category_id: categoryId, subcategory_id: "" }));
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
    
    // Start with category field
    let allFields = [categoryField];

    // Add static configuration fields (if config exists)
    if (config) {
      const filteredBaseFields = baseFields.filter(
        (field) =>
          config.baseFields.includes(field.name) && field.name !== "category_id",
      );

      allFields = [
        ...allFields,
        ...filteredBaseFields,
        ...config.specificFields,
      ];

      console.log("getAllFields - static config fields added:", config.specificFields.length);
    }

    // Add dynamic database fields (prioritize these and merge with static ones)
    if (dynamicFormFields.length > 0) {
      console.log("getAllFields - adding dynamic fields:", dynamicFormFields.length);
      console.log("getAllFields - dynamic fields:", dynamicFormFields.map(f => f.name));
      
      // CRITICAL FIX: Replace static fields with dynamic fields when they exist
      // This ensures service-specific configurations (like measurement units) take precedence
      const dynamicFieldNames = dynamicFormFields.map(f => f.name);
      
      // Remove static fields that have dynamic replacements
      allFields = allFields.filter(field => !dynamicFieldNames.includes(field.name));
      
      // Add all dynamic fields
      allFields = [
        ...allFields,
        ...dynamicFormFields,
      ];

      console.log("getAllFields - merged fields count:", allFields.length);
      console.log("getAllFields - final field names:", allFields.map(f => f.name));
      
      // Special logging for measurement_unit
      const measurementField = allFields.find(f => f.name === 'measurement_unit');
      if (measurementField) {
        console.log("✅ measurement_unit field in final fields:", {
          name: measurementField.name,
          label: measurementField.label,
          type: measurementField.type,
          optionsCount: measurementField.options?.length || 0,
          options: measurementField.options
        });
      }
    }

    // If no config and no dynamic fields, add basic fields
    if (!config && dynamicFormFields.length === 0) {
      console.warn("No config found and no dynamic fields for service type:", selectedServiceType);
      // Add basic product fields
      allFields = [
        ...allFields,
        ...baseFields.filter(field => 
          ['name', 'description', 'price', 'brand', 'sku'].includes(field.name)
        )
      ];
    }

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
    console.log("getAllFields - dynamic fields count:", dynamicFormFields.length);
    console.log("getAllFields - final validFields count:", validFields.length);

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
      // Validate vendor_id is required
      if (!formData.vendor_id || formData.vendor_id.trim() === "") {
        toast.error("Please select a vendor for this product");
        setLoading(false);
        return;
      }

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
        vendor_id: formData.vendor_id,
        name: formData.name,
        // NEW: Optional subcategory mapping - if subcategory is selected, map to it, otherwise map to category
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null, // Will be null if not selected
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
        const productId = mode === "edit" ? product.id : result.data?.id;
        
        // Save custom field values if we have custom fields and a product ID
        if (productId && customFields.length > 0) {
          try {
            console.log("💾 Saving custom field values for product:", productId);
            
            // Extract custom field values from form data
            const customFieldValues: Record<string, any> = {};
            customFields.forEach(field => {
              const value = formData[field.field_name];
              if (value !== undefined && value !== null && value !== '') {
                customFieldValues[field.field_name] = value;
              }
            });
            
            console.log("💾 Custom field values to save:", customFieldValues);
            
            if (Object.keys(customFieldValues).length > 0) {
              await saveCustomFieldValues(productId, customFieldValues, customFields);
              console.log("✅ Custom field values saved successfully");
            }
          } catch (customFieldError) {
            console.error("❌ Error saving custom field values:", customFieldError);
            // Don't fail the entire operation, just log the error
            toast.error("Product saved but custom fields failed to save");
          }
        }
        
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
  
  // Make fields reactive to changes in dynamicFormFields
  const fields = React.useMemo(() => {
    const allFields = getAllFields();
    console.log('🔄 Fields recalculated:', {
      selectedServiceType,
      dynamicFormFieldsCount: dynamicFormFields.length,
      totalFieldsCount: allFields.length,
      fields: allFields.map(f => ({ name: f.name, label: f.label, type: f.type }))
    });
    return allFields;
  }, [selectedServiceType, dynamicFormFields, categories]);

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

                  {/* NEW: Subcategory selector (optional) */}
                  {selectedServiceType && subcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="subcategory_id">
                        Subcategory <span className="text-xs text-muted-foreground">(Optional)</span>
                      </Label>
                      <Select
                        value={formData.subcategory_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, subcategory_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None (map to category only)</SelectItem>
                          {subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.icon && `${subcategory.icon} `}
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        If subcategory is selected, the product will be mapped to it. Otherwise, it will be mapped to the category.
                      </p>
                    </div>
                  )}

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
                    aria-label="Upload product images"
                    title="Upload product images"
                    onChange={handleImageUpload}
                  />
                </CardContent>
              </Card>

              {/* Vendor Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="vendor_id">
                      Vendor *
                      {vendorAuth.isVendor && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Your vendor account)
                        </span>
                      )}
                    </Label>
                    <Select
                      value={formData.vendor_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, vendor_id: value })
                      }
                      disabled={vendorAuth.isVendor && !vendorAuth.canSelectVendor}
                    >
                      <SelectTrigger className={vendorAuth.isVendor && !vendorAuth.canSelectVendor ? "opacity-60" : ""}>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorAuth.loading ? (
                          <div className="p-4 text-center text-muted-foreground">
                            Loading vendors...
                          </div>
                        ) : vendorAuth.isVendor && !vendorAuth.canSelectVendor ? (
                          <SelectItem value={vendorAuth.vendorId!}>
                            {vendorAuth.vendorName} (Your account)
                          </SelectItem>
                        ) : (
                          vendors.map((vendor) => (
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

              {/* Dynamic Form Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customFieldsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading custom fields...</p>
                    </div>
                  ) : customFieldsError ? (
                    <div className="text-center py-8 text-red-600">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      <p>Error loading custom fields: {customFieldsError}</p>
                      <p className="text-sm text-muted-foreground mt-2">Using default fields</p>
                    </div>
                  ) : (() => {
                    const nonCategoryFields = fields.filter(
                      (field) => field && field.name !== "category_id",
                    );

                    if (nonCategoryFields.length > 0) {
                      return (
                        <div className="space-y-4">
                          {/* Show field source info */}
                          {dynamicFormFields.length > 0 && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-green-700">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Dynamic Fields Loaded
                                </span>
                              </div>
                              <p className="text-xs text-green-600 mt-1">
                                {dynamicFormFields.length} custom fields from database + {nonCategoryFields.length - dynamicFormFields.length} standard fields
                              </p>
                            </div>
                          )}
                          
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
