import { View, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect } from "react";
import * as Haptics from 'expo-haptics';
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import { ChatSummary } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";

interface ChatListItemProps {
  chat: ChatSummary;
  index?: number;
  onlineStatusMap?: Map<string, boolean>;
}

function ChatListItem({ chat, index = 0, onlineStatusMap }: ChatListItemProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Prefetch first page of messages and chat detail for the first few chats
  useEffect(() => {
    if (index < 8) {
      const prefetchData = async () => {
        queryClient.prefetchQuery({
          queryKey: ['chats', String(chat.id)],
          queryFn: () => chatApi.get(String(chat.id)),
          staleTime: 1000 * 60 * 5,
        });
        queryClient.prefetchInfiniteQuery({
          queryKey: ['messages', String(chat.id)],
          queryFn: () => chatApi.listMessages(String(chat.id), 1),
          initialPageParam: 1,
          staleTime: 1000 * 60 * 5,
        });
      };
      const timer = setTimeout(prefetchData, 1000 + (index * 150));
      return () => clearTimeout(timer);
    }
  }, [chat.id, index, queryClient]);

  const otherParticipant = chat.participant1.id === user?.id
    ? chat.participant2
    : chat.participant1;

  const isOnline = onlineStatusMap?.get(String(otherParticipant.id)) ?? false;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/messages/${chat.id}`);
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isOwnMessage = chat.last_message?.sender?.id === user?.id;

  const truncate = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  };

  const hasUnread = chat.unread_count > 0;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className="px-6 py-3.5 bg-transparent"
    >
      <View className="flex-row items-center gap-5">
        {/* Ad Image / Participant Avatar Combination */}
        <View className="relative flex-shrink-0" style={{ width: 68, height: 68 }}>
          {chat.ad_image ? (
            <>
              <Image
                source={{ uri: chat.ad_image }}
                style={{ width: 68, height: 68 }}
                className="rounded-2xl bg-gray-50 border border-border"
                resizeMode="cover"
              />
              {/* User Avatar Overlay */}
              <View
                className="absolute -bottom-1 -right-1 rounded-full border-2 border-white shadow-lg bg-white items-center justify-center overflow-hidden"
                style={{ width: 38, height: 38 }}
              >
                <Avatar
                  src={otherParticipant.avatar}
                  alt={otherParticipant.full_name || otherParticipant.username || "User"}
                  size={32}
                />
              </View>
              {isOnline && (
                <View className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-10" />
              )}
            </>
          ) : (
            <>
              <Avatar
                src={otherParticipant.avatar}
                alt={otherParticipant.full_name || otherParticipant.username || "User"}
                size={68}
              />
              {isOnline && (
                <View className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-10" />
              )}
            </>
          )}
        </View>

        {/* Chat Info */}
        <View className="flex-1 justify-center min-w-0">
          <View className="flex-row justify-between items-center mb-0.5">
            <AppText
              weight={hasUnread ? "bold" : "semibold"}
              className={`text-[17px] ${hasUnread ? 'text-[#000]' : 'text-[#111b21]'}`}
              numberOfLines={1}
            >
              {otherParticipant.full_name || otherParticipant.username}
            </AppText>
            <AppText className={`text-xs ${hasUnread ? 'text-[#25D366] font-semibold' : 'text-gray-500'}`}>
              {formatTime(chat.last_message?.created_at || chat.last_message_at)}
            </AppText>
          </View>

          {chat.ad_title && (
            <AppText
              className="text-xs font-bold mb-0.5 text-primary uppercase"
              numberOfLines={1}
            >
              {truncate(chat.ad_title, 35)}
            </AppText>
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-1 mr-2">
              {isOwnMessage && chat.last_message && (
                <Ionicons
                  name={chat.last_message.is_read ? "checkmark-done" : "checkmark"}
                  size={16}
                  color={chat.last_message.is_read ? "#34B7F1" : "#9ca3af"}
                  style={{ marginRight: 2 }}
                />
              )}
              <AppText
                className={`text-[15px] leading-5 flex-1 ${hasUnread ? 'text-[#111b21] font-medium' : 'text-[#667781]'}`}
                numberOfLines={1}
              >
                {(() => {
                  const msg = chat.last_message;
                  if (!msg) return 'No messages yet';
                  const prefix = isOwnMessage ? 'You: ' : '';
                  if (msg.message_type === 'image') return `${prefix}📷 Photo`;
                  if (msg.message_type === 'audio') return `${prefix}🎤 Voice message`;
                  if (msg.message_type === 'document') return `${prefix}📄 Document`;
                  return `${prefix}${msg.content || ''}`;
                })()}
              </AppText>
            </View>

            {hasUnread && (
              <View className="bg-[#25D366] px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] items-center justify-center">
                <AppText className="text-white text-[11px] font-bold">
                  {chat.unread_count}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ChatListItem);
