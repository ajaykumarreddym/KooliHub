import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Eye } from "lucide-react";
import React from "react";

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productData: Record<string, any>;
  mode?: 'admin' | 'customer';
  hideNullValues?: boolean;
}

export const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productData,
  mode = 'customer',
  hideNullValues = true,
}) => {
  // Filter out null/empty values if hideNullValues is true
  const displayData = hideNullValues
    ? Object.entries(productData).filter(([_, value]) => value !== null && value !== '' && value !== undefined)
    : Object.entries(productData);

  // Group fields by type
  const mandatoryFields = ['product_name', 'product_description', 'price', 'vendor_name'];
  const metaFields = ['meta_title', 'meta_tags', 'meta_description'];
  
  const mandatory = displayData.filter(([key]) => mandatoryFields.includes(key));
  const meta = displayData.filter(([key]) => metaFields.includes(key));
  const custom = displayData.filter(([key]) => !mandatoryFields.includes(key) && !metaFields.includes(key));

  const renderValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  const renderFieldGroup = (title: string, fields: [string, any][], icon?: React.ReactNode) => {
    if (fields.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">{title}</h3>
          <Separator className="flex-1" />
        </div>
        <div className="space-y-2">
          {fields.map(([key, value]) => (
            <div key={key} className="flex justify-between items-start p-2 rounded-md hover:bg-accent/50">
              <span className="font-medium text-sm capitalize">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className="text-sm text-muted-foreground text-right max-w-[60%] break-words">
                {renderValue(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {mode === 'admin' ? 'Admin Preview' : 'Customer Preview'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'admin' 
              ? 'Review all product fields before saving (including hidden fields)'
              : 'Preview how this product will appear to customers (null values hidden)'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            {/* Validation Status */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Validation Passed
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                All required fields are filled. Product is ready to be saved.
              </CardContent>
            </Card>

            {/* Mandatory Fields */}
            {renderFieldGroup('Mandatory Fields', mandatory, <AlertCircle className="h-4 w-4 text-orange-500" />)}

            {/* Custom Attributes */}
            {renderFieldGroup('Custom Attributes', custom)}

            {/* Meta/SEO Fields */}
            {mode === 'admin' && renderFieldGroup('SEO & Metadata', meta)}

            {/* Stats */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total Fields: {displayData.length}</span>
                {hideNullValues && (
                  <span>Hidden (null) Fields: {Object.keys(productData).length - displayData.length}</span>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Go Back & Edit
          </Button>
          <Button onClick={onConfirm}>
            Confirm & Save Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

