// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Separator } from "@/components/ui/separator";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "@/hooks/use-toast";
// import { supabase } from "@/lib/supabase";
// import { Lock, Upload } from "lucide-react";
// import React, { useCallback, useEffect, useState } from "react";

// // Types
// interface FormField {
//     attribute_id: string | null;
//     attribute_name: string;
//     attribute_label: string;
//     data_type: string;
//     input_type: string;
//     placeholder: string | null;
//     help_text: string | null;
//     is_required: boolean;
//     is_visible: boolean;
//     display_order: number;
//     field_group: string;
//     validation_rules: any;
//     options: any;
//     default_value: string | null;
//     is_system_field: boolean;
//     is_mandatory: boolean;
//     inherited_from: string;
// }

// interface DynamicFormGeneratorProps {
//     serviceTypeId?: string | null;
//     categoryId?: string | null;
//     subcategoryId?: string | null; // NEW: Support for subcategories
//     initialValues?: Record<string, any>;
//     onSubmit: (values: Record<string, any>) => Promise<void>;
//     onCancel?: () => void;
//     submitButtonText?: string;
//     useEnhancedVersion?: boolean; // NEW: Use v2 with inheritance tracking
// }

// const DynamicFormGenerator: React.FC<DynamicFormGeneratorProps> = ({
//     serviceTypeId,
//     categoryId,
//     subcategoryId,
//     initialValues = {},
//     onSubmit,
//     onCancel,
//     submitButtonText = "Save",
//     useEnhancedVersion = false,
// }) => {
//     const [fields, setFields] = useState<FormField[]>([]);
//     const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
//     const [errors, setErrors] = useState<Record<string, string>>({});
//     const [loading, setLoading] = useState(true);
//     const [submitting, setSubmitting] = useState(false);
//     const [vendors, setVendors] = useState<Array<{id: string, name: string}>>([]);

//     const fetchVendors = useCallback(async () => {
//         try {
//             const { data, error } = await supabase
//                 .from('vendors')
//                 .select('id, name')
//                 .is('deleted_at', null)
//                 .eq('status', 'active')
//                 .order('name');
            
//             if (error) throw error;
//             setVendors(data || []);
//             console.log('✅ Fetched vendors:', data?.length || 0);
//         } catch (error) {
//             console.error('Error fetching vendors:', error);
//         }
//     }, []);

//     const fetchFormFields = useCallback(async () => {
//         console.log('🔄 fetchFormFields called, vendors available:', vendors.length);
//         try {
//             setLoading(true);
            
//             // Choose function based on useEnhancedVersion flag
//             const functionName = useEnhancedVersion 
//                 ? 'get_product_form_attributes_v2' 
//                 : 'get_product_form_attributes';
            
//             const params = useEnhancedVersion
//                 ? {
//                     p_service_type_id: serviceTypeId,
//                     p_category_id: categoryId,
//                     p_subcategory_id: subcategoryId,
//                   }
//                 : {
//                     p_service_type_id: serviceTypeId,
//                     p_category_id: categoryId,
//                   };

//             // Call the database function to get merged attributes
//             const { data, error } = await supabase.rpc(functionName, params);

//             if (error) throw error;

//             console.log('🔍 Raw data from database:', data);

//             // ✅ FIX: Map database response to match FormField interface
//             const mappedFields = (data || []).map((field: any) => ({
//                 ...field,
//                 attribute_label: field.label || field.attribute_label || field.attribute_name, // Map label to attribute_label
//             }));

//             // ✅ FILTER: Only show visible fields
//             const visibleFields = mappedFields.filter((field: FormField) => field.is_visible !== false);

//             console.log('🔍 Filtered to visible fields:', visibleFields.length, 'of', mappedFields.length);

//             // Group fields by field_group for better organization
//             const sortedFields = visibleFields.sort((a: FormField, b: FormField) => 
//                 a.display_order - b.display_order
//             );

//             // ✅ FIX: Enhance vendor_name field with fetched vendors
//             const enhancedFields = sortedFields.map((field: FormField) => {
//                 if (field.attribute_name === 'vendor_name') {
//                     console.log('🔍 Processing vendor_name field:', {
//                         vendorsCount: vendors.length,
//                         fieldInputType: field.input_type,
//                         fieldDataType: field.data_type
//                     });
                    
//                     if (vendors.length > 0) {
//                         return {
//                             ...field,
//                             input_type: 'select', // Force select type
//                             data_type: 'select',
//                             options: vendors.map(v => ({ value: v.id, label: v.name }))
//                         };
//                     } else {
//                         console.warn('⚠️ No vendors found! Keeping as select but with empty options');
//                         return {
//                             ...field,
//                             input_type: 'select',
//                             data_type: 'select',
//                             options: []
//                         };
//                     }
//                 }
//                 return field;
//             });

//             console.log('📋 Loaded fields:', enhancedFields.length, 'fields');
//             console.log('🔍 Vendor field after enhancement:', 
//                 enhancedFields.find(f => f.attribute_name === 'vendor_name')
//             );
//             setFields(enhancedFields);
//         } catch (error: any) {
//             console.error("Error fetching form fields:", error);
//             toast({
//                 title: "Error",
//                 description: "Failed to load form fields",
//                 variant: "destructive",
//             });
//         } finally {
//             setLoading(false);
//         }
//     }, [serviceTypeId, categoryId, subcategoryId, useEnhancedVersion, vendors, toast]);

//     // Load vendors on mount
//     useEffect(() => {
//         fetchVendors();
//     }, [fetchVendors]);

//     // Load form fields when service/category changes OR when vendors are loaded
//     useEffect(() => {
//         if (serviceTypeId || categoryId || subcategoryId) {
//             fetchFormFields();
//         }
//     }, [serviceTypeId, categoryId, subcategoryId, vendors.length, fetchFormFields]);

//     // Handle form field change
//     const handleFieldChange = useCallback((fieldName: string, value: any) => {
//         setFormValues(prev => ({
//             ...prev,
//             [fieldName]: value,
//         }));

//         // Clear error for this field
//         if (errors[fieldName]) {
//             setErrors(prev => {
//                 const newErrors = { ...prev };
//                 delete newErrors[fieldName];
//                 return newErrors;
//             });
//         }
//     }, [errors]);

//     // Validate form
//     const validateForm = useCallback((): boolean => {
//         const newErrors: Record<string, string> = {};

//         fields.forEach(field => {
//             if (field.is_required && !formValues[field.attribute_name]) {
//                 newErrors[field.attribute_name] = `${field.attribute_label} is required`;
//             }

//             // Additional validation based on data type
//             if (formValues[field.attribute_name]) {
//                 const value = formValues[field.attribute_name];

//                 if (field.data_type === 'number') {
//                     if (isNaN(Number(value))) {
//                         newErrors[field.attribute_name] = `${field.attribute_label} must be a number`;
//                     }
//                 }

//                 if (field.data_type === 'email') {
//                     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//                     if (!emailRegex.test(value)) {
//                         newErrors[field.attribute_name] = `${field.attribute_label} must be a valid email`;
//                     }
//                 }

//                 if (field.data_type === 'url') {
//                     try {
//                         new URL(value);
//                     } catch {
//                         newErrors[field.attribute_name] = `${field.attribute_label} must be a valid URL`;
//                     }
//                 }

//                 // Custom validation rules
//                 if (field.validation_rules) {
//                     const rules = field.validation_rules;
                    
//                     if (rules.min !== undefined && Number(value) < rules.min) {
//                         newErrors[field.attribute_name] = `${field.attribute_label} must be at least ${rules.min}`;
//                     }
                    
//                     if (rules.max !== undefined && Number(value) > rules.max) {
//                         newErrors[field.attribute_name] = `${field.attribute_label} must be at most ${rules.max}`;
//                     }

//                     if (rules.minLength !== undefined && value.length < rules.minLength) {
//                         newErrors[field.attribute_name] = `${field.attribute_label} must be at least ${rules.minLength} characters`;
//                     }

//                     if (rules.maxLength !== undefined && value.length > rules.maxLength) {
//                         newErrors[field.attribute_name] = `${field.attribute_label} must be at most ${rules.maxLength} characters`;
//                     }
//                 }
//             }
//         });

//         setErrors(newErrors);
//         return Object.keys(newErrors).length === 0;
//     }, [fields, formValues]);

//     // Handle form submission
//     const handleSubmit = useCallback(async (e: React.FormEvent) => {
//         e.preventDefault();

//         if (!validateForm()) {
//             toast({
//                 title: "Validation Error",
//                 description: "Please fix the errors in the form",
//                 variant: "destructive",
//             });
//             return;
//         }

//         setSubmitting(true);
//         try {
//             await onSubmit(formValues);
//         } catch (error: any) {
//             console.error("Error submitting form:", error);
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to submit form",
//                 variant: "destructive",
//             });
//         } finally {
//             setSubmitting(false);
//         }
//     }, [formValues, validateForm, onSubmit]);

//     // Render field based on type with lock indicator
//     const renderField = useCallback((field: FormField) => {
//         // ✅ FIX: Only lock truly non-editable system fields, not mandatory ones
//         // Mandatory fields should be editable but required
//         const isReadOnly = field.is_system_field && !field.is_mandatory && field.attribute_name !== 'vendor_name';
//         const value = formValues[field.attribute_name] || field.default_value || '';
//         const error = errors[field.attribute_name];

//         const commonProps = {
//             id: field.attribute_name,
//             value,
//             onChange: (e: any) => handleFieldChange(field.attribute_name, e.target.value),
//             disabled: submitting, // ✅ FIX: Only disable when submitting, not for mandatory fields
//             readOnly: isReadOnly, // Use readOnly for display-only fields
//             className: error ? "border-red-500" : "",
//         };

//         switch (field.input_type) {
//             case 'textarea':
//                 return (
//                     <Textarea
//                         {...commonProps}
//                         placeholder={field.placeholder || ''}
//                         rows={4}
//                     />
//                 );

//             case 'select':
//                 // ✅ FIX: Ensure options are available before rendering select
//                 const hasOptions = field.options && Array.isArray(field.options) && field.options.length > 0;
                
//                 // Special handling for vendor_name - show loading state if no vendors yet
//                 if (field.attribute_name === 'vendor_name' && !hasOptions) {
//                     return (
//                         <Select
//                             value={value}
//                             onValueChange={(val) => handleFieldChange(field.attribute_name, val)}
//                             disabled={true}
//                         >
//                             <SelectTrigger className={error ? "border-red-500" : ""}>
//                                 <SelectValue placeholder="Loading vendors..." />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="loading" disabled>No vendors available</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     );
//                 }
                
//                 if (!hasOptions) {
//                     // Fallback to text input if no options available
//                     console.warn(`Select field "${field.attribute_name}" has no options, rendering as text input`);
//                     return (
//                         <Input
//                             {...commonProps}
//                             type="text"
//                             placeholder={field.placeholder || 'No options available'}
//                         />
//                     );
//                 }
                
//                 console.log(`🎯 Rendering select for "${field.attribute_name}" with ${field.options.length} options`);
                
//                 return (
//                     <Select
//                         value={value}
//                         onValueChange={(val) => handleFieldChange(field.attribute_name, val)}
//                         disabled={submitting}
//                     >
//                         <SelectTrigger className={error ? "border-red-500" : ""}>
//                             <SelectValue placeholder={field.placeholder || 'Select...'} />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {field.options.map((option: any, idx: number) => {
//                                 const optionValue = typeof option === 'string' ? option : (option.value || option);
//                                 const optionLabel = typeof option === 'string' ? option : (option.label || option.value || option);
//                                 return (
//                                     <SelectItem key={idx} value={String(optionValue)}>
//                                         {optionLabel}
//                                     </SelectItem>
//                                 );
//                             })}
//                         </SelectContent>
//                     </Select>
//                 );

//             case 'multiselect':
//                 // For multiselect, render as checkboxes
//                 const hasMultiOptions = field.options && Array.isArray(field.options) && field.options.length > 0;
                
//                 if (!hasMultiOptions) {
//                     console.warn(`Multiselect field "${field.attribute_name}" has no options`);
//                     return (
//                         <Input
//                             {...commonProps}
//                             type="text"
//                             placeholder="No options available"
//                         />
//                     );
//                 }
                
//                 return (
//                     <div className="space-y-2">
//                         {field.options.map((option: any, idx: number) => {
//                             const optionValue = typeof option === 'string' ? option : (option.value || option);
//                             const optionLabel = typeof option === 'string' ? option : (option.label || option.value || option);
//                             const isChecked = Array.isArray(value) && value.includes(optionValue);

//                             return (
//                                 <div key={idx} className="flex items-center space-x-2">
//                                     <Checkbox
//                                         checked={isChecked}
//                                         onCheckedChange={(checked) => {
//                                             const currentValues = Array.isArray(value) ? value : [];
//                                             const newValues = checked
//                                                 ? [...currentValues, optionValue]
//                                                 : currentValues.filter((v: any) => v !== optionValue);
//                                             handleFieldChange(field.attribute_name, newValues);
//                                         }}
//                                         disabled={submitting}
//                                     />
//                                     <label className="text-sm">{optionLabel}</label>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 );

//             case 'checkbox':
//             case 'boolean':
//                 return (
//                     <div className="flex items-center space-x-2">
//                         <Checkbox
//                             checked={value === true || value === 'true'}
//                             onCheckedChange={(checked) => handleFieldChange(field.attribute_name, checked)}
//                             disabled={submitting}
//                         />
//                         <label className="text-sm">{field.placeholder || 'Enable'}</label>
//                     </div>
//                 );

//             case 'file':
//             case 'image':
//                 // ✅ FIX: Allow multiple images for product_images field
//                 const allowMultiple = field.attribute_name === 'product_images';
//                 return (
//                     <div className="space-y-2">
//                         <div className="flex items-center space-x-2">
//                             <Input
//                                 type="file"
//                                 accept={field.input_type === 'image' ? 'image/*' : '*'}
//                                 multiple={allowMultiple}
//                                 onChange={(e) => {
//                                     const files = e.target.files;
//                                     if (files && files.length > 0) {
//                                         if (allowMultiple) {
//                                             // Store array of files for product_images
//                                             handleFieldChange(field.attribute_name, Array.from(files));
//                                         } else {
//                                             // Store single file for other fields
//                                             handleFieldChange(field.attribute_name, files[0]);
//                                         }
//                                     }
//                                 }}
//                                 disabled={submitting}
//                                 className={error ? "border-red-500" : ""}
//                             />
//                             <Upload className="h-4 w-4 text-gray-400" />
//                         </div>
//                         {/* Show file count for arrays */}
//                         {Array.isArray(value) && value.length > 0 && (
//                             <div className="space-y-2">
//                                 <p className="text-xs text-muted-foreground">
//                                     {value.length} file(s) selected
//                                 </p>
//                                 {/* ✅ Image Preview Thumbnails */}
//                                 <div className="grid grid-cols-4 gap-2">
//                                     {value.map((file: File, idx: number) => {
//                                         const previewUrl = URL.createObjectURL(file);
//                                         return (
//                                             <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
//                                                 <img 
//                                                     src={previewUrl} 
//                                                     alt={`Preview ${idx + 1}`}
//                                                     className="w-full h-full object-cover"
//                                                     onLoad={() => URL.revokeObjectURL(previewUrl)}
//                                                 />
//                                                 <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
//                                                     {idx + 1}
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             </div>
//                         )}
//                         {/* Show current file/URL for single files */}
//                         {!Array.isArray(value) && value && typeof value === 'string' && (
//                             <p className="text-xs text-muted-foreground">Current: {value}</p>
//                         )}
//                     </div>
//                 );

//             case 'number':
//                 return (
//                     <Input
//                         {...commonProps}
//                         type="number"
//                         placeholder={field.placeholder || ''}
//                         min={field.validation_rules?.min}
//                         max={field.validation_rules?.max}
//                         step={field.validation_rules?.step || 'any'}
//                     />
//                 );

//             case 'date':
//                 return (
//                     <Input
//                         {...commonProps}
//                         type="date"
//                     />
//                 );

//             case 'datetime':
//             case 'datetime-local':
//                 return (
//                     <Input
//                         {...commonProps}
//                         type="datetime-local"
//                     />
//                 );

//             case 'time':
//                 return (
//                     <Input
//                         {...commonProps}
//                         type="time"
//                     />
//                 );

//             case 'email':
//                 return (
//                     <Input
//                         {...commonProps}
//                         type="email"
//                         placeholder={field.placeholder || 'email@example.com'}
//                     />
//                 );

//             case 'tel':
//                 return (
//                     <Input
//                         {...commonProps}
//                         type="tel"
//                         placeholder={field.placeholder || '+1 (555) 000-0000'}
//                     />
//                 );

//             case 'url':
//                 return (
//                     <Input
//                         {...commonProps}
//                         type="url"
//                         placeholder={field.placeholder || 'https://example.com'}
//                     />
//                 );

//             case 'text':
//             default:
//                 return (
//                     <Input
//                         {...commonProps}
//                         type="text"
//                         placeholder={field.placeholder || ''}
//                     />
//                 );
//         }
//     }, [formValues, errors, submitting, handleFieldChange]);

//     // Group fields by field_group
//     const groupedFields = fields.reduce((acc, field) => {
//         const group = field.field_group || 'general';
//         if (!acc[group]) {
//             acc[group] = [];
//         }
//         acc[group].push(field);
//         return acc;
//     }, {} as Record<string, FormField[]>);

//     // ✅ FIX: Define group order - Basic first, then Custom
//     const groupOrder: Record<string, number> = {
//         'basic': 1,
//         'mandatory': 1,
//         'general': 2,
//         'product_details': 3,
//         'pricing': 4,
//         'custom': 5,
//         'additional': 6,
//     };

//     // Sort groups by priority
//     const sortedGroupEntries = Object.entries(groupedFields).sort(([groupA], [groupB]) => {
//         const orderA = groupOrder[groupA] || 99;
//         const orderB = groupOrder[groupB] || 99;
//         return orderA - orderB;
//     });

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center py-12">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                 <span className="ml-2">Loading form...</span>
//             </div>
//         );
//     }

//     return (
//         <form onSubmit={handleSubmit} className="space-y-6">
//             {sortedGroupEntries.map(([group, groupFields]) => (
//                 <div key={group} className="space-y-4">
//                     <div className="flex items-center space-x-2">
//                         <h3 className="text-lg font-semibold capitalize">{group.replace(/_/g, ' ')}</h3>
//                         {group === 'mandatory' && (
//                             <Lock className="h-4 w-4 text-gray-400" />
//                         )}
//                     </div>
//                     <Separator />
                    
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         {groupFields.map(field => (
//                             <div 
//                                 key={field.attribute_name} 
//                                 className={`space-y-2 ${
//                                     ['textarea', 'multiselect'].includes(field.input_type) ? 'md:col-span-2' : ''
//                                 }`}
//                             >
//                                 <div className="flex items-center space-x-2">
//                                     <Label htmlFor={field.attribute_name}>
//                                         {field.attribute_label}
//                                         {field.is_required && <span className="text-red-500 ml-1">*</span>}
//                                     </Label>
//                                     {/* ✅ FIX: Only show lock icon for truly non-editable fields */}
//                                     {field.is_system_field && !field.is_mandatory && field.attribute_name !== 'vendor_name' && (
//                                         <span title="Read-only field">
//                                             <Lock className="h-3 w-3 text-gray-400" />
//                                         </span>
//                                     )}
//                                     {field.inherited_from && field.inherited_from !== 'default' && (
//                                         <span className="text-xs text-muted-foreground bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
//                                             inherited from {field.inherited_from}
//                                         </span>
//                                     )}
//                                 </div>
                                
//                                 {renderField(field)}
                                
//                                 {field.help_text && (
//                                     <p className="text-xs text-muted-foreground">{field.help_text}</p>
//                                 )}
                                
//                                 {errors[field.attribute_name] && (
//                                     <p className="text-xs text-red-500">{errors[field.attribute_name]}</p>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             ))}

//             {fields.length === 0 && (
//                 <div className="text-center py-12 text-muted-foreground">
//                     <p>No form fields configured for this service/category</p>
//                 </div>
//             )}

//             <div className="flex justify-end space-x-2 pt-4">
//                 {onCancel && (
//                     <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
//                         Cancel
//                     </Button>
//                 )}
//                 <Button type="submit" disabled={submitting || fields.length === 0}>
//                     {submitting ? 'Saving...' : submitButtonText}
//                 </Button>
//             </div>
//         </form>
//     );
// };

// export default DynamicFormGenerator;

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
    subcategoryId?: string | null;
    initialValues?: Record<string, any>;
    onSubmit: (values: Record<string, any>) => Promise<void>;
    onCancel?: () => void;
    submitButtonText?: string;
    useEnhancedVersion?: boolean;
}

const DynamicFormGenerator: React.FC<DynamicFormGeneratorProps> = ({
    serviceTypeId,
    categoryId,
    subcategoryId,
    initialValues = {},
    onSubmit,
    onCancel,
    submitButtonText = "Save",
    useEnhancedVersion = false,
}) => {
    const [fields, setFields] = useState<FormField[]>([]);
    const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [vendors, setVendors] = useState<Array<{id: string, name: string}>>([]);
    // ✅ CHANGE 1: Add measurementUnits state
    const [measurementUnits, setMeasurementUnits] = useState<Array<{value: string, label: string}>>([]);

    // ✅ CHANGE 2: Add fetchMeasurementUnits function
    const fetchMeasurementUnits = useCallback(async () => {
        try {
            console.log('🔄 Fetching measurement units...');
            const { data, error } = await supabase
                .from('measurement_units')
                .select('id, name, symbol')
                .eq('is_active', true)
                .order('name');
            
            if (error) {
                console.error('❌ Error fetching measurement units:', error);
                throw error;
            }
            
            const units = (data || []).map(unit => ({
                value: unit.id,
                label: unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name
            }));
            
            setMeasurementUnits(units);
            console.log('✅ Fetched measurement units:', units.length, 'units');
            if (units.length > 0) {
                console.log('   Sample units:', units.slice(0, 3));
            }
        } catch (error) {
            console.error('⚠️ Error fetching measurement units, using fallback:', error);
            // Fallback to common units if database fetch fails
            const fallbackUnits = [
                { value: 'kg', label: 'Kilogram (kg)' },
                { value: 'g', label: 'Gram (g)' },
                { value: 'l', label: 'Liter (l)' },
                { value: 'ml', label: 'Milliliter (ml)' },
                { value: 'pcs', label: 'Pieces (pcs)' },
                { value: 'box', label: 'Box' },
                { value: 'pack', label: 'Pack' },
                { value: 'dozen', label: 'Dozen' },
            ];
            setMeasurementUnits(fallbackUnits);
            console.log('✅ Using', fallbackUnits.length, 'fallback units');
        }
    }, []);

    const fetchVendors = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('vendors')
                .select('id, name')
                .is('deleted_at', null)
                .eq('status', 'active')
                .order('name');
            
            if (error) throw error;
            setVendors(data || []);
            console.log('✅ Fetched vendors:', data?.length || 0);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    }, []);

    const fetchFormFields = useCallback(async () => {
        console.log('🔄 fetchFormFields called');
        console.log('  ├─ vendors available:', vendors.length);
        console.log('  └─ measurement units available:', measurementUnits.length);
        
        try {
            setLoading(true);
            
            const functionName = useEnhancedVersion 
                ? 'get_product_form_attributes_v2' 
                : 'get_product_form_attributes';
            
            const params = useEnhancedVersion
                ? {
                    p_service_type_id: serviceTypeId,
                    p_category_id: categoryId,
                    p_subcategory_id: subcategoryId,
                  }
                : {
                    p_service_type_id: serviceTypeId,
                    p_category_id: categoryId,
                  };

            const { data, error } = await supabase.rpc(functionName, params);

            if (error) throw error;

            console.log('🔍 Raw data from database:', data);

            const mappedFields = (data || []).map((field: any) => ({
                ...field,
                attribute_label: field.label || field.attribute_label || field.attribute_name,
            }));

            const visibleFields = mappedFields.filter((field: FormField) => field.is_visible !== false);

            console.log('🔍 Filtered to visible fields:', visibleFields.length, 'of', mappedFields.length);

            const sortedFields = visibleFields.sort((a: FormField, b: FormField) => 
                a.display_order - b.display_order
            );

            // ✅ CHANGE 3: Enhance both vendor_name AND measurement_unit fields
            const enhancedFields = sortedFields.map((field: FormField) => {
                // Handle vendor_name field (existing)
                if (field.attribute_name === 'vendor_name') {
                    console.log('🔍 Processing vendor_name field:', {
                        vendorsCount: vendors.length,
                        fieldInputType: field.input_type,
                        fieldDataType: field.data_type
                    });
                    
                    if (vendors.length > 0) {
                        return {
                            ...field,
                            input_type: 'select',
                            data_type: 'select',
                            options: vendors.map(v => ({ value: v.id, label: v.name }))
                        };
                    } else {
                        console.warn('⚠️ No vendors found! Keeping as select but with empty options');
                        return {
                            ...field,
                            input_type: 'select',
                            data_type: 'select',
                            options: []
                        };
                    }
                }
                
                // ✅ NEW: Handle measurement_unit field
                if (field.attribute_name === 'measurement_unit') {
                    console.log('🔍 Processing measurement_unit field:', {
                        unitsCount: measurementUnits.length,
                        fieldInputType: field.input_type,
                        fieldDataType: field.data_type,
                        existingOptions: field.options
                    });
                    
                    // Only enhance if we have units and field doesn't already have valid options
                    if (measurementUnits.length > 0 && (!field.options || field.options.length === 0)) {
                        console.log('✅ Enhancing measurement_unit field with', measurementUnits.length, 'options');
                        return {
                            ...field,
                            input_type: 'select',
                            data_type: 'select',
                            options: measurementUnits
                        };
                    } else if (measurementUnits.length === 0) {
                        console.warn('⚠️ No measurement units found!');
                    } else {
                        console.log('ℹ️ Measurement unit field already has options:', field.options?.length);
                    }
                }
                
                return field;
            });

            console.log('📋 Loaded fields:', enhancedFields.length, 'fields');
            console.log('🔍 Vendor field after enhancement:', 
                enhancedFields.find(f => f.attribute_name === 'vendor_name')
            );
            console.log('🔍 Measurement unit field after enhancement:', 
                enhancedFields.find(f => f.attribute_name === 'measurement_unit')
            );
            
            setFields(enhancedFields);
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
    }, [serviceTypeId, categoryId, subcategoryId, useEnhancedVersion, vendors, measurementUnits, toast]);

    // ✅ CHANGE 4: Load both vendors and measurement units on mount
    useEffect(() => {
        const loadStaticData = async () => {
            console.log('🚀 Loading static data (vendors & measurement units)...');
            await Promise.all([
                fetchVendors(),
                fetchMeasurementUnits()
            ]);
            console.log('✅ Static data loading complete');
        };
        loadStaticData();
    }, [fetchVendors, fetchMeasurementUnits]);

    // ✅ CHANGE 5: Wait for both vendors AND measurement units before loading form fields
    useEffect(() => {
        if ((serviceTypeId || categoryId || subcategoryId) && 
            vendors.length > 0 && 
            measurementUnits.length > 0) {
            console.log('✅ All prerequisites met, fetching form fields');
            fetchFormFields();
        } else {
            console.log('⏳ Waiting for prerequisites:', {
                hasServiceOrCategory: !!(serviceTypeId || categoryId || subcategoryId),
                vendorsLoaded: vendors.length > 0,
                measurementUnitsLoaded: measurementUnits.length > 0
            });
        }
    }, [serviceTypeId, categoryId, subcategoryId, vendors.length, measurementUnits.length, fetchFormFields]);

    const handleFieldChange = useCallback((fieldName: string, value: any) => {
        setFormValues(prev => ({
            ...prev,
            [fieldName]: value,
        }));

        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    }, [errors]);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        fields.forEach(field => {
            if (field.is_required && !formValues[field.attribute_name]) {
                newErrors[field.attribute_name] = `${field.attribute_label} is required`;
            }

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

    const renderField = useCallback((field: FormField) => {
        const isReadOnly = field.is_system_field && !field.is_mandatory && field.attribute_name !== 'vendor_name';
        const value = formValues[field.attribute_name] || field.default_value || '';
        const error = errors[field.attribute_name];

        const commonProps = {
            id: field.attribute_name,
            value,
            onChange: (e: any) => handleFieldChange(field.attribute_name, e.target.value),
            disabled: submitting,
            readOnly: isReadOnly,
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
                const hasOptions = field.options && Array.isArray(field.options) && field.options.length > 0;
                
                // ✅ CHANGE 6: Special handling for both vendor_name AND measurement_unit
                if ((field.attribute_name === 'vendor_name' || field.attribute_name === 'measurement_unit') && !hasOptions) {
                    const loadingText = field.attribute_name === 'vendor_name' 
                        ? 'Loading vendors...' 
                        : 'Loading measurement units...';
                    const noDataText = field.attribute_name === 'vendor_name' 
                        ? 'No vendors available' 
                        : 'No measurement units available';
                    
                    return (
                        <Select
                            value={value}
                            onValueChange={(val) => handleFieldChange(field.attribute_name, val)}
                            disabled={true}
                        >
                            <SelectTrigger className={error ? "border-red-500" : ""}>
                                <SelectValue placeholder={loadingText} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="loading" disabled>{noDataText}</SelectItem>
                            </SelectContent>
                        </Select>
                    );
                }
                
                if (!hasOptions) {
                    console.warn(`Select field "${field.attribute_name}" has no options, rendering as text input`);
                    return (
                        <Input
                            {...commonProps}
                            type="text"
                            placeholder={field.placeholder || 'No options available'}
                        />
                    );
                }
                
                console.log(`🎯 Rendering select for "${field.attribute_name}" with ${field.options.length} options`);
                
                return (
                    <Select
                        value={value}
                        onValueChange={(val) => handleFieldChange(field.attribute_name, val)}
                        disabled={submitting}
                    >
                        <SelectTrigger className={error ? "border-red-500" : ""}>
                            <SelectValue placeholder={field.placeholder || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options.map((option: any, idx: number) => {
                                const optionValue = typeof option === 'string' ? option : (option.value || option);
                                const optionLabel = typeof option === 'string' ? option : (option.label || option.value || option);
                                return (
                                    <SelectItem key={idx} value={String(optionValue)}>
                                        {optionLabel}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                );

            case 'multiselect':
                const hasMultiOptions = field.options && Array.isArray(field.options) && field.options.length > 0;
                
                if (!hasMultiOptions) {
                    console.warn(`Multiselect field "${field.attribute_name}" has no options`);
                    return (
                        <Input
                            {...commonProps}
                            type="text"
                            placeholder="No options available"
                        />
                    );
                }
                
                return (
                    <div className="space-y-2">
                        {field.options.map((option: any, idx: number) => {
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
                                        disabled={submitting}
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
                            disabled={submitting}
                        />
                        <label className="text-sm">{field.placeholder || 'Enable'}</label>
                    </div>
                );

            case 'file':
            case 'image':
                const allowMultiple = field.attribute_name === 'product_images';
                return (
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Input
                                type="file"
                                accept={field.input_type === 'image' ? 'image/*' : '*'}
                                multiple={allowMultiple}
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                        if (allowMultiple) {
                                            handleFieldChange(field.attribute_name, Array.from(files));
                                        } else {
                                            handleFieldChange(field.attribute_name, files[0]);
                                        }
                                    }
                                }}
                                disabled={submitting}
                                className={error ? "border-red-500" : ""}
                            />
                            <Upload className="h-4 w-4 text-gray-400" />
                        </div>
                        {Array.isArray(value) && value.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                    {value.length} file(s) selected
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {value.map((file: File, idx: number) => {
                                        const previewUrl = URL.createObjectURL(file);
                                        return (
                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                                                <img 
                                                    src={previewUrl} 
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onLoad={() => URL.revokeObjectURL(previewUrl)}
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                                    {idx + 1}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {!Array.isArray(value) && value && typeof value === 'string' && (
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

    const groupedFields = fields.reduce((acc, field) => {
        const group = field.field_group || 'general';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(field);
        return acc;
    }, {} as Record<string, FormField[]>);

    const groupOrder: Record<string, number> = {
        'basic': 1,
        'mandatory': 1,
        'general': 2,
        'product_details': 3,
        'pricing': 4,
        'custom': 5,
        'additional': 6,
    };

    const sortedGroupEntries = Object.entries(groupedFields).sort(([groupA], [groupB]) => {
        const orderA = groupOrder[groupA] || 99;
        const orderB = groupOrder[groupB] || 99;
        return orderA - orderB;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading form...</span>
            </div>
        );
    }

    return (
        <div onSubmit={handleSubmit} className="space-y-6">
            {sortedGroupEntries.map(([group, groupFields]) => (
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
                                    {field.is_system_field && !field.is_mandatory && field.attribute_name !== 'vendor_name' && (
                                        <span title="Read-only field">
                                            <Lock className="h-3 w-3 text-gray-400" />
                                        </span>
                                    )}
                                    {field.inherited_from && field.inherited_from !== 'default' && (
                                        <span className="text-xs text-muted-foreground bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                            inherited from {field.inherited_from}
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
        </div>
    );
};

export default DynamicFormGenerator;