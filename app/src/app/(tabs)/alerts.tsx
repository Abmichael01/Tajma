import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppText from "@/components/ui/AppText";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import Skeleton from "@/components/ui/Skeleton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useTranslation } from "react-i18next";

const NOTIFICATION_TYPES = [
  { label: "alerts.types.all", value: "all", icon: "apps-outline" },
  { label: "alerts.types.message", value: "message", icon: "chatbubble-ellipses-outline" },
  { label: "alerts.types.ad_view", value: "ad_view", icon: "eye-outline" },
  { label: "alerts.types.favorite", value: "favorite", icon: "heart-outline" },
  { label: "alerts.types.phone_view", value: "phone_view", icon: "call-outline" },
  { label: "alerts.types.ad_status", value: "ad_status", icon: "information-circle-outline" },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "message":
      return { name: "chatbubble-ellipses", color: "#2563eb" };
    case "phone_view":
      return { name: "call", color: "#9333ea" };
    case "favorite":
      return { name: "heart", color: "#ef4444" };
    case "review":
      return { name: "star", color: "#eab308" };
    case "ad_view":
      return { name: "eye", color: "#10b981" };
    case "ad_status":
      return { name: "information-circle", color: "#3b82f6" };
    default:
      return { name: "notifications", color: "#6b7280" };
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMs < 60000) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default function AlertsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState("all");

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    if (selectedType === "all") return notifications;
    return notifications.filter((n) => n.type === selectedType);
  }, [notifications, selectedType]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleNotificationPress = (notification: any) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.related_ad_slug) {
      router.push(`/ads/${notification.related_ad_slug}`);
    } else if (notification.related_user) {
      const slug = notification.related_user_name || notification.related_user;
      router.push(`/users/${slug}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-4">
        <Ionicons name="lock-closed-outline" size={64} color="#9ca3af" />
        <AppText
          variant="heading"
          weight="bold"
          className="mt-4 mb-2 text-3xl text-gray-900"
        >
          {t('auth.signInRequired')}
        </AppText>
        <AppText
          variant="default"
          className="text-gray-600 text-center mb-6 text-lg"
        >
          {t('auth.signInRequiredDesc')}
        </AppText>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          className="bg-primary px-8 py-4 rounded-full"
        >
          <AppText weight="semibold" className="text-white text-lg">
            {t('auth.signIn')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;
  const hasNotifications = notifications && notifications.length > 0;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      {/* Header */}
      <ScreenHeader
        title={t('common.alerts')}
        subtitle={unreadCount > 0 ? t('alerts.newRequests', { count: unreadCount }) : undefined}
        showBackButton={false}
      />

      {/* Filter Bar & Bulk Action */}
      <View className="bg-white border-b border-gray-50 py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {NOTIFICATION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() => setSelectedType(type.value)}
              className={`flex-row items-center gap-2 px-5 py-2 rounded-full ${
                selectedType === type.value
                  ? "bg-slate-900 shadow-sm shadow-slate-900/20"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <Ionicons
                name={type.icon as any}
                size={16}
                color={selectedType === type.value ? "white" : "#64748B"}
              />
              <AppText
                weight="bold"
                className={`text-xs ${
                  selectedType === type.value ? "text-white" : "text-slate-600"
                }`}
              >
                {t(type.label)}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {hasNotifications && unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            className="mx-6 flex-row items-center justify-center gap-2 py-2 mt-4 bg-primary/5 border border-primary/10 rounded-full"
          >
            <Ionicons name="checkmark-done" size={16} color="#FF4F18" />
            <AppText weight="bold" className="text-primary text-xs uppercase">
              {t('alerts.markAllRead')}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View className="flex-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <View key={idx} className="p-6 border-b border-gray-100">
              <View className="flex-row gap-4">
                <Skeleton
                  className="w-14 h-14 rounded-full"
                  variant="circular"
                />
                <View className="flex-1">
                  <Skeleton variant="text" className="w-2/3 h-5 mb-3" />
                  <Skeleton variant="text" className="w-full h-4 mb-2" />
                  <Skeleton variant="text" className="w-1/2 h-4" />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : filteredNotifications.length === 0 ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF4F18"
            />
          }
        >
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color="#f3f4f6"
          />
          <AppText
            weight="medium"
            className="text-gray-300 mt-6 text-xl text-center"
          >
            {selectedType === "all"
              ? t('alerts.noNotifications')
              : t('alerts.noTypeAlerts', { type: selectedType })}
          </AppText>
          {selectedType !== "all" && (
            <TouchableOpacity
              onPress={() => setSelectedType("all")}
              className="mt-4"
            >
              <AppText className="text-primary font-bold">
                {t('alerts.clearFilters')}
              </AppText>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF4F18"
            />
          }
          showsVerticalScrollIndicator={false}
          className="flex-1"
          windowSize={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === "android"}
          ListFooterComponent={<View className="h-32" />}
          renderItem={({ item: notification }) => {
            const icon = getNotificationIcon(notification.type);
            const isRead = notification.is_read;

            return (
              <TouchableOpacity
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.8}
                className="p-6 bg-transparent"
              >
                <View className="flex-row gap-5 items-center">
                  <View
                    className={`w-14 h-14 rounded-full items-center justify-center ${
                      isRead ? "bg-gray-50" : "bg-[#FF4F18]/5"
                    }`}
                  >
                    <Ionicons
                      name={icon.name as any}
                      size={26}
                      color={isRead ? "#d1d5db" : "#FF4F18"}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <View className="flex-1 flex-row items-center gap-2">
                        {!isRead && (
                          <View className="w-2.5 h-2.5 rounded-full bg-[#FF4F18]" />
                        )}
                        <AppText
                          weight={isRead ? "medium" : "bold"}
                          className={`text-lg ${isRead ? "text-gray-500" : "text-[#2D2D2D]"}`}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </AppText>
                      </View>
                      <AppText className="text-xs text-gray-400 uppercase font-bold">
                        {formatTimeAgo(notification.created_at)}
                      </AppText>
                    </View>

                    <AppText
                      className={`text-base leading-5 ${isRead ? "text-gray-400" : "text-gray-600"}`}
                      numberOfLines={2}
                    >
                      {notification.message}
                    </AppText>
                  </View>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-3"
                  >
                    <Ionicons name="close" size={24} color="#e5e7eb" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
