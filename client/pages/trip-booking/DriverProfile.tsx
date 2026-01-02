import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Star,
  Car,
  Shield,
  ChevronRight,
  Phone,
  Mail,
  BadgeCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DriverProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  driver_profile?: {
    average_rating: number;
    total_trips: number;
    total_reviews: number;
    years_experience: number;
    background_check_status: string;
  };
}

interface ReviewData {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface VerificationInfo {
  phone_verified: boolean;
  email_verified: boolean;
  id_verified: boolean;
  background_check: string;
}

export default function DriverProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverProfileData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [allReviews, setAllReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loadingAllReviews, setLoadingAllReviews] = useState(false);
  const [verification, setVerification] = useState<VerificationInfo>({
    phone_verified: false,
    email_verified: false,
    id_verified: false,
    background_check: 'pending'
  });

  useEffect(() => {
    if (id) {
      fetchDriverProfile();
      fetchReviews();
      
      // Subscribe to real-time review updates
      const reviewsChannel = supabase
        .channel(`driver-reviews-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trip_reviews',
            filter: `reviewee_id=eq.${id}`
          },
          () => {
            // Refetch reviews when there's a change
            fetchReviews();
            // Also refresh driver profile to update total_reviews count
            fetchDriverProfile();
          }
        )
        .subscribe();
      
      return () => {
        reviewsChannel.unsubscribe();
      };
    }
  }, [id]);

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          email,
          phone,
          driver_profile:driver_profiles(
            average_rating,
            total_trips,
            total_reviews,
            years_experience,
            background_check_status
          )
        `)
        .eq("id", id)
        .single();

      if (queryError) throw queryError;
      
      const transformedData = {
        ...data,
        driver_profile: Array.isArray(data.driver_profile) 
          ? data.driver_profile[0] 
          : data.driver_profile
      };
      
      setDriver(transformedData);

      // Set verification info based on real data
      setVerification({
        phone_verified: !!data.phone,
        email_verified: !!data.email,
        id_verified: transformedData.driver_profile?.background_check_status === 'verified',
        background_check: transformedData.driver_profile?.background_check_status || 'pending'
      });

    } catch (err) {
      console.error("Error fetching driver profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (fetchAll = false) => {
    if (!id) return;

    try {
      if (fetchAll) setLoadingAllReviews(true);
      
      const query = supabase
        .from("trip_reviews")
        .select(`
          id,
          rating,
          review_text,
          created_at,
          reviewer:profiles!trip_reviews_reviewer_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("reviewee_id", id)
        .order("created_at", { ascending: false });

      if (!fetchAll) {
        query.limit(3);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const transformedReviews = (data || []).map(review => ({
        ...review,
        reviewer: Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer
      }));
      
      if (fetchAll) {
        setAllReviews(transformedReviews);
        setShowAllReviews(true);
      } else {
        setReviews(transformedReviews);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      if (fetchAll) setLoadingAllReviews(false);
    }
  };

  const handleViewAllReviews = async () => {
    if (showAllReviews) {
      setShowAllReviews(false);
    } else {
      await fetchReviews(true);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
              star <= rating
                ? "fill-[#FFCC00] text-[#FFCC00]"
                : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return "D";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatReviewerName = (name: string | null) => {
    if (!name) return "Anonymous";
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1]?.charAt(0) || ''}.`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
          <div className="max-w-lg mx-auto lg:max-w-4xl xl:max-w-5xl p-4 space-y-6">
            <div className="flex flex-col items-center py-8">
              <Skeleton className="h-28 w-28 sm:h-32 sm:w-32 rounded-full" />
              <Skeleton className="h-6 w-40 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !driver) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101922]/50 rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-gray-200/80 dark:border-white/10">
            <h2 className="text-lg sm:text-xl font-bold text-[#1C1C1E] dark:text-white mb-2">
              Profile Not Found
            </h2>
            <p className="text-sm sm:text-base text-[#8E8E93] dark:text-gray-400 mb-6">
              {error || "The profile you're looking for doesn't exist."}
            </p>
            <button 
              onClick={() => navigate(-1)} 
              className="w-full py-3 px-6 rounded-xl border border-gray-200 dark:border-white/10 text-[#1C1C1E] dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Use actual data from driver_profiles and reviews
  const rating = driver.driver_profile?.average_rating 
    ? parseFloat(String(driver.driver_profile.average_rating)) 
    : 0;
  // Prefer the actual count from fetched reviews for accuracy
  const totalReviews = showAllReviews 
    ? allReviews.length 
    : Math.max(driver.driver_profile?.total_reviews || 0, reviews.length);
  const totalTrips = driver.driver_profile?.total_trips || 0;
  const yearsExperience = driver.driver_profile?.years_experience || 0;
  const isVerified = driver.driver_profile?.background_check_status === 'verified';

  const displayedReviews = showAllReviews ? allReviews : reviews;

  return (
    <Layout>
      <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#f6f7f8] dark:bg-[#101922] overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center bg-[#f6f7f8] dark:bg-[#101922] px-4 py-3 justify-between border-b border-gray-200/80 dark:border-white/10">
          <button
            onClick={() => navigate(-1)}
            className="flex size-9 sm:size-10 shrink-0 items-center justify-center text-[#1C1C1E] dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <h2 className="text-[#1C1C1E] dark:text-white text-base sm:text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Driver Profile
          </h2>
          <div className="size-9 sm:size-10 shrink-0" />
        </header>

        {/* Main Content */}
        <main className="p-4 pt-6 flex flex-col gap-4 sm:gap-6 max-w-lg mx-auto lg:max-w-4xl xl:max-w-5xl w-full pb-8">
          {/* Desktop layout wrapper */}
          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-4 sm:gap-6 lg:w-1/3">
              {/* Profile Header */}
              <div className="flex w-full flex-col gap-4 items-center">
                <div className="flex gap-4 flex-col items-center">
                  {/* Avatar */}
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-28 w-28 sm:min-h-32 sm:w-32 shadow-md ring-4 ring-white dark:ring-[#101922]"
                    style={{
                      backgroundImage: driver.avatar_url 
                        ? `url("${driver.avatar_url}")` 
                        : undefined,
                      backgroundColor: !driver.avatar_url ? '#007AFF' : undefined
                    }}
                  >
                    {!driver.avatar_url && (
                      <div className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                        {getInitials(driver.full_name)}
                      </div>
                    )}
                  </div>
                  
                  {/* Name and Rating */}
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-[#1C1C1E] dark:text-white text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">
                      {driver.full_name || "Driver"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-[#1C1C1E] dark:text-white font-bold">{rating.toFixed(1)}</p>
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-[#FFCC00] text-[#FFCC00]" />
                      <p className="text-[#8E8E93] dark:text-gray-400 text-sm sm:text-base font-normal leading-normal text-center">
                        ({totalReviews} ratings)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div className="flex min-w-[90px] flex-1 flex-col gap-1 sm:gap-1.5 rounded-xl p-3 sm:p-4 bg-white dark:bg-[#101922]/50 border border-gray-200/80 dark:border-white/10">
                  <p className="text-[#8E8E93] dark:text-gray-400 text-xs sm:text-sm font-medium leading-normal">Trips</p>
                  <p className="text-[#1C1C1E] dark:text-white text-xl sm:text-2xl font-bold leading-tight">{totalTrips}</p>
                </div>
                <div className="flex min-w-[90px] flex-1 flex-col gap-1 sm:gap-1.5 rounded-xl p-3 sm:p-4 bg-white dark:bg-[#101922]/50 border border-gray-200/80 dark:border-white/10">
                  <p className="text-[#8E8E93] dark:text-gray-400 text-xs sm:text-sm font-medium leading-normal">Experience</p>
                  <p className="text-[#1C1C1E] dark:text-white text-xl sm:text-2xl font-bold leading-tight">
                    {yearsExperience} <span className="text-sm sm:text-base font-normal">years</span>
                  </p>
                </div>
                <div className="flex min-w-[90px] flex-1 flex-col gap-1 sm:gap-1.5 rounded-xl p-3 sm:p-4 bg-white dark:bg-[#101922]/50 border border-gray-200/80 dark:border-white/10">
                  <p className="text-[#8E8E93] dark:text-gray-400 text-xs sm:text-sm font-medium leading-normal">Reviews</p>
                  <p className="text-[#1C1C1E] dark:text-white text-xl sm:text-2xl font-bold leading-tight">{totalReviews}</p>
                </div>
              </div>

              {/* Quick Links Card */}
              <div className="flex flex-col gap-0 rounded-xl bg-white dark:bg-[#101922]/50 border border-gray-200/80 dark:border-white/10 overflow-hidden">
                {/* My Vehicles */}
                <button
                  onClick={() => navigate(`/trip-booking/driver/${id}/vehicles`)}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="text-[#007AFF] flex items-center justify-center rounded-lg bg-[#007AFF]/10 dark:bg-[#007AFF]/20 shrink-0 size-9 sm:size-10">
                    <Car className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex flex-col justify-center flex-1 text-left">
                    <p className="text-[#1C1C1E] dark:text-white text-sm sm:text-base font-medium leading-normal">My Vehicles</p>
                    <p className="text-[#8E8E93] dark:text-gray-400 text-xs sm:text-sm font-normal leading-normal">View and manage your vehicle details</p>
                  </div>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#8E8E93] dark:text-gray-400" />
                </button>

                <div className="h-px bg-gray-200/80 dark:bg-white/10 mx-4" />

                {/* Verified Information */}
                <div className="flex flex-col p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`flex items-center justify-center rounded-lg shrink-0 size-9 sm:size-10 ${
                      isVerified 
                        ? 'text-green-600 bg-green-100 dark:bg-green-900/50' 
                        : 'text-orange-600 bg-orange-100 dark:bg-orange-900/50'
                    }`}>
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <p className="text-[#1C1C1E] dark:text-white text-sm sm:text-base font-medium leading-normal">Verified Information</p>
                      <p className="text-[#8E8E93] dark:text-gray-400 text-xs sm:text-sm font-normal leading-normal">
                        {isVerified ? 'All verifications complete' : 'Verification in progress'}
                      </p>
                    </div>
                  </div>

                  {/* Verification Details */}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className={`h-4 w-4 ${verification.phone_verified ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`text-xs sm:text-sm ${verification.phone_verified ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {verification.phone_verified ? 'Phone Verified' : 'Phone Not Verified'}
                      </span>
                      {verification.phone_verified && <BadgeCheck className="h-3 w-3 text-green-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className={`h-4 w-4 ${verification.email_verified ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`text-xs sm:text-sm ${verification.email_verified ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {verification.email_verified ? 'Email Verified' : 'Email Not Verified'}
                      </span>
                      {verification.email_verified && <BadgeCheck className="h-3 w-3 text-green-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className={`h-4 w-4 ${verification.id_verified ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`text-xs sm:text-sm ${verification.id_verified ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {verification.id_verified ? 'ID Verified' : 'ID Pending'}
                      </span>
                      {verification.id_verified && <BadgeCheck className="h-3 w-3 text-green-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeCheck className={`h-4 w-4 ${verification.background_check === 'verified' ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`text-xs sm:text-sm ${verification.background_check === 'verified' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {verification.background_check === 'verified' ? 'Background Checked' : 'Background Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Reviews */}
            <div className="flex flex-col gap-4 mt-4 lg:mt-0 lg:flex-1">
              <h2 className="text-[#1C1C1E] dark:text-white text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em]">
                What passengers are saying
              </h2>

              {displayedReviews.length === 0 ? (
                <div className="flex flex-col gap-3 rounded-xl p-6 sm:p-8 bg-white dark:bg-[#101922]/50 border border-gray-200/80 dark:border-white/10 text-center">
                  <Star className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto" />
                  <p className="text-[#8E8E93] dark:text-gray-400">No reviews yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {displayedReviews.map((review) => (
                    <div 
                      key={review.id} 
                      className="flex flex-col gap-2.5 sm:gap-3 rounded-xl p-3 sm:p-4 bg-white dark:bg-[#101922]/50 border border-gray-200/80 dark:border-white/10"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        {review.reviewer?.avatar_url ? (
                          <img 
                            className="size-9 sm:size-10 shrink-0 rounded-full object-cover"
                            src={review.reviewer.avatar_url}
                            alt={review.reviewer?.full_name || 'Reviewer'}
                          />
                        ) : (
                          <div className="size-9 sm:size-10 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-semibold">
                            {getInitials(review.reviewer?.full_name)}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-[#1C1C1E] dark:text-white truncate">
                            {formatReviewerName(review.reviewer?.full_name)}
                          </p>
                          {renderStars(review.rating)}
                        </div>
                        
                        <p className="text-xs sm:text-sm text-[#8E8E93] dark:text-gray-400 shrink-0">
                          {getRelativeTime(review.created_at)}
                        </p>
                      </div>
                      
                      {review.review_text && (
                        <p className="text-sm sm:text-base text-[#8E8E93] dark:text-gray-300 leading-relaxed">
                          "{review.review_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* View All Reviews Button */}
              {totalReviews > 3 && (
                <button 
                  onClick={handleViewAllReviews}
                  disabled={loadingAllReviews}
                  className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF] font-bold text-sm sm:text-base transition-colors hover:bg-[#007AFF]/20 dark:hover:bg-[#007AFF]/30 disabled:opacity-50"
                >
                  {loadingAllReviews ? (
                    "Loading..."
                  ) : showAllReviews ? (
                    <>
                      Show Less
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      View All {totalReviews} Reviews
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
