import { AttributePreviewPanel } from "@/components/admin/AttributePreviewPanel";
import { CategoryAttributeManager } from "@/components/admin/CategoryAttributeManager";
import ComprehensiveAttributeManager from "@/components/admin/ComprehensiveAttributeManager";
import { SubcategoryManager } from "@/components/admin/SubcategoryManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminData } from "@/contexts/AdminDataContext";
import { toast } from "@/hooks/use-toast";
import type { EnhancedFormField } from "@shared/api";
import { AlertCircle, Eye, Layers, List, Settings } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface NamingConventionManagerProps {
  serviceTypeId?: string;
}

export const NamingConventionManager: React.FC<NamingConventionManagerProps> = ({
  serviceTypeId: initialServiceTypeId,
}) => {
  const { serviceTypes, categories } = useAdminData();
  const [selectedServiceType, setSelectedServiceType] = useState<string>(initialServiceTypeId || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [previewFields, setPreviewFields] = useState<EnhancedFormField[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter categories and subcategories
  const filteredCategories = categories.filter(
    (cat) => cat.service_type === selectedServiceType && cat.level === 0
  );

  const subcategories = categories.filter(
    (cat) => cat.parent_id === selectedCategory && cat.level > 0
  );

  // Load preview when selections change
  useEffect(() => {
    if (selectedServiceType || selectedCategory || selectedSubcategory) {
      loadPreview();
    }
  }, [selectedServiceType, selectedCategory, selectedSubcategory]);

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedServiceType) params.append('service_type_id', selectedServiceType);
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedSubcategory) params.append('subcategory_id', selectedSubcategory);

      const response = await fetch(`/api/attributes/preview?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPreviewFields(data.data.fields || []);
      } else {
        throw new Error(data.error || 'Failed to load preview');
      }
    } catch (error: any) {
      console.error('Error loading preview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load form preview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedServiceType, selectedCategory, selectedSubcategory]);

  return (
    <div className="space-y-6">
      {/* Header Card with Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Naming Convention & Field Management System
          </CardTitle>
          <CardDescription>
            Manage default and custom fields across the hierarchy: Service → Category → Subcategory → Product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li><strong>Service Level:</strong> Configure attributes for an entire service (e.g., all Grocery products)</li>
                <li><strong>Category Level:</strong> Override or add attributes for specific categories</li>
                <li><strong>Subcategory Level:</strong> Further refine attributes for subcategories</li>
                <li><strong>Product Level:</strong> All attributes cascade down and appear in product forms</li>
                <li><strong>Default Fields:</strong> Mandatory fields (locked) that appear in all products</li>
                <li><strong>Custom Fields:</strong> Optional fields that can be edited or deleted</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Select Service & Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category (Optional)</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                disabled={!selectedServiceType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategory (Optional)</Label>
              <Select 
                value={selectedSubcategory} 
                onValueChange={setSelectedSubcategory}
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {subcategories.map((subcat) => (
                    <SelectItem key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="service-attributes" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="service-attributes">
            <List className="h-4 w-4 mr-2" />
            Service Attributes
          </TabsTrigger>
          <TabsTrigger value="category-attributes">
            <Layers className="h-4 w-4 mr-2" />
            Category Attributes
          </TabsTrigger>
          <TabsTrigger value="subcategories">
            <Layers className="h-4 w-4 mr-2" />
            Subcategories
          </TabsTrigger>
          <TabsTrigger value="preview-admin">
            <Eye className="h-4 w-4 mr-2" />
            Admin Preview
          </TabsTrigger>
          <TabsTrigger value="preview-customer">
            <Eye className="h-4 w-4 mr-2" />
            Customer Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="service-attributes" className="space-y-4">
          <ComprehensiveAttributeManager />
        </TabsContent>

        <TabsContent value="category-attributes" className="space-y-4">
          <CategoryAttributeManager />
        </TabsContent>

        <TabsContent value="subcategories" className="space-y-4">
          <SubcategoryManager serviceTypeId={selectedServiceType} />
        </TabsContent>

        <TabsContent value="preview-admin" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading preview...
              </CardContent>
            </Card>
          ) : previewFields.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a service to preview form fields
              </CardContent>
            </Card>
          ) : (
            <AttributePreviewPanel
              fields={previewFields}
              title="Admin Form Preview"
              showNullValues={true}
              mode="admin"
            />
          )}
        </TabsContent>

        <TabsContent value="preview-customer" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading preview...
              </CardContent>
            </Card>
          ) : previewFields.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a service to preview form fields
              </CardContent>
            </Card>
          ) : (
            <AttributePreviewPanel
              fields={previewFields}
              title="Customer-Facing Form Preview"
              showNullValues={false}
              mode="customer"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

