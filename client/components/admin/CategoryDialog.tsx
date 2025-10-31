import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Check, Edit, Eye, ImageIcon, Layers, Loader2, Plus, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceTypeId: string;
  serviceTypeName: string;
  category?: any;
  mode?: 'add' | 'edit';
}

// Color and Icon Options (same as EntityManagement)
const colorOptions = [
    { label: 'Blue Ocean', value: 'from-blue-500 to-blue-600', preview: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { label: 'Purple Magic', value: 'from-purple-500 to-purple-600', preview: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { label: 'Pink Sunset', value: 'from-pink-500 to-pink-600', preview: 'bg-gradient-to-r from-pink-500 to-pink-600' },
    { label: 'Green Forest', value: 'from-green-500 to-green-600', preview: 'bg-gradient-to-r from-green-500 to-green-600' },
    { label: 'Orange Glow', value: 'from-orange-500 to-orange-600', preview: 'bg-gradient-to-r from-orange-500 to-orange-600' },
    { label: 'Red Passion', value: 'from-red-500 to-red-600', preview: 'bg-gradient-to-r from-red-500 to-red-600' },
    { label: 'Teal Wave', value: 'from-teal-500 to-teal-600', preview: 'bg-gradient-to-r from-teal-500 to-teal-600' },
    { label: 'Indigo Night', value: 'from-indigo-500 to-indigo-600', preview: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
];

const iconOptions = [
    "🛒", "🍔", "👗", "💄", "📱", "🏠", "🚗", "🔧",
    "🎨", "🎭", "💼", "🍕", "🎮", "⚽", "🎬", "📚"
];

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  serviceTypeId,
  serviceTypeName,
  category,
  mode = 'add',
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: 'from-blue-500 to-blue-600',
    image_url: '',
  });

  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '📁',
        color: category.color || 'from-blue-500 to-blue-600',
        image_url: category.image_url || '',
      });
      setImagePreview(category.image_url || null);
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '📁',
        color: 'from-blue-500 to-blue-600',
        image_url: '',
      });
      setImagePreview(null);
    }
  }, [category, mode, isOpen]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleImageUpload(e.target.files[0]);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      setImagePreview(publicUrl);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'add') {
        const { error } = await supabase
          .from('categories')
          .insert({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            image_url: formData.image_url,
            service_type: serviceTypeId,
            is_active: true,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            image_url: formData.image_url,
          })
          .eq('id', category.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {mode === 'add' ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {mode === 'add' ? 'Create' : 'Edit'} Category
          </DialogTitle>
          <DialogDescription>
            <span className="text-blue-600 font-medium">For {serviceTypeName}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hierarchical Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Hierarchical Structure: Service → Category
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Creating category under <strong>{serviceTypeName}</strong>
              </p>
            </div>

            <Separator />

            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">
                Category Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name"
                className="text-base"
                required
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
                className="text-base resize-none"
              />
            </div>

            {/* Icon and Color Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Icon</Label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-md bg-gray-50">
                  {iconOptions.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, icon })}
                      className="text-2xl w-12 h-12 p-0 hover:scale-110 transition-transform"
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Selected: {formData.icon || '📁'}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Color Theme</Label>
                <ScrollArea className="h-40 border rounded-md p-2 bg-gray-50">
                  <div className="space-y-2">
                    {colorOptions.map((color) => (
                      <div
                        key={color.value}
                        className={`flex items-center space-x-3 p-2 rounded cursor-pointer border transition-all ${
                          formData.color === color.value 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-105' 
                            : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                        }`}
                        onClick={() => setFormData({ ...formData, color: color.value })}
                      >
                        <div className={`w-10 h-10 rounded-md ${color.preview} shadow-sm`}></div>
                        <span className="text-sm font-medium">{color.label}</span>
                        {formData.color === color.value && (
                          <Check className="h-4 w-4 ml-auto text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <Separator />

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Category Image
              </Label>
              <div className="space-y-3">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden group">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(imagePreview, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Upload Area */}
                {!imagePreview && (
                  <div 
                    className={`flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-all ${
                      dragActive 
                        ? 'border-primary bg-primary/5 scale-105' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <label htmlFor="category-image-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-base text-gray-600 font-medium">
                        {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, WebP or GIF up to 5MB</p>
                      <input
                        ref={fileInputRef}
                        id="category-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                
                {uploadingImage && (
                  <div className="flex items-center justify-center py-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">Uploading image...</span>
                  </div>
                )}
                
                {/* Manual URL Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="image_url" className="text-sm text-muted-foreground">Or enter image URL manually</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : mode === 'add' ? 'Create Category' : 'Update Category'}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

