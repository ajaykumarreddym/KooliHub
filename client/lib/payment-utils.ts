import { toast } from "sonner";

// Razorpay integration
export const loadRazorpay = (): Promise<any> => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve((window as any).Razorpay);
    };
    document.body.appendChild(script);
  });
};

export interface RazorpayOptions {
  amount: number; // Amount in paise (multiply by 100)
  currency: string;
  orderId: string;
  name: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
}

export const initializeRazorpay = async (options: RazorpayOptions) => {
  try {
    const Razorpay = await loadRazorpay();

    const razorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your Razorpay key ID
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      order_id: options.orderId,
      prefill: {
        email: options.customerEmail,
        contact: options.customerPhone,
      },
      theme: {
        color: "#f8d247", // Your brand color
      },
      handler: options.onSuccess,
      modal: {
        ondismiss: () => {
          toast.error("Payment cancelled");
        },
      },
    };

    const rzp = new Razorpay(razorpayOptions);
    rzp.on("payment.failed", options.onError);
    rzp.open();
  } catch (error) {
    console.error("Error initializing Razorpay:", error);
    options.onError(error);
  }
};

// Stripe integration
export const loadStripe = async () => {
  if (typeof window === "undefined") return null;

  try {
    // Dynamic import with error handling
    const stripeModule = await import("@stripe/stripe-js").catch(() => null);
    if (!stripeModule) {
      console.warn("Stripe module not available");
      return null;
    }
    return await stripeModule.loadStripe(
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    );
  } catch (error) {
    console.error("Error loading Stripe:", error);
    return null;
  }
};

// UPI payment handler
export const handleUPIPayment = (
  amount: number,
  orderId: string,
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
) => {
  // Check if device supports UPI
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  if (isMobile) {
    // Try to open UPI apps
    const upiId = "merchant@upi"; // Your UPI ID
    const upiUrl = `upi://pay?pa=${upiId}&pn=YourBusiness&am=${amount}&cu=INR&tn=Payment for Order ${orderId}`;

    try {
      window.open(upiUrl, "_blank");

      // Simulate payment verification after some time
      setTimeout(() => {
        const success = confirm(
          "Have you completed the payment in your UPI app?",
        );
        if (success) {
          onSuccess({
            method: "UPI",
            transactionId: `UPI_${Date.now()}`,
            amount,
            orderId,
          });
        } else {
          onError({ message: "Payment not completed" });
        }
      }, 3000);
    } catch (error) {
      onError(error);
    }
  } else {
    // For desktop, show QR code or redirect to web payment
    toast.info("UPI payment is best experienced on mobile devices");
    onError({ message: "UPI payment requires mobile device" });
  }
};

// Cash on Delivery handler
export const handleCODPayment = (
  orderData: any,
  onSuccess: (data: any) => void,
) => {
  // Validate COD eligibility
  const { amount, address, phone } = orderData;

  if (!address || !phone) {
    toast.error("Address and phone number are required for COD");
    return;
  }

  if (amount > 50000) {
    toast.error("COD is not available for orders above ₹50,000");
    return;
  }

  // Process COD order
  const codData = {
    method: "COD",
    orderId: `COD_${Date.now()}`,
    amount: amount + 25, // Add COD charges
    address,
    phone,
    status: "pending",
    paymentStatus: "pending",
    deliveryInstructions: orderData.instructions || "",
    codCharges: 25,
  };

  onSuccess(codData);
  toast.success(
    "COD order placed successfully! You will pay when the order is delivered.",
  );
};

// Payment method validation
export const validatePaymentMethod = (
  method: string,
  amount: number,
): { valid: boolean; message?: string } => {
  switch (method) {
    case "card":
      if (amount < 1)
        return {
          valid: false,
          message: "Minimum amount for card payment is ₹1",
        };
      if (amount > 200000)
        return {
          valid: false,
          message: "Maximum amount for card payment is ₹2,00,000",
        };
      break;

    case "upi":
      if (amount < 1)
        return {
          valid: false,
          message: "Minimum amount for UPI payment is ₹1",
        };
      if (amount > 100000)
        return {
          valid: false,
          message: "Maximum amount for UPI payment is ₹1,00,000",
        };
      break;

    case "netbanking":
      if (amount < 1)
        return {
          valid: false,
          message: "Minimum amount for net banking is ₹1",
        };
      if (amount > 500000)
        return {
          valid: false,
          message: "Maximum amount for net banking is ₹5,00,000",
        };
      break;

    case "cod":
      if (amount < 50)
        return { valid: false, message: "Minimum amount for COD is ₹50" };
      if (amount > 50000)
        return { valid: false, message: "Maximum amount for COD is ₹50,000" };
      break;

    default:
      return { valid: false, message: "Invalid payment method" };
  }

  return { valid: true };
};

// Format currency for Indian market
export const formatCurrency = (
  amount: number,
  currency: string = "INR",
): string => {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Payment status checker
export const checkPaymentStatus = async (
  transactionId: string,
  paymentMethod: string,
) => {
  try {
    // This would typically call your backend API
    const response = await fetch(
      `/api/payment-status/${transactionId}?method=${paymentMethod}`,
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
};

// Generate order ID
export const generateOrderId = (prefix: string = "ORD"): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

// Indian payment gateway configurations
export const PAYMENT_GATEWAYS = {
  RAZORPAY: {
    name: "Razorpay",
    supportedMethods: ["card", "upi", "netbanking", "wallet"],
    currencies: ["INR"],
    fees: {
      card: { percentage: 1.95, fixed: 2 },
      upi: { percentage: 0, fixed: 0 },
      netbanking: { percentage: 0.9, fixed: 5 },
      wallet: { percentage: 1.5, fixed: 0 },
    },
  },
  STRIPE: {
    name: "Stripe",
    supportedMethods: ["card"],
    currencies: ["INR", "USD"],
    fees: {
      card: { percentage: 2.9, fixed: 0.3 },
    },
  },
  PAYTM: {
    name: "Paytm",
    supportedMethods: ["wallet", "upi", "card"],
    currencies: ["INR"],
    fees: {
      wallet: { percentage: 0, fixed: 0 },
      upi: { percentage: 0, fixed: 0 },
      card: { percentage: 1.95, fixed: 2 },
    },
  },
  PHONEPE: {
    name: "PhonePe",
    supportedMethods: ["upi", "wallet"],
    currencies: ["INR"],
    fees: {
      upi: { percentage: 0, fixed: 0 },
      wallet: { percentage: 0, fixed: 0 },
    },
  },
};

export default {
  loadRazorpay,
  initializeRazorpay,
  loadStripe,
  handleUPIPayment,
  handleCODPayment,
  validatePaymentMethod,
  formatCurrency,
  checkPaymentStatus,
  generateOrderId,
  PAYMENT_GATEWAYS,
};
