import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

// Fix for default marker icons in Leaflet with webpack
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RouteMapProps {
  origin: { lat: number; lon: number; name: string };
  destination: { lat: number; lon: number; name: string };
  route?: Array<[number, number]>; // Array of [lat, lon] coordinates
  height?: string;
  showRoute?: boolean;
  className?: string;
  singleLocation?: boolean; // New prop to indicate single location display
  interactive?: boolean; // Enable full interactivity (dragging, zooming)
}

export function RouteMap({
  origin,
  destination,
  route,
  height = "300px",
  showRoute = true,
  className = "",
  singleLocation = false,
  interactive = true,
}: RouteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        // Enable ALL interactions for desktop and mobile
        scrollWheelZoom: interactive,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        // Smooth interactions
        inertia: true,
        inertiaDeceleration: 3000,
      });

      // Force enable handlers after creation
      if (interactive) {
        mapRef.current.dragging.enable();
        mapRef.current.touchZoom.enable();
        mapRef.current.scrollWheelZoom.enable();
        mapRef.current.doubleClickZoom.enable();
      }

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing markers and polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Check if showing a single location (origin and destination are the same)
    const isSameLocation = origin.lat === destination.lat && origin.lon === destination.lon;

    // SVG Pin marker generator - creates a proper map pin icon
    const createPinSvg = (color: string) => `
      <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
        <path d="M16 0C7.164 0 0 7.164 0 16C0 28 16 44 16 44C16 44 32 28 32 16C32 7.164 24.836 0 16 0Z" fill="${color}" filter="url(#shadow)"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
        <circle cx="16" cy="16" r="5" fill="${color}"/>
      </svg>
    `;

    if (singleLocation || isSameLocation) {
      // Show single location with prominent pin marker
      const pinColor = "#10b981"; // Green for pickup
      const locationIcon = L.divIcon({
        html: createPinSvg(pinColor),
        className: "custom-pin-marker",
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
      });

      L.marker([origin.lat, origin.lon], { icon: locationIcon })
        .addTo(map)
        .bindPopup(`<b>${origin.name}</b>`)
        .openPopup();

      // Center on the single location with appropriate zoom
      map.setView([origin.lat, origin.lon], 15);
    } else {
      // Add origin marker (green pin)
      const originIcon = L.divIcon({
        html: createPinSvg("#10b981"),
        className: "custom-pin-marker",
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
      });

      L.marker([origin.lat, origin.lon], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>From:</b> ${origin.name}`);

      // Add destination marker (blue pin)
      const destIcon = L.divIcon({
        html: createPinSvg("#137fec"),
        className: "custom-pin-marker",
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
      });

      L.marker([destination.lat, destination.lon], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>To:</b> ${destination.name}`);

      // Draw route if provided, otherwise draw straight line
      if (showRoute) {
        const routeCoords = route || [[origin.lat, origin.lon], [destination.lat, destination.lon]];
        
        L.polyline(routeCoords, {
          color: "#137fec",
          weight: 4,
          opacity: 0.7,
          smoothFactor: 1,
        }).addTo(map);
      }

      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [origin.lat, origin.lon],
        [destination.lat, destination.lon]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [origin, destination, route, showRoute]);

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0 ${className}`}
      style={{ height, width: "100%" }}
    />
  );
}

