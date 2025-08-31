import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Smartphone,
  Building2,
  Coins,
  Truck,
  Shield,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentMethod {
  id: string;
  name: string;
  type: "card" | "wallet" | "bank" | "crypto" | "cod";
  provider: string;
  is_enabled: boolean;
  fees_percentage: number;
  fees_fixed: number;
  min_amount: number;
  max_amount: number;
  supported_currencies: string[];
}

interface PaymentCheckoutProps {
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
  amount?: number;
  currency?: string;
  orderDetails?: any;
}

const paymentIcons = {
  card: CreditCard,
  wallet: Smartphone,
  bank: Building2,
  crypto: Coins,
  cod: Truck,
};

const indianPaymentMethods = [
  {
    id: "razorpay-upi",
    name: "UPI (PhonePe, Google Pay, Paytm)",
    type: "wallet" as const,
    provider: "Razorpay",
    logo: "💳",
    description: "Pay using any UPI app",
    is_enabled: true,
    fees_percentage: 0,
    fees_fixed: 0,
    min_amount: 1,
    max_amount: 100000,
    supported_currencies: ["INR"],
  },
  {
    id: "razorpay-cards",
    name: "Credit/Debit Cards",
    type: "card" as const,
    provider: "Razorpay",
    logo: "💳",
    description: "Visa, Mastercard, Rupay",
    is_enabled: true,
    fees_percentage: 1.9,
    fees_fixed: 2,
    min_amount: 1,
    max_amount: 200000,
    supported_currencies: ["INR"],
  },
  {
    id: "razorpay-netbanking",
    name: "Net Banking",
    type: "bank" as const,
    provider: "Razorpay",
    logo: "🏦",
    description: "All major Indian banks",
    is_enabled: true,
    fees_percentage: 0.9,
    fees_fixed: 5,
    min_amount: 1,
    max_amount: 500000,
    supported_currencies: ["INR"],
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    type: "cod" as const,
    provider: "COD",
    logo: "💰",
    description: "Pay when you receive your order",
    is_enabled: true,
    fees_percentage: 0,
    fees_fixed: 25, // COD handling charges
    min_amount: 50,
    max_amount: 50000,
    supported_currencies: ["INR"],
  },
];

export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  onPaymentSuccess,
  onPaymentError,
  amount,
  currency = "INR",
  orderDetails,
}) => {
  const { state } = useCart();
  const { user } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    upiId: "",
    phoneNumber: "",
    codAddress: "",
    codPhone: "",
    codInstructions: "",
  });

  const totalAmount = amount || state.total;
  const selectedMethod = indianPaymentMethods.find(
    (m) => m.id === selectedPaymentMethod,
  );
  const processingFee = selectedMethod
    ? (totalAmount * selectedMethod.fees_percentage) / 100 +
      selectedMethod.fees_fixed
    : 0;
  const finalAmount = totalAmount + processingFee;

  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    // Reset payment data when changing methods
    setPaymentData({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardName: "",
      upiId: "",
      phoneNumber: "",
      codAddress: "",
      codPhone: "",
      codInstructions: "",
    });
  };

  const validatePaymentData = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return false;
    }

    if (totalAmount < selectedMethod.min_amount) {
      toast.error(
        `Minimum amount for ${selectedMethod.name} is ₹${selectedMethod.min_amount}`,
      );
      return false;
    }

    if (totalAmount > selectedMethod.max_amount) {
      toast.error(
        `Maximum amount for ${selectedMethod.name} is ₹${selectedMethod.max_amount}`,
      );
      return false;
    }

    switch (selectedMethod.type) {
      case "card":
        if (
          !paymentData.cardNumber ||
          !paymentData.expiryDate ||
          !paymentData.cvv ||
          !paymentData.cardName
        ) {
          toast.error("Please fill all card details");
          return false;
        }
        break;
      case "wallet":
        if (
          selectedMethod.provider === "Razorpay" &&
          !paymentData.phoneNumber
        ) {
          toast.error("Please enter your phone number for UPI payment");
          return false;
        }
        break;
      case "cod":
        if (!paymentData.codAddress || !paymentData.codPhone) {
          toast.error(
            "Please provide delivery address and phone number for COD",
          );
          return false;
        }
        break;
    }

    return true;
  };

  const processPayment = async () => {
    if (!validatePaymentData()) return;

    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const paymentResult = {
        paymentMethod: selectedMethod,
        amount: finalAmount,
        currency,
        orderId: `ORD-${Date.now()}`,
        transactionId: `TXN-${Date.now()}`,
        status: "success",
        data: paymentData,
        timestamp: new Date().toISOString(),
      };

      if (selectedMethod?.type === "cod") {
        paymentResult.status = "pending";
        toast.success(
          "Order placed successfully! You will pay cash on delivery.",
        );
      } else {
        toast.success("Payment completed successfully!");
      }

      onPaymentSuccess?.(paymentResult);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentForm = () => {
    if (!selectedMethod) return null;

    switch (selectedMethod.type) {
      case "card":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    cardNumber: e.target.value,
                  }))
                }
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      expiryDate: e.target.value,
                    }))
                  }
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) =>
                    setPaymentData((prev) => ({ ...prev, cvv: e.target.value }))
                  }
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                placeholder="Full name as on card"
                value={paymentData.cardName}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    cardName: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        );

      case "wallet":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="Enter your mobile number"
                value={paymentData.phoneNumber}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                maxLength={10}
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-800">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">UPI Payment Process</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                You will be redirected to complete payment using your preferred
                UPI app (PhonePe, Google Pay, Paytm, etc.)
              </p>
            </div>
          </div>
        );

      case "bank":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 text-green-800">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Net Banking</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                You will be redirected to your bank's secure payment gateway to
                complete the transaction.
              </p>
            </div>
          </div>
        );

      case "cod":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="codPhone">Phone Number</Label>
              <Input
                id="codPhone"
                placeholder="Enter your mobile number"
                value={paymentData.codPhone}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    codPhone: e.target.value,
                  }))
                }
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="codAddress">Delivery Address</Label>
              <Textarea
                id="codAddress"
                placeholder="Enter complete delivery address with pincode"
                value={paymentData.codAddress}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    codAddress: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="codInstructions">
                Delivery Instructions (Optional)
              </Label>
              <Textarea
                id="codInstructions"
                placeholder="Any special instructions for delivery"
                value={paymentData.codInstructions}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    codInstructions: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 text-yellow-800">
                <Truck className="h-4 w-4" />
                <span className="text-sm font-medium">Cash on Delivery</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Pay ₹{finalAmount.toFixed(2)} (including ₹
                {selectedMethod.fees_fixed} COD charges) when your order is
                delivered.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal ({state.itemCount} items)</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            {processingFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing Fee</span>
                <span>₹{processingFee.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPaymentMethod}
            onValueChange={handlePaymentMethodChange}
          >
            <div className="space-y-3">
              {indianPaymentMethods.map((method) => {
                if (!method.is_enabled) return null;

                const Icon = paymentIcons[method.type];
                const isInRange =
                  totalAmount >= method.min_amount &&
                  totalAmount <= method.max_amount;

                return (
                  <div
                    key={method.id}
                    className={`relative border rounded-lg p-4 ${
                      !isInRange
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={method.id} disabled={!isInRange} />
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{method.name}</span>
                          <span className="text-2xl">{method.logo}</span>
                          {method.fees_percentage === 0 &&
                            method.fees_fixed === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Free
                              </Badge>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {method.description}
                        </p>
                        {(method.fees_percentage > 0 ||
                          method.fees_fixed > 0) && (
                          <p className="text-xs text-gray-500">
                            Fee: {method.fees_percentage}% + ₹
                            {method.fees_fixed}
                          </p>
                        )}
                        {!isInRange && (
                          <p className="text-xs text-red-500">
                            Amount must be between ₹{method.min_amount} - ₹
                            {method.max_amount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Form */}
      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(paymentIcons[selectedMethod.type], {
                className: "h-5 w-5",
              })}
              <span>{selectedMethod.name} Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>{renderPaymentForm()}</CardContent>
        </Card>
      )}

      {/* Payment Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={processPayment}
            disabled={!selectedPaymentMethod || loading}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {loading ? "Processing..." : `Pay ₹${finalAmount.toFixed(2)}`}
          </Button>

          {selectedMethod?.type === "cod" && !loading && (
            <p className="text-center text-sm text-gray-600 mt-2">
              By placing this order, you agree to pay ₹{finalAmount.toFixed(2)}{" "}
              in cash upon delivery
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCheckout;
