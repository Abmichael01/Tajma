import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AppText from '@/components/ui/AppText';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useUserAds } from '@/hooks/useAds';
import { useSavedAds } from '@/hooks/useSavedAds';
import { useCurrentUser } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: currentUser, refetch: refetchUser } = useCurrentUser();
  const displayUser = currentUser || user;
  
  const { data: allAds, refetch: refetchAds } = useUserAds(displayUser?.id);
  const { data: savedAdsData } = useSavedAds(1, 1);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAds(), refetchUser()]);
    setRefreshing(false);
  };

  if (!displayUser) return null;

  // Stats Calculation
  const ads = allAds || [];
  const totalAds = ads.length;
  const activeAds = ads.filter((ad: any) => ad.status === 'published').length;
  const soldItems = ads.filter((ad: any) => ad.status === 'archived').length;
  const totalViews = ads.reduce((sum: number, ad: any) => sum + (ad.views || 0), 0);
  const extendedUser = displayUser as any;
  const responseRate = extendedUser.response_stats?.response_rate_1h ?? 0;
  const savedAdsCount = savedAdsData?.count || 0;
  const avgRating = extendedUser.review_stats?.average_rating || 0;
  
  const joinedDays = (() => {
    if (!displayUser.date_joined) return 0;
    const joined = new Date(displayUser.date_joined);
    if (isNaN(joined.getTime())) return 0;
    const diff = Date.now() - joined.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  })();

  const stats = [
    { icon: 'document-text-outline', label: t('analytics.totalAds'), value: totalAds.toLocaleString(), color: '#FF4F18' },
    { icon: 'eye-outline', label: t('analytics.views'), value: totalViews.toLocaleString(), color: '#FF4F18' },
    { icon: 'trending-up-outline', label: t('analytics.active'), value: activeAds.toLocaleString(), color: '#FF4F18' },
    { icon: 'chatbubble-ellipses-outline', label: t('analytics.response'), value: `${responseRate}%`, color: '#FF4F18' },
    { icon: 'time-outline', label: t('analytics.daysActive'), value: joinedDays.toLocaleString(), color: '#64748b' },
    { icon: 'heart-outline', label: t('analytics.favorites'), value: savedAdsCount.toLocaleString(), color: '#64748b' },
    { icon: 'checkmark-circle-outline', label: t('analytics.sold'), value: soldItems.toLocaleString(), color: '#64748b' },
    { icon: 'star-outline', label: t('analytics.rating'), value: avgRating.toFixed(1), color: '#64748b' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScreenHeader 
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4F18" />
        }
      >
        <View className="px-6 py-8">
            <AppText weight="bold" className="text-2xl text-gray-900 mb-2">{t('analytics.globalTitle')}</AppText>
            <AppText className="text-gray-500 mb-8">{t('analytics.globalDesc')}</AppText>

            {/* Performance Insights (Simplified Pill List) */}
            <View className="mb-10 space-y-4">
                {stats.map((stat, i) => (
                    <View 
                        key={i} 
                        className="bg-white p-4 rounded-full flex-row items-center justify-between border border-gray-100"
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="w-12 h-12 rounded-full bg-gray-50 items-center justify-center mr-4">
                                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                            </View>
                            <View>
                                <AppText weight="bold" className="text-gray-900 text-base">{stat.label}</AppText>
                                <AppText className="text-gray-500 text-[10px]">{t('analytics.realtime')}</AppText>
                            </View>
                        </View>
                        <View className="pr-4">
                            <AppText weight="bold" className="text-gray-900 text-xl">{stat.value}</AppText>
                        </View>
                    </View>
                ))}
            </View>

            {/* Performance Banner Cards */}
            <View className="mt-6 space-y-8">
                <View className="bg-white border border-gray-100 rounded-[32px] p-6">
                    <View className="flex-row items-center mb-6">
                        <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
                            <Ionicons name="trending-up" size={24} color="#FF4F18" />
                        </View>
                        <View>
                            <AppText weight="bold" className="text-gray-900 text-lg">{t('analytics.engagement')}</AppText>
                            <AppText className="text-gray-500 text-xs">{t('analytics.engagementDesc')}</AppText>
                        </View>
                    </View>
                                        <View className="flex-row justify-between pt-4 border-t border-gray-200/50">
                        <View>
                            <AppText className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('analytics.avgViews')}</AppText>
                            <AppText weight="bold" className="text-gray-900 text-xl">{Math.round(totalViews / (totalAds || 1))}</AppText>
                        </View>
                        <View className="items-center">
                            <AppText className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('analytics.conversion')}</AppText>
                            <AppText weight="bold" className="text-gray-900 text-xl">{Math.round((soldItems / (totalAds || 1)) * 100)}%</AppText>
                        </View>
                        <View className="items-end">
                            <AppText className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('analytics.growth')}</AppText>
                            <AppText weight="bold" className="text-green-500 text-xl">+12%</AppText>
                        </View>
                    </View>
                </View>

                {/* Trust Section */}
                <View className="mt-8 bg-gray-900 rounded-[32px] p-8 relative overflow-hidden">
                    <View className="absolute top-[-20] right-[-20] w-40 h-40 bg-primary/20 rounded-full blur-[40px]" />
                    
                    <View className="flex-row items-center justify-between mb-6">
                        <AppText weight="bold" className="text-white text-xl">{t('profile.trustLevel')}</AppText>
                        <View className="bg-white/10 px-3 py-1 rounded-full">
                            <AppText className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{t('profile.verified')}</AppText>
                        </View>
                    </View>

                    <View className="flex-row items-baseline mb-2">
                        <AppText weight="bold" className="text-white text-5xl">{avgRating.toFixed(1)}</AppText>
                        <AppText className="text-white/40 text-lg ml-2">/ 5.0</AppText>
                    </View>

                    <View className="flex-row items-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Ionicons 
                                key={i} 
                                name={i <= Math.round(avgRating) ? "star" : "star-outline"} 
                                size={14} 
                                color={i <= Math.round(avgRating) ? "#fbbf24" : "#4b5563"} 
                            />
                        ))}
                        <AppText className="text-white/60 text-xs ml-2">{t('analytics.excellentReputation')}</AppText>
                    </View>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-white/10 p-4 rounded-full border border-white/10 flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3">
                                <Ionicons name="chatbubble-outline" size={16} color="white" />
                            </View>
                            <View>
                                <AppText className="text-white/40 text-[9px] font-bold uppercase mb-0.5">{t('analytics.response')}</AppText>
                                <AppText weight="bold" className="text-white text-base">{responseRate}%</AppText>
                            </View>
                        </View>
                        <View className="flex-1 bg-white/10 p-4 rounded-full border border-white/10 flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3">
                                <Ionicons name="cart-outline" size={16} color="white" />
                            </View>
                            <View>
                                <AppText className="text-white/40 text-[9px] font-bold uppercase mb-0.5">{t('analytics.sales')}</AppText>
                                <AppText weight="bold" className="text-white text-base">{soldItems}</AppText>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
      </ScrollView>
    </View>
  );
}
