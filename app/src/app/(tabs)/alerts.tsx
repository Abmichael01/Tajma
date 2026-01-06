import { View, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppText from "@/components/ui/AppText";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import Skeleton from "@/components/ui/Skeleton";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return { name: 'chatbubble-ellipses', color: '#2563eb' };
    case 'phone_view':
      return { name: 'call', color: '#9333ea' };
    case 'favorite':
      return { name: 'heart', color: '#ef4444' };
    case 'review':
      return { name: 'star', color: '#eab308' };
    case 'ad_view':
      return { name: 'eye', color: '#10b981' };
    case 'ad_status':
      return { name: 'information-circle', color: '#3b82f6' };
    default:
      return { name: 'notifications', color: '#6b7280' };
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

  if (diffMs < 60000) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default function AlertsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const [refreshing, setRefreshing] = useState(false);

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
      // Navigate to user profile
      const slug = notification.related_user_name || notification.related_user;
      router.push(`/users/${slug}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-4">
        <Ionicons name="lock-closed-outline" size={64} color="#9ca3af" />
        <AppText variant="heading" weight="bold" className="mt-4 mb-2 text-gray-900">
          Sign In Required
        </AppText>
        <AppText variant="default" className="text-gray-600 text-center mb-6">
          Please sign in to view your alerts and notifications.
        </AppText>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          className="bg-primary px-6 py-3 rounded-full"
        >
          <AppText weight="semibold" className="text-white">Sign In</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const hasNotifications = notifications && notifications.length > 0;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText variant="heading" weight="bold" className="text-gray-900">
              Alerts
            </AppText>
            {unreadCount > 0 && (
              <AppText variant="default" className="text-gray-500 mt-1">
                {unreadCount} unread
              </AppText>
            )}
          </View>
          {hasNotifications && unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              className="px-4 py-2 rounded-full bg-gray-100"
            >
              <AppText weight="medium" className="text-gray-700 text-sm">
                Mark all read
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View className="flex-1 px-4 py-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <View key={idx} className="mb-4">
              <View className="flex-row gap-3">
                <Skeleton className="w-12 h-12 rounded-full" variant="circular" />
                <View className="flex-1">
                  <Skeleton variant="text" className="w-3/4 h-5 mb-2" />
                  <Skeleton variant="text" className="w-full h-4 mb-1" />
                  <Skeleton variant="text" className="w-1/2 h-3" />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : !hasNotifications ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
          <AppText variant="heading" weight="semibold" className="mt-4 mb-2 text-gray-900">
            No Alerts
          </AppText>
          <AppText variant="default" className="text-gray-500 text-center">
            You're all caught up! No new notifications.
          </AppText>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="px-4 py-4">
            {notifications.map((notification) => {
              const icon = getNotificationIcon(notification.type);
              return (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  className={`mb-4 p-4 rounded-xl border ${
                    notification.is_read
                      ? 'bg-white border-gray-100'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <View className="flex-row gap-3">
                    {/* Icon */}
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        notification.is_read ? 'bg-gray-100' : 'bg-white'
                      }`}
                    >
                      <Ionicons name={icon.name as any} size={24} color={icon.color} />
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between gap-2 mb-1">
                        <AppText
                          weight={notification.is_read ? 'medium' : 'semibold'}
                          className={`flex-1 ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}
                        >
                          {notification.title}
                        </AppText>
                        {!notification.is_read && (
                          <View className="w-2 h-2 rounded-full bg-primary mt-1" />
                        )}
                      </View>
                      <AppText
                        variant="default"
                        className={`text-sm mb-2 ${notification.is_read ? 'text-gray-600' : 'text-gray-700'}`}
                      >
                        {notification.message}
                      </AppText>
                      <View className="flex-row items-center justify-between">
                        <AppText variant="default" className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </AppText>
                        <View className="flex-row gap-2">
                          {!notification.is_read && (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="px-3 py-1 rounded-full bg-white"
                            >
                              <AppText weight="medium" className="text-xs text-gray-600">
                                Mark read
                              </AppText>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="px-3 py-1 rounded-full bg-gray-100"
                          >
                            <Ionicons name="trash-outline" size={14} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
