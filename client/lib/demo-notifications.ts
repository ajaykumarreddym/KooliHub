import { notificationService } from "./notification-service";

export const createDemoNotifications = () => {
  // Welcome notification
  notificationService.showNotification({
    title: "Welcome to KooliHub! 🎉",
    body: "Discover amazing local services and products. Get 20% off on your first order!",
    type: "promotion",
    data: { promoCode: "WELCOME20" },
  });

  // Order notification (simulated)
  setTimeout(() => {
    notificationService.showOrderNotification(
      "KH123456",
      "Confirmed",
      "Your grocery order has been confirmed and is being prepared.",
    );
  }, 2000);

  // Delivery notification
  setTimeout(() => {
    notificationService.showDeliveryNotification("KH123456", "25-30 minutes");
  }, 5000);

  // Promotion notification
  setTimeout(() => {
    notificationService.showPromotionNotification(
      "Flash Sale! 🔥",
      "Up to 60% off on Electronics. Limited time offer ending soon!",
      "FLASH60",
    );
  }, 8000);

  // Payment success notification
  setTimeout(() => {
    notificationService.showPaymentNotification("KH123456", 299.5, "success");
  }, 12000);

  // Location-based offer
  setTimeout(() => {
    notificationService.showNotification({
      title: "Local Offer Available! 📍",
      body: "Special handyman services discount in your area. Book now and save 25%!",
      type: "info",
      data: { serviceType: "handyman", discount: 25 },
    });
  }, 15000);

  // Service reminder
  setTimeout(() => {
    notificationService.showNotification({
      title: "Car Rental Reminder 🚗",
      body: "Your car rental booking is due tomorrow at 10:00 AM. Please arrive 15 minutes early.",
      type: "warning",
      data: { serviceType: "car-rental", bookingTime: "2024-01-16T10:00:00Z" },
      requireInteraction: true,
    });
  }, 18000);
};

export const createOrderUpdateNotifications = (orderId: string) => {
  const updates = [
    { status: "Order Placed", delay: 0 },
    { status: "Payment Confirmed", delay: 2000 },
    { status: "Preparing", delay: 5000 },
    { status: "Out for Delivery", delay: 15000 },
    { status: "Delivered", delay: 25000 },
  ];

  updates.forEach(({ status, delay }) => {
    setTimeout(() => {
      notificationService.showOrderNotification(
        orderId,
        status,
        `Your order status has been updated to: ${status}`,
      );
    }, delay);
  });
};

export const createLocationBasedNotifications = (city: string) => {
  const notifications = [
    {
      title: `Welcome to ${city}! 🌟`,
      body: `Discover the best local services and products in ${city}. Special offers available for new customers!`,
      type: "info" as const,
      delay: 1000,
    },
    {
      title: "Local Grocery Stores Available 🛒",
      body: `Fresh groceries from trusted local stores in ${city}. Free delivery on orders above ₹299!`,
      type: "promotion" as const,
      delay: 3000,
    },
    {
      title: "Reliable Handyman Services 🔧",
      body: `Need repairs or maintenance? Book verified handyman services in ${city}. Available 24/7!`,
      type: "info" as const,
      delay: 6000,
    },
  ];

  notifications.forEach(({ title, body, type, delay }) => {
    setTimeout(() => {
      notificationService.showNotification({
        title,
        body,
        type,
        data: { city },
      });
    }, delay);
  });
};

export const createServiceBookingNotifications = (
  serviceType: string,
  bookingId: string,
) => {
  const serviceEmojis: { [key: string]: string } = {
    grocery: "🛒",
    trips: "🚌",
    "car-rental": "🚗",
    handyman: "🔧",
    electronics: "📱",
  };

  const emoji = serviceEmojis[serviceType] || "📦";

  notificationService.showNotification({
    title: `${emoji} Booking Confirmed!`,
    body: `Your ${serviceType} service booking (ID: ${bookingId}) has been confirmed. You'll receive updates soon!`,
    type: "success",
    data: { serviceType, bookingId },
    requireInteraction: true,
  });
};

export const createDailyOfferNotifications = () => {
  const dailyOffers = [
    {
      title: "Daily Deal: Electronics 📱",
      body: "Get up to 40% off on smartphones and accessories. Limited stock available!",
      promoCode: "DAILY40",
    },
    {
      title: "Grocery Special 🥬",
      body: "Fresh vegetables and fruits at unbeatable prices. Free delivery today only!",
      promoCode: "FRESH20",
    },
    {
      title: "Travel Tuesday 🚌",
      body: "Book your trip now and get 30% off on all bus bookings. Valid for today only!",
      promoCode: "TRAVEL30",
    },
  ];

  // Pick a random offer
  const offer = dailyOffers[Math.floor(Math.random() * dailyOffers.length)];

  notificationService.showPromotionNotification(
    offer.title,
    offer.body,
    offer.promoCode,
  );
};

// Initialize demo notifications when user first visits
export const initializeDemoNotifications = () => {
  // Check if demo notifications have been shown before
  const hasSeenDemo = localStorage.getItem("koolihub_demo_notifications_shown");

  if (!hasSeenDemo) {
    // Mark as shown
    localStorage.setItem("koolihub_demo_notifications_shown", "true");

    // Create demo notifications
    setTimeout(() => {
      createDemoNotifications();
    }, 3000); // Wait 3 seconds after page load
  } else {
    // Show daily offer for returning users
    setTimeout(() => {
      createDailyOfferNotifications();
    }, 5000);
  }
};

export default {
  createDemoNotifications,
  createOrderUpdateNotifications,
  createLocationBasedNotifications,
  createServiceBookingNotifications,
  createDailyOfferNotifications,
  initializeDemoNotifications,
};
