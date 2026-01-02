import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  MoreHorizontal,
  CheckCircle,
  FileText,
  ChevronRight,
  Edit,
  Trash2,
  Star,
  Car,
  Clock,
  XCircle,
  Upload,
  Eye,
  Loader2,
  Calendar,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface VehiclePhoto {
  url: string;
  is_primary?: boolean;
}

interface Vehicle {
  id: string;
  driver_id: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  seating_capacity: number;
  registration_number: string;
  insurance_number: string | null;
  insurance_expiry: string | null;
  is_verified: boolean;
  is_active: boolean;
  is_default: boolean;
  verification_status: string | null;
  images: VehiclePhoto[] | null;
  documents: any | null;
  created_at: string;
}

interface DocumentUpload {
  type: 'registration' | 'insurance';
  file?: File;
  expiryDate?: string;
  uploading: boolean;
}

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Document management state
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'registration' | 'insurance' | null>(null);
  const [documentUpload, setDocumentUpload] = useState<DocumentUpload | null>(null);
  const [viewDocumentUrl, setViewDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setVehicle(data);
    } catch (error: any) {
      console.error("Error fetching vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicle details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (!vehicle || !user) return;

    try {
      await supabase
        .from("vehicles")
        .update({ is_default: false })
        .eq("driver_id", user.id);

      await supabase
        .from("vehicles")
        .update({ is_default: true })
        .eq("id", vehicle.id);

      toast({ title: "Vehicle set as default" });
      fetchVehicle();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set as default",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;

    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await supabase
        .from("vehicles")
        .update({ is_active: false })
        .eq("id", vehicle.id);

      toast({ title: "Vehicle deleted" });
      navigate("/trip-booking/vehicles");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vehicle",
        variant: "destructive",
      });
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const width = carouselRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setCurrentImageIndex(index);
    }
  };

  const getVehicleImages = (): string[] => {
    if (vehicle?.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
      return vehicle.images.map(img => typeof img === 'string' ? img : img.url);
    }
    return [];
  };

  const getVerificationBadge = () => {
    if (!vehicle) return null;
    
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });
  };

  const handleOpenDocumentDialog = (type: 'registration' | 'insurance') => {
    setSelectedDocType(type);
    setDocumentUpload({
      type,
      uploading: false,
      expiryDate: type === 'insurance' && vehicle?.insurance_expiry 
        ? vehicle.insurance_expiry.split('T')[0] 
        : ''
    });
    setDocumentDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && documentUpload) {
      setDocumentUpload({ ...documentUpload, file });
    }
  };

  const handleUploadDocument = async () => {
    if (!documentUpload?.file || !vehicle || !user || !selectedDocType) return;

    setDocumentUpload({ ...documentUpload, uploading: true });

    try {
      // Upload file to Supabase Storage
      const fileExt = documentUpload.file.name.split('.').pop();
      const fileName = `${user.id}/${vehicle.id}/${selectedDocType}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(fileName, documentUpload.file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(uploadData.path);

      // Update vehicle record
      const updateData: any = {
        documents: {
          ...vehicle.documents,
          [selectedDocType]: {
            url: urlData.publicUrl,
            uploaded_at: new Date().toISOString(),
            file_name: documentUpload.file.name
          }
        }
      };

      if (selectedDocType === 'insurance' && documentUpload.expiryDate) {
        updateData.insurance_expiry = documentUpload.expiryDate;
      }

      const { error: updateError } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicle.id);

      if (updateError) throw updateError;

      toast({ 
        title: "Document uploaded!",
        description: `Your ${selectedDocType} document has been uploaded successfully.`
      });
      
      setDocumentDialogOpen(false);
      fetchVehicle();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      if (documentUpload) {
        setDocumentUpload({ ...documentUpload, uploading: false });
      }
    }
  };

  const handleViewDocument = (type: 'registration' | 'insurance') => {
    const docUrl = vehicle?.documents?.[type]?.url;
    if (docUrl) {
      window.open(docUrl, '_blank');
    } else {
      toast({
        title: "No document",
        description: `No ${type} document has been uploaded yet.`,
        variant: "destructive"
      });
    }
  };

  const hasDocument = (type: 'registration' | 'insurance') => {
    return !!vehicle?.documents?.[type]?.url;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
          <div className="max-w-lg mx-auto lg:max-w-4xl xl:max-w-5xl p-4 space-y-4">
            <Skeleton className="h-56 sm:h-72 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!vehicle) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 text-center max-w-md w-full">
            <Car className="h-12 w-12 sm:h-16 sm:w-16 text-stone-400 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white mb-2">
              Vehicle Not Found
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              The vehicle you're looking for doesn't exist or has been removed.
            </p>
            <button 
              onClick={() => navigate(-1)} 
              className="mt-2 px-6 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const images = getVehicleImages();
  const isOwner = user?.id === vehicle.driver_id;

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden text-stone-800 dark:text-stone-200 bg-[#f6f7f8] dark:bg-[#101922] font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <header className="flex items-center justify-between bg-white dark:bg-[#101922] px-4 py-3 sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800">
          <button
            onClick={() => navigate(-1)}
            className="flex size-9 sm:size-10 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-stone-800 dark:text-stone-200" />
          </button>
          <h2 className="flex-1 text-center text-base sm:text-lg font-bold leading-tight tracking-[-0.015em] text-stone-900 dark:text-white truncate px-2">
            {vehicle.make} {vehicle.model}
          </h2>
          {isOwner ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex size-9 sm:size-10 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-5 w-5 sm:h-6 sm:w-6 text-stone-800 dark:text-stone-200" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(`/trip-booking/vehicle/${id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Vehicle
                </DropdownMenuItem>
                {!vehicle.is_default && (
                  <DropdownMenuItem onClick={handleSetDefault}>
                    <Star className="h-4 w-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vehicle
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="size-9 sm:size-10" />
          )}
        </header>

        {/* Main Content */}
        <main className="flex flex-col max-w-lg mx-auto lg:max-w-4xl xl:max-w-5xl w-full">
          {/* Image Carousel */}
          <div className="relative w-full lg:px-4 lg:pt-4">
            <div 
              ref={carouselRef}
              onScroll={handleScroll}
              className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth lg:rounded-xl lg:overflow-hidden"
            >
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <img
                    key={idx}
                    alt={`${vehicle.make} ${vehicle.model} - ${idx + 1}`}
                    className="aspect-[4/3] sm:aspect-[16/9] w-full shrink-0 snap-center object-cover"
                    src={img}
                  />
                ))
              ) : (
                <div className="aspect-[4/3] sm:aspect-[16/9] w-full shrink-0 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <Car className="h-16 w-16 sm:h-24 sm:w-24 text-stone-400" />
                </div>
              )}
            </div>
            {/* Pagination Dots */}
            {images.length > 1 && (
              <div className="pointer-events-none absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-1.5 sm:gap-2">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-opacity ${
                      idx === currentImageIndex ? "bg-white opacity-90" : "bg-white opacity-40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content Cards */}
          <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 sm:gap-4 p-4">
            {/* Vehicle Details Card */}
            <div className="flex flex-col gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 sm:p-4 shadow-sm lg:flex-1 lg:min-w-[300px]">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-white">Vehicle Details</h3>
                {isOwner && (
                  <button 
                    onClick={() => navigate(`/trip-booking/vehicle/${id}/edit`)}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    aria-label="Edit vehicle"
                  >
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-stone-500 dark:text-stone-400" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-y-2.5 sm:gap-y-3 gap-x-4">
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-normal text-stone-500 dark:text-stone-400">Make</p>
                  <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">{vehicle.make}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-normal text-stone-500 dark:text-stone-400">Model</p>
                  <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">{vehicle.model}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-normal text-stone-500 dark:text-stone-400">Year</p>
                  <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">{vehicle.year}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-normal text-stone-500 dark:text-stone-400">Color</p>
                  <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200 capitalize">{vehicle.color}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-normal text-stone-500 dark:text-stone-400">License Plate</p>
                  <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">{vehicle.license_plate}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-normal text-stone-500 dark:text-stone-400">VIN</p>
                  <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">
                    {vehicle.registration_number || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Status and Documents */}
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-1 lg:min-w-[300px]">
              {/* Status Card */}
              <div className="flex flex-col gap-2.5 sm:gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 sm:p-4 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-white">Status</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">Verification</p>
                  {getVerificationBadge()}
                </div>
                {vehicle.is_default && (
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                    <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">Default Vehicle</p>
                    <div className="flex h-7 sm:h-8 shrink-0 items-center justify-center gap-x-1.5 sm:gap-x-2 rounded-lg bg-yellow-400/20 px-2 sm:px-3">
                      <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-xs sm:text-sm font-medium leading-normal text-yellow-700 dark:text-yellow-300">Yes</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Documents Card */}
              <div className="flex flex-col gap-2.5 sm:gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 sm:p-4 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-white">Documents</h3>
                
                {/* Registration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${
                      hasDocument('registration') 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-stone-100 dark:bg-stone-800'
                    }`}>
                      {hasDocument('registration') ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-stone-600 dark:text-stone-300" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">Registration</p>
                      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                        {hasDocument('registration') ? "Uploaded" : "Not uploaded"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasDocument('registration') && (
                      <button 
                        onClick={() => handleViewDocument('registration')}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[#137fec] hover:bg-[#137fec]/10 transition-colors"
                        title="View document"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                    {isOwner && (
                      <button 
                        onClick={() => handleOpenDocumentDialog('registration')}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title={hasDocument('registration') ? "Update document" : "Upload document"}
                      >
                        <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="my-1 sm:my-2 border-t border-stone-200 dark:border-stone-800" />

                {/* Insurance */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${
                      hasDocument('insurance') 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-stone-100 dark:bg-stone-800'
                    }`}>
                      {hasDocument('insurance') ? (
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-stone-600 dark:text-stone-300" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200">Insurance</p>
                      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                        {vehicle.insurance_expiry 
                          ? `Expires ${formatDate(vehicle.insurance_expiry)}` 
                          : "Not uploaded"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasDocument('insurance') && (
                      <button 
                        onClick={() => handleViewDocument('insurance')}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[#137fec] hover:bg-[#137fec]/10 transition-colors"
                        title="View document"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                    {isOwner && (
                      <button 
                        onClick={() => handleOpenDocumentDialog('insurance')}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title={hasDocument('insurance') ? "Update document" : "Upload document"}
                      >
                        <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Document Upload Dialog */}
        <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload {selectedDocType === 'registration' ? 'Registration' : 'Insurance'} Document
              </DialogTitle>
              <DialogDescription>
                Upload a clear image or PDF of your vehicle's {selectedDocType} document.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="document-file">Document File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="document-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                </div>
                {documentUpload?.file && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ {documentUpload.file.name}
                  </p>
                )}
              </div>

              {/* Expiry Date for Insurance */}
              {selectedDocType === 'insurance' && (
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="expiry-date"
                      type="date"
                      value={documentUpload?.expiryDate || ''}
                      onChange={(e) => documentUpload && setDocumentUpload({
                        ...documentUpload,
                        expiryDate: e.target.value
                      })}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDocumentDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadDocument}
                  disabled={!documentUpload?.file || documentUpload.uploading}
                  className="flex-1 bg-[#137fec] hover:bg-[#137fec]/90"
                >
                  {documentUpload?.uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </Layout>
  );
}
