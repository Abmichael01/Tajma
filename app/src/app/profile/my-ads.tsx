import { View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";
import { useUserAds, useDeleteAd, useUpdateAd } from "@/hooks/useAds";
import ScreenHeader from "@/components/ui/ScreenHeader";
import HorizontalAdCard from "@/components/ads/HorizontalAdCard";

function MyAdItem({ ad }: { ad: any }) {
  const router = useRouter();
  const deleteAd = useDeleteAd(ad.slug || ad.id);
  const updateAd = useUpdateAd(ad.slug || ad.id);
  const { alertConfig, showAlert, hideAlert } = useAlert();

  const handleDelete = () => {
    showAlert({
      title: "Delete Ad",
      message: "Are you sure you want to delete this listing? This action cannot be undone.",
      icon: "trash-outline",
      iconColor: "#ef4444",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteAd.mutate() }
      ]
    });
  };

  const handleToggleStatus = () => {
    const newStatus = ad.status === 'published' ? 'archived' : 'published';
    updateAd.mutate({ status: newStatus });
  };

  return (
    <View className="mb-4 mx-6">
      <HorizontalAdCard ad={ad} showStatus />

      <View className="flex-row items-center gap-2 mt-[-8px] px-2 mb-2">
        <TouchableOpacity
          onPress={handleToggleStatus}
          disabled={updateAd.isPending}
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl border ${ad.status === 'published' ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}
        >
          <Ionicons
            name={ad.status === 'published' ? "eye-off-outline" : "eye-outline"}
            size={16}
            color={ad.status === 'published' ? "#6b7280" : "#16a34a"}
          />
          <AppText
            weight="semibold"
            className={`ml-1.5 text-sm ${ad.status === 'published' ? 'text-gray-600' : 'text-green-600'}`}
          >
            {ad.status === 'published' ? 'Archive' : 'Make Live'}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/ads/edit/${ad.slug || ad.id}`)}
          className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl bg-gray-900 border border-gray-900"
        >
          <Ionicons name="create-outline" size={16} color="white" />
          <AppText weight="semibold" className="text-white ml-1.5 text-sm">Edit</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleteAd.isPending}
          className="w-12 h-10 items-center justify-center rounded-xl bg-red-50 border border-red-100"
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
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
    </View>
  );
}

export default function MyAdsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: adsData, isLoading, refetch, isRefetching } = useUserAds(user?.id);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'archived' | 'draft'>('all');

  const ads = Array.isArray(adsData) ? adsData : ((adsData as any)?.results || []);

  // Filter ads based on selected status
  const filteredAds = statusFilter === 'all'
    ? ads
    : ads.filter((ad: any) => ad.status === statusFilter);

  const handleCreateAd = () => {
    router.push("/(tabs)/add");
  };

  const filters = [
    { value: 'all', label: 'All', icon: 'apps' },
    { value: 'published', label: 'Active', icon: 'checkmark-circle' },
    { value: 'archived', label: 'Archived', icon: 'archive' },
    { value: 'draft', label: 'Draft', icon: 'create' },
  ] as const;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="My Listings"
        rightElement={
          <TouchableOpacity
            onPress={handleCreateAd}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-md transform rotate-[-5deg]"
          >
            <Ionicons name="add" size={24} color="#FF4F18" />
          </TouchableOpacity>
        }
      />

      {isLoading && !isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF4F18" />
        </View>
      ) : (
        <FlatList
          data={filteredAds}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MyAdItem ad={item} />}
          className="flex-1"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF4F18" />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Filter Bar */}
              <View className="px-6 mb-6">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {filters.map((filter) => (
                    <TouchableOpacity
                      key={filter.value}
                      onPress={() => setStatusFilter(filter.value)}
                      className={`flex-row items-center gap-2 px-4 py-2.5 rounded-full border ${statusFilter === filter.value
                        ? 'bg-secondary border-secondary'
                        : 'bg-white border-gray-200'
                        }`}
                    >
                      <Ionicons
                        name={filter.icon as any}
                        size={16}
                        color={statusFilter === filter.value ? '#ffffff' : '#6b7280'}
                      />
                      <AppText
                        weight={statusFilter === filter.value ? 'bold' : 'medium'}
                        className={statusFilter === filter.value ? 'text-white' : 'text-gray-600'}
                      >
                        {filter.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Title - Only if ads exist */}
              {filteredAds.length > 0 && (
                <View className="flex-row items-center justify-between mb-8 px-6">
                  <AppText weight="bold" className="text-gray-900 text-xl">
                    {statusFilter === 'all' ? 'Your Ads' : `${filters.find(f => f.value === statusFilter)?.label} Ads`}
                  </AppText>
                  <View className="bg-primary-50 px-3 py-1 rounded-full">
                    <AppText weight="bold" className="text-[#FF4F18] text-xs">
                      {filteredAds.length} Total
                    </AppText>
                  </View>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24">
              <View className="w-28 h-28 bg-primary-50 rounded-[40px] items-center justify-center mb-8">
                <Ionicons name="megaphone-outline" size={48} color="#FF4F18" />
              </View>
              <AppText weight="bold" className="text-gray-900 mb-2 text-2xl text-center">
                No active ads
              </AppText>
              <AppText className="text-gray-500 text-center px-12 mb-10 leading-6 text-base">
                Ready to sell? Post your first ad and start earning today!
              </AppText>
              <TouchableOpacity
                onPress={handleCreateAd}
                className="bg-[#FF4F18] px-10 py-4 rounded-2xl flex-row items-center shadow-xl"
              >
                <Ionicons name="add" size={24} color="white" className="mr-2" />
                <AppText weight="bold" className="text-white text-lg">Create Listing</AppText>
              </TouchableOpacity>
            </View>
          }
          windowSize={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
}
