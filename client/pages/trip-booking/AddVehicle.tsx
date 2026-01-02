import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, HelpCircle, X, Camera, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const VEHICLE_TYPES = [
  { value: "car", label: "Car" },
  { value: "auto", label: "Auto-rickshaw" },
  { value: "bike", label: "Bike" },
];

const COLORS = ["White", "Black", "Silver", "Blue", "Red", "Gray", "Brown", "Green", "Yellow", "Orange"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

interface VehiclePhoto {
  file?: File;
  preview: string;
  url?: string;
}

export default function AddVehicle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!id);
  const isEditMode = !!id;
  
  // Form state
  const [vehicleType, setVehicleType] = useState<string>("car");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchVehicle();
    }
  }, [id, user]);

  const fetchVehicle = async () => {
    if (!id) return;

    try {
      setPageLoading(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setVehicleType(data.vehicle_type || "car");
        setMake(data.make || "");
        setModel(data.model || "");
        setYear(String(data.year || CURRENT_YEAR));
        setColor(data.color || "");
        setLicensePlate(data.license_plate || "");
        
        if (data.images && Array.isArray(data.images)) {
          setPhotos(data.images.map((img: any) => ({
            preview: typeof img === 'string' ? img : img.url,
            url: typeof img === 'string' ? img : img.url,
          })));
        }
      }
    } catch (error: any) {
      console.error("Error fetching vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicle details",
        variant: "destructive",
      });
      navigate("/trip-booking/vehicles");
    } finally {
      setPageLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (photos.length + files.length > 5) {
      toast({
        title: "Maximum 5 photos allowed",
        description: "Please remove some photos before adding more",
        variant: "destructive",
      });
      return;
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos([...photos, ...newPhotos]);
    
    if (errors.photos) {
      setErrors(prev => ({ ...prev, photos: "" }));
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    if (newPhotos[index].file) {
    URL.revokeObjectURL(newPhotos[index].preview);
    }
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const validateLicensePlate = (plate: string): boolean => {
    const cleanPlate = plate.replace(/[- ]/g, '').toUpperCase();
    return /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/i.test(cleanPlate);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!make.trim()) newErrors.make = "Make is required";
    if (!model.trim()) newErrors.model = "Model is required";
    if (!color) newErrors.color = "Color is required";
    if (!licensePlate.trim()) {
      newErrors.licensePlate = "License plate is required";
    } else if (!validateLicensePlate(licensePlate)) {
      newErrors.licensePlate = "Please enter a valid license plate";
    }
    if (photos.length === 0) {
      newErrors.photos = "At least one photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setLoading(true);

    try {
      // Upload new photos
      const photoUrls: string[] = [];
      
      for (const photo of photos) {
        if (photo.url) {
          // Existing photo
          photoUrls.push(photo.url);
        } else if (photo.file) {
          // New photo to upload
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photo.file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

        const { data: urlData } = supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(uploadData.path);

        photoUrls.push(urlData.publicUrl);
        }
      }

      const seatingCapacity = vehicleType === 'bike' ? 1 : vehicleType === 'auto' ? 3 : 4;

      const vehicleData = {
        driver_id: user.id,
        vehicle_type: vehicleType,
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        color,
        license_plate: licensePlate.toUpperCase().replace(/[- ]/g, ''),
        seating_capacity: seatingCapacity,
        images: photoUrls.map((url, idx) => ({ url, is_primary: idx === 0 })),
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Vehicle updated successfully!",
          description: "Your vehicle details have been updated",
        });
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert({
            ...vehicleData,
            is_verified: false,
            is_active: true,
            verification_status: 'pending',
            is_default: false,
        });

        if (error) throw error;

      toast({
        title: "Vehicle added successfully!",
        description: "Your vehicle is pending verification",
      });
      }

      navigate("/trip-booking/vehicles");
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save vehicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
          <div className="max-w-lg mx-auto lg:max-w-2xl p-4 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden text-stone-800 dark:text-stone-200 bg-[#f6f7f8] dark:bg-[#101922] font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <header className="bg-white dark:bg-[#101922] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <button 
              onClick={() => navigate(-1)}
                className="flex size-10 shrink-0 items-center justify-center text-stone-900 dark:text-white"
                aria-label="Go back"
            >
                <span className="flex items-center justify-center size-10 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
                </span>
              </button>
              <h1 className="text-stone-900 dark:text-white tracking-tight text-lg sm:text-xl font-bold leading-tight absolute left-1/2 transform -translate-x-1/2">
                {isEditMode ? "Edit Vehicle" : "Add Your Vehicle"}
            </h1>
              <button 
                onClick={() => setShowHelpDialog(true)}
                className="flex size-10 items-center justify-center text-stone-500 dark:text-stone-400"
                aria-label="Help"
              >
                <span className="flex items-center justify-center size-10 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">
                  <HelpCircle className="h-5 w-5" />
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Form */}
        <main className="flex-grow flex flex-col p-4 gap-5 sm:gap-6 max-w-3xl mx-auto w-full pb-28">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
            {/* Heading */}
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              Vehicle Details
            </h2>

            {/* Vehicle Type */}
            <div>
              <label className="text-sm sm:text-base font-medium text-stone-900 dark:text-white mb-2 sm:mb-3 block">
                Vehicle Type
              </label>
              <div className="flex gap-2 sm:gap-3">
                {VEHICLE_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVehicleType(value)}
                    className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all border-2 ${
                      vehicleType === value
                        ? "border-[#137fec] bg-[#137fec]/10 text-[#137fec]"
                        : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Make & Model - responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Make */}
            <div>
                <label htmlFor="make" className="text-sm sm:text-base font-medium text-stone-900 dark:text-white mb-2 block">
                  Make
                </label>
                <input
                id="make"
                  type="text"
                placeholder="e.g., Toyota"
                value={make}
                  onChange={(e) => {
                    setMake(e.target.value);
                    if (errors.make) setErrors(prev => ({ ...prev, make: "" }));
                  }}
                  className={`w-full h-12 sm:h-14 px-4 rounded-xl border-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent transition-all text-sm sm:text-base ${
                    errors.make ? "border-red-500" : "border-stone-200 dark:border-stone-700"
                  }`}
              />
                {errors.make && <p className="text-red-500 text-xs sm:text-sm mt-1.5">{errors.make}</p>}
            </div>

            {/* Model */}
            <div>
                <label htmlFor="model" className="text-sm sm:text-base font-medium text-stone-900 dark:text-white mb-2 block">
                  Model
                </label>
                <input
                id="model"
                  type="text"
                placeholder="e.g., Camry"
                value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    if (errors.model) setErrors(prev => ({ ...prev, model: "" }));
                  }}
                  className={`w-full h-12 sm:h-14 px-4 rounded-xl border-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent transition-all text-sm sm:text-base ${
                    errors.model ? "border-red-500" : "border-stone-200 dark:border-stone-700"
                  }`}
              />
                {errors.model && <p className="text-red-500 text-xs sm:text-sm mt-1.5">{errors.model}</p>}
              </div>
            </div>

            {/* Year & Color */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="year" className="text-sm sm:text-base font-medium text-stone-900 dark:text-white mb-2 block">
                  Year
                </label>
                <div className="relative">
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-12 sm:h-14 px-3 sm:px-4 pr-8 sm:pr-10 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent appearance-none cursor-pointer text-sm sm:text-base"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="color" className="text-sm sm:text-base font-medium text-stone-900 dark:text-white mb-2 block">
                  Color
                </label>
                <div className="relative">
                  <select
                    id="color"
                    value={color}
                    onChange={(e) => {
                      setColor(e.target.value);
                      if (errors.color) setErrors(prev => ({ ...prev, color: "" }));
                    }}
                    className={`w-full h-12 sm:h-14 px-3 sm:px-4 pr-8 sm:pr-10 rounded-xl border-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent appearance-none cursor-pointer text-sm sm:text-base ${
                      errors.color ? "border-red-500" : "border-stone-200 dark:border-stone-700"
                    }`}
                  >
                    <option value="">Select</option>
                    {COLORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.color && <p className="text-red-500 text-xs sm:text-sm mt-1.5">{errors.color}</p>}
              </div>
            </div>

            {/* License Plate */}
            <div>
              <label htmlFor="licensePlate" className="text-sm sm:text-base font-medium text-stone-900 dark:text-white mb-2 block">
                License Plate Number
              </label>
              <input
                id="licensePlate"
                type="text"
                placeholder="e.g., MH12AB1234"
                value={licensePlate}
                onChange={(e) => {
                  setLicensePlate(e.target.value.toUpperCase());
                  if (errors.licensePlate) setErrors(prev => ({ ...prev, licensePlate: "" }));
                }}
                className={`w-full h-12 sm:h-14 px-4 rounded-xl border-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent transition-all uppercase text-sm sm:text-base ${
                  errors.licensePlate ? "border-red-500" : "border-stone-200 dark:border-stone-700"
                }`}
              />
              {errors.licensePlate && (
                <p className="text-red-500 text-xs sm:text-sm mt-1.5">{errors.licensePlate}</p>
              )}
            </div>

            {/* Vehicle Photos */}
            <div>
              <label className="text-sm sm:text-base font-medium text-stone-900 dark:text-white mb-1 block">
                Vehicle Photos
              </label>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-3 sm:mb-4">
                Add at least one photo of your vehicle's exterior.
              </p>
              
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-16 h-16 sm:w-20 sm:h-20">
                    <img
                      src={photo.preview}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      aria-label="Remove photo"
                      className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 p-1 sm:p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </button>
                  </div>
                ))}

                {photos.length < 5 && (
                  <label className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg sm:rounded-xl cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-stone-400" />
                    <span className="text-[10px] sm:text-xs font-medium text-stone-500 mt-0.5 sm:mt-1">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      multiple
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {errors.photos && <p className="text-red-500 text-xs sm:text-sm mt-2">{errors.photos}</p>}
            </div>
          </form>
        </main>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#101922]/90 backdrop-blur-sm p-3 sm:p-4 z-10 border-t border-stone-200 dark:border-stone-800">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center justify-center w-full rounded-xl h-12 sm:h-14 px-5 bg-[#137fec] text-white text-sm sm:text-base font-bold shadow-lg hover:bg-[#137fec]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditMode ? "Update Vehicle" : "Save Vehicle"
              )}
            </button>
          </div>
        </div>

        {/* Help Dialog */}
        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#137fec]" />
                How to Add Your Vehicle
              </DialogTitle>
              <DialogDescription>
                Follow these steps to register your vehicle for trips.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#137fec]/10 text-[#137fec] text-xs font-bold shrink-0">1</span>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-white">Select Vehicle Type</p>
                    <p>Choose whether your vehicle is a Car, Auto-rickshaw, or Bike.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#137fec]/10 text-[#137fec] text-xs font-bold shrink-0">2</span>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-white">Enter Vehicle Details</p>
                    <p>Provide accurate make, model, year, color, and license plate number.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#137fec]/10 text-[#137fec] text-xs font-bold shrink-0">3</span>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-white">Upload Photos</p>
                    <p>Add clear photos of your vehicle exterior. At least one photo is required.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#137fec]/10 text-[#137fec] text-xs font-bold shrink-0">4</span>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-white">Verification</p>
                    <p>After submission, your vehicle will be verified by our team within 24-48 hours.</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-xs text-stone-500 dark:text-stone-500">
                  Need more help? Contact support at support@koolihub.com
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
