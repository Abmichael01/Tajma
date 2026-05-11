import { View, Animated, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";
import { useLogout, useCurrentUser } from "@/hooks/useAuth";
import { useUserAds } from "@/hooks/useAds";
import { useTranslation } from "react-i18next";

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 115 : 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: currentUser } = useCurrentUser();
  const { alertConfig, showAlert, hideAlert } = useAlert();

  const displayUser = currentUser || user;
  const { data: allAds, refetch: refetchAds } = useUserAds(displayUser?.id);
  const { refetch: refetchUser } = useCurrentUser();
  const logoutMutation = useLogout();

  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAds(), refetchUser()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    showAlert({
      title: t('profile.logoutConfirmTitle'),
      message: t('profile.logoutConfirmMessage'),
      icon: "log-out-outline",
      iconColor: "#ef4444",
      buttons: [
        { text: t('common.cancel'), style: "cancel" },
        { text: t('profile.logoutConfirmTitle'), style: "destructive", onPress: () => logoutMutation.mutate() },
      ]
    });
  };

  if (!displayUser) return null;

  const fullName = displayUser.full_name || `${displayUser.first_name || ""} ${displayUser.last_name || ""}`.trim() || displayUser.username || "User";
  const initials = (displayUser.first_name?.[0] || "") + (displayUser.last_name?.[0] || "") || displayUser.username?.[0] || "U";
  
  const ads = allAds || [];
  const totalAds = ads.length;
  const extendedUser = displayUser as any;
  const avgRating = extendedUser.review_stats?.average_rating || 0;
  const totalReviews = extendedUser.review_stats?.total_reviews || 0;

  // Header Background Animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.5, 1],
    extrapolate: 'clamp',
  });

  const sections = [
    {
      items: [
        { id: 'ads', label: t('profile.myAds'), icon: 'grid-outline', route: '/profile/my-ads', color: '#FF4F18' },
        { id: 'leads', label: t('profile.leads'), icon: 'people-outline', route: '/profile/leads', color: '#10b981' },
        { id: 'favorites', label: t('profile.wishlist'), icon: 'heart-outline', route: '/profile/saved', color: '#FF4F18' },
        { id: 'reviews', label: t('profile.reviews'), icon: 'star-outline', route: '/profile/reviews', color: '#FF4F18' },
      ],
    },
    {
      items: [
        { id: 'kyc', label: t('profile.verifyIdentity'), icon: 'shield-checkmark-outline', route: '/profile/kyc', color: '#FF4F18' },
        { id: 'analytics', label: t('profile.analytics'), icon: 'bar-chart-outline', route: '/profile/analytics', color: '#FF4F18' },
      ],
    },
    {
      items: [
        { id: 'language', label: t('profile.language'), icon: 'globe-outline', route: '/settings/language', color: '#FF4F18', value: i18n.language?.toUpperCase() || 'EN' },
        { id: 'support', label: t('profile.helpSupport'), icon: 'help-circle-outline', route: '/profile/support', color: '#64748b' },
      ],
    },
  ] as const;

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />

      {/* Persistent Top Bar — avatar + name fade in on scroll, settings always visible */}
      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0 z-[2000]">
        <View className="flex-row items-center justify-between px-4 py-2 h-14">
          <Animated.View
            style={{ opacity: headerOpacity, flex: 1 }}
            className="flex-row items-center"
            pointerEvents="none"
          >
            <Avatar
              src={displayUser.avatar}
              size={36}
              fallback={initials.toUpperCase()}
              className="rounded-full border-2 border-white/40"
            />
            <AppText
              weight="bold"
              numberOfLines={1}
              className="text-white text-base ml-3 flex-1"
            >
              {fullName}
            </AppText>
          </Animated.View>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="w-10 h-10 items-center justify-center rounded-full bg-black/20 ml-2"
          >
            <Ionicons name="settings-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Floating Scroll Header (Just Color) */}
      <Animated.View 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_MIN_HEIGHT,
          backgroundColor: '#FF4F18',
          zIndex: 1000,
          opacity: headerOpacity,
        }}
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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FF4F18"
          />
        }
      >
        {/* Header Background Image */}
        <View style={{ height: HEADER_MAX_HEIGHT, overflow: 'hidden' }}>
          <Animated.Image
            source={require("@/assets/images/profile-card-bg.jpg")}
            style={{
              width: '100%',
              height: '100%',
              transform: [{ translateY: imageTranslateY }, { scale: imageScale }]
            }}
            resizeMode="cover"
          />
        </View>

        {/* Profile Content */}
        <View className="px-6 -mt-16">
          <View className="items-center">
            <View className="p-1 bg-white rounded-full shadow-lg">
              <Avatar 
                src={displayUser.avatar} 
                size={110} 
                fallback={initials.toUpperCase()} 
                className="rounded-full"
              />
              {displayUser.is_verified && (
                <View className="absolute bottom-1 right-1 w-7 h-7 bg-primary rounded-full border-2 border-white items-center justify-center">
                  <Ionicons name="shield-checkmark" size={12} color="white" />
                </View>
              )}
            </View>

            <View className="items-center mt-4">
              <AppText variant="subheading" weight="bold" className="text-gray-900 text-2xl">{fullName}</AppText>
              <AppText className="text-gray-400 font-medium text-sm mt-1">{displayUser.email || (displayUser.username ? `@${displayUser.username}` : "")}</AppText>
            </View>
          </View>

          {/* Stats Bar */}
          <View className="flex-row bg-white rounded-3xl p-6 mt-8 justify-between border border-gray-100">
            {[
              { label: t('profile.listings'), value: totalAds },
              { label: t('profile.reviews'), value: totalReviews },
              { label: t('profile.reputation'), value: avgRating.toFixed(1) },
            ].map((stat, i) => (
              <View key={i} className={`items-center flex-1 ${i < 2 ? 'border-r border-gray-100' : ''}`}>
                <AppText weight="bold" className="text-gray-900 text-xl">{stat.value}</AppText>
                <AppText className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">{stat.label}</AppText>
              </View>
            ))}
          </View>

          {/* Seller Setup Banner */}
          {!displayUser.is_seller_account_setup && (
            <TouchableOpacity
              onPress={() => router.push("/seller/setup")}
              activeOpacity={0.8}
              className="mt-6 bg-primary rounded-3xl p-6 flex-row items-center shadow-lg shadow-primary/20"
            >
              <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                <Ionicons name="storefront-outline" size={24} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <AppText weight="bold" className="text-white text-base">
                  {t('profile.completeSetupTitle')}
                </AppText>
                <AppText className="text-white/80 text-xs mt-0.5">
                  {t('profile.completeSetupDesc')}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}

          {/* Grouped Action Sections */}
          <View className="mt-6 pb-32">
            {sections.map((section, sectionIdx) => (
              <View key={sectionIdx} className="bg-white rounded-3xl mb-4 overflow-hidden border border-gray-100">
                {section.items.map((item, itemIdx) => {
                  const isLast = itemIdx === section.items.length - 1;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => router.push(item.route as any)}
                      activeOpacity={0.6}
                      className={`px-5 py-4 flex-row items-center ${isLast ? '' : 'border-b border-gray-100'}`}
                    >
                      <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-50">
                        <Ionicons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <AppText weight="bold" className="text-gray-800 ml-4 flex-1">{item.label}</AppText>
                      {(item as any).value && (
                        <AppText weight="bold" className="text-gray-400 text-xs mr-2">{(item as any).value}</AppText>
                      )}
                      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Sign Out — its own card */}
            <View className="bg-white rounded-3xl mt-2 overflow-hidden border border-gray-100">
              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.6}
                className="px-5 py-4 flex-row items-center justify-center"
              >
                <Ionicons name="log-out-outline" size={22} color="#dc2626" />
                <AppText weight="bold" className="text-red-600 ml-3">{t('profile.signOut')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
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
