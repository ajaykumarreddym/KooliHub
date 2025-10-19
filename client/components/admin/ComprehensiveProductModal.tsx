import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AlertCircle, ArrowRight, Package, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DynamicFormGenerator from "./DynamicFormGenerator";

interface Category {
  id: string;
  name: string;
  service_type: string;
}

interface ServiceType {
  id: string;
  title: string;
  description: string;
}

interface ComprehensiveProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any;
  mode?: "add" | "edit";
}

interface Vendor {
  id: string;
  name: string;
  status: string;
}

export function ComprehensiveProductModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  mode = "add",
}: ComprehensiveProductModalProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<"service" | "category" | "details">("service");
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && product) {
        // Load product data for editing
        setSelectedServiceType(product.service_type || "");
        setSelectedCategory(product.category_id || "");
        setInitialValues({
          product_name: product.name,
          product_description: product.description,
          product_specification: product.specification,
          price: product.price,
          units: product.units,
          discount: product.discount || 0,
          vendor_name: product.vendor_id,
          meta_title: product.meta_title,
          meta_tags: product.meta_tags,
          meta_description: product.meta_description,
          ...product.custom_attributes, // Load custom attributes
        });
        setCurrentStep("details");
      } else {
        // Reset for adding new product
        setSelectedServiceType("");
        setSelectedCategory("");
        setInitialValues({});
        setCurrentStep("service");
      }
      fetchServiceTypes();
      fetchCategories();
      fetchVendors();
    }
  }, [isOpen, mode, product]);

  const fetchServiceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("service_types")
        .select("id, title, description")
        .eq("is_active", true)
        .order("title");

      if (error) throw error;
      setServiceTypes(data || []);
    } catch (error) {
      console.error("Error fetching service types:", error);
      toast.error("Failed to load service types");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, service_type")
        .eq("is_active", true)
        .order("service_type, name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, status")
        .is("deleted_at", null)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    }
  };

  const handleServiceTypeSelect = (serviceTypeId: string) => {
    setSelectedServiceType(serviceTypeId);
    setSelectedCategory(""); // Reset category when service type changes
    setCurrentStep("category");
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentStep("details");
  };

  const handleBack = () => {
    if (currentStep === "details") {
      setCurrentStep("category");
    } else if (currentStep === "category") {
      setCurrentStep("service");
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      // ✅ Handle multiple product images upload
      let imageUrls: string[] = [];
      let primaryImageUrl: string | null = null;

      if (values.product_images) {
        const images = Array.isArray(values.product_images) 
          ? values.product_images 
          : [values.product_images];
        
        // Upload images to Supabase storage
        for (const file of images) {
          if (file instanceof File) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `product-images/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('products')
              .upload(filePath, file);
            
            if (uploadError) {
              console.error('Image upload error:', uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);
              imageUrls.push(publicUrl);
            }
          }
        }
        
        // Set first image as primary
        if (imageUrls.length > 0) {
          primaryImageUrl = imageUrls[0];
        }
      }

      // Prepare offering data (using offerings table, not products)
      const offeringData: any = {
        name: values.product_name,
        description: values.product_description,
        type: 'product', // offering_type enum
        vendor_id: values.vendor_name,
        category_id: selectedCategory,
        base_price: parseFloat(values.price),
        meta_title: values.meta_title,
        meta_description: values.meta_description,
        is_active: true,
        metadata: {
          specification: values.product_specification,
          units: values.units,
          discount: parseFloat(values.discount || 0),
          meta_tags: values.meta_tags,
        },
      };

      // ✅ Add images (multiple support)
      if (imageUrls.length > 0) {
        offeringData.primary_image_url = primaryImageUrl;
        offeringData.gallery_urls = imageUrls; // Array of images
      }

      // Extract custom attributes (non-default fields)
      const customAttributes: Record<string, any> = {};
      const defaultFields = [
        'product_name', 'product_description', 'product_specification',
        'product_images', 'price', 'units', 'discount', 'vendor_name',
        'meta_title', 'meta_tags', 'meta_description'
      ];
      
      Object.keys(values).forEach(key => {
        if (!defaultFields.includes(key)) {
          customAttributes[key] = values[key];
        }
      });

      if (Object.keys(customAttributes).length > 0) {
        offeringData.custom_attributes = customAttributes;
      }

      if (mode === "edit" && product) {
        // Update existing offering
        const { error: offeringError } = await supabase
          .from("offerings")
          .update(offeringData)
          .eq("id", product.id);

        if (offeringError) throw offeringError;

        toast.success("Product updated successfully!");
      } else {
        // Create new offering
        const { data: newOffering, error: offeringError } = await supabase
          .from("offerings")
          .insert(offeringData)
          .select()
          .single();

        if (offeringError) throw offeringError;

        toast.success("Product created successfully!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} product`);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = selectedServiceType
    ? categories.filter((cat) => cat.service_type === selectedServiceType)
    : [];

  const selectedServiceTypeName = serviceTypes.find(st => st.id === selectedServiceType)?.title || "";
  const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name || "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6" />
            {mode === "edit" ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === "service" && "Select the service type for this product"}
            {currentStep === "category" && "Select the category for this product"}
            {currentStep === "details" && "Fill in the product details"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <Badge variant={currentStep === "service" ? "default" : "secondary"} className="text-xs">
            1. Service
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={currentStep === "category" ? "default" : "secondary"} className="text-xs">
            2. Category
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={currentStep === "details" ? "default" : "secondary"} className="text-xs">
            3. Details
          </Badge>
        </div>

        {/* Step 1: Service Type Selection */}
        {currentStep === "service" && (
          <Card>
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">Select Service Type</Label>
              <div className="grid grid-cols-2 gap-4">
                {serviceTypes.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceTypeSelect(service.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary hover:shadow-md ${
                      selectedServiceType === service.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold text-sm">{service.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {serviceTypes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No service types available. Please create one first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Category Selection */}
        {currentStep === "category" && (
          <Card>
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                Select Category for {selectedServiceTypeName}
              </Label>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all hover:border-primary ${
                      selectedCategory === category.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <p className="font-medium text-sm">{category.name}</p>
                  </button>
                ))}
              </div>
              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No categories available for this service type.</p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleBack}
                className="mt-4 w-full"
              >
                Back to Service Types
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Dynamic Form */}
        {currentStep === "details" && (
          <div className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Service:</span>{" "}
                    <span className="font-semibold">{selectedServiceTypeName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>{" "}
                    <span className="font-semibold">{selectedCategoryName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                  >
                    Change Category
                  </Button>
                </div>
              </CardContent>
            </Card>

            <DynamicFormGenerator
              serviceTypeId={selectedServiceType}
              categoryId={selectedCategory}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              onCancel={onClose}
              submitButtonText={mode === "edit" ? "Update Product" : "Create Product"}
              useEnhancedVersion={true}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

