import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { useAdReviews, useReviewStats, useMarkReviewHelpful } from "@/hooks/useReviews";
import { useAuthStore } from "@/store/authStore";
import ReviewForm from "./ReviewForm";

interface ReviewsSectionProps {
  adId: string;
  reviewStats?: any;
  isOwner?: boolean;
}

export default function ReviewsSection({ adId, reviewStats: providedStats, isOwner = false }: ReviewsSectionProps) {
  const { data: reviewsData, isLoading, error } = useAdReviews(adId);
  const { data: statsData } = useReviewStats({ ad: adId }, !!adId);
  const { isAuthenticated, user } = useAuthStore();
  const [showAll, setShowAll] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const markHelpful = useMarkReviewHelpful();

  // Use provided stats or fetched stats
  const reviewStats = providedStats || statsData;

  // Ensure reviews is always an array
  const reviews = useMemo(() => {
    if (!reviewsData) return [];
    if (Array.isArray(reviewsData)) return reviewsData;
    if (reviewsData && typeof reviewsData === 'object' && 'results' in reviewsData) {
      return Array.isArray((reviewsData as any).results) ? (reviewsData as any).results : [];
    }
    return [];
  }, [reviewsData]);

  // Check if user has already reviewed this ad
  const userReview = reviews.find((r: any) => r.reviewer?.id === user?.id);
  const canReview = isAuthenticated && !isOwner && !userReview;

  const toggleHelpful = async (reviewId: string) => {
    try {
      await markHelpful.mutateAsync(reviewId);
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 16 : 20;
    return (
      <View className="flex-row">
        {Array.from({ length: 5 }, (_, i) => (
          <Ionicons
            key={i}
            name={i < rating ? "star" : "star-outline"}
            size={starSize}
            color={i < rating ? "#fbbf24" : "#d1d5db"}
          />
        ))}
      </View>
    );
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);
  
  // Calculate stats from reviews if not provided
  const stats = reviewStats || {
    total_reviews: reviews.length,
    average_rating: reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0,
    rating_5: reviews.filter((r: any) => r.rating === 5).length,
    rating_4: reviews.filter((r: any) => r.rating === 4).length,
    rating_3: reviews.filter((r: any) => r.rating === 3).length,
    rating_2: reviews.filter((r: any) => r.rating === 2).length,
    rating_1: reviews.filter((r: any) => r.rating === 1).length,
  };

  if (isLoading) {
    return (
      <View className="bg-white border-b border-gray-200 px-4 py-6">
        <ActivityIndicator size="small" color="#0f172b" />
        <AppText className="mt-2 text-gray-500">Loading reviews...</AppText>
      </View>
    );
  }

  return (
    <View className="bg-white border-b border-gray-200 px-4 py-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <AppText variant="subheading" weight="semibold" className="text-gray-900 mb-2">
            Customer Reviews
          </AppText>
          <View className="flex-row items-center gap-2">
            {renderStars(Math.round(stats.average_rating || 0))}
            <AppText variant="default" weight="semibold" className="text-gray-900">
              {(stats.average_rating || 0).toFixed(1)}
            </AppText>
            <AppText variant="default" className="text-gray-600">
              ({stats.total_reviews || 0} reviews)
            </AppText>
          </View>
        </View>
        
        {canReview && !showReviewForm && (
          <TouchableOpacity onPress={() => setShowReviewForm(true)}>
            <AppText variant="default" weight="semibold" className="text-primary">
              Write a Review
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Review Form */}
      {showReviewForm && canReview && (
        <View className="mb-6 pb-6 border-b border-gray-200">
          <ReviewForm
            adId={adId}
            onSuccess={() => {
              setShowReviewForm(false);
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        </View>
      )}

      {/* Rating Breakdown */}
      {stats.total_reviews > 0 && (
        <View className="mb-6 p-4 bg-gray-50 rounded-lg">
          <AppText variant="default" weight="medium" className="text-gray-900 mb-3">
            Rating Breakdown
          </AppText>
          <View className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = [
                stats.rating_5,
                stats.rating_4,
                stats.rating_3,
                stats.rating_2,
                stats.rating_1
              ][5 - rating];
              const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
              
              return (
                <View key={rating} className="flex-row items-center gap-3">
                  <AppText variant="caption" className="text-gray-600 w-6">{rating}</AppText>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <View className="flex-1 bg-gray-200 rounded-full h-2">
                    <View 
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                  <AppText variant="caption" className="text-gray-600 w-8">{count}</AppText>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <>
          <View className="space-y-6">
            {displayedReviews.map((review: any) => {
              const reviewerName = review.reviewer_name || review.reviewer?.full_name || review.reviewer?.first_name || 'User';
              const reviewerInitials = reviewerName.split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2).toUpperCase();
              
              return (
                <View key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <View className="flex-row items-start gap-4">
                    {/* Avatar */}
                    <Avatar
                      src={review.reviewer_avatar || review.reviewer?.avatar}
                      alt={reviewerName}
                      fallback={reviewerInitials}
                      size={40}
                    />

                    {/* Review Content */}
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2 mb-2">
                        <AppText variant="default" weight="medium" className="text-gray-900">
                          {reviewerName}
                        </AppText>
                        {review.is_verified_purchase && (
                          <View className="bg-green-100 px-2 py-0.5 rounded-full">
                            <AppText variant="caption" className="text-green-800">Verified Purchase</AppText>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center gap-2 mb-2">
                        {renderStars(review.rating || 0, 'sm')}
                        <AppText variant="caption" className="text-gray-500">{formatDate(review.created_at)}</AppText>
                      </View>

                      {review.comment && (
                        <AppText variant="default" className="text-gray-700 leading-relaxed mb-3">
                          {review.comment}
                        </AppText>
                      )}

                      <TouchableOpacity
                        onPress={() => toggleHelpful(review.id)}
                        disabled={markHelpful.isPending}
                        className="flex-row items-center gap-1"
                      >
                        <Ionicons name="thumbs-up-outline" size={16} color="#6b7280" />
                        <AppText variant="caption" className="text-gray-500">Helpful</AppText>
                        {review.helpful_count > 0 && (
                          <AppText variant="caption" className="text-gray-400">
                            ({review.helpful_count})
                          </AppText>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Show More/Less Button */}
          {reviews.length > 3 && (
            <View className="mt-6 items-center">
              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <AppText variant="default" weight="semibold" className="text-primary">
                  {showAll ? 'Show Less' : `Show All ${stats.total_reviews} Reviews`}
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View className="items-center py-8">
          <AppText className="text-4xl mb-4">⭐</AppText>
          <AppText variant="default" weight="medium" className="text-gray-900 mb-2">
            No reviews yet
          </AppText>
          {isOwner ? (
            <AppText variant="default" className="text-gray-600">
              Reviews will appear here once buyers rate your ad.
            </AppText>
          ) : (
            <>
              <AppText variant="default" className="text-gray-600 mb-4">
                Be the first to review this seller's product!
              </AppText>
              {canReview && (
                <Button
                  size="lg"
                  onPress={() => setShowReviewForm(true)}
                >
                  Write First Review
                </Button>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

