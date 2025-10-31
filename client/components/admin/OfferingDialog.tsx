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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';

interface OfferingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: string;
  offering?: any;
  categories: any[];
  mode: 'add' | 'edit';
}

export const OfferingDialog: React.FC<OfferingDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  serviceId,
  offering,
  categories,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: 0,
    category_id: '',
    stock_quantity: 0,
    sku: '',
    brand: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (offering && mode === 'edit') {
      setFormData({
        name: offering.name || '',
        description: offering.description || '',
        base_price: offering.base_price || 0,
        category_id: offering.category_id || '',
        stock_quantity: offering.stock_quantity || 0,
        sku: offering.sku || '',
        brand: offering.brand || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        base_price: 0,
        category_id: '',
        stock_quantity: 0,
        sku: '',
        brand: '',
      });
    }
  }, [offering, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || formData.base_price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'add') {
        const { error } = await supabase
          .from('offerings')
          .insert({
            name: formData.name,
            description: formData.description,
            base_price: formData.base_price,
            type: serviceId,
            category_id: formData.category_id,
            stock_quantity: formData.stock_quantity,
            sku: formData.sku,
            brand: formData.brand,
            is_active: true,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Offering added successfully',
        });
      } else {
        const { error } = await supabase
          .from('offerings')
          .update({
            name: formData.name,
            description: formData.description,
            base_price: formData.base_price,
            category_id: formData.category_id,
            stock_quantity: formData.stock_quantity,
            sku: formData.sku,
            brand: formData.brand,
          })
          .eq('id', offering.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Offering updated successfully',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving offering:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save offering',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Offering' : 'Edit Offering'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Create a new product or service offering'
              : 'Update offering details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter offering name"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter offering description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">
                  Base Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      base_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="Product SKU"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  placeholder="Brand name"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Offering' : 'Update Offering'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

