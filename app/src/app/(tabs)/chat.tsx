import { View, ScrollView, TouchableOpacity, RefreshControl, Platform, FlatList, Pressable, Animated, Easing } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import AppText from "@/components/ui/AppText";
import ChatListItem from "@/components/chat/ChatListItem";
import ChatListSkeleton from "@/components/chat/ChatListSkeleton";
import { useChats, useOnlineStatuses } from "@/hooks/useChat";
import { useUnifiedChatWebSocket } from "@/hooks/useUnifiedChatWebSocket";
import { useAuthStore } from "@/store/authStore";
import { useChatWebSocketStore } from "@/store/chatWebSocketStore";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useTranslation } from "react-i18next";
import { chatApi } from "@/api/chat";
import type { ChatSummary } from "@/api/types";
import { useCustomAlert } from "@/hooks/useCustomAlert";

const FILTERS = [
  { label: 'chat.filters.all', value: 'all', icon: 'chatbubbles-outline' },
  { label: 'chat.filters.unread', value: 'unread', icon: 'mail-unread-outline' },
];

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { alert, AlertHost } = useCustomAlert();
  const { isAuthenticated, user } = useAuthStore();

  // URL param decides which list to show. view='archived' uses the archived
  // endpoint and switches the header. No new route — same tab, different data.
  const params = useLocalSearchParams<{ view?: string }>();
  const isArchivedView = params.view === "archived";

  const { data: inboxChats, isLoading: inboxLoading, refetch: refetchInbox } = useChats();
  const {
    data: archivedChats = [],
    isLoading: archivedLoading,
    refetch: refetchArchived,
  } = useQuery<ChatSummary[]>({
    queryKey: ["chats", "archived"],
    queryFn: () => chatApi.listArchivedChats(),
    staleTime: 60 * 1000,
    enabled: isArchivedView,
  });

  const chats = isArchivedView ? archivedChats : inboxChats;
  const isLoading = isArchivedView ? archivedLoading : inboxLoading;
  const refetch = isArchivedView ? refetchArchived : refetchInbox;
  const { data: onlineStatuses } = useOnlineStatuses();
  const typingStatus = useChatWebSocketStore((state) => state.typingStatus);

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

  // Selection mode — long-press a chat to enter; tap rows to multi-select.
  // Selection mode overlays a contextual action bar over the screen header.
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const isSelectionMode = selectedChatIds.size > 0;

  // Animated transition for the selection header: it slides down + fades in
  // over the normal screen header when entering selection mode.
  const selectionAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: isSelectionMode ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isSelectionMode, selectionAnim]);

  const filteredChats = useMemo(() => {
    if (!chats) return [];
    // In INBOX view, strip archived + hidden (belt-and-braces against WS-merge
    // cache lag). In ARCHIVED view, the list IS the archived chats — don't
    // filter them out.
    const base = isArchivedView
      ? (chats as ChatSummary[]).filter((c) => !c.is_hidden)
      : (chats as ChatSummary[]).filter((c) => !c.is_archived && !c.is_hidden);
    if (selectedFilter === 'all') return base;
    if (selectedFilter === 'unread')
      return base.filter((chat) => (chat.unread_count ?? 0) > 0);
    return base;
  }, [chats, selectedFilter, isArchivedView]);

  // Compute majority state of selected chats so toggle labels make sense.
  const selectedChats = useMemo(
    () => (chats as ChatSummary[] | undefined)?.filter((c) => selectedChatIds.has(String(c.id))) ?? [],
    [chats, selectedChatIds],
  );
  const allPinned = selectedChats.length > 0 && selectedChats.every((c) => c.is_pinned);
  const allMuted = selectedChats.length > 0 && selectedChats.every((c) => c.is_muted);
  const allArchived = selectedChats.length > 0 && selectedChats.every((c) => c.is_archived);
  const singleSelection = selectedChatIds.size === 1;
  const singleChat = singleSelection ? selectedChats[0] : null;
  const singleHasUnread = (singleChat?.unread_count ?? 0) > 0;

  const exitSelection = useCallback(() => setSelectedChatIds(new Set()), []);

  const handleChatLongPress = useCallback((chat: ChatSummary) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      next.add(String(chat.id));
      return next;
    });
  }, []);

  const handleSelectToggle = useCallback((chatId: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  }, []);

  const invalidateChats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["chats"] });
  }, [queryClient]);

  // Run an action across all selected chats in parallel. On any failure, we
  // still invalidate (some calls may have succeeded) and toast a generic error.
  const runBulk = useCallback(
    async (fn: (chatId: string) => Promise<void>, opts?: { dontExit?: boolean }) => {
      const ids = Array.from(selectedChatIds);
      try {
        await Promise.all(ids.map(fn));
        invalidateChats();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        console.warn("[chat-list] bulk action failed:", err);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        invalidateChats();
        alert({
          title: t('chat.bulkAction.errorTitle'),
          message: t('chat.bulkAction.errorBody'),
          icon: "alert-circle-outline",
          iconColor: "#DC2626",
          buttons: [{ text: t('common.ok'), style: "default" }],
        });
      } finally {
        if (!opts?.dontExit) exitSelection();
      }
    },
    [selectedChatIds, invalidateChats, exitSelection],
  );

  const onTogglePin = () =>
    runBulk((id) => (allPinned ? chatApi.unpinChat(id) : chatApi.pinChat(id)));
  const onToggleMute = () =>
    runBulk((id) => chatApi.muteChat(id, !allMuted));
  const onToggleArchive = () =>
    runBulk((id) => (allArchived ? chatApi.unarchiveChat(id) : chatApi.archiveChat(id)));

  const onMarkUnread = () => {
    if (!singleChat) return;
    runBulk(() => chatApi.markChatUnread(String(singleChat.id)));
  };

  const onClear = () => {
    if (!singleChat) return;
    const chatId = String(singleChat.id);
    alert({
      title: t('chat.clearChat.title'),
      message: t('chat.clearChat.body'),
      icon: "trash-bin-outline",
      iconColor: "#DC2626",
      buttons: [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('chat.clearChat.confirm'),
          style: "destructive",
          onPress: () =>
            runBulk(async () => {
              await chatApi.clearChat(chatId);
              queryClient.removeQueries({ queryKey: ["messages", chatId] });
              queryClient.removeQueries({ queryKey: ["chats", chatId] });
            }),
        },
      ],
    });
  };

  const onDelete = () => {
    const count = selectedChatIds.size;
    alert({
      title: count > 1
        ? t('chat.deleteChats.titleMany')
        : t('chat.deleteChats.titleOne'),
      message: count > 1
        ? t('chat.deleteChats.bodyMany', { count })
        : t('chat.deleteChats.bodyOne'),
      icon: "trash-outline",
      iconColor: "#DC2626",
      buttons: [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('chat.deleteChats.confirm'),
          style: "destructive",
          onPress: () => runBulk((id) => chatApi.hideChat(id)),
        },
      ],
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  const unreadCount = chats?.reduce((acc, chat) => acc + (chat.unread_count || 0), 0) || 0;

  // Selection header — overlays the normal screen header. Uses the SAME
  // LinearGradient as ScreenHeader so the swap is invisible color-wise, and
  // SafeAreaView + py-5 to match the exact height profile.
  const SelectionHeader = (
    <LinearGradient colors={["#FF4F18", "#E63E0B"]} style={{ width: "100%" }}>
      <SafeAreaView edges={["top"]}>
        <View className="flex-row items-center px-6 py-5">
          <Pressable onPress={exitSelection} hitSlop={12} className="mr-4">
            <Ionicons name="close" size={26} color="white" />
          </Pressable>
          <AppText weight="bold" className="text-white text-lg flex-1">
            {selectedChatIds.size}
          </AppText>
      <View className="flex-row items-center gap-4">
        <Pressable onPress={onTogglePin} hitSlop={8}>
          <MaterialCommunityIcons
            name={allPinned ? "pin-off" : "pin"}
            size={22}
            color="white"
          />
        </Pressable>
        <Pressable onPress={onToggleMute} hitSlop={8}>
          <Ionicons
            name={allMuted ? "notifications" : "notifications-off-outline"}
            size={22}
            color="white"
          />
        </Pressable>
        {singleSelection && !singleHasUnread && (
          <Pressable onPress={onMarkUnread} hitSlop={8}>
            <Ionicons name="mail-unread-outline" size={22} color="white" />
          </Pressable>
        )}
        <Pressable onPress={onToggleArchive} hitSlop={8}>
          <Ionicons
            name={allArchived ? "file-tray-full-outline" : "archive-outline"}
            size={22}
            color="white"
          />
        </Pressable>
        {singleSelection && (
          <Pressable onPress={onClear} hitSlop={8}>
            <Ionicons name="remove-circle-outline" size={22} color="white" />
          </Pressable>
        )}
          <Pressable onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={22} color="white" />
          </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style={isSelectionMode ? "light" : "light"} />

      {/* Both headers are always rendered. The selection header is an
          absolute overlay on top of the screen header; opacity + translateY
          drive a smooth crossfade in either direction. pointerEvents is
          toggled so taps on the inactive header pass through. */}
      <View style={{ position: "relative" }}>
        <ScreenHeader
          title={isArchivedView ? "Archived" : t('messages.title')}
          subtitle={
            isArchivedView
              ? `${filteredChats.length} archived chat${filteredChats.length === 1 ? '' : 's'}`
              : unreadCount > 0
                ? t('messages.unreadCount', { count: unreadCount })
                : undefined
          }
          // In archived view, show the back-arrow that clears the view param
          // and returns to the inbox. In inbox view, no back button.
          showBackButton={isArchivedView}
          onBackPress={isArchivedView ? () => router.setParams({ view: undefined as any }) : undefined}
          rightElement={
            !isArchivedView ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.setParams({ view: "archived" });
                }}
                hitSlop={10}
                className="w-10 h-10 rounded-full border border-white/20 bg-white/10 items-center justify-center"
              >
                <Ionicons name="archive-outline" size={20} color="white" />
              </Pressable>
            ) : undefined
          }
        />
        <Animated.View
          pointerEvents={isSelectionMode ? "auto" : "none"}
          // zIndex/elevation must exceed ScreenHeader's (zIndex 50, elevation 6)
          // otherwise the overlay renders BENEATH on Android and stacks weird
          // on iOS.
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            elevation: 20,
            opacity: selectionAnim,
            transform: [
              {
                translateY: selectionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          }}
        >
          {SelectionHeader}
        </Animated.View>
      </View>

      {/* Filter Bar — stays visible in selection mode too (matches WhatsApp). */}
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
              isTyping={(() => {
                const otherParticipant = item.participant1?.id === user?.id
                  ? item.participant2
                  : item.participant1;
                return !!otherParticipant?.id && !!typingStatus[String(item.id)]?.[otherParticipant.id];
              })()}
              isSelectionMode={isSelectionMode}
              isSelected={selectedChatIds.has(String(item.id))}
              onLongPress={handleChatLongPress}
              onSelectToggle={handleSelectToggle}
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

      {AlertHost}
    </View>
  );
}
