import {
  View,
  Animated,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
  Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef } from "react";
import AppText from "@/components/ui/AppText";
import BackButton from "@/components/ui/BackButton";
import { useAdDetails, useUpdateAd } from "@/hooks/useAds";
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
import { useTranslation } from "react-i18next";
import ScrollAwareHeader from "@/components/ui/ScrollAwareHeader";

export default function AdsDetailScreen() {
  const { t } = useTranslation();
  const { slug, preview } = useLocalSearchParams<{ slug: string, preview: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { alertConfig, showAlert, hideAlert } = useAlert();
  const { data: ad, isLoading, error, refetch } = useAdDetails(slug || "");
  const updateAdMutation = useUpdateAd(slug || "");
  const isPreview = preview === "true";
  const { user, isAuthenticated } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: reviewStats } = useReviewStats({ ad: ad?.id }, !!ad?.id);
  const { mutateAsync: getOrCreateChat, isPending: isGettingChat } =
    useGetOrCreateChat();
  const { recordInteraction } = useLeads();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  // Check if current user is the ad owner
  const isOwner = user && ad && user.id === ad.seller?.id;

  // Get images from backend ad
  const adImages = ad?.images && ad.images.length > 0 ? ad.images : [];

  // Format price
  const formattedPrice = ad?.price
    ? `${ad.currency || "Fr"} ${parseFloat(String(ad.price)).toLocaleString()}`
    : "Contact for price";

  // Get location from seller
  const location = ad?.seller?.location || "Location not specified";

  // Get category name
  const categoryName =
    ad?.category_details?.name || ad?.category || "Uncategorized";

  const handleShare = async () => {
    try {
      if (!ad) return;
      const shareUrl = `https://tajma.com/ads/${ad.slug}`; 
      const message = `Check out this ${ad.title} on Tajma!\n\nPrice: ${formattedPrice}\nLocation: ${location}\n\n${shareUrl}`;

      await Share.share({
        message,
        url: shareUrl, 
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

  const handlePublish = async () => {
    try {
      await updateAdMutation.mutateAsync({ status: "published" });
      showAlert({
        title: t('common.success'),
        message: t('ads.publishedSuccess'),
        icon: "checkmark-circle-outline",
        iconColor: "#10b981",
        buttons: [
          { 
            text: t('common.ok'), 
            onPress: () => {
                router.replace(`/ads/${slug}`);
            }
          }
        ]
      });
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('ads.publishError'),
        icon: "alert-circle-outline",
        iconColor: "#ef4444",
        buttons: [{ text: t('common.ok') }]
      });
    }
  };

  if (isLoading) {
    return <AdDetailSkeleton />;
  }

  if (error || !ad) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-4">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <AppText
          variant="heading"
          weight="bold"
          className="mt-4 mb-2 text-gray-900"
        >
          {t('ads.loadError')}
        </AppText>
        <AppText variant="default" className="text-gray-600 text-center mb-6">
          {t('ads.loadErrorDesc')}
        </AppText>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <AppText weight="semibold" className="text-white">
            {t('common.goBack')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollAwareHeader 
        title={ad.title} 
        scrollY={scrollY} 
        showAt={300}
        rightElement={
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color="#0f172b" />
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {!adImages || adImages.length === 0 ? (
           <View style={{ paddingTop: insets.top + 10 }} className="px-6">
              <BackButton isStatic />
           </View>
        ) : null}
        
        {/* Image Gallery */}
        <AdImageGallery
          images={adImages}
          title={ad.title}
          currentIndex={currentImageIndex}
          onPrev={() =>
            setCurrentImageIndex(Math.max(0, currentImageIndex - 1))
          }
          onNext={() =>
            setCurrentImageIndex(
              Math.min(adImages.length - 1, currentImageIndex + 1),
            )
          }
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
        <AdDescription description={ad.description || ""} />

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
      </Animated.ScrollView>

      {/* Sticky Bottom Actions */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex-row gap-3 items-center"
        style={{
          paddingBottom: Math.max(insets.bottom, 20),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        {!isOwner ? (
          <>
            <TouchableOpacity
              className="flex-1 bg-primary h-14 rounded-full flex-row items-center justify-center shadow-lg"
              style={{ backgroundColor: "#FF4F18" }}
              disabled={isGettingChat}
              onPress={async () => {
                if (!isAuthenticated) {
                  router.push("/(auth)/login");
                } else if (ad.seller?.id) {
                  try {
                    const chat = await getOrCreateChat({
                      participant2_id: ad.seller.id,
                      ad_id: ad.id,
                    });

                    recordInteraction({
                      seller_id: ad.seller.id,
                      source: "phone_view", 
                      ad_id: ad.id,
                    }).catch(console.error);

                    router.push(`/messages/${chat.id}`);
                  } catch (error) {
                    showAlert({
                      title: t('common.error'),
                      message:
                        t('chat.startError'),
                      icon: "alert-circle-outline",
                      iconColor: "#ef4444",
                      buttons: [{ text: t('common.ok') }],
                    });
                  }
                }
              }}
            >
              {isGettingChat ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="white"
                  />
                  <AppText weight="bold" className="text-white ml-2 text-lg">
                    {t('ads.chat')}
                  </AppText>
                </>
              )}
            </TouchableOpacity>

            {ad.seller?.phone && (
              <TouchableOpacity
                className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center border border-gray-200"
                onPress={() => {
                  if (isAuthenticated && ad.seller?.id) {
                    recordInteraction({
                      seller_id: ad.seller.id,
                      source: "phone_view",
                      ad_id: ad.id,
                    }).catch(console.error);
                  }
                  Linking.openURL(`tel:${ad.seller.phone}`);
                }}
              >
                <Ionicons name="call" size={22} color="#0f172b" />
              </TouchableOpacity>
            )}
          </>
        ) : isPreview ? (
          <TouchableOpacity
            className="flex-1 bg-primary h-14 rounded-full flex-row items-center justify-center shadow-lg"
            style={{ backgroundColor: "#FF4F18" }}
            disabled={updateAdMutation.isPending}
            onPress={handlePublish}
          >
            {updateAdMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="white" />
                <AppText weight="bold" className="text-white ml-2 text-lg">
                  {t('ads.publishNow')}
                </AppText>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="flex-1 bg-gray-900 h-14 rounded-full flex-row items-center justify-center"
            onPress={() => router.push(`/ads/edit/${ad.slug}`)}
          >
            <Ionicons name="create-outline" size={22} color="white" />
            <AppText weight="bold" className="text-white ml-2 text-lg">
              {t('ads.editListing')}
            </AppText>
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
