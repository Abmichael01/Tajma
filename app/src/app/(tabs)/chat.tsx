import { View, ScrollView, TouchableOpacity, RefreshControl, Platform, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AppText from "@/components/ui/AppText";
import ChatListItem from "@/components/chat/ChatListItem";
import ChatListSkeleton from "@/components/chat/ChatListSkeleton";
import { useChats, useOnlineStatuses } from "@/hooks/useChat";
import { useUnifiedChatWebSocket } from "@/hooks/useUnifiedChatWebSocket";
import { useAuthStore } from "@/store/authStore";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useTranslation } from "react-i18next";

const FILTERS = [
  { label: 'chat.filters.all', value: 'all', icon: 'chatbubbles-outline' },
  { label: 'chat.filters.unread', value: 'unread', icon: 'mail-unread-outline' },
];

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: chats, isLoading, refetch } = useChats();
  const { data: onlineStatuses } = useOnlineStatuses();

  // Create a memoized map of online user IDs for O(1) lookup in list items
  const onlineStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!onlineStatuses) return map;
    onlineStatuses.forEach(status => {
      const userId = (status as any).user_id || (status as any).user?.id;
      if (userId) {
        map.set(String(userId), status.is_online);
      }
    });
    return map;
  }, [onlineStatuses]);

  // Enable global WebSocket for notifications/updates when on this screen
  useUnifiedChatWebSocket({ enabled: true });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredChats = useMemo(() => {
    if (!chats) return [];
    const chatsArray = chats as any[];
    if (selectedFilter === 'all') return chatsArray;
    if (selectedFilter === 'unread') return chatsArray.filter(chat => chat.unread_count > 0);
    return chatsArray;
  }, [chats, selectedFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  const unreadCount = chats?.reduce((acc, chat) => acc + (chat.unread_count || 0), 0) || 0;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Header */}
      <ScreenHeader
        title={t('messages.title')}
        subtitle={unreadCount > 0 ? t('messages.unreadCount', { count: unreadCount }) : undefined}
        showBackButton={false}
      />

      {/* Filter Bar */}
      <View className="bg-white border-b border-gray-50 py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(filter.value);
              }}
              className={`flex-row items-center gap-2 px-5 py-2 rounded-full ${selectedFilter === filter.value
                ? 'bg-slate-900 shadow-sm shadow-slate-900/20'
                : 'bg-slate-50 border border-slate-100'
                }`}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedFilter === filter.value ? 'white' : '#64748B'}
              />
              <AppText
                weight="bold"
                className={`text-xs ${selectedFilter === filter.value ? 'text-white' : 'text-slate-600'}`}
              >
                {t(filter.label)}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && (!chats || (chats as any[]).length === 0) ? (
        <ChatListSkeleton />
      ) : filteredChats.length === 0 ? (
        <View className="flex-1 justify-center items-center p-10 bg-slate-50/30">
          <View className="w-24 h-24 rounded-full bg-slate-50 items-center justify-center mb-6">
            <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
          </View>
          <AppText weight="bold" className="text-slate-900 text-xl text-center">
            {selectedFilter === 'all'
              ? t('messages.noConversations')
              : t('messages.noUnread')}
          </AppText>
          <AppText className="text-slate-400 text-center mt-2 px-6">
            {selectedFilter === 'all'
              ? t('messages.conversationsDesc')
              : t('messages.caughtUp')}
          </AppText>
          {selectedFilter !== 'all' && (
            <TouchableOpacity
              onPress={() => setSelectedFilter('all')}
              className="mt-8 bg-white px-8 py-3 rounded-full border border-slate-200"
            >
              <AppText weight="bold" className="text-primary text-[15px]">{t('messages.viewAll')}</AppText>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ChatListItem
              chat={item}
              index={index}
              onlineStatusMap={onlineStatusMap}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4F18" />
          }
          showsVerticalScrollIndicator={false}
          className="flex-1"
          windowSize={10}
          maxToRenderPerBatch={10}
          initialNumToRender={12}
          removeClippedSubviews={Platform.OS === 'android'}
          ListFooterComponent={<View className="h-32" />}
        />
      )}
    </View>
  );
}
