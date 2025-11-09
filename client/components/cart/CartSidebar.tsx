import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "@/contexts/LocationContext";
import { Clock, Info, MapPin, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { state, dispatch } = useCart();
  const { currentLocation } = useLocation();
  const navigate = useNavigate();
  const [donationEnabled, setDonationEnabled] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  const deliveryCharge = state.total >= 500 ? 0 : 30;
  const handlingCharge = 5;
  const donation = donationEnabled ? 2 : 0;
  const tip = selectedTip || 0;
  const finalTotal = state.total + deliveryCharge + handlingCharge + donation + tip;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      dispatch({ type: "REMOVE_ITEM", payload: { productId } });
    } else {
      dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity: newQuantity } });
    }
  };

  const handleProceedToPay = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">My Cart</SheetTitle>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-600 mb-4">Add items to get started</p>
              <Button onClick={onClose}>Continue Shopping</Button>
            </div>
          ) : (
            <>
              {/* Delivery Info */}
              <div className="px-4 py-3 bg-blue-50 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Delivery in 8 minutes</p>
                    <p className="text-xs text-gray-600">Shipment of {state.items.length} items</p>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="px-4 py-4 space-y-4">
                {state.items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-contain rounded-lg border"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.product.brand}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-gray-900">
                          ₹{(item.product.price * item.quantity).toFixed(0)}
                        </span>
                        {item.product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{(item.product.originalPrice * item.quantity).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center border-2 border-green-600 rounded-lg bg-green-600">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          className="p-2 hover:bg-green-700 transition-colors text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 py-1 text-sm font-bold text-white min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          className="p-2 hover:bg-green-700 transition-colors text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Bill Details */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Bill details</h3>
                  <Badge variant="secondary" className="text-xs">Save ₹{deliveryCharge}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Items total</span>
                    </div>
                    <span className="font-medium">₹{state.total.toFixed(0)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Delivery charge</span>
                      <Info className="h-3 w-3 text-gray-400" />
                    </div>
                    <span className={deliveryCharge === 0 ? "text-green-600 font-medium" : "font-medium"}>
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Handling charge</span>
                      <Info className="h-3 w-3 text-gray-400" />
                    </div>
                    <span className="font-medium">₹{handlingCharge}</span>
                  </div>

                  {donation > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Feeding India donation</span>
                      <span className="font-medium">₹{donation}</span>
                    </div>
                  )}

                  {tip > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Delivery tip</span>
                      <span className="font-medium">₹{tip}</span>
                    </div>
                  )}

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between text-base font-bold">
                    <span>Grand total</span>
                    <span>₹{finalTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Feeding India Donation */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded flex items-center justify-center text-lg">
                    🍲
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Feeding India donation</p>
                    <p className="text-xs text-gray-600">Working towards a malnutrition free India. Feeding...</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={donationEnabled}
                    onChange={(e) => setDonationEnabled(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                </div>
              </div>

              <Separator />

              {/* Tip Section */}
              <div className="px-4 py-3">
                <h3 className="font-semibold text-gray-900 mb-2">Tip your delivery partner</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Your kindness means a lot! 100% of your tip will go directly to your delivery partner.
                </p>
                <div className="flex gap-2">
                  {[20, 30, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedTip(selectedTip === amount ? null : amount)}
                      className={`flex-1 py-2 px-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTip === amount
                          ? "border-green-600 bg-green-50 text-green-600"
                          : "border-gray-300 text-gray-700 hover:border-green-300"
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                  <button
                    className={`flex-1 py-2 px-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTip && ![20, 30, 50].includes(selectedTip)
                        ? "border-green-600 bg-green-50 text-green-600"
                        : "border-gray-300 text-gray-700 hover:border-green-300"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              <Separator />

              {/* Cancellation Policy */}
              <div className="px-4 py-3 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Cancellation Policy</h3>
                <p className="text-xs text-gray-600">
                  Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t bg-white">
            {/* Delivery Address */}
            {currentLocation && (
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Delivering to Home</p>
                      <p className="text-xs text-gray-600">{currentLocation.city}, {currentLocation.state}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-green-600 font-semibold">
                    Change
                  </Button>
                </div>
              </div>
            )}

            {/* Proceed to Pay Button */}
            <div className="px-4 py-4">
              <Button
                onClick={handleProceedToPay}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-base"
              >
                <span className="flex items-center justify-between w-full">
                  <span>₹{finalTotal.toFixed(0)}</span>
                  <span>TOTAL</span>
                  <span>Proceed To Pay ›</span>
                </span>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

