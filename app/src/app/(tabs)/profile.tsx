import { View, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";
import { useLogout, useCurrentUser } from "@/hooks/useAuth";
import { useUserAds } from "@/hooks/useAds";
import { useSavedAds } from "@/hooks/useSavedAds";
import { useTranslation } from "react-i18next";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: currentUser } = useCurrentUser();
  const { alertConfig, showAlert, hideAlert } = useAlert();

  const displayUser = currentUser || user;
  const { data: allAds, refetch: refetchAds } = useUserAds(displayUser?.id);
  const { data: savedAdsData } = useSavedAds(1, 1);
  const { refetch: refetchUser } = useCurrentUser();
  const logoutMutation = useLogout();

  const [refreshing, setRefreshing] = useState(false);

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

  if (!displayUser) {
    return null;
  }

  const fullName = displayUser.full_name || `${displayUser.first_name || ""} ${displayUser.last_name || ""}`.trim() || displayUser.username || "User";
  const initials = (displayUser.first_name?.[0] || "") + (displayUser.last_name?.[0] || "") || displayUser.username?.[0] || "U";

  // Cast for stats
  const extendedUser = displayUser as any;
  const avgRating = extendedUser.review_stats?.average_rating || 0;
  const totalReviews = extendedUser.review_stats?.total_reviews || 0;
  
  // Advanced Stats Calculation
  const ads = allAds || [];
  const totalAds = ads.length;
  
  return (
    <View className="flex-1 bg-gray-50/50">
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4F18" />
        }
      >
        {/* Overscroll Background */}
        <View className="absolute top-[-1000px] left-0 right-0 h-[1000px]" style={{ backgroundColor: '#1e1e1e' }} />

        {/* Mesh Gradient Header */}
        <View style={{ height: 260, backgroundColor: '#0f1115', overflow: 'hidden' }}>
          <View 
            style={{ 
              position: 'absolute', 
              top: -80, 
              right: -80, 
              width: 240, 
              height: 240, 
              borderRadius: 120, 
              backgroundColor: 'rgba(255, 79, 24, 0.25)',
              opacity: 0.8
            }} 
          />
          
          <LinearGradient
            colors={['rgba(17, 24, 39, 0.4)', 'rgba(255, 79, 24, 0.05)', 'rgba(255, 79, 24, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0 }}
          />

          <View className="pt-16 px-6 flex-row justify-between items-center relative z-10">
            <AppText weight="bold" className="text-white text-xl">{t('common.profile')}</AppText>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="settings-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info Section */}
        <View className="px-6 -mt-24">
          <View className="items-center">
            <View className="relative">
              <Avatar
                src={displayUser.avatar}
                size={110}
                fallback={initials.toUpperCase()}
                alt={fullName}
                onPress={() => router.push(`/users/${displayUser.username || displayUser.id}`)}
                className="border-4 border-white shadow-2xl bg-white"
              />
              <View className="absolute bottom-1 right-1 w-7 h-7 bg-green-500 border-4 border-white rounded-full shadow-sm" />
            </View>

            <View className="mt-4 items-center">
              <View className="flex-row items-center">
                <AppText variant="subheading" weight="bold" className="text-gray-900 text-2xl">{fullName}</AppText>
                {displayUser.is_verified ? (
                  <Ionicons name="checkmark-circle" size={24} color="#FF4F18" style={{ marginLeft: 6 }} />
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push("/profile/kyc")}
                    className="ml-2 bg-primary/10 px-2 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons name="shield-checkmark-outline" size={14} color="#FF4F18" />
                    <AppText className="text-primary text-[10px] ml-1 font-bold uppercase">
                      {displayUser.kyc_status === 'pending' ? t('profile.pending') : t('profile.verifyIdentity')}
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
              <AppText className="text-gray-500 font-medium text-sm mt-1">{displayUser.email}</AppText>
            </View>
          </View>

          {/* Stats Bar */}
          <View className="flex-row bg-white rounded-[32px] p-6 mt-8 border border-gray-100 justify-between">
            {[
              { label: t('profile.listings'), value: totalAds },
              { label: t('profile.reviews'), value: totalReviews },
              { label: t('profile.reputation'), value: avgRating.toFixed(1) },
            ].map((stat, i) => (
              <View key={i} className={`items-center flex-1 ${i < 2 ? 'border-r border-gray-50' : ''}`}>
                <AppText weight="bold" className="text-primary text-xl">{stat.value}</AppText>
                <AppText className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">{stat.label}</AppText>
              </View>
            ))}
          </View>

          {/* Performance Highlight Link */}
          <TouchableOpacity 
            onPress={() => router.push("/profile/analytics")}
            className="mt-6 bg-white p-5 rounded-[24px] flex-row items-center border border-gray-100"
          >
            <View className="w-10 h-10 rounded-full bg-primary/5 items-center justify-center">
                <Ionicons name="bar-chart-outline" size={22} color="#FF4F18" />
            </View>
            <View className="ml-4 flex-1">
                <AppText weight="bold" className="text-gray-900">{t('profile.analytics')}</AppText>
                <AppText className="text-gray-500 text-[10px]">{t('profile.analyticsDesc')}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View className="mt-8">
          {/* Main Actions */}
          <View className="px-6 space-y-3">
            {[
              { id: 'ads', label: t('profile.myAds'), icon: 'grid-outline', route: '/profile/my-ads', color: '#FF4F18' },
              { id: 'leads', label: t('profile.leads'), icon: 'people-outline', route: '/profile/leads', color: '#10b981' },
              { id: 'favorites', label: t('profile.wishlist'), icon: 'heart-outline', route: '/profile/saved', color: '#FF4F18' },
              { id: 'language', label: t('profile.language'), icon: 'globe-outline', route: '/settings/language', color: '#3b82f6', value: i18n.language.toUpperCase() },
            ].map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                className="bg-white p-5 rounded-[24px] flex-row items-center border border-gray-100"
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
            ))}
          </View>

          {/* Support & Legal Section */}
          <View className="px-6 mt-8 pb-32 space-y-3">
            <AppText weight="bold" className="text-gray-400 text-[10px] uppercase tracking-widest ml-4 mb-2">
                {t('profile.supportLegal')}
            </AppText>
            {[
              { label: t('profile.helpSupport'), icon: 'help-circle-outline', route: '/profile/support' },
              { label: t('profile.legalTerms'), icon: 'document-text-outline', route: '/legal' },
              { label: t('profile.shareApp'), icon: 'share-social-outline', route: '/share' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => item.route && router.push(item.route as any)}
                className="flex-row items-center p-5 bg-white rounded-[24px] border border-gray-100"
              >
                <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center">
                  <Ionicons name={item.icon as any} size={22} color="#64748b" />
                </View>
                <AppText weight="bold" className="text-gray-700 ml-4 flex-1">{item.label}</AppText>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              onPress={handleLogout}
              className="mt-8 flex-row items-center justify-center p-5 bg-white rounded-[24px] border border-red-50"
            >
              <Ionicons name="log-out-outline" size={24} color="#dc2626" />
              <AppText weight="bold" className="text-red-600 ml-3">{t('profile.signOut')}</AppText>
            </TouchableOpacity>
          </View>
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
