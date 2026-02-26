import { View, ScrollView, TouchableOpacity, RefreshControl, Platform, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppText from "@/components/ui/AppText";
import ChatListItem from "@/components/chat/ChatListItem";
import ChatListSkeleton from "@/components/chat/ChatListSkeleton";
import { useChats, useOnlineStatuses } from "@/hooks/useChat";
import { useUnifiedChatWebSocket } from "@/hooks/useUnifiedChatWebSocket";
import { useAuthStore } from "@/store/authStore";
import ScreenHeader from "@/components/ui/ScreenHeader";

const FILTERS = [
  { label: 'All Messages', value: 'all', icon: 'chatbubbles-outline' },
  { label: 'Unread', value: 'unread', icon: 'mail-unread-outline' },
];

export default function ChatScreen() {
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
    if (selectedFilter === 'all') return chats;
    if (selectedFilter === 'unread') return chats.filter(chat => chat.unread_count > 0);
    return chats;
  }, [chats, selectedFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  const unreadCount = chats?.reduce((acc, chat) => acc + chat.unread_count, 0) || 0;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Header */}
      <ScreenHeader
        title="Messages"
        subtitle={unreadCount > 0 ? `${unreadCount} unread messages` : undefined}
        showBackButton={false}
      />

      {/* Filter Bar */}
      <View className="bg-white border-b border-border py-3.5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => setSelectedFilter(filter.value)}
              className={`flex-row items-center gap-2 px-6 py-2.5 rounded-full border ${selectedFilter === filter.value
                ? 'bg-secondary border-secondary'
                : 'bg-white border-border'
                }`}
            >
              <Ionicons
                name={filter.icon as any}
                size={18}
                color={selectedFilter === filter.value ? 'white' : '#6b7280'}
              />
              <AppText
                weight={selectedFilter === filter.value ? 'bold' : 'medium'}
                className={`text-base ${selectedFilter === filter.value ? 'text-white' : 'text-gray-500'}`}
              >
                {filter.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chats List */}
      {isLoading && (!chats || chats.length === 0) ? (
        <ChatListSkeleton />
      ) : filteredChats.length === 0 ? (
        <View className="flex-1 justify-center items-center p-10">
          <Ionicons name="chatbubbles-outline" size={64} color="#f3f4f6" />
          <AppText weight="medium" className="text-gray-300 mt-6 text-xl text-center">
            {selectedFilter === 'all'
              ? 'No conversations yet'
              : 'No unread messages'}
          </AppText>
          {selectedFilter !== 'all' && (
            <TouchableOpacity
              onPress={() => setSelectedFilter('all')}
              className="mt-4"
            >
              <AppText className="text-primary font-bold text-lg">View All Messages</AppText>
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
