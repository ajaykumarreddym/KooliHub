import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  type: "card" | "upi" | "wallet";
  last4?: string;
  brand?: string;
  upi_id?: string;
  wallet_name?: string;
  is_default: boolean;
}

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      last4: "4242",
      brand: "Visa",
      is_default: true,
    },
    {
      id: "2",
      type: "upi",
      upi_id: "user@paytm",
      is_default: false,
    },
  ]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods((methods) =>
      methods.map((method) => ({
        ...method,
        is_default: method.id === id,
      }))
    );
    toast({
      title: "Default Payment Method Updated",
      description: "This method will be used for future transactions",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) return;
    
    setPaymentMethods((methods) => methods.filter((m) => m.id !== id));
    toast({
      title: "Payment Method Removed",
      description: "The payment method has been deleted successfully",
    });
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    return <CreditCard className="h-5 w-5" />;
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    if (method.type === "card") {
      return `${method.brand} •••• ${method.last4}`;
    }
    if (method.type === "upi") {
      return method.upi_id;
    }
    return method.wallet_name;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">
              Payment Methods
            </h1>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="icon"
              className="rounded-full bg-[#137fec] hover:bg-[#137fec]/90"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          {paymentMethods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <CreditCard className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No Payment Methods
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add a payment method to book trips quickly
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-[#137fec] hover:bg-[#137fec]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {getPaymentIcon(method)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getPaymentLabel(method)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {method.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(method.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    {method.is_default ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
            <div className="flex gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Secure Payments
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  All payment information is encrypted and secure. We never store your full card details.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Add Payment Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Card Number</Label>
                <Input placeholder="1234 5678 9012 3456" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input type="password" placeholder="123" maxLength={4} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cardholder Name</Label>
                <Input placeholder="John Doe" />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowAddDialog(false);
                  toast({
                    title: "Payment Method Added",
                    description: "Your card has been added successfully",
                  });
                }}
                className="bg-[#137fec] hover:bg-[#137fec]/90"
              >
                Add Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

