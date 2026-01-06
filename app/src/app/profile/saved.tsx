import { View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import BackButton from "@/components/ui/BackButton";
import { useSavedAds, useToggleSaveAd } from "@/hooks/useSavedAds";
import AdCard from "@/components/ads/AdCard";

export default function SavedAdsScreen() {
  const router = useRouter();
  const { data: savedAdsData, isLoading, refetch, isRefetching } = useSavedAds();
  const toggleFavoriteMutation = useToggleSaveAd();
  
  const savedAds = Array.isArray(savedAdsData) ? savedAdsData : ((savedAdsData as any)?.results || []);

  const handleToggleFavorite = (adId: string) => {
    toggleFavoriteMutation.mutate(adId);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-14 pb-4 bg-white border-b border-gray-200 flex-row items-center">
         <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <AppText variant="heading" weight="semibold">Saved Ads</AppText>
      </View>

      {isLoading && !isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#cb234a" />
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-4 pt-4"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#cb234a" />
          }
        >
          {savedAds.length > 0 ? (
            <View className="pb-8">
              <AppText variant="default" className="text-gray-500 mb-4">
                {savedAds.length} saved {savedAds.length === 1 ? 'item' : 'items'}
              </AppText>
              
              <View className="flex-row flex-wrap justify-between">
                {savedAds.map((ad: any) => (
                  <View key={ad.id} className="w-[48%] mb-4">
                    <AdCard 
                      ad={{ ...ad, is_saved: true }} 
                      onToggleFavorite={() => handleToggleFavorite(ad.id)}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20 min-h-[500px]">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="heart-outline" size={32} color="#9ca3af" />
              </View>
              <AppText variant="heading" weight="medium" className="text-gray-900 mb-2">
                No saved ads
              </AppText>
              <AppText variant="default" className="text-gray-500 text-center px-8 mb-6">
                Items you save will appear here.
              </AppText>
              <Link href="/(tabs)" asChild>
                <TouchableOpacity className="bg-primary px-6 py-3 rounded-full">
                  <AppText weight="semibold" className="text-white">Start Browsing</AppText>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
