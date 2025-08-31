import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Users, CreditCard, CheckCircle } from "lucide-react";
import { TripRoute, TripSchedule, DeparturePoint } from "@/lib/trip-data";

interface TripBookingModalProps {
  route: TripRoute | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TripBookingModal({ route, isOpen, onClose }: TripBookingModalProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<TripSchedule | null>(null);
  const [selectedDeparture, setSelectedDeparture] = useState<DeparturePoint | null>(null);
  const [passengerDetails, setPassengerDetails] = useState({
    name: "",
    phone: "",
    email: "",
    seatCount: 1
  });
  const [currentStep, setCurrentStep] = useState<"schedule" | "details" | "payment" | "confirmation">("schedule");

  if (!route) return null;

  const handleBooking = () => {
    // Simulate booking process
    setCurrentStep("confirmation");
  };

  const resetAndClose = () => {
    setCurrentStep("schedule");
    setSelectedSchedule(null);
    setSelectedDeparture(null);
    setPassengerDetails({ name: "", phone: "", email: "", seatCount: 1 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{route.image}</span>
            {route.name}
          </DialogTitle>
        </DialogHeader>

        {currentStep === "schedule" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Select Departure Point</h3>
              <div className="grid gap-3">
                {(route.departurePoints || []).length > 0 ? (
                  (route.departurePoints || []).map((point) => (
                    <Card
                      key={point.id}
                      className={`cursor-pointer transition-all ${
                        selectedDeparture?.id === point.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedDeparture(point)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <h4 className="font-medium">{point.name}</h4>
                            <p className="text-sm text-gray-600">{point.address}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No departure points available for this route</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Select Schedule</h3>
              <div className="grid gap-3">
                {(route.schedules || []).length > 0 ? (
                  (route.schedules || []).map((schedule) => (
                    <Card
                      key={schedule.id}
                      className={`cursor-pointer transition-all ${
                        selectedSchedule?.id === schedule.id ? 'ring-2 ring-primary' : ''
                      } ${schedule.availableSeats === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => schedule.availableSeats > 0 && setSelectedSchedule(schedule)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="font-medium text-lg">
                                {schedule.departureTime} - {schedule.arrivalTime}
                              </div>
                              <div className="text-sm text-gray-600">
                                {route.duration} journey
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">AED {route.price}</div>
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-3 w-3" />
                              <span>{schedule.availableSeats} seats left</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No schedules available for this route</p>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={() => setCurrentStep("details")}
              disabled={!selectedSchedule || !selectedDeparture}
              className="w-full"
            >
              Continue to Passenger Details
            </Button>
          </div>
        )}

        {currentStep === "details" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Passenger Details</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={passengerDetails.name}
                    onChange={(e) => setPassengerDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name as per ID"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={passengerDetails.phone}
                    onChange={(e) => setPassengerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+971 xx xxx xxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={passengerDetails.email}
                    onChange={(e) => setPassengerDetails(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="seats">Number of Seats</Label>
                  <select
                    id="seats"
                    value={passengerDetails.seatCount}
                    onChange={(e) => setPassengerDetails(prev => ({ ...prev, seatCount: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} seat{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Booking Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Route:</span>
                  <span className="font-medium">{route.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Departure:</span>
                  <span className="font-medium">{selectedSchedule?.departureTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seats:</span>
                  <span className="font-medium">{passengerDetails.seatCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>AED {(route.price * passengerDetails.seatCount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep("schedule")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep("payment")}
                disabled={!passengerDetails.name || !passengerDetails.phone || !passengerDetails.email}
                className="flex-1"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}

        {currentStep === "payment" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input id="cardName" placeholder="Name on card" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep("details")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleBooking} className="flex-1">
                Complete Booking - AED {(route.price * passengerDetails.seatCount).toFixed(2)}
              </Button>
            </div>
          </div>
        )}

        {currentStep === "confirmation" && (
          <div className="text-center space-y-6">
            <div className="text-green-500">
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600">Your trip has been successfully booked.</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-left">
              <div className="font-semibold mb-2">Booking Details:</div>
              <div className="space-y-1 text-sm">
                <div>Booking ID: <span className="font-mono">TRP{Date.now().toString().slice(-6)}</span></div>
                <div>Route: {route.name}</div>
                <div>Passenger: {passengerDetails.name}</div>
                <div>Departure: {selectedSchedule?.departureTime}</div>
                <div>Seats: {passengerDetails.seatCount}</div>
                <div className="font-semibold">Total: AED {(route.price * passengerDetails.seatCount).toFixed(2)}</div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              A confirmation SMS and email have been sent to your registered details.
            </p>

            <Button onClick={resetAndClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
