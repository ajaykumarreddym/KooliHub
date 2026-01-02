import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Calendar, DollarSign, MapPin, Package } from 'lucide-react';
import React, { useState } from 'react';

interface OrderViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: any;
  mode: 'view' | 'edit';
}

export const OrderViewDialog: React.FC<OrderViewDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  order,
  mode,
}) => {
  const [status, setStatus] = useState(order?.status || 'pending');
  const [paymentStatus, setPaymentStatus] = useState(order?.payment_status || 'pending');
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async () => {
    if (mode === 'view') return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          payment_status: paymentStatus,
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order updated successfully',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  const orderItems = order.order_items
    ? typeof order.order_items === 'string'
      ? JSON.parse(order.order_items)
      : order.order_items
    : [];

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details</span>
            <Badge className="text-base">
              #{order.id.slice(0, 8).toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'View and update order information' : 'Order information'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Order Information
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-gray-600">Order Date</Label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Total Amount</Label>
                <div className="flex items-center mt-1">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-bold text-lg">
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Order Status</Label>
                {mode === 'edit' ? (
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`mt-1 ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                )}
              </div>
              <div>
                <Label className="text-gray-600">Payment Status</Label>
                {mode === 'edit' ? (
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`mt-1 ${getStatusColor(order.payment_status)}`}>
                    {order.payment_status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Delivery Information
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div>
                <Label className="text-gray-600">Address</Label>
                <p className="font-medium">{order.delivery_address || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Pincode</Label>
                <p className="font-medium">{order.delivery_pincode || 'N/A'}</p>
              </div>
              {order.payment_method && (
                <div>
                  <Label className="text-gray-600">Payment Method</Label>
                  <p className="font-medium capitalize">{order.payment_method}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                <div className="space-y-2">
                  {orderItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name || 'Item'}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity || 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${(item.price || 0).toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">Notes</h3>
                <p className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  {order.notes}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {mode === 'edit' && (
            <Button onClick={handleUpdateStatus} disabled={loading}>
              {loading ? 'Updating...' : 'Update Order'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

