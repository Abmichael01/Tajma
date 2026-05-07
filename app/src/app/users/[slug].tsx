import { View, Animated, TouchableOpacity, RefreshControl, Linking, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useRef } from "react";
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
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import { useCreateNotification } from "@/hooks/useNotifications";
import ScrollAwareHeader from "@/components/ui/ScrollAwareHeader";
import { useTranslation } from "react-i18next";

type TabType = 'ads' | 'reviews';

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const { slug } = useLocalSearchParams<{ slug: string }>();
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

  const scrollY = useRef(new Animated.Value(0)).current;
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
    return profile?.username || 'User';
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
        <Animated.ScrollView className="flex-1">
          <View className="bg-white border-b border-gray-200 px-4 py-8">
            <View className="items-center mb-6">
              <Skeleton className="w-20 h-20 rounded-full mb-4" variant="circular" />
              <Skeleton variant="text" className="w-32 h-6 mb-2" />
              <Skeleton variant="text" className="w-24 h-4 mb-2" />
              <Skeleton variant="text" className="w-40 h-4" />
            </View>
          </View>
        </Animated.ScrollView>
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
      <StatusBar style="dark" />
      
      <ScrollAwareHeader 
        title={isOwner ? "My Profile" : userName} 
        scrollY={scrollY} 
        showAt={100}
      />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF4F18" />
        }
      >
        {/* Top Header with Back Button */}
        <View className="bg-white px-6 pt-12 pb-4 flex-row items-center">
           <BackButton isStatic />
           <AppText weight="bold" className="text-gray-900 text-2xl ml-4">
              {isOwner ? "My Profile" : userName}
           </AppText>
        </View>

        {/* Profile Info */}
        <View className="bg-white border-b border-gray-100 px-6 py-8">
          <View className="items-center mb-6">
            <Avatar
              src={profile.avatar || undefined}
              alt={userName}
              fallback={getUserInitials()}
              size={100}
              className="mb-5 shadow-lg"
            />

            <View className="flex-row items-center gap-2 mb-2">
              <AppText variant="heading" weight="bold" className="text-gray-900 text-2xl">
                {userName}
              </AppText>
              {profile.is_verified && (
                <Ionicons name="shield-checkmark" size={24} color="#FF4F18" />
              )}
            </View>

            <View className="flex-row items-center gap-1 mb-4">
              <Ionicons name="star" size={18} color="#FF4F18" />
              <AppText weight="bold" className="text-gray-900 text-lg">
                {rating.toFixed(1)}
              </AppText>
              <AppText variant="default" className="text-gray-500 font-medium">
                ({totalReviews} reviews)
              </AppText>
              <AppText variant="caption" className="text-gray-400 ml-2">
                • {joinedDays} days
              </AppText>
            </View>

            {profile.location && (
              <View className="flex-row items-center gap-1 mb-3 bg-gray-50 px-4 py-1.5 rounded-full">
                <Ionicons name="location-outline" size={14} color="#6b7280" />
                <AppText variant="default" className="text-gray-600 text-sm font-medium">
                  {profile.location}
                </AppText>
              </View>
            )}

            {profile.bio && (
              <AppText variant="default" className="text-gray-500 text-center mt-3 px-4 italic">
                "{profile.bio}"
              </AppText>
            )}
          </View>

          {/* Action Buttons */}
          {!isOwner && (
            <View className="flex-row gap-3">
              <TouchableOpacity
                disabled={isGettingChat}
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
                className="flex-1 bg-gray-900 h-14 rounded-full flex-row items-center justify-center shadow-sm"
              >
                {isGettingChat ? (
                   <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#ffffff" />
                    <AppText weight="bold" className="text-white ml-2">Contact</AppText>
                  </>
                )}
              </TouchableOpacity>
              
              {profile.phone && (
                <TouchableOpacity
                  onPress={() => {
                    if (!showPhone) {
                      setShowPhone(true);
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
                  className="flex-1 bg-primary h-14 rounded-full flex-row items-center justify-center shadow-sm"
                  style={{ backgroundColor: '#FF4F18' }}
                >
                  <Ionicons name={showPhone ? "call-outline" : "eye-outline"} size={20} color="#ffffff" />
                  <AppText weight="bold" className="text-white ml-2">
                    {showPhone ? "Call" : "Show Number"}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View className="bg-white border-b border-gray-100 px-6">
          <View className="flex-row gap-8">
            {(['ads', 'reviews'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`py-4 border-b-2 ${activeTab === tab
                  ? 'border-primary'
                  : 'border-transparent'
                  }`}
              >
                <AppText
                  weight={activeTab === tab ? 'bold' : 'bold'}
                  className={`capitalize text-lg ${activeTab === tab ? 'text-primary' : 'text-gray-300'
                    }`}
                >
                  {tab}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View className="flex-1 bg-gray-50/50 pb-20">
          {activeTab === 'ads' && (
            <View className="flex-1">
              {adsLoading ? (
                <AdsListSkeleton />
              ) : ads.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20 px-4 min-h-[300px]">
                  <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="cube-outline" size={32} color="#94a3b8" />
                  </View>
                  <AppText weight="bold" className="text-gray-400">No ads yet</AppText>
                </View>
              ) : (
                <AdsList ads={ads} columns={2} />
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View className="p-6">
              {reviewsLoading ? (
                <View>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <View key={idx} className="mb-4 p-4 border border-gray-100 bg-white rounded-2xl">
                      <Skeleton variant="text" className="w-32 h-5 mb-2" />
                      <Skeleton variant="text" className="w-full h-4 mb-1" />
                    </View>
                  ))}
                </View>
              ) : reviews.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20 min-h-[300px]">
                  <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="star-outline" size={32} color="#94a3b8" />
                  </View>
                  <AppText weight="bold" className="text-gray-400">No reviews yet</AppText>
                </View>
              ) : (
                <View>
                  {reviews.map((review: any) => {
                    const reviewerName = review.reviewer_name || review.reviewer?.full_name || review.reviewer?.first_name || 'User';
                    const reviewerInitials = reviewerName.split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2).toUpperCase();

                    return (
                      <View key={review.id} className="mb-4 p-5 bg-white border border-gray-100 rounded-[24px]">
                        <View className="flex-row items-start gap-3 mb-4">
                          <Avatar
                            src={review.reviewer_avatar || review.reviewer?.avatar}
                            alt={reviewerName}
                            fallback={reviewerInitials}
                            size={44}
                          />
                          <View className="flex-1">
                            <AppText weight="bold" className="text-gray-900 mb-1">
                              {reviewerName}
                            </AppText>
                            <View className="flex-row items-center gap-2">
                              <View className="flex-row">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Ionicons
                                    key={i}
                                    name={i < review.rating ? 'star' : 'star-outline'}
                                    size={14}
                                    color="#FF4F18"
                                  />
                                ))}
                              </View>
                              <AppText variant="caption" className="text-gray-400">
                                {new Date(review.created_at).toLocaleDateString()}
                              </AppText>
                            </View>
                          </View>
                        </View>
                        {review.comment && (
                          <AppText className="text-gray-600 leading-5">
                            {review.comment}
                          </AppText>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>

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
