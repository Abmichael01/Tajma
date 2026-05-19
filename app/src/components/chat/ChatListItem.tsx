import { View, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import { ChatSummary } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { chatApi } from "@/api/chat";
import { resolveImageUrl } from "@/utils/imageUtils";

interface ChatListItemProps {
  chat: ChatSummary;
  index?: number;
  onlineStatusMap?: Map<string, boolean>;
  isTyping?: boolean;
  /** Selection state owned by the parent (chat tab). */
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: (chat: ChatSummary) => void;
  onSelectToggle?: (chatId: string) => void;
}

function ChatListItem({
  chat,
  index = 0,
  onlineStatusMap,
  isTyping = false,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  onSelectToggle,
}: ChatListItemProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Prefetch first page of messages and chat detail for the first few chats.
  useEffect(() => {
    if (index < 8) {
      const prefetchData = async () => {
        queryClient.prefetchQuery({
          queryKey: ["chats", String(chat.id)],
          queryFn: () => chatApi.get(String(chat.id)),
          staleTime: 1000 * 60 * 5,
        });
        queryClient.prefetchInfiniteQuery({
          queryKey: ["messages", String(chat.id)],
          queryFn: () => chatApi.listMessages(String(chat.id), 1),
          initialPageParam: 1,
          staleTime: 1000 * 60 * 5,
        });
      };
      const timer = setTimeout(prefetchData, 1000 + index * 150);
      return () => clearTimeout(timer);
    }
  }, [chat.id, index, queryClient]);

  const otherParticipant =
    chat.participant1?.id === user?.id ? chat.participant2 : chat.participant1;

  if (!otherParticipant) return null;

  const isOnline = onlineStatusMap?.get(String(otherParticipant.id)) ?? false;

  const handlePress = () => {
    if (isSelectionMode) {
      Haptics.selectionAsync();
      onSelectToggle?.(String(chat.id));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/messages/${chat.id}`);
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(chat);
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const isOwnMessage = chat.last_message?.sender?.id === user?.id;

  const truncate = (text: string | null | undefined, maxLength: number) => {
    if (!text) return "";
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  };

  const hasUnread = (chat.unread_count ?? 0) > 0;
  const isPinned = !!chat.is_pinned;
  const isMuted = !!chat.is_muted;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={350}
      activeOpacity={0.7}
      className={`px-5 py-4 border-b border-gray-50 ${
        isSelected ? "bg-primary/10" : isPinned ? "bg-amber-50/40" : "bg-white"
      }`}
    >
      <View className="flex-row items-center gap-4">
        {/* Selection check (selection mode only) */}
        {isSelectionMode && (
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              isSelected ? "bg-primary border-primary" : "border-slate-300 bg-white"
            }`}
          >
            {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
          </View>
        )}

        {/* Ad image / participant avatar */}
        <View className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
          {chat.ad_image ? (
            <>
              <Image
                source={{ uri: resolveImageUrl(chat.ad_image) ?? undefined }}
                style={{ width: 60, height: 60 }}
                className="rounded-2xl bg-slate-50 border border-slate-100"
                resizeMode="cover"
              />
              <View
                className="absolute -bottom-1 -right-1 rounded-full border-2 border-white shadow-sm bg-white items-center justify-center overflow-hidden"
                style={{ width: 34, height: 34 }}
              >
                <Avatar
                  src={otherParticipant.avatar}
                  alt={otherParticipant.full_name || otherParticipant.username || "User"}
                  size={30}
                />
              </View>
              {isOnline && (
                <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10" />
              )}
            </>
          ) : (
            <>
              <Avatar
                src={otherParticipant.avatar}
                alt={otherParticipant.full_name || otherParticipant.username || "User"}
                size={60}
                className="border border-slate-50 shadow-sm"
              />
              {isOnline && (
                <View className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10" />
              )}
            </>
          )}
        </View>

        {/* Chat info */}
        <View className="flex-1 justify-center min-w-0">
          <View className="flex-row justify-between items-center mb-1">
            <View className="flex-row items-center flex-1 mr-2">
              <AppText
                weight={hasUnread ? "bold" : "semibold"}
                className={`text-[17px] ${hasUnread ? "text-slate-900" : "text-slate-800"}`}
                numberOfLines={1}
              >
                {otherParticipant.full_name || otherParticipant.username}
              </AppText>
              {isPinned && (
                <MaterialCommunityIcons
                  name="pin"
                  size={14}
                  color="#64748B"
                  style={{ marginLeft: 6 }}
                />
              )}
              {isMuted && (
                <Ionicons
                  name="notifications-off"
                  size={13}
                  color="#94A3B8"
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
            <AppText
              className={`text-[11px] ${
                hasUnread ? "text-primary font-bold" : "text-slate-400 font-medium"
              }`}
            >
              {formatTime(chat.last_message?.created_at || chat.last_message_at)}
            </AppText>
          </View>

          {chat.ad_title && (
            <View className="bg-slate-50 self-start px-2 py-0.5 rounded-md mb-1.5 border border-slate-100">
              <AppText
                className="text-[10px] font-bold text-slate-500 uppercase tracking-tight"
                numberOfLines={1}
              >
                {truncate(chat.ad_title, 30)}
              </AppText>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-1.5 mr-3">
              {isOwnMessage && chat.last_message && (
                <Ionicons
                  name={chat.last_message.is_read ? "checkmark-done" : "checkmark"}
                  size={16}
                  color={chat.last_message.is_read ? "#FF4F18" : "#94A3B8"}
                />
              )}
              {isTyping ? (
                <AppText
                  className="text-[14px] leading-5 flex-1 text-slate-500 italic font-semibold"
                  numberOfLines={1}
                >
                  typing...
                </AppText>
              ) : (
                <AppText
                  className={`text-[14px] leading-5 flex-1 ${
                    hasUnread ? "text-slate-900 font-semibold" : "text-slate-500 font-medium"
                  }`}
                  numberOfLines={1}
                >
                  {(() => {
                    const msg = chat.last_message;
                    if (!msg) return "No messages yet";
                    const prefix = isOwnMessage ? "You: " : "";
                    if (msg.message_type === "image") return `${prefix}📷 Photo`;
                    if (msg.message_type === "audio") return `${prefix}🎤 Voice message`;
                    if (msg.message_type === "document") return `${prefix}📄 Document`;
                    return `${prefix}${msg.content || ""}`;
                  })()}
                </AppText>
              )}
            </View>

            {hasUnread && (
              <View className="bg-primary px-2 py-0.5 rounded-full min-w-[20px] h-[20px] items-center justify-center shadow-sm shadow-primary/20">
                <AppText className="text-white text-[10px] font-bold">{chat.unread_count}</AppText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ChatListItem);
