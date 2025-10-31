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

interface VendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendor?: any;
  mode: 'add' | 'edit' | 'view';
}

export const VendorDialog: React.FC<VendorDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vendor,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    business_registration_number: '',
    tax_id: '',
    commission_rate: 0,
    payment_terms_days: 30,
    minimum_order_amount: 0,
    status: 'active' as 'active' | 'pending' | 'suspended' | 'inactive',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vendor && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: vendor.name || '',
        slug: vendor.slug || '',
        description: vendor.description || '',
        business_email: vendor.business_email || '',
        business_phone: vendor.business_phone || '',
        business_address: vendor.business_address || '',
        business_registration_number: vendor.business_registration_number || '',
        tax_id: vendor.tax_id || '',
        commission_rate: vendor.commission_rate || 0,
        payment_terms_days: vendor.payment_terms_days || 30,
        minimum_order_amount: vendor.minimum_order_amount || 0,
        status: vendor.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        business_email: '',
        business_phone: '',
        business_address: '',
        business_registration_number: '',
        tax_id: '',
        commission_rate: 0,
        payment_terms_days: 30,
        minimum_order_amount: 0,
        status: 'active',
      });
    }
  }, [vendor, mode, isOpen]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.business_email) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const slug = formData.slug || generateSlug(formData.name);

      if (mode === 'add') {
        const { error } = await supabase.from('vendors').insert({
          name: formData.name,
          slug,
          description: formData.description,
          business_email: formData.business_email,
          business_phone: formData.business_phone,
          business_address: formData.business_address,
          business_registration_number: formData.business_registration_number,
          tax_id: formData.tax_id,
          commission_rate: formData.commission_rate,
          payment_terms_days: formData.payment_terms_days,
          minimum_order_amount: formData.minimum_order_amount,
          status: formData.status,
          is_verified: false,
          settings: {},
        });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Vendor added successfully',
        });
      } else {
        const { error } = await supabase
          .from('vendors')
          .update({
            name: formData.name,
            slug,
            description: formData.description,
            business_email: formData.business_email,
            business_phone: formData.business_phone,
            business_address: formData.business_address,
            business_registration_number: formData.business_registration_number,
            tax_id: formData.tax_id,
            commission_rate: formData.commission_rate,
            payment_terms_days: formData.payment_terms_days,
            minimum_order_amount: formData.minimum_order_amount,
            status: formData.status,
          })
          .eq('id', vendor.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Vendor updated successfully',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save vendor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Vendor' : mode === 'edit' ? 'Edit Vendor' : 'Vendor Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Register a new vendor or service provider'
              : mode === 'edit'
              ? 'Update vendor information'
              : 'View vendor details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="Enter business name"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="business-slug"
                  disabled={isReadOnly}
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
                  placeholder="Enter business description"
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Business Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.business_email}
                  onChange={(e) =>
                    setFormData({ ...formData, business_email: e.target.value })
                  }
                  placeholder="vendor@example.com"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.business_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, business_phone: e.target.value })
                  }
                  placeholder="+1234567890"
                  disabled={isReadOnly}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={formData.business_address}
                  onChange={(e) =>
                    setFormData({ ...formData, business_address: e.target.value })
                  }
                  placeholder="Enter business address"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="registration">Registration Number</Label>
                <Input
                  id="registration"
                  value={formData.business_registration_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business_registration_number: e.target.value,
                    })
                  }
                  placeholder="Business registration number"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="tax">Tax ID</Label>
                <Input
                  id="tax"
                  value={formData.tax_id}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_id: e.target.value })
                  }
                  placeholder="Tax identification number"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commission_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="payment">Payment Terms (Days)</Label>
                <Input
                  id="payment"
                  type="number"
                  min="0"
                  value={formData.payment_terms_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_terms_days: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="30"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="minimum">Minimum Order Amount</Label>
                <Input
                  id="minimum"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimum_order_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimum_order_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={loading}>
                {loading
                  ? 'Saving...'
                  : mode === 'add'
                  ? 'Add Vendor'
                  : 'Update Vendor'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

