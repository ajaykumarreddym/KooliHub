import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Car, CheckCircle, ChevronRight, Clock, Plus, Star, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface VehiclePhoto {
  url: string;
  is_primary?: boolean;
}

interface Vehicle {
  id: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  seating_capacity: number;
  registration_number: string;
  is_verified: boolean;
  is_active: boolean;
  is_default: boolean;
  verification_status: string | null;
  images: VehiclePhoto[] | null;
  created_at: string;
}

export default function VehicleManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (user?.id) {
    fetchVehicles();
    }
  }, [user?.id]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("driver_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (vehicle: Vehicle) => {
    const status = vehicle.verification_status || (vehicle.is_verified ? "verified" : "pending");
    
    switch (status) {
      case "verified":
        return (
          <div className="flex h-7 sm:h-8 shrink-0 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-green-500/10 px-2 sm:px-3">
            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
            <p className="text-xs sm:text-sm font-medium leading-normal text-green-700 dark:text-green-300">Verified</p>
          </div>
        );
      case "pending":
        return (
          <div className="flex h-7 sm:h-8 shrink-0 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-orange-500/10 px-2 sm:px-3">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-600 dark:text-orange-400" />
            <p className="text-xs sm:text-sm font-medium leading-normal text-orange-700 dark:text-orange-300">Pending</p>
          </div>
        );
      case "rejected":
        return (
          <div className="flex h-7 sm:h-8 shrink-0 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-red-500/10 px-2 sm:px-3">
            <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />
            <p className="text-xs sm:text-sm font-medium leading-normal text-red-700 dark:text-red-300">Rejected</p>
          </div>
        );
      default:
        return null;
    }
  };

  const getVehicleImages = (vehicle: Vehicle): string[] => {
    if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
      return vehicle.images.map(img => typeof img === 'string' ? img : img.url);
    }
    return [];
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
          <div className="max-w-lg mx-auto lg:max-w-4xl xl:max-w-5xl">
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden text-stone-800 dark:text-stone-200 bg-[#f6f7f8] dark:bg-[#101922] font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <header className="flex items-center justify-between bg-white dark:bg-[#101922] px-4 py-3 sm:py-4 sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800">
          <button
              onClick={() => navigate(-1)}
            className="flex size-9 sm:size-10 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Go back"
            >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-stone-800 dark:text-stone-200" />
          </button>
          <h2 className="flex-1 text-center text-base sm:text-lg font-bold leading-tight tracking-[-0.015em] text-stone-900 dark:text-white">
            My Vehicles
          </h2>
          <div className="size-9 sm:size-10" />
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 pb-28 max-w-lg mx-auto lg:max-w-4xl xl:max-w-5xl w-full">
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div className="p-5 sm:p-6 bg-stone-100 dark:bg-stone-800 rounded-full mb-5 sm:mb-6">
                <Car className="h-12 w-12 sm:h-16 sm:w-16 text-stone-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white mb-2">
                No Vehicles Yet
              </h3>
              <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 mb-6 sm:mb-8 max-w-xs">
                Add your first vehicle to start earning as a driver
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {vehicles.map((vehicle) => {
                const images = getVehicleImages(vehicle);
                
                return (
                  <button
                  key={vehicle.id}
                    onClick={() => navigate(`/trip-booking/vehicle/${vehicle.id}`)}
                    className="block cursor-pointer rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 sm:p-4 shadow-sm active:bg-stone-50 dark:active:bg-stone-800/50 hover:shadow-md transition-all text-left w-full"
                >
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex w-full items-start gap-3 sm:gap-4">
                          {/* Image */}
                          <div className="relative w-16 sm:w-20 shrink-0">
                            {images.length > 0 ? (
                              <img
                                alt={`${vehicle.make} ${vehicle.model}`}
                                className="h-14 sm:h-16 w-16 sm:w-20 shrink-0 rounded-lg object-cover"
                                src={images[0]}
                              />
                            ) : (
                              <div className="h-14 sm:h-16 w-16 sm:w-20 shrink-0 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                <Car className="h-6 w-6 sm:h-8 sm:w-8 text-stone-400" />
                              </div>
                            )}
                      </div>

                          {/* Vehicle Info */}
                          <div className="flex flex-1 flex-col justify-center min-w-0">
                            <p className="text-sm sm:text-base font-medium leading-normal text-stone-900 dark:text-white truncate">
                          {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-xs sm:text-sm font-normal leading-normal text-stone-500 dark:text-stone-400 capitalize">
                              {vehicle.color}
                            </p>
                            <p className="text-xs sm:text-sm font-normal leading-normal text-stone-500 dark:text-stone-400">
                              {vehicle.license_plate} • {vehicle.year}
                        </p>
                      </div>
                    </div>

                        {/* Chevron */}
                        <div className="shrink-0 hidden sm:flex">
                          <div className="flex size-6 sm:size-7 items-center justify-center">
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-stone-500 dark:text-stone-400" />
                          </div>
                    </div>
                  </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {vehicle.is_default && (
                          <div className="flex h-7 sm:h-8 shrink-0 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-yellow-400/20 px-2 sm:px-3">
                            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-xs sm:text-sm font-medium leading-normal text-yellow-700 dark:text-yellow-300">Default</p>
                    </div>
                        )}
                        {getVerificationBadge(vehicle)}
                    </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 dark:bg-[#101922]/90 p-3 sm:p-4 backdrop-blur-sm border-t border-stone-200 dark:border-stone-800">
          <div className="max-w-lg mx-auto lg:max-w-4xl xl:max-w-5xl">
            <button
              onClick={() => navigate("/trip-booking/add-vehicle")}
              className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#137fec] text-sm sm:text-base font-bold text-white shadow-lg transition-all duration-200 active:scale-[0.98] hover:bg-[#137fec]/90"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Add New Vehicle</span>
            </button>
                </div>
                </div>
              </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Layout>
  );
}
