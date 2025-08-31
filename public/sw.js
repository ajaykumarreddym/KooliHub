// Service Worker for KooliHub - Handles notifications and offline functionality

const CACHE_NAME = "koolihub-v1";
const OFFLINE_URL = "/offline.html";

// Install event - cache essential files
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker caching essential files");
        return cache.addAll([
          "/",
          "/offline.html",
          "/icon-192x192.png",
          "/icon-512x512.png",
        ]);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        );
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome-extension requests
  if (event.request.url.includes("chrome-extension")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If the request fails and it's a navigation request, serve offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          throw new Error("Network request failed and no cache available");
        });
    }),
  );
});

// Push event - handle push notifications
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let notificationData = {
    title: "KooliHub",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error("Error parsing push data:", error);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icon-view.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    tag: notificationData.tag || "koolihub-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options),
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (action === "dismiss") {
    return;
  }

  // Default action or 'view' action
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }

        // Open a new window
        if (clients.openWindow) {
          let targetUrl = "/";

          // Navigate to specific pages based on notification data
          if (data.orderId) {
            targetUrl = `/orders/${data.orderId}`;
          } else if (data.serviceType) {
            targetUrl = `/${data.serviceType}`;
          } else if (data.url) {
            targetUrl = data.url;
          }

          return clients.openWindow(targetUrl);
        }
      }),
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Background sync:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any pending offline actions
  try {
    // Get pending actions from IndexedDB or cache
    const pendingActions = await getPendingActions();

    for (const action of pendingActions) {
      try {
        await processAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.error("Failed to process pending action:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

async function getPendingActions() {
  // Implement IndexedDB logic to get pending actions
  return [];
}

async function processAction(action) {
  // Process the pending action (API call, etc.)
  console.log("Processing action:", action);
}

async function removePendingAction(actionId) {
  // Remove the action from IndexedDB
  console.log("Removing pending action:", actionId);
}

// Message handling from main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case "SKIP_WAITING":
        self.skipWaiting();
        break;

      case "GET_VERSION":
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;

      case "CLEAR_CACHE":
        caches
          .delete(CACHE_NAME)
          .then(() => event.ports[0].postMessage({ success: true }))
          .catch((error) =>
            event.ports[0].postMessage({ success: false, error }),
          );
        break;

      default:
        console.log("Unknown message type:", event.data.type);
    }
  }
});

console.log("KooliHub Service Worker loaded");
