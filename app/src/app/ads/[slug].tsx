import { View, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AppText from "@/components/ui/AppText";
import BackButton from "@/components/ui/BackButton";
import { useAdDetails } from "@/hooks/useAds";
import { useAuthStore } from "@/store/authStore";
import AdImageGallery from "@/components/ads/AdImageGallery";
import AdProductInfo from "@/components/ads/AdProductInfo";
import AdDescription from "@/components/ads/AdDescription";
import AdInfo from "@/components/ads/AdInfo";
import AdSellerInfo from "@/components/ads/AdSellerInfo";
import AdSafetyTips from "@/components/ads/AdSafetyTips";
import ReviewsSection from "@/components/ads/ReviewsSection";
import AdDetailSkeleton from "@/components/ads/AdDetailSkeleton";
import { useReviewStats } from "@/hooks/useReviews";

export default function AdsDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: ad, isLoading, error } = useAdDetails(slug || "");
  const { user, isAuthenticated } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: reviewStats } = useReviewStats({ ad: ad?.id }, !!ad?.id);

  // Check if current user is the ad owner
  const isOwner = user && ad && user.id === ad.seller?.id;

  // Get images from backend ad
  const adImages = ad?.images && ad.images.length > 0
    ? ad.images
    : [];

  // Format price
  const formattedPrice = ad?.price
    ? `${ad.currency || 'Fr'} ${parseFloat(String(ad.price)).toLocaleString()}`
    : 'Contact for price';

  // Get location from seller
  const location = ad?.seller?.location || 'Location not specified';

  // Get category name
  const categoryName = ad?.category_details?.name || ad?.category || 'Uncategorized';

  if (isLoading) {
    return <AdDetailSkeleton />;
  }

  if (error || !ad) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-4">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <AppText variant="heading" weight="bold" className="mt-4 mb-2 text-gray-900">
          Ad Not Found
        </AppText>
        <AppText variant="default" className="text-gray-600 text-center mb-6">
          The ad you're looking for doesn't exist or has been removed.
        </AppText>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <AppText weight="semibold" className="text-white">Go Back</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Back Button */}
      <BackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <AdImageGallery
          images={adImages}
          title={ad.title}
          currentIndex={currentImageIndex}
          onPrev={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
          onNext={() => setCurrentImageIndex(Math.min(adImages.length - 1, currentImageIndex + 1))}
          onThumbnailClick={setCurrentImageIndex}
        />

        {/* Product Info */}
        <AdProductInfo
          ad={ad}
          user={user}
          isOwner={!!isOwner}
          formattedPrice={formattedPrice}
          location={location}
          categoryName={categoryName}
        />

        {/* Description */}
        <AdDescription description={ad.description || ''} />

        {/* Ad Info */}
        {ad.attributes && Object.keys(ad.attributes).length > 0 && (
          <AdInfo attributes={ad.attributes} />
        )}

        {/* Seller Info */}
        {ad.seller && !isOwner && (
          <AdSellerInfo seller={ad.seller} />
        )}

        {/* Reviews Section */}
        <ReviewsSection
          adId={ad.id}
          reviewStats={reviewStats}
          isOwner={!!isOwner}
        />

        {/* Safety Tips */}
        <AdSafetyTips />
      </ScrollView>
    </View>
  );
}

