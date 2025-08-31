// Firebase Messaging Service Worker
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA-peDNnwnXIU7g5nPBXhi-GUebTKhUUWQ",
  authDomain: "koolihub.firebaseapp.com",
  projectId: "koolihub",
  storageBucket: "koolihub.firebasestorage.app",
  messagingSenderId: "609901106592",
  appId: "1:609901106592:web:856d26499d09a86ad7c0c5",
  measurementId: "G-LPPGJ45CCC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification?.title || "KooliHub";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: payload.notification?.icon || "/icon-192x192.png",
    badge: "/icon-72x72.png",
    tag: payload.data?.tag || "default",
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "view") {
    // Open the app or navigate to specific page
    const urlToOpen = event.notification.data?.url || "/";

    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then(function (clientList) {
          // Check if app is already open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (
              client.url.includes(self.location.origin) &&
              "focus" in client
            ) {
              return client.focus();
            }
          }

          // Open new window/tab
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        }),
    );
  }
});

// Handle message from main thread
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(event.data.title, event.data.options);
  }
});
