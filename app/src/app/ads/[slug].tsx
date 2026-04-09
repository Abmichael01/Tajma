import { View, ScrollView, TouchableOpacity, Platform, Linking, Alert, ActivityIndicator, Share } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AppText from "@/components/ui/AppText";
import BackButton from "@/components/ui/BackButton";
import { useAdDetails } from "@/hooks/useAds";
import { useAuthStore } from "@/store/authStore";
import { useGetOrCreateChat } from "@/hooks/useChat";
import AdImageGallery from "@/components/ads/AdImageGallery";
import AdProductInfo from "@/components/ads/AdProductInfo";
import AdDescription from "@/components/ads/AdDescription";
import AdInfo from "@/components/ads/AdInfo";
import AdSellerInfo from "@/components/ads/AdSellerInfo";
import AdSafetyTips from "@/components/ads/AdSafetyTips";
import AdMap from "@/components/ads/AdMap";
import { useLeads } from "@/hooks/useLeads";
import ReviewsSection from "@/components/ads/ReviewsSection";
import AdDetailSkeleton from "@/components/ads/AdDetailSkeleton";
import { useReviewStats } from "@/hooks/useReviews";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import ReportAdModal from "@/components/ads/ReportAdModal";

export default function AdsDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { alertConfig, showAlert, hideAlert } = useAlert();
  const { data: ad, isLoading, error } = useAdDetails(slug || "");
  const { user, isAuthenticated } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: reviewStats } = useReviewStats({ ad: ad?.id }, !!ad?.id);
  const { mutateAsync: getOrCreateChat, isPending: isGettingChat } = useGetOrCreateChat();
  const { recordInteraction } = useLeads();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

  const handleShare = async () => {
    try {
      const shareUrl = `https://tajma.com/ads/${ad.slug}`; // Fallback or dynamic link
      const message = `Check out this ${ad.title} on Tajma!\n\nPrice: ${formattedPrice}\nLocation: ${location}\n\n${shareUrl}`;

      await Share.share({
        message,
        url: shareUrl, // iOS only
        title: ad.title,
      });
    } catch (error) {
      console.error("Error sharing ad:", error);
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
    } else {
      setIsReportModalOpen(true);
    }
  };

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
      <StatusBar style="dark" />

      {/* Floating Back Button - Handles insets internally */}
      <BackButton />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Image Gallery */}
        <AdImageGallery
          images={adImages}
          title={ad.title}
          currentIndex={currentImageIndex}
          onPrev={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
          onNext={() => setCurrentImageIndex(Math.min(adImages.length - 1, currentImageIndex + 1))}
          onThumbnailClick={setCurrentImageIndex}
          onShare={handleShare}
          onReport={handleReport}
          onIndexChange={setCurrentImageIndex}
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

        {/* Map Section */}
        {ad.latitude && ad.longitude && (
          <AdMap 
            latitude={ad.latitude} 
            longitude={ad.longitude} 
            title={ad.title} 
            locationName={ad.location_name || ad.location} 
          />
        )}

        {/* Seller Info */}
        {ad.seller && !isOwner && (
          <AdSellerInfo seller={ad.seller} adId={ad.id} />
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

      {/* Sticky Bottom Actions */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex-row gap-3 items-center"
        style={{
          paddingBottom: Math.max(insets.bottom, 20),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10
        }}
      >
        {!isOwner ? (
          <>
            <TouchableOpacity
              className="flex-1 bg-primary h-14 rounded-2xl flex-row items-center justify-center shadow-lg"
              style={{ backgroundColor: '#FF4F18' }}
              disabled={isGettingChat}
              onPress={async () => {
                if (!isAuthenticated) {
                  router.push("/(auth)/login");
                } else if (ad.seller?.id) {
                  try {
                    const chat = await getOrCreateChat({
                      participant2_id: ad.seller.id,
                      ad_id: ad.id
                    });

                    // Track as interaction
                    recordInteraction({
                      seller_id: ad.seller.id,
                      source: 'phone_view', // Or maybe a new 'chat_start' source? 
                      ad_id: ad.id
                    }).catch(console.error);

                    router.push(`/messages/${chat.id}`);
                  } catch (error) {
                    showAlert({
                      title: "Error",
                      message: "Failed to start conversation. Please try again.",
                      icon: "alert-circle-outline",
                      iconColor: "#ef4444",
                      buttons: [{ text: "OK" }]
                    });
                  }
                }
              }}
            >
              {isGettingChat ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="white" />
                  <AppText weight="bold" className="text-white ml-2 text-lg">Chat</AppText>
                </>
              )}
            </TouchableOpacity>

            {ad.seller?.phone && (
              <TouchableOpacity
                className="w-14 h-14 rounded-2xl bg-gray-100 items-center justify-center border border-gray-200"
                onPress={() => {
                  if (isAuthenticated && ad.seller?.id) {
                    recordInteraction({
                      seller_id: ad.seller.id,
                      source: 'phone_view',
                      ad_id: ad.id
                    }).catch(console.error);
                  }
                  Linking.openURL(`tel:${ad.seller.phone}`);
                }}
              >
                <Ionicons name="call" size={22} color="#0f172b" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity
            className="flex-1 bg-gray-900 h-14 rounded-2xl flex-row items-center justify-center"
            onPress={() => router.push(`/ads/edit/${ad.slug}`)}
          >
            <Ionicons name="create-outline" size={22} color="white" />
            <AppText weight="bold" className="text-white ml-2 text-lg">Edit Listing</AppText>
          </TouchableOpacity>
        )}
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />

      <ReportAdModal
        visible={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        ad={ad}
      />
    </View>
  );
}
