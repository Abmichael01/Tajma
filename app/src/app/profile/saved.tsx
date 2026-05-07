import { View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useSavedAds, useToggleSaveAd } from "@/hooks/useSavedAds";
import AdCard from "@/components/ads/AdCard";

export default function SavedAdsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: savedAdsData, isLoading, refetch, isRefetching } = useSavedAds();
  const toggleFavoriteMutation = useToggleSaveAd();

  const savedAds = Array.isArray(savedAdsData) ? savedAdsData : ((savedAdsData as any)?.results || []);

  const handleToggleFavorite = (adId: string) => {
    toggleFavoriteMutation.mutate(adId);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title={t('profile.wishlist')}
        subtitle={savedAds.length > 0 ? t('profile.wishlist_interact.itemsSaved', { count: savedAds.length }) : t('profile.wishlist_interact.yourWishlist')}
      />

      {isLoading && !isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF4F18" />
        </View>
      ) : (
        <FlatList
          data={savedAds}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF4F18" />
          }
          ListHeaderComponent={
            savedAds.length > 0 ? (
              <AppText variant="default" className="text-gray-500 mb-4">
                {savedAds.length} {savedAds.length === 1 ? t('profile.wishlist_interact.item') : t('profile.wishlist_interact.items')}
              </AppText>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 min-h-[500px]">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="heart-outline" size={32} color="#9ca3af" />
              </View>
              <AppText variant="heading" weight="medium" className="text-gray-900 mb-2">
                {t('profile.wishlist_interact.noSavedAdsTitle')}
              </AppText>
              <AppText variant="default" className="text-gray-500 text-center px-8 mb-6">
                {t('profile.wishlist_interact.noSavedAdsDesc')}
              </AppText>
              <Link href="/(tabs)" asChild>
                <TouchableOpacity className="bg-primary px-6 py-3 rounded-full">
                  <AppText weight="semibold" className="text-white">{t('profile.wishlist_interact.startBrowsing')}</AppText>
                </TouchableOpacity>
              </Link>
            </View>
          }
          renderItem={({ item: ad }) => (
            <View className="w-[48%] mb-4">
              <AdCard
                ad={{ ...ad, is_saved: true }}
                onToggleFavorite={() => handleToggleFavorite(ad.id)}
              />
            </View>
          )}
          windowSize={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
}
