import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { uploadApi, vendorApi } from "@/lib/api";
import type { Vendor, VendorStatus } from "@shared/api";
import {
    Building,
    Calendar,
    DollarSign,
    FileText,
    Hash,
    Image as ImageIcon,
    Mail,
    MapPin,
    Phone,
    Store,
    Upload,
    X,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface EnhancedVendorModalProps {
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

interface VendorFormData {
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

interface ImageUpload {
  file: File;
  preview: string;
  type: "logo" | "banner";
}

export function EnhancedVendorModal({
  isOpen,
  onClose,
  onSuccess,
  vendor,
  mode,
}: EnhancedVendorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    name: vendor?.name || "",
    slug: vendor?.slug || "",
    description: vendor?.description || "",
    business_email: vendor?.business_email || "",
    business_phone: vendor?.business_phone || "",
    business_address: vendor?.business_address || "",
    business_registration_number: vendor?.business_registration_number || "",
    tax_id: vendor?.tax_id || "",
    commission_rate: vendor?.commission_rate || 10,
    payment_terms_days: vendor?.payment_terms_days || 30,
    minimum_order_amount: vendor?.minimum_order_amount || 0,
    status: vendor?.status || "pending_approval",
    logo_url: vendor?.logo_url || "",
    banner_url: vendor?.banner_url || "",
  });

  const [images, setImages] = useState<{
    logo?: ImageUpload;
    banner?: ImageUpload;
  }>({});

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value;
      setFormData((prev) => ({
        ...prev,
        name,
        slug: generateSlug(name),
      }));
    },
    [generateSlug],
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, slug: e.target.value }));
    },
    [],
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, description: e.target.value }));
    },
    [],
  );

  const handleBusinessEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, business_email: e.target.value }));
    },
    [],
  );

  const handleBusinessPhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, business_phone: e.target.value }));
    },
    [],
  );

  const handleBusinessAddressChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, business_address: e.target.value }));
    },
    [],
  );

  const handleRegistrationNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        business_registration_number: e.target.value,
      }));
    },
    [],
  );

  const handleTaxIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, tax_id: e.target.value }));
    },
    [],
  );

  const handleCommissionRateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Allow empty string or valid number input
      if (value === '') {
        setFormData((prev) => ({
          ...prev,
          commission_rate: 0,
        }));
        return;
      }

      const numValue = parseFloat(value);
      
      // Validate: must be >= 0 and <= 100
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        setFormData((prev) => ({
          ...prev,
          commission_rate: numValue,
        }));
      }
    },
    [],
  );

  const handlePaymentTermsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Allow empty string or valid number input
      if (value === '') {
        setFormData((prev) => ({
          ...prev,
          payment_terms_days: 0,
        }));
        return;
      }

      const numValue = parseInt(value);
      
      // Validate: must be >= 0 (changed from >= 1 to allow 0)
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData((prev) => ({
          ...prev,
          payment_terms_days: numValue,
        }));
      }
    },
    [],
  );

  const handleMinOrderAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Allow empty string or valid number input
      if (value === '') {
        setFormData((prev) => ({
          ...prev,
          minimum_order_amount: 0,
        }));
        return;
      }

      const numValue = parseFloat(value);
      
      // Validate: must be >= 0
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData((prev) => ({
          ...prev,
          minimum_order_amount: numValue,
        }));
      }
    },
    [],
  );

  const handleStatusChange = useCallback((value: VendorStatus) => {
    setFormData((prev) => ({ ...prev, status: value }));
  }, []);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setImages((prev) => ({
          ...prev,
          [type]: { file, preview, type },
        }));
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

    // Clear the file input
    if (type === "logo" && logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    if (type === "banner" && bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  }, []);

  const uploadImage = async (
    imageUpload: ImageUpload,
  ): Promise<string | null> => {
    try {
      const result = await uploadApi.vendorImage(
        imageUpload.file,
        imageUpload.type,
      );
      if (result.success && result.data) {
        return result.data.url;
      } else {
        toast.error(result.error || `Failed to upload ${imageUpload.type}`);
        return null;
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(`Failed to upload ${imageUpload.type}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalFormData = { ...formData };

      // Upload images if any
      if (images.logo) {
        const logoUrl = await uploadImage(images.logo);
        if (logoUrl) finalFormData.logo_url = logoUrl;
      }

      if (images.banner) {
        const bannerUrl = await uploadImage(images.banner);
        if (bannerUrl) finalFormData.banner_url = bannerUrl;
      }

      let result;
      if (mode === "edit" && vendor) {
        result = await vendorApi.update(vendor.id, finalFormData);
      } else {
        result = await vendorApi.create(finalFormData);
      }

      if (result.success) {
        toast.success(
          mode === "edit"
            ? "Vendor updated successfully"
            : "Vendor created successfully",
        );
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error("Error saving vendor");
    } finally {
      setLoading(false);
    }
  };

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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {mode === "edit" ? "Edit Vendor" : "Add New Vendor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Vendor Images</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo Upload */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Logo
                    </Label>
                    {images.logo ? (
                      <div className="relative">
                        <img
                          src={images.logo.preview}
                          alt="Logo preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage("logo")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : formData.logo_url ? (
                      <div className="relative">
                        <img
                          src={formData.logo_url}
                          alt="Current logo"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Click to upload logo
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "logo")}
                    />
                    {!images.logo && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Banner Upload */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Banner
                    </Label>
                    {images.banner ? (
                      <div className="relative">
                        <img
                          src={images.banner.preview}
                          alt="Banner preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage("banner")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : formData.banner_url ? (
                      <div className="relative">
                        <img
                          src={formData.banner_url}
                          alt="Current banner"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => bannerInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Click to upload banner
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "banner")}
                    />
                    {!images.banner && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => bannerInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Banner
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Basic Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Vendor Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Enter vendor name"
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="slug" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  URL Slug *
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="vendor-url-slug"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Describe the vendor and their business..."
                rows={3}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Contact Information
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="business_email"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Business Email *
                </Label>
                <Input
                  id="business_email"
                  type="email"
                  value={formData.business_email}
                  onChange={handleBusinessEmailChange}
                  placeholder="contact@vendor.com"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="business_phone"
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Business Phone
                </Label>
                <Input
                  id="business_phone"
                  value={formData.business_phone}
                  onChange={handleBusinessPhoneChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="business_address"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Business Address
              </Label>
              <Textarea
                id="business_address"
                value={formData.business_address}
                onChange={handleBusinessAddressChange}
                placeholder="Full business address..."
                rows={2}
              />
            </div>
          </div>

          {/* Legal Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Legal Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="business_registration_number"
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  Registration Number
                </Label>
                <Input
                  id="business_registration_number"
                  value={formData.business_registration_number}
                  onChange={handleRegistrationNumberChange}
                  placeholder="Business registration number"
                />
              </div>
              <div>
                <Label htmlFor="tax_id" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tax ID
                </Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={handleTaxIdChange}
                  placeholder="Tax identification number"
                />
              </div>
            </div>
          </div>

          {/* Business Terms */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Business Terms</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label
                  htmlFor="commission_rate"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Commission Rate (%)
                </Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_rate}
                  onChange={handleCommissionRateChange}
                />
              </div>
              <div>
                <Label
                  htmlFor="payment_terms_days"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Payment Terms (Days)
                </Label>
                <Input
                  id="payment_terms_days"
                  type="number"
                  min="0"
                  value={formData.payment_terms_days}
                  onChange={handlePaymentTermsChange}
                />
              </div>
              <div>
                <Label
                  htmlFor="minimum_order_amount"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Minimum Order Amount
                </Label>
                <Input
                  id="minimum_order_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum_order_amount}
                  onChange={handleMinOrderAmountChange}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Vendor Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
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
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Update Vendor"
                  : "Create Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
