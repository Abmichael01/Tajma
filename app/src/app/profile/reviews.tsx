import { View, ScrollView, TouchableOpacity, RefreshControl, Image, ActivityIndicator, FlatList, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useAuthStore } from "@/store/authStore";
import { useSellerReviews } from "@/hooks/useReviews";

export default function ReviewsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.id ? Number(user.id) : undefined;
  const { data: reviewsData, isLoading, refetch, isRefetching } = useSellerReviews(userId);

  const reviews = Array.isArray(reviewsData) ? reviewsData : ((reviewsData as any)?.results || []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? "star" : "star-outline"}
        size={14}
        color="#eab308"
      />
    ));
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title={t('profile.reviews')}
        subtitle={reviews.length > 0 ? t('profile.reviews_interact.reviewsReceived', { count: reviews.length }) : t('profile.reviews_interact.yourFeedback')}
      />

      {isLoading && !isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF4F18" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          className="flex-1 px-4 pt-4"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF4F18" />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
          ListHeaderComponent={
            reviews.length > 0 ? (
              <AppText variant="default" className="text-gray-500 mb-4">
                {reviews.length} {reviews.length === 1 ? t('profile.reviews_interact.review') : t('profile.reviews_interact.reviews')}
              </AppText>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 min-h-[500px]">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="star-outline" size={32} color="#9ca3af" />
              </View>
              <AppText variant="heading" weight="medium" className="text-gray-900 mb-2">
                {t('profile.reviews_interact.noReviewsTitle')}
              </AppText>
              <AppText variant="default" className="text-gray-500 text-center px-8">
                {t('profile.reviews_interact.noReviewsDesc')}
              </AppText>
            </View>
          }
          renderItem={({ item: review }) => {
            const reviewerName = review.reviewer_name || review.reviewer?.full_name || review.reviewer?.first_name || 'User';
            const reviewerInitials = reviewerName.split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2).toUpperCase();

            return (
              <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <Avatar
                      src={review.reviewer_avatar || review.reviewer?.avatar}
                      fallback={reviewerInitials}
                      size={40}
                    />
                    <View className="flex-1">
                      <AppText variant="default" weight="medium" className="text-gray-900">
                        {reviewerName}
                      </AppText>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <View className="flex-row">{renderStars(review.rating)}</View>
                        <AppText variant="caption" className="text-gray-500 ml-1">
                          • {new Date(review.created_at).toLocaleDateString()}
                        </AppText>
                      </View>
                    </View>
                  </View>
                </View>

                {review.comment && (
                  <AppText variant="default" className="text-gray-700 mb-3 leading-5">
                    {review.comment}
                  </AppText>
                )}

                {/* Ad Reference with View Button */}
                {review.ad_title && (
                  <View className="bg-gray-50 rounded-lg p-3 flex-row items-center justify-between border border-gray-100">
                    <View className="flex-1 mr-2">
                      <AppText variant="caption" className="text-gray-500 mb-0.5">{t('profile.reviews_interact.reviewedItem')}:</AppText>
                      <AppText variant="default" weight="medium" className="text-gray-900" numberOfLines={1}>
                        {review.ad_title}
                      </AppText>
                    </View>
                    <Link href={`/ads/${review.ad_slug || review.ad}`} asChild>
                      <TouchableOpacity className="bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                        <AppText variant="caption" weight="medium" className="text-secondary">
                          {t('profile.reviews_interact.viewAd')}
                        </AppText>
                      </TouchableOpacity>
                    </Link>
                  </View>
                )}
              </View>
            );
          }}
          windowSize={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
}
