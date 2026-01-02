import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const REVIEW_TAGS = {
  positive: [
    "Punctual",
    "Friendly",
    "Safe Driving",
    "Clean Car",
    "Good Music",
    "Great Conversation",
    "Professional",
    "Comfortable",
  ],
  negative: [
    "Late",
    "Rude",
    "Unsafe Driving",
    "Dirty Car",
    "Smoking",
    "Uncomfortable",
    "Detour",
    "Poor Vehicle Condition",
  ],
};

interface TripDetails {
  id: string;
  driver_id: string;
  booking_id: string;
  driver: {
    full_name: string;
    avatar_url?: string;
  };
  route: {
    departure_location: string;
    arrival_location: string;
  };
}

export default function RateTrip() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (bookingId) {
      fetchTripDetails();
    }
  }, [bookingId]);

  const fetchTripDetails = async () => {
    if (!bookingId) return;

    try {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          id,
          trip:trips!trip_bookings_trip_id_fkey(
            id,
            driver_id,
            driver:profiles!trips_driver_id_fkey(
              full_name,
              avatar_url
            ),
            route:routes!trips_route_id_fkey(
              departure_location,
              arrival_location
            )
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      if (data?.trip) {
        setTripDetails({
          id: data.trip.id,
          driver_id: data.trip.driver_id,
          booking_id: data.id,
          driver: data.trip.driver,
          route: data.trip.route,
        });
      }
    } catch (error: any) {
      console.error("Error fetching trip details:", error);
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive",
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!user || !tripDetails || rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("trip_reviews").insert({
        trip_id: tripDetails.id,
        booking_id: tripDetails.booking_id,
        reviewer_id: user.id,
        reviewee_id: tripDetails.driver_id,
        rating,
        review_text: reviewText.trim() || null,
        categories: selectedTags.length > 0 ? { tags: selectedTags } : null,
        is_anonymous: false,
      });

      if (error) throw error;

      // Update driver's average rating
      const { data: reviews } = await supabase
        .from("trip_reviews")
        .select("rating")
        .eq("reviewee_id", tripDetails.driver_id);

      if (reviews) {
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabase
          .from("driver_profiles")
          .update({ average_rating: avgRating })
          .eq("id", tripDetails.driver_id);
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback",
      });

      navigate("/trip-booking");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!tripDetails) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </Layout>
    );
  }

  const availableTags = rating >= 4 ? REVIEW_TAGS.positive : REVIEW_TAGS.negative;

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
              Rate Your Trip
            </h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto p-4 pb-24 space-y-8">
          {/* Driver Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="flex justify-center mb-4">
              {tripDetails.driver.avatar_url ? (
                <img
                  src={tripDetails.driver.avatar_url}
                  alt={tripDetails.driver.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {tripDetails.driver.full_name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {tripDetails.route.departure_location} → {tripDetails.route.arrival_location}
            </p>
          </div>

          {/* Rating */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              How was your trip?
            </h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-12 w-12 transition-colors",
                      star <= (hoverRating || rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-300 dark:text-gray-600"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-3 text-gray-600 dark:text-gray-400 font-medium">
                {rating === 5 && "Excellent!"}
                {rating === 4 && "Good"}
                {rating === 3 && "Average"}
                {rating === 2 && "Below Average"}
                {rating === 1 && "Poor"}
              </p>
            )}
          </div>

          {/* Tags */}
          {rating > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                What stood out? (Optional)
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors",
                      selectedTags.includes(tag)
                        ? "border-[#137fec] bg-[#137fec]/10 text-[#137fec]"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review Text */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Share more details (Optional)
            </h3>
            <Textarea
              placeholder="Tell us about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </main>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="w-full h-14 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

