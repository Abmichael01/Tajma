import { View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import BackButton from "@/components/ui/BackButton";
import { useAuthStore } from "@/store/authStore";
import { useUserAds } from "@/hooks/useAds";
import HorizontalAdCard from "@/components/ads/HorizontalAdCard";

export default function MyAdsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: adsData, isLoading, refetch, isRefetching } = useUserAds(user?.id);
  
  const ads = Array.isArray(adsData) ? adsData : ((adsData as any)?.results || []);

  const handleCreateAd = () => {
    // Navigate to create ad screen (add tab)
    router.push("/(tabs)/add");
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-14 pb-4 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <AppText variant="heading" weight="semibold">My Ads</AppText>
        </View>
        <TouchableOpacity onPress={handleCreateAd}>
          <Ionicons name="add-circle-outline" size={28} color="#cb234a" />
        </TouchableOpacity>
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
          {ads.length > 0 ? (
            <View className="pb-8">
              <AppText variant="default" className="text-gray-500 mb-4">
                {ads.length} {ads.length === 1 ? 'listing' : 'listings'} found
              </AppText>
              
              {ads.map((ad: any) => (
                <View key={ad.id} className="mb-1 relative">
                  <HorizontalAdCard ad={ad} showStatus />
                  {/* Edit Button Overlay can be added here or inside the card if needed, 
                      but kept simple for now as per design */}
                  <Link href={`/ads/${ad.slug || ad.id}/edit`} asChild>
                    <TouchableOpacity 
                      className="absolute bottom-6 right-3 bg-white/90 p-2 rounded-full border border-gray-200 shadow-sm"
                      style={{ elevation: 2 }}
                    >
                      <Ionicons name="create-outline" size={20} color="#374151" />
                    </TouchableOpacity>
                  </Link>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20 min-h-[500px]">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="grid-outline" size={32} color="#9ca3af" />
              </View>
              <AppText variant="heading" weight="medium" className="text-gray-900 mb-2">
                No ads yet
              </AppText>
              <AppText variant="default" className="text-gray-500 text-center px-8 mb-6">
                You haven't posted any ads yet. Start selling today!
              </AppText>
              <TouchableOpacity
                onPress={handleCreateAd}
                className="bg-primary px-6 py-3 rounded-full flex-row items-center"
              >
                <Ionicons name="add" size={20} color="white" className="mr-2" />
                <AppText weight="semibold" className="text-white">Post an Ad</AppText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
