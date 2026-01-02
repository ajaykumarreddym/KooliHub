import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, ChevronRight, Star, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleRepository } from "@/infrastructure/repositories/SupabaseVehicleRepository";
import { Vehicle } from "@/domain/entities/Vehicle";
import { toast } from "@/hooks/use-toast";

export default function MyVehicles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await vehicleRepository.getUserVehicles(user.id);
      setVehicles(data);
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: any; label: string; className: string }> = {
      verified: {
        icon: CheckCircle2,
        label: "Verified",
        className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
      },
      pending: {
        icon: Clock,
        label: "Pending",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
      },
      rejected: {
        icon: XCircle,
        label: "Rejected",
        className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      },
    };

    const { icon: Icon, label, className } = config[status] || config.pending;

    return (
      <Badge className={`flex items-center gap-1 ${className}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 text-center">
              My Vehicles
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Vehicle List */}
        <main className="max-w-2xl mx-auto p-4 pb-24 space-y-4">
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                <Plus className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No vehicles yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                Add your vehicle to start offering rides and earning money
              </p>
              <Button
                onClick={() => navigate("/trip-booking/add-vehicle")}
                className="bg-[#137fec] hover:bg-[#137fec]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const primaryPhoto = vehicle.photos.find((p) => p.isPrimary) || vehicle.photos[0];

              return (
                <button
                  key={vehicle.id}
                  onClick={() => navigate(`/trip-booking/vehicle/${vehicle.id}`)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Photo Carousel */}
                    <div className="relative w-20 shrink-0">
                      {primaryPhoto ? (
                        <img
                          src={primaryPhoto.photoUrl}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-20 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{vehicle.vehicleType === 'car' ? '🚗' : vehicle.vehicleType === 'bike' ? '🏍️' : '🛺'}</span>
                        </div>
                      )}
                      {vehicle.photos.length > 1 && (
                        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1.5">
                          {vehicle.photos.slice(0, 3).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 w-1.5 rounded-full ${
                                idx === 0 ? "bg-white" : "bg-white/40"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.color}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.licensePlate} • {vehicle.year}
                      </p>
                    </div>

                    {/* Chevron */}
                    <div className="shrink-0 flex items-center">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    {vehicle.isDefault && (
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    {getStatusBadge(vehicle.verificationStatus)}
                  </div>
                </button>
              );
            })
          )}
        </main>

        {/* Bottom Action Bar */}
        {vehicles.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4 z-10">
            <div className="max-w-2xl mx-auto">
              <Button
                onClick={() => navigate("/trip-booking/add-vehicle")}
                className="w-full h-12 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Vehicle
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

