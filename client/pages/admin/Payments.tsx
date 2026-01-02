import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Settings,
  DollarSign,
  Percent,
  Shield,
  Eye,
  EyeOff,
  Key,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  name: string;
  type: "card" | "wallet" | "bank" | "crypto" | "cod";
  provider: string;
  is_enabled: boolean;
  api_key: string;
  secret_key: string;
  webhook_url: string;
  sandbox_mode: boolean;
  supported_currencies: string[];
  fees_percentage: number;
  fees_fixed: number;
  min_amount: number;
  max_amount: number;
  created_at: string;
}

interface PaymentConfig {
  id: string;
  currency: string;
  tax_rate: number;
  service_fee: number;
  auto_capture: boolean;
  refund_policy_days: number;
  webhook_secret: string;
  created_at: string;
}

const initialPaymentMethod: Omit<PaymentMethod, "id" | "created_at"> = {
  name: "",
  type: "card",
  provider: "",
  is_enabled: true,
  api_key: "",
  secret_key: "",
  webhook_url: "",
  sandbox_mode: true,
  supported_currencies: ["INR", "USD"],
  fees_percentage: 2.9,
  fees_fixed: 0.3,
  min_amount: 1,
  max_amount: 100000,
};

const paymentProviders = {
  card: [
    "Stripe",
    "Razorpay",
    "Square",
    "PayPal",
    "Authorize.Net",
    "Braintree",
    "Juspay",
  ],
  wallet: [
    "Razorpay",
    "PayPal",
    "Apple Pay",
    "Google Pay",
    "PhonePe",
    "Paytm",
    "Amazon Pay",
  ],
  bank: [
    "Razorpay",
    "UPI",
    "ACH",
    "Wire Transfer",
    "SEPA",
    "Plaid",
    "NEFT",
    "RTGS",
  ],
  crypto: ["Coinbase", "BitPay", "CoinGate", "Binance Pay"],
  cod: ["Cash on Delivery"],
};

export const Payments: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [formData, setFormData] = useState(initialPaymentMethod);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>(
    {},
  );

  // Config form state
  const [configFormData, setConfigFormData] = useState({
    currency: "USD",
    tax_rate: 0,
    service_fee: 0,
    auto_capture: true,
    refund_policy_days: 30,
    webhook_secret: "",
  });

  useEffect(() => {
    fetchPaymentMethods();
    fetchPaymentConfig();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error details:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);

        // Check if table doesn't exist
        if (
          error.code === "PGRST116" ||
          error.message?.includes(
            'relation "public.payment_methods" does not exist',
          )
        ) {
          toast.error(
            "Payment methods table not found. Please run database migrations.",
          );
          return;
        }

        // Extract meaningful error message
        const errorAny = error as any;
        let errorMessage = "Unknown database error";
        if (error.message) {
          errorMessage = error.message;
        } else if (errorAny.error_description) {
          errorMessage = errorAny.error_description;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        toast.error(`Database error: ${errorMessage}`);
        return;
      }
      setPaymentMethods(data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);

      // Better error parsing
      let errorMessage = "Unknown error";
      if (error && typeof error === "object") {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (error.details) {
          errorMessage = error.details;
        } else {
          // If it's still an object, stringify it
          try {
            errorMessage = JSON.stringify(error, null, 2);
          } catch {
            errorMessage = "Complex error object - check console";
          }
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error(`Failed to fetch payment methods: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_config")
        .select("*")
        .single();

      if (error) {
        console.error("Supabase payment config error details:", error);

        // Check if table doesn't exist
        if (
          error.code === "PGRST116" ||
          error.message?.includes(
            'relation "public.payment_config" does not exist',
          )
        ) {
          toast.error(
            "Payment config table not found. Please run database migrations.",
          );
          return;
        }

        // If no data found, that's ok - we'll use defaults
        if (error.code === "PGRST116") return;

        throw error;
      }

      if (data) {
        setPaymentConfig(data);
        setConfigFormData({
          currency: data.currency,
          tax_rate: data.tax_rate,
          service_fee: data.service_fee,
          auto_capture: data.auto_capture,
          refund_policy_days: data.refund_policy_days,
          webhook_secret: data.webhook_secret,
        });
      }
    } catch (error) {
      console.error("Error fetching payment config:", error);
      const errorMessage =
        error?.message || error?.error_description || "Unknown database error";
      toast.error(`Failed to fetch payment configuration: ${errorMessage}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        const { error } = await supabase
          .from("payment_methods")
          .update(formData)
          .eq("id", editingMethod.id);

        if (error) throw error;
        toast.success("Payment method updated successfully");
      } else {
        const { error } = await supabase
          .from("payment_methods")
          .insert([formData]);

        if (error) throw error;
        toast.success("Payment method created successfully");
      }

      setIsDialogOpen(false);
      setEditingMethod(null);
      setFormData(initialPaymentMethod);
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Failed to save payment method");
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (paymentConfig) {
        const { error } = await supabase
          .from("payment_config")
          .update(configFormData)
          .eq("id", paymentConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_config")
          .insert([configFormData]);

        if (error) throw error;
      }

      toast.success("Payment configuration updated successfully");
      fetchPaymentConfig();
    } catch (error) {
      console.error("Error saving payment config:", error);
      toast.error("Failed to save payment configuration");
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      provider: method.provider,
      is_enabled: method.is_enabled,
      api_key: method.api_key,
      secret_key: method.secret_key,
      webhook_url: method.webhook_url,
      sandbox_mode: method.sandbox_mode,
      supported_currencies: method.supported_currencies,
      fees_percentage: method.fees_percentage,
      fees_fixed: method.fees_fixed,
      min_amount: method.min_amount,
      max_amount: method.max_amount,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Payment method deleted successfully");
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method");
    }
  };

  const toggleMethodStatus = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_enabled: !method.is_enabled })
        .eq("id", method.id);

      if (error) throw error;
      toast.success(
        `Payment method ${method.is_enabled ? "disabled" : "enabled"}`,
      );
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error updating payment method status:", error);
      toast.error("Failed to update payment method status");
    }
  };

  const toggleSecretVisibility = (methodId: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [methodId]: !prev[methodId],
    }));
  };

  const maskSecret = (secret: string) => {
    if (!secret) return "";
    return (
      secret.slice(0, 4) + "*".repeat(secret.length - 8) + secret.slice(-4)
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      card: "bg-blue-100 text-blue-800",
      wallet: "bg-green-100 text-green-800",
      bank: "bg-purple-100 text-purple-800",
      crypto: "bg-orange-100 text-orange-800",
      cod: "bg-yellow-100 text-yellow-800",
    };
    return (
      <Badge className={colors[type as keyof typeof colors]}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Management
          </h1>
          <p className="text-gray-500">
            Configure payment methods and settings
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingMethod(null);
                setFormData(initialPaymentMethod);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMethod
                  ? "Edit Payment Method"
                  : "Add New Payment Method"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Method Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Credit Cards"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: PaymentMethod["type"]) =>
                      setFormData({ ...formData, type: value, provider: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="wallet">Digital Wallet</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) =>
                    setFormData({ ...formData, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentProviders[formData.type]
                      .filter((provider) => provider && provider.trim() !== "")
                      .map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) =>
                      setFormData({ ...formData, api_key: e.target.value })
                    }
                    placeholder="Enter API key"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret_key">Secret Key</Label>
                  <Input
                    id="secret_key"
                    type="password"
                    value={formData.secret_key}
                    onChange={(e) =>
                      setFormData({ ...formData, secret_key: e.target.value })
                    }
                    placeholder="Enter secret key"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  value={formData.webhook_url}
                  onChange={(e) =>
                    setFormData({ ...formData, webhook_url: e.target.value })
                  }
                  placeholder="Enter webhook URL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fees_percentage">Fee Percentage (%)</Label>
                  <Input
                    id="fees_percentage"
                    type="number"
                    value={formData.fees_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fees_percentage: Number(e.target.value),
                      })
                    }
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fees_fixed">Fixed Fee (₹)</Label>
                  <Input
                    id="fees_fixed"
                    type="number"
                    value={formData.fees_fixed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fees_fixed: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_amount">Minimum Amount (₹)</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    value={formData.min_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_amount: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_amount">Maximum Amount (₹)</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    value={formData.max_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_amount: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sandbox_mode"
                    checked={formData.sandbox_mode}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, sandbox_mode: checked })
                    }
                  />
                  <Label htmlFor="sandbox_mode">Sandbox Mode</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_enabled"
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_enabled: checked })
                    }
                  />
                  <Label htmlFor="is_enabled">Enabled</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMethod ? "Update" : "Create"} Payment Method
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="methods" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  Loading payment methods...
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No payment methods configured. Add your first payment method!
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {method.name}
                            </h3>
                            <Badge
                              variant={
                                method.is_enabled ? "default" : "secondary"
                              }
                            >
                              {method.is_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                            {getTypeBadge(method.type)}
                            {method.sandbox_mode && (
                              <Badge variant="outline">Sandbox</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            Provider: {method.provider}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Fees:</span>{" "}
                              {method.fees_percentage}% + ₹{method.fees_fixed}
                            </div>
                            <div>
                              <span className="font-medium">Min:</span> ₹
                              {method.min_amount}
                            </div>
                            <div>
                              <span className="font-medium">Max:</span> ₹
                              {method.max_amount}
                            </div>
                            <div>
                              <span className="font-medium">Currencies:</span>{" "}
                              {method.supported_currencies.join(", ")}
                            </div>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <Key className="h-3 w-3" />
                              <span>API Key:</span>
                              <code className="bg-gray-100 px-1 rounded text-xs">
                                {showSecrets[method.id]
                                  ? method.api_key
                                  : maskSecret(method.api_key)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleSecretVisibility(method.id)
                                }
                                className="h-5 w-5 p-0"
                              >
                                {showSecrets[method.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={method.is_enabled}
                            onCheckedChange={() => toggleMethodStatus(method)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(method)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Payment Method
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{method.name}
                                  "? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(method.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfigSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={configFormData.currency}
                      onValueChange={(value) =>
                        setConfigFormData({
                          ...configFormData,
                          currency: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">
                          CAD - Canadian Dollar
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      value={configFormData.tax_rate}
                      onChange={(e) =>
                        setConfigFormData({
                          ...configFormData,
                          tax_rate: Number(e.target.value),
                        })
                      }
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service_fee">Service Fee (%)</Label>
                    <Input
                      id="service_fee"
                      type="number"
                      value={configFormData.service_fee}
                      onChange={(e) =>
                        setConfigFormData({
                          ...configFormData,
                          service_fee: Number(e.target.value),
                        })
                      }
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refund_policy_days">
                      Refund Policy (Days)
                    </Label>
                    <Input
                      id="refund_policy_days"
                      type="number"
                      value={configFormData.refund_policy_days}
                      onChange={(e) =>
                        setConfigFormData({
                          ...configFormData,
                          refund_policy_days: Number(e.target.value),
                        })
                      }
                      min="0"
                      max="365"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook_secret">Global Webhook Secret</Label>
                  <Input
                    id="webhook_secret"
                    type="password"
                    value={configFormData.webhook_secret}
                    onChange={(e) =>
                      setConfigFormData({
                        ...configFormData,
                        webhook_secret: e.target.value,
                      })
                    }
                    placeholder="Enter webhook secret"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_capture"
                    checked={configFormData.auto_capture}
                    onCheckedChange={(checked) =>
                      setConfigFormData({
                        ...configFormData,
                        auto_capture: checked,
                      })
                    }
                  />
                  <Label htmlFor="auto_capture">Auto-capture payments</Label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        Security Notice
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Payment configuration changes will affect all future
                        transactions. Make sure to test in sandbox mode before
                        enabling in production.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Save Configuration</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
