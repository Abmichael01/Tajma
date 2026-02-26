import { View, ScrollView, TouchableOpacity, RefreshControl, Linking, Alert, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserAds } from "@/hooks/useAds";
import { useSellerReviews } from "@/hooks/useReviews";
import { useAuthStore } from "@/store/authStore";
import { useGetOrCreateChat } from "@/hooks/useChat";
import { AdsList, AdsListSkeleton } from "@/components/ads";
import Skeleton from "@/components/ui/Skeleton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import { useCreateNotification } from "@/hooks/useNotifications";
import * as Clipboard from 'expo-clipboard';

type TabType = 'ads' | 'reviews';

export default function UserProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  if (!slug) {
    console.warn('[UserProfileScreen] Missing slug param');
  } else {
    console.log('[UserProfileScreen] Fetching profile for slug:', slug);
  }

  const router = useRouter();
  const { alertConfig, showAlert, hideAlert } = useAlert();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useUserProfile(slug);
  const userId = profile?.id ? (typeof profile.id === 'string' ? parseInt(profile.id) : profile.id) : undefined;
  const { data: adsData, isLoading: adsLoading, refetch: refetchAds } = useUserAds(userId);
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useSellerReviews(userId);
  const [activeTab, setActiveTab] = useState<TabType>('ads');
  const [refreshing, setRefreshing] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const { mutate: notifyUser } = useCreateNotification();
  const { mutateAsync: getOrCreateChat, isPending: isGettingChat } = useGetOrCreateChat();

  const isOwner = currentUser && profile && String(currentUser.id) === String(profile.id);
  const ads = Array.isArray(adsData) ? adsData : ((adsData as any)?.results || []);
  const reviews = Array.isArray(reviewsData) ? reviewsData : ((reviewsData as any)?.results || []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchAds(), refetchReviews()]);
    setRefreshing(false);
  };

  const getUserName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.username || profile?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getJoinedDays = () => {
    if (!profile?.date_joined) return 0;
    const now = new Date();
    const joined = new Date(profile.date_joined);
    const diffTime = Math.abs(now.getTime() - joined.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (profileLoading) {
    return (
      <View className="flex-1 bg-white">
        <View className="bg-primary px-6 pt-16 pb-6 shadow-sm flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <AppText variant="heading" weight="bold" className="text-white text-3xl">Profile</AppText>
        </View>
        <ScrollView className="flex-1">
          {/* Profile Header Skeleton */}
          <View className="bg-white border-b border-gray-200 px-4 py-8">
            <View className="items-center mb-6">
              <Skeleton className="w-20 h-20 rounded-full mb-4" variant="circular" />
              <Skeleton variant="text" className="w-32 h-6 mb-2" />
              <Skeleton variant="text" className="w-24 h-4 mb-2" />
              <Skeleton variant="text" className="w-40 h-4" />
            </View>
            <View className="flex-row gap-3 mb-6">
              <Skeleton className="flex-1 h-12 rounded-full" />
              <Skeleton className="flex-1 h-12 rounded-full" />
            </View>
          </View>

          {/* Tabs Skeleton */}
          <View className="bg-white border-b border-gray-200 px-4">
            <View className="flex-row gap-2">
              <Skeleton className="flex-1 h-12 rounded-t-lg" />
              <Skeleton className="flex-1 h-12 rounded-t-lg" />
            </View>
          </View>

          {/* Tab Content Skeleton */}
          <View className="px-4 py-6">
            <View className="flex-row flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="w-[48%] h-64 rounded" />
              ))}
            </View>
          </View>
        </ScrollView>
      </View >
    );
  }

  if (profileError || !profile) {
    return (
      <View className="flex-1 bg-white">
        <View className="bg-primary px-6 pt-16 pb-6 shadow-sm flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <AppText variant="heading" weight="bold" className="text-white text-3xl">Profile</AppText>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="person-outline" size={64} color="#9ca3af" />
          <AppText variant="heading" weight="semibold" className="mt-4 mb-2 text-gray-900">
            Profile Not Found
          </AppText>
          <AppText variant="default" className="text-gray-600 text-center mb-6">
            The user profile you're looking for doesn't exist or has been removed.
          </AppText>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-full"
          >
            <AppText weight="semibold" className="text-white">Go Back</AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const userName = getUserName();
  const joinedDays = getJoinedDays();
  const rating = profile.review_stats?.average_rating || 0;
  const totalReviews = profile.review_stats?.total_reviews || 0;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title={isOwner ? "My Profile" : userName}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-8">
          <View className="items-center mb-6">
            <Avatar
              src={profile.avatar || undefined}
              alt={userName}
              fallback={getUserInitials()}
              size={80}
              className="mb-4"
            />

            <View className="flex-row items-center gap-2 mb-2">
              <AppText variant="heading" weight="semibold" className="text-gray-900">
                {userName}
              </AppText>
              {profile.is_verified && (
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
              )}
            </View>

            <View className="flex-row items-center gap-1 mb-3">
              <Ionicons name="star" size={16} color="#eab308" />
              <AppText weight="semibold" className="text-gray-900">
                {rating.toFixed(1)}
              </AppText>
              <AppText variant="default" className="text-gray-500">
                ({totalReviews} reviews)
              </AppText>
              <AppText variant="caption" className="text-gray-400 ml-2">
                • {joinedDays} days
              </AppText>
            </View>

            {profile.location && (
              <View className="flex-row items-center gap-1 mb-2">
                <Ionicons name="location-outline" size={14} color="#6b7280" />
                <AppText variant="default" className="text-gray-600 text-sm">
                  {profile.location}
                </AppText>
              </View>
            )}

            {profile.bio && (
              <AppText variant="default" className="text-gray-600 text-center mt-3 px-4">
                {profile.bio}
              </AppText>
            )}
          </View>

          {/* Action Buttons */}
          {!isOwner && (
            <View className="flex-row gap-3">
              <Button
                size="lg"
                className="flex-1"
                disabled={isGettingChat}
                leftIcon={isGettingChat ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="chatbubble-ellipses-outline" size={20} color="#ffffff" />}
                onPress={async () => {
                  if (!isAuthenticated) {
                    router.push("/(auth)/login");
                  } else if (profile.id) {
                    try {
                      const chat = await getOrCreateChat({
                        participant2_id: profile.id,
                        ad_id: null
                      });
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
                Contact
              </Button>
              {profile.phone && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  leftIcon={<Ionicons name={showPhone ? "call-outline" : "eye-outline"} size={20} color="#ffffff" />}
                  onPress={() => {
                    if (!showPhone) {
                      setShowPhone(true);
                      // Notify user that their number was viewed
                      if (currentUser && profile.id && String(currentUser.id) !== String(profile.id)) {
                        notifyUser({
                          recipient: Number(profile.id),
                          type: 'phone_view',
                          title: 'Phone Number Viewed',
                          message: `${currentUser.full_name || currentUser.username} viewed your phone number on your profile.`,
                          related_user: Number(currentUser.id)
                        });
                      }
                    } else {
                      Linking.openURL(`tel:${profile.phone}`);
                    }
                  }}
                >
                  {showPhone ? "Call" : "Show Number"}
                </Button>
              )}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View className="bg-white border-b border-gray-200 px-4">
          <View className="flex-row gap-2">
            {(['ads', 'reviews'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-t-lg border-b-2 ${activeTab === tab
                  ? 'border-primary'
                  : 'border-transparent'
                  }`}
              >
                <AppText
                  weight={activeTab === tab ? 'semibold' : 'medium'}
                  className={`text-center capitalize ${activeTab === tab ? 'text-primary' : 'text-gray-600'
                    }`}
                >
                  {tab}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View className="flex-1">
          {activeTab === 'ads' && (
            <View className="flex-1">
              {adsLoading ? (
                <AdsListSkeleton />
              ) : ads.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20 px-4 min-h-[300px]">
                  <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                  <AppText variant="default" weight="medium" className="text-gray-500 mt-4">
                    No ads yet
                  </AppText>
                </View>
              ) : (
                <AdsList ads={ads} columns={2} />
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View className="p-4 pb-8">
              {reviewsLoading ? (
                <View>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <View key={idx} className="mb-4 p-4 border border-gray-200 rounded-xl">
                      <Skeleton variant="text" className="w-32 h-5 mb-2" />
                      <Skeleton variant="text" className="w-full h-4 mb-1" />
                      <Skeleton variant="text" className="w-3/4 h-4" />
                    </View>
                  ))}
                </View>
              ) : reviews.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20 min-h-[300px]">
                  <Ionicons name="star-outline" size={48} color="#d1d5db" />
                  <AppText variant="default" weight="medium" className="text-gray-500 mt-4">
                    No reviews yet
                  </AppText>
                </View>
              ) : (
                <View>
                  {reviews.map((review: any) => {
                    const reviewerName = review.reviewer_name || review.reviewer?.full_name || review.reviewer?.first_name || 'User';
                    const reviewerInitials = reviewerName.split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2).toUpperCase();

                    return (
                      <View key={review.id} className="mb-4 p-4 border border-gray-200 rounded-xl">
                        <View className="flex-row items-start gap-3 mb-3">
                          <Avatar
                            src={review.reviewer_avatar || review.reviewer?.avatar}
                            alt={reviewerName}
                            fallback={reviewerInitials}
                            size={40}
                          />
                          <View className="flex-1">
                            <AppText variant="default" weight="medium" className="text-gray-900 mb-1">
                              {reviewerName}
                            </AppText>
                            <View className="flex-row items-center gap-2 mb-2">
                              <View className="flex-row">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Ionicons
                                    key={i}
                                    name={i < review.rating ? 'star' : 'star-outline'}
                                    size={16}
                                    color="#eab308"
                                  />
                                ))}
                              </View>
                              <AppText variant="caption" className="text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </AppText>
                            </View>
                            {review.comment && (
                              <AppText variant="default" className="text-gray-700">
                                {review.comment}
                              </AppText>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>

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

