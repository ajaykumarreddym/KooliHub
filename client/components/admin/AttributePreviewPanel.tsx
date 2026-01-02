import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { EnhancedFormField } from "@shared/api";
import { Eye, Lock } from "lucide-react";
import React from "react";

interface AttributePreviewPanelProps {
  fields: EnhancedFormField[];
  title?: string;
  showNullValues?: boolean;
  mode?: 'admin' | 'customer';
}

export const AttributePreviewPanel: React.FC<AttributePreviewPanelProps> = ({
  fields,
  title = "Form Preview",
  showNullValues = true,
  mode = 'admin',
}) => {
  // Group fields by field_group
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.field_group || 'general';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(field);
    return acc;
  }, {} as Record<string, EnhancedFormField[]>);

  const renderFieldInput = (field: EnhancedFormField) => {
    const isLocked = field.is_mandatory || field.is_system_field;

    switch (field.input_type) {
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || `Enter ${field.attribute_label}`}
            disabled
            readOnly
            className="resize-none bg-gray-50 cursor-not-allowed"
            rows={3}
          />
        );

      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="bg-gray-50 cursor-not-allowed">
              <SelectValue placeholder={field.placeholder || `Select ${field.attribute_label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any, idx: number) => (
                <SelectItem key={idx} value={option.value || option}>
                  {option.label || option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.attribute_name} disabled className="cursor-not-allowed" />
            <label
              htmlFor={field.attribute_name}
              className="text-sm font-medium leading-none cursor-not-allowed opacity-70"
            >
              {field.attribute_label}
            </label>
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch id={field.attribute_name} disabled className="cursor-not-allowed" />
            <Label htmlFor={field.attribute_name} className="cursor-not-allowed">{field.attribute_label}</Label>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || `Enter ${field.attribute_label}`}
            disabled
            readOnly
            className="bg-gray-50 cursor-not-allowed"
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.placeholder || `Enter ${field.attribute_label}`}
            disabled
            readOnly
            className="bg-gray-50 cursor-not-allowed"
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            placeholder={field.placeholder || `Enter ${field.attribute_label}`}
            disabled
            readOnly
            className="bg-gray-50 cursor-not-allowed"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            disabled
            readOnly
            className="bg-gray-50 cursor-not-allowed"
          />
        );

      case 'image':
      case 'file':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="file"
              disabled
              className="bg-gray-50 cursor-not-allowed"
              accept={field.input_type === 'image' ? 'image/*' : undefined}
            />
          </div>
        );

      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder || `Enter ${field.attribute_label}`}
            disabled
            readOnly
            className="bg-gray-50 cursor-not-allowed"
          />
        );
    }
  };

  const renderField = (field: EnhancedFormField) => {
    const isLocked = field.is_mandatory || field.is_system_field;
    const showInPreview = showNullValues || mode === 'admin';

    if (!showInPreview && !field.default_value) {
      return null; // Hide null values in customer view
    }

    return (
      <div key={field.attribute_name} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor={field.attribute_name}>
              {field.attribute_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {isLocked && (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {mode === 'admin' && (
              <Badge variant="outline" className="text-xs">
                {field.inherited_from}
              </Badge>
            )}
          </div>
        </div>
        {renderFieldInput(field)}
        {field.help_text && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {mode === 'admin' 
            ? 'Preview of form fields with inheritance information'
            : 'Customer-facing product form preview'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {Object.keys(groupedFields).map((groupName) => (
              <div key={groupName} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                    {groupName === 'mandatory' ? '🔒 Mandatory Fields' : groupName}
                  </h3>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-4">
                  {groupedFields[groupName]
                    .sort((a, b) => a.display_order - b.display_order)
                    .map(renderField)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Legend */}
        {mode === 'admin' && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Legend:</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Badge variant="outline">default</Badge>
                <span className="text-muted-foreground">System default</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">service</Badge>
                <span className="text-muted-foreground">Service level</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">category</Badge>
                <span className="text-muted-foreground">Category level</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">subcategory</Badge>
                <span className="text-muted-foreground">Subcategory level</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span className="text-muted-foreground">Locked field</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

