import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit3, Map } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface GeoFence {
  type: "polygon" | "circle";
  coordinates: [number, number][];
  center?: [number, number];
  radius?: number; // in meters
  name?: string;
}

interface MapPickerProps {
  onGeofenceChange: (geofence: GeoFence | null) => void;
  initialGeofence?: GeoFence | null;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Map click handler component - wrapped with error boundary
function MapClickHandler({
  isDrawing,
  drawMode,
  onPolygonClick,
  onCircleCenter,
}: {
  isDrawing: boolean;
  drawMode: "polygon" | "circle";
  onPolygonClick: (latlng: L.LatLng) => void;
  onCircleCenter: (latlng: L.LatLng) => void;
}) {
  try {
    useMapEvents({
      click: (e) => {
        if (!isDrawing) return;

        if (drawMode === "polygon") {
          onPolygonClick(e.latlng);
        } else if (drawMode === "circle") {
          onCircleCenter(e.latlng);
        }
      },
    });
  } catch (error) {
    console.warn("MapEvents hook error:", error);
  }

  return null;
}

// Safe polygon component wrapper
function SafePolygon({
  positions,
  pathOptions,
}: {
  positions: [number, number][];
  pathOptions: any;
}) {
  try {
    return <Polygon positions={positions} pathOptions={pathOptions} />;
  } catch (error) {
    console.warn("Polygon render error:", error);
    return null;
  }
}

// Safe circle component wrapper
function SafeCircle({
  center,
  radius,
  pathOptions,
}: {
  center: [number, number];
  radius: number;
  pathOptions: any;
}) {
  try {
    return <Circle center={center} radius={radius} pathOptions={pathOptions} />;
  } catch (error) {
    console.warn("Circle render error:", error);
    return null;
  }
}

export const MapPicker: React.FC<MapPickerProps> = ({
  onGeofenceChange,
  initialGeofence,
  center = [28.6139, 77.209], // Default to Delhi
  zoom = 10,
  className = "h-96 w-full",
}) => {
  const [geofence, setGeofence] = useState<GeoFence | null>(
    initialGeofence || null,
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<"polygon" | "circle">("polygon");
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(
    null,
  );
  const [circleRadius, setCircleRadius] = useState<number>(1000); // 1km default
  const [isEditing, setIsEditing] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (initialGeofence) {
      setGeofence(initialGeofence);
      if (initialGeofence.type === "polygon") {
        setPolygonPoints(initialGeofence.coordinates);
      } else if (initialGeofence.type === "circle" && initialGeofence.center) {
        setCircleCenter(initialGeofence.center);
        setCircleRadius(initialGeofence.radius || 1000);
      }
    }
  }, [initialGeofence]);

  const handleStartDrawing = (mode: "polygon" | "circle") => {
    setDrawMode(mode);
    setIsDrawing(true);
    setPolygonPoints([]);
    setCircleCenter(null);
    setIsEditing(false);
    setMapError(null);
  };

  const handlePolygonClick = (latlng: L.LatLng) => {
    const newPoint: [number, number] = [latlng.lat, latlng.lng];
    setPolygonPoints((prev) => [...prev, newPoint]);
  };

  const handleCircleCenter = (latlng: L.LatLng) => {
    const newCenter: [number, number] = [latlng.lat, latlng.lng];
    setCircleCenter(newCenter);
    setIsDrawing(false);
  };

  const finishPolygon = () => {
    if (polygonPoints.length >= 3) {
      const newGeofence: GeoFence = {
        type: "polygon",
        coordinates: polygonPoints,
      };
      setGeofence(newGeofence);
      onGeofenceChange(newGeofence);
      setIsDrawing(false);
    }
  };

  const finishCircle = () => {
    if (circleCenter) {
      const newGeofence: GeoFence = {
        type: "circle",
        coordinates: [],
        center: circleCenter,
        radius: circleRadius,
      };
      setGeofence(newGeofence);
      onGeofenceChange(newGeofence);
    }
  };

  const clearGeofence = () => {
    setGeofence(null);
    setPolygonPoints([]);
    setCircleCenter(null);
    setIsDrawing(false);
    onGeofenceChange(null);
  };

  const editGeofence = () => {
    setIsEditing(true);
    if (geofence?.type === "polygon") {
      setPolygonPoints(geofence.coordinates);
      setDrawMode("polygon");
    } else if (geofence?.type === "circle" && geofence.center) {
      setCircleCenter(geofence.center);
      setCircleRadius(geofence.radius || 1000);
      setDrawMode("circle");
    }
  };

  // Fallback UI if map fails to load
  if (mapError) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5" />
              Map Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">Map failed to load: {mapError}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Map Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5" />
              Geo-Fencing
            </CardTitle>
            <CardDescription>
              Define service coverage area on the map using polygon or circle
              shapes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {!isDrawing && !geofence && (
                <>
                  <Button
                    onClick={() => handleStartDrawing("polygon")}
                    variant="outline"
                    size="sm"
                  >
                    Draw Polygon
                  </Button>
                  <Button
                    onClick={() => handleStartDrawing("circle")}
                    variant="outline"
                    size="sm"
                  >
                    Draw Circle
                  </Button>
                </>
              )}

              {isDrawing && drawMode === "polygon" && (
                <div className="flex gap-2">
                  <Button
                    onClick={finishPolygon}
                    disabled={polygonPoints.length < 3}
                    size="sm"
                  >
                    Finish Polygon ({polygonPoints.length} points)
                  </Button>
                  <Button
                    onClick={() => setIsDrawing(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {drawMode === "circle" && circleCenter && !geofence && (
                <div className="flex gap-2 items-center">
                  <Label htmlFor="radius">Radius (m):</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={circleRadius}
                    onChange={(e) => setCircleRadius(Number(e.target.value))}
                    className="w-24"
                    min="100"
                    max="50000"
                  />
                  <Button onClick={finishCircle} size="sm">
                    Create Circle
                  </Button>
                  <Button
                    onClick={() => {
                      setCircleCenter(null);
                      setIsDrawing(false);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {geofence && !isEditing && (
                <div className="flex gap-2">
                  <Button onClick={editGeofence} variant="outline" size="sm">
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button onClick={clearGeofence} variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {isDrawing && drawMode === "polygon" && (
              <p className="text-sm text-gray-600">
                Click on the map to add points to your polygon. You need at
                least 3 points.
              </p>
            )}

            {isDrawing && drawMode === "circle" && !circleCenter && (
              <p className="text-sm text-gray-600">
                Click on the map to set the center of your circle.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Map Container */}
        <div className="h-96 w-full rounded-lg border overflow-hidden">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            key={`map-${center[0]}-${center[1]}`} // Force remount on center change
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler
              isDrawing={isDrawing}
              drawMode={drawMode}
              onPolygonClick={handlePolygonClick}
              onCircleCenter={handleCircleCenter}
            />

            {/* Show current geofence */}
            {geofence?.type === "polygon" &&
              geofence.coordinates.length >= 3 && (
                <SafePolygon
                  positions={geofence.coordinates}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                />
              )}

            {geofence?.type === "circle" &&
              geofence.center &&
              geofence.radius && (
                <SafeCircle
                  center={geofence.center}
                  radius={geofence.radius}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                />
              )}

            {/* Show polygon being drawn */}
            {isDrawing &&
              drawMode === "polygon" &&
              polygonPoints.length >= 3 && (
                <SafePolygon
                  positions={polygonPoints}
                  pathOptions={{
                    color: "#f59e0b",
                    fillColor: "#f59e0b",
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                />
              )}

            {/* Show circle being configured */}
            {circleCenter && !geofence && (
              <SafeCircle
                center={circleCenter}
                radius={circleRadius}
                pathOptions={{
                  color: "#f59e0b",
                  fillColor: "#f59e0b",
                  fillOpacity: 0.2,
                  weight: 2,
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Geofence Info */}
        {geofence && (
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Type:</strong> {geofence.type}
                </p>
                {geofence.type === "polygon" && (
                  <p>
                    <strong>Points:</strong> {geofence.coordinates.length}
                  </p>
                )}
                {geofence.type === "circle" && (
                  <>
                    <p>
                      <strong>Center:</strong> {geofence.center?.[0].toFixed(6)}
                      , {geofence.center?.[1].toFixed(6)}
                    </p>
                    <p>
                      <strong>Radius:</strong> {geofence.radius} meters
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
