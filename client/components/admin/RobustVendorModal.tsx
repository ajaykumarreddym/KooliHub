import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  X,
  Image as ImageIcon,
  Store,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Calendar,
  Hash,
  Building,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { VendorImageUpload } from "./VendorImageUpload";
import type { Vendor, VendorStatus } from "@shared/api";

interface RobustVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendor?: Vendor | null;
  mode: "add" | "edit";
}

const VENDOR_STATUSES: { value: VendorStatus; label: string; color: string }[] =
  [
    { value: "active", label: "Active", color: "bg-green-500" },
    { value: "inactive", label: "Inactive", color: "bg-gray-500" },
    {
      value: "pending_approval",
      label: "Pending Approval",
      color: "bg-yellow-500",
    },
    { value: "suspended", label: "Suspended", color: "bg-red-500" },
  ];

interface VendorForm {
  name: string;
  slug: string;
  description: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  business_registration_number: string;
  tax_id: string;
  commission_rate: number;
  payment_terms_days: number;
  minimum_order_amount: number;
  status: VendorStatus;
  logo_url?: string;
  banner_url?: string;
}

interface ImageFile {
  file: File;
  preview: string;
  type: "logo" | "banner";
  name: string;
  size: number;
}

export function RobustVendorModal({
  isOpen,
  onClose,
  onSuccess,
  vendor,
  mode,
}: RobustVendorModalProps) {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState<VendorForm>({
    name: "",
    slug: "",
    description: "",
    business_email: "",
    business_phone: "",
    business_address: "",
    business_registration_number: "",
    tax_id: "",
    commission_rate: 10,
    payment_terms_days: 30,
    minimum_order_amount: 0,
    status: "pending_approval",
    logo_url: "",
    banner_url: "",
  });

  const [images, setImages] = useState<{
    logo?: ImageFile;
    banner?: ImageFile;
  }>({});

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when modal opens or vendor changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && vendor) {
        setFormData({
          name: vendor.name || "",
          slug: vendor.slug || "",
          description: vendor.description || "",
          business_email: vendor.business_email || "",
          business_phone: vendor.business_phone || "",
          business_address: vendor.business_address || "",
          business_registration_number:
            vendor.business_registration_number || "",
          tax_id: vendor.tax_id || "",
          commission_rate: vendor.commission_rate || 10,
          payment_terms_days: vendor.payment_terms_days || 30,
          minimum_order_amount: vendor.minimum_order_amount || 0,
          status: vendor.status || "pending_approval",
          logo_url: vendor.logo_url || "",
          banner_url: vendor.banner_url || "",
        });
      } else {
        resetForm();
      }
      setValidationErrors({});
      setImages({});

      // Focus first input after a short delay to ensure modal is rendered
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, vendor, mode]);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      business_email: "",
      business_phone: "",
      business_address: "",
      business_registration_number: "",
      tax_id: "",
      commission_rate: 10,
      payment_terms_days: 30,
      minimum_order_amount: 0,
      status: "pending_approval",
      logo_url: "",
      banner_url: "",
    });
    setImages({});
    setValidationErrors({});
  };

  // Generate slug from name
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  // Optimized input handlers to prevent re-renders
  const handleInputChange = useCallback(
    (field: keyof VendorForm, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Auto-generate slug when name changes
        if (field === "name" && typeof value === "string") {
          newData.slug = generateSlug(value);
        }

        return newData;
      });

      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [generateSlug, validationErrors],
  );

  // Handle image selection and validation
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        const imageFile: ImageFile = {
          file,
          preview,
          type,
          name: file.name,
          size: file.size,
        };

        setImages((prev) => ({
          ...prev,
          [type]: imageFile,
        }));

        toast.success(
          `${type === "logo" ? "Logo" : "Banner"} selected successfully`,
        );
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const removeImage = useCallback((type: "logo" | "banner") => {
    setImages((prev) => {
      const newImages = { ...prev };
      delete newImages[type];
      return newImages;
    });

    // Clear file input
    if (type === "logo" && logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    if (type === "banner" && bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  }, []);

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Vendor name is required";
    }

    if (!formData.business_email.trim()) {
      errors.business_email = "Business email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email)) {
      errors.business_email = "Please enter a valid email address";
    }

    if (formData.commission_rate < 0 || formData.commission_rate > 100) {
      errors.commission_rate = "Commission rate must be between 0 and 100";
    }

    if (formData.payment_terms_days < 1) {
      errors.payment_terms_days = "Payment terms must be at least 1 day";
    }

    if (formData.minimum_order_amount < 0) {
      errors.minimum_order_amount = "Minimum order amount cannot be negative";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Upload images to server
  const uploadImages = async (): Promise<{
    logo_url?: string;
    banner_url?: string;
  }> => {
    const uploadedUrls: { logo_url?: string; banner_url?: string } = {};

    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    for (const [type, imageFile] of Object.entries(images)) {
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append("file", imageFile.file);
          formData.append("type", type);

          const response = await fetch("/api/upload/vendor-image", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            if (type === "logo") {
              uploadedUrls.logo_url = data.url;
            } else {
              uploadedUrls.banner_url = data.url;
            }
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to upload ${type}`);
          }
        } catch (error) {
          console.error(`Error uploading ${type}:`, error);
          throw new Error(
            `Failed to upload ${type}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    return uploadedUrls;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    if (!session?.access_token) {
      toast.error("Not authenticated. Please login again.");
      return;
    }

    setLoading(true);
    setUploadingImages(true);

    try {
      // Upload images first
      const uploadedUrls = await uploadImages();
      setUploadingImages(false);

      // Prepare final form data
      const finalFormData = {
        ...formData,
        ...uploadedUrls,
      };

      // Submit to API
      const url =
        mode === "edit" && vendor
          ? `/api/admin/vendors/${vendor.id}`
          : "/api/admin/vendors";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(finalFormData),
      });

      if (response.ok) {
        toast.success(
          mode === "edit"
            ? "Vendor updated successfully"
            : "Vendor created successfully",
        );
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error(
        error instanceof Error ? error.message : "Error saving vendor",
      );
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const renderImageUpload = (type: "logo" | "banner") => {
    const imageFile = images[type];
    const currentUrl =
      type === "logo" ? formData.logo_url : formData.banner_url;
    const inputRef = type === "logo" ? logoInputRef : bannerInputRef;
    const title = type === "logo" ? "Logo" : "Banner";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ImageIcon className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {imageFile ? (
            <div className="relative">
              <img
                src={imageFile.preview}
                alt={`${title} preview`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() => removeImage(type)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {Math.round(imageFile.size / 1024)} KB
              </div>
            </div>
          ) : currentUrl ? (
            <div className="relative">
              <img
                src={currentUrl}
                alt={`Current ${title.toLowerCase()}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Current
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Upload {title}</p>
              <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelect(e, type)}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {imageFile || currentUrl ? `Replace ${title}` : `Upload ${title}`}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderInput = (
    field: keyof VendorForm,
    label: string,
    icon: React.ReactNode,
    type: string = "text",
    required: boolean = false,
    placeholder?: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={field}
        ref={field === "name" ? firstInputRef : undefined}
        type={type}
        value={formData[field]}
        onChange={(e) =>
          handleInputChange(
            field,
            type === "number"
              ? parseFloat(e.target.value) || 0
              : e.target.value,
          )
        }
        placeholder={placeholder}
        required={required}
        className={validationErrors[field] ? "border-red-500" : ""}
        autoComplete="off"
        spellCheck={false}
      />
      {validationErrors[field] && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {validationErrors[field]}
        </p>
      )}
    </div>
  );

  const renderTextarea = (
    field: keyof VendorForm,
    label: string,
    icon: React.ReactNode,
    rows: number = 3,
    placeholder?: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <Textarea
        id={field}
        value={formData[field] as string}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={validationErrors[field] ? "border-red-500" : ""}
      />
      {validationErrors[field] && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {validationErrors[field]}
        </p>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {mode === "edit" ? "Edit Vendor" : "Add New Vendor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Brand Assets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VendorImageUpload
                type="logo"
                imageFile={images.logo}
                currentUrl={formData.logo_url}
                onImageSelect={(file, type) => {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const preview = event.target?.result as string;
                    const imageFile = {
                      file,
                      preview,
                      type,
                      name: file.name,
                      size: file.size,
                    };
                    setImages((prev) => ({ ...prev, [type]: imageFile }));
                  };
                  reader.readAsDataURL(file);
                }}
                onRemoveImage={(type) => {
                  setImages((prev) => ({ ...prev, [type]: undefined }));
                  if (type === "logo") {
                    setFormData((prev) => ({ ...prev, logo_url: "" }));
                  } else {
                    setFormData((prev) => ({ ...prev, banner_url: "" }));
                  }
                }}
                disabled={loading}
              />
              <VendorImageUpload
                type="banner"
                imageFile={images.banner}
                currentUrl={formData.banner_url}
                onImageSelect={(file, type) => {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const preview = event.target?.result as string;
                    const imageFile = {
                      file,
                      preview,
                      type,
                      name: file.name,
                      size: file.size,
                    };
                    setImages((prev) => ({ ...prev, [type]: imageFile }));
                  };
                  reader.readAsDataURL(file);
                }}
                onRemoveImage={(type) => {
                  setImages((prev) => ({ ...prev, [type]: undefined }));
                  if (type === "logo") {
                    setFormData((prev) => ({ ...prev, logo_url: "" }));
                  } else {
                    setFormData((prev) => ({ ...prev, banner_url: "" }));
                  }
                }}
                disabled={loading}
              />
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput(
                "name",
                "Vendor Name",
                <Store className="h-4 w-4" />,
                "text",
                true,
                "Enter vendor name",
              )}
              {renderInput(
                "slug",
                "URL Slug",
                <Hash className="h-4 w-4" />,
                "text",
                false,
                "auto-generated-slug",
              )}
            </div>
            {renderTextarea(
              "description",
              "Description",
              <FileText className="h-4 w-4" />,
              3,
              "Describe the vendor and their business...",
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput(
                "business_email",
                "Business Email",
                <Mail className="h-4 w-4" />,
                "email",
                true,
                "contact@vendor.com",
              )}
              {renderInput(
                "business_phone",
                "Business Phone",
                <Phone className="h-4 w-4" />,
                "tel",
                false,
                "+1 (555) 123-4567",
              )}
            </div>
            {renderTextarea(
              "business_address",
              "Business Address",
              <MapPin className="h-4 w-4" />,
              2,
              "Full business address...",
            )}
          </div>

          <Separator />

          {/* Legal & Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Legal & Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput(
                "business_registration_number",
                "Registration Number",
                <Building className="h-4 w-4" />,
                "text",
                false,
                "Business registration number",
              )}
              {renderInput(
                "tax_id",
                "Tax ID",
                <FileText className="h-4 w-4" />,
                "text",
                false,
                "Tax identification number",
              )}
            </div>
          </div>

          <Separator />

          {/* Business Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderInput(
                "commission_rate",
                "Commission Rate (%)",
                <DollarSign className="h-4 w-4" />,
                "number",
                false,
              )}
              {renderInput(
                "payment_terms_days",
                "Payment Terms (Days)",
                <Calendar className="h-4 w-4" />,
                "number",
                false,
              )}
              {renderInput(
                "minimum_order_amount",
                "Minimum Order Amount",
                <DollarSign className="h-4 w-4" />,
                "number",
                false,
              )}
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Vendor Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: VendorStatus) =>
                handleInputChange("status", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
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
            <Button type="submit" disabled={loading || uploadingImages}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingImages ? "Uploading Images..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "edit" ? "Update Vendor" : "Create Vendor"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
