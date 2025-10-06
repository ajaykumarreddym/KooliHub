import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Lock, Upload } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Types
interface FormField {
    attribute_id: string | null;
    attribute_name: string;
    attribute_label: string;
    data_type: string;
    input_type: string;
    placeholder: string | null;
    help_text: string | null;
    is_required: boolean;
    is_visible: boolean;
    display_order: number;
    field_group: string;
    validation_rules: any;
    options: any;
    default_value: string | null;
    is_system_field: boolean;
    is_mandatory: boolean;
    inherited_from: string;
}

interface DynamicFormGeneratorProps {
    serviceTypeId?: string | null;
    categoryId?: string | null;
    initialValues?: Record<string, any>;
    onSubmit: (values: Record<string, any>) => Promise<void>;
    onCancel?: () => void;
    submitButtonText?: string;
}

const DynamicFormGenerator: React.FC<DynamicFormGeneratorProps> = ({
    serviceTypeId,
    categoryId,
    initialValues = {},
    onSubmit,
    onCancel,
    submitButtonText = "Save",
}) => {
    const [fields, setFields] = useState<FormField[]>([]);
    const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Load form fields based on service type and category
    useEffect(() => {
        fetchFormFields();
    }, [serviceTypeId, categoryId]);

    const fetchFormFields = useCallback(async () => {
        try {
            setLoading(true);
            
            // Call the database function to get merged attributes
            const { data, error } = await supabase
                .rpc('get_product_form_attributes', {
                    p_service_type_id: serviceTypeId,
                    p_category_id: categoryId,
                });

            if (error) throw error;

            // Group fields by field_group for better organization
            const sortedFields = (data || []).sort((a: FormField, b: FormField) => 
                a.display_order - b.display_order
            );

            setFields(sortedFields);
        } catch (error: any) {
            console.error("Error fetching form fields:", error);
            toast({
                title: "Error",
                description: "Failed to load form fields",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [serviceTypeId, categoryId]);

    // Handle form field change
    const handleFieldChange = useCallback((fieldName: string, value: any) => {
        setFormValues(prev => ({
            ...prev,
            [fieldName]: value,
        }));

        // Clear error for this field
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    }, [errors]);

    // Validate form
    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        fields.forEach(field => {
            if (field.is_required && !formValues[field.attribute_name]) {
                newErrors[field.attribute_name] = `${field.attribute_label} is required`;
            }

            // Additional validation based on data type
            if (formValues[field.attribute_name]) {
                const value = formValues[field.attribute_name];

                if (field.data_type === 'number') {
                    if (isNaN(Number(value))) {
                        newErrors[field.attribute_name] = `${field.attribute_label} must be a number`;
                    }
                }

                if (field.data_type === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        newErrors[field.attribute_name] = `${field.attribute_label} must be a valid email`;
                    }
                }

                if (field.data_type === 'url') {
                    try {
                        new URL(value);
                    } catch {
                        newErrors[field.attribute_name] = `${field.attribute_label} must be a valid URL`;
                    }
                }

                // Custom validation rules
                if (field.validation_rules) {
                    const rules = field.validation_rules;
                    
                    if (rules.min !== undefined && Number(value) < rules.min) {
                        newErrors[field.attribute_name] = `${field.attribute_label} must be at least ${rules.min}`;
                    }
                    
                    if (rules.max !== undefined && Number(value) > rules.max) {
                        newErrors[field.attribute_name] = `${field.attribute_label} must be at most ${rules.max}`;
                    }

                    if (rules.minLength !== undefined && value.length < rules.minLength) {
                        newErrors[field.attribute_name] = `${field.attribute_label} must be at least ${rules.minLength} characters`;
                    }

                    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                        newErrors[field.attribute_name] = `${field.attribute_label} must be at most ${rules.maxLength} characters`;
                    }
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [fields, formValues]);

    // Handle form submission
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast({
                title: "Validation Error",
                description: "Please fix the errors in the form",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(formValues);
        } catch (error: any) {
            console.error("Error submitting form:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit form",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    }, [formValues, validateForm, onSubmit]);

    // Render field based on type
    const renderField = useCallback((field: FormField) => {
        const value = formValues[field.attribute_name] || field.default_value || '';
        const error = errors[field.attribute_name];
        const isLocked = field.is_system_field && field.is_mandatory;

        const commonProps = {
            id: field.attribute_name,
            value,
            onChange: (e: any) => handleFieldChange(field.attribute_name, e.target.value),
            disabled: submitting || isLocked,
            className: error ? "border-red-500" : "",
        };

        switch (field.input_type) {
            case 'textarea':
                return (
                    <Textarea
                        {...commonProps}
                        placeholder={field.placeholder || ''}
                        rows={4}
                    />
                );

            case 'select':
                return (
                    <Select
                        value={value}
                        onValueChange={(val) => handleFieldChange(field.attribute_name, val)}
                        disabled={submitting || isLocked}
                    >
                        <SelectTrigger className={error ? "border-red-500" : ""}>
                            <SelectValue placeholder={field.placeholder || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options && Array.isArray(field.options) && field.options.map((option: any, idx: number) => {
                                const optionValue = typeof option === 'string' ? option : (option.value || option);
                                const optionLabel = typeof option === 'string' ? option : (option.label || option.value || option);
                                return (
                                    <SelectItem key={idx} value={optionValue}>
                                        {optionLabel}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                );

            case 'multiselect':
                // For multiselect, render as checkboxes
                return (
                    <div className="space-y-2">
                        {field.options && Array.isArray(field.options) && field.options.map((option: any, idx: number) => {
                            const optionValue = typeof option === 'string' ? option : (option.value || option);
                            const optionLabel = typeof option === 'string' ? option : (option.label || option.value || option);
                            const isChecked = Array.isArray(value) && value.includes(optionValue);

                            return (
                                <div key={idx} className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            const currentValues = Array.isArray(value) ? value : [];
                                            const newValues = checked
                                                ? [...currentValues, optionValue]
                                                : currentValues.filter((v: any) => v !== optionValue);
                                            handleFieldChange(field.attribute_name, newValues);
                                        }}
                                        disabled={submitting || isLocked}
                                    />
                                    <label className="text-sm">{optionLabel}</label>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'checkbox':
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={value === true || value === 'true'}
                            onCheckedChange={(checked) => handleFieldChange(field.attribute_name, checked)}
                            disabled={submitting || isLocked}
                        />
                        <label className="text-sm">{field.placeholder || 'Enable'}</label>
                    </div>
                );

            case 'file':
            case 'image':
                return (
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Input
                                type="file"
                                accept={field.input_type === 'image' ? 'image/*' : '*'}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        // Handle file upload
                                        handleFieldChange(field.attribute_name, file);
                                    }
                                }}
                                disabled={submitting || isLocked}
                                className={error ? "border-red-500" : ""}
                            />
                            <Upload className="h-4 w-4 text-gray-400" />
                        </div>
                        {value && typeof value === 'string' && (
                            <p className="text-xs text-muted-foreground">Current: {value}</p>
                        )}
                    </div>
                );

            case 'number':
                return (
                    <Input
                        {...commonProps}
                        type="number"
                        placeholder={field.placeholder || ''}
                        min={field.validation_rules?.min}
                        max={field.validation_rules?.max}
                        step={field.validation_rules?.step || 'any'}
                    />
                );

            case 'date':
                return (
                    <Input
                        {...commonProps}
                        type="date"
                    />
                );

            case 'datetime':
            case 'datetime-local':
                return (
                    <Input
                        {...commonProps}
                        type="datetime-local"
                    />
                );

            case 'time':
                return (
                    <Input
                        {...commonProps}
                        type="time"
                    />
                );

            case 'email':
                return (
                    <Input
                        {...commonProps}
                        type="email"
                        placeholder={field.placeholder || 'email@example.com'}
                    />
                );

            case 'tel':
                return (
                    <Input
                        {...commonProps}
                        type="tel"
                        placeholder={field.placeholder || '+1 (555) 000-0000'}
                    />
                );

            case 'url':
                return (
                    <Input
                        {...commonProps}
                        type="url"
                        placeholder={field.placeholder || 'https://example.com'}
                    />
                );

            case 'text':
            default:
                return (
                    <Input
                        {...commonProps}
                        type="text"
                        placeholder={field.placeholder || ''}
                    />
                );
        }
    }, [formValues, errors, submitting, handleFieldChange]);

    // Group fields by field_group
    const groupedFields = fields.reduce((acc, field) => {
        const group = field.field_group || 'general';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(field);
        return acc;
    }, {} as Record<string, FormField[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading form...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {Object.entries(groupedFields).map(([group, groupFields]) => (
                <div key={group} className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold capitalize">{group.replace(/_/g, ' ')}</h3>
                        {group === 'mandatory' && (
                            <Lock className="h-4 w-4 text-gray-400" />
                        )}
                    </div>
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupFields.map(field => (
                            <div 
                                key={field.attribute_name} 
                                className={`space-y-2 ${
                                    ['textarea', 'multiselect'].includes(field.input_type) ? 'md:col-span-2' : ''
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor={field.attribute_name}>
                                        {field.attribute_label}
                                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    {field.is_system_field && field.is_mandatory && (
                                        <Lock className="h-3 w-3 text-gray-400" />
                                    )}
                                    {field.inherited_from !== 'default' && (
                                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                                            from {field.inherited_from}
                                        </span>
                                    )}
                                </div>
                                
                                {renderField(field)}
                                
                                {field.help_text && (
                                    <p className="text-xs text-muted-foreground">{field.help_text}</p>
                                )}
                                
                                {errors[field.attribute_name] && (
                                    <p className="text-xs text-red-500">{errors[field.attribute_name]}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {fields.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No form fields configured for this service/category</p>
                </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={submitting || fields.length === 0}>
                    {submitting ? 'Saving...' : submitButtonText}
                </Button>
            </div>
        </form>
    );
};

export default DynamicFormGenerator;

