import { Pressable, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import { ChatSummary } from "@/api/types";
import { useAuthStore } from "@/store/authStore";

interface ChatListItemProps {
  chat: ChatSummary;
}

export default function ChatListItem({ chat }: ChatListItemProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const otherParticipant = chat.participant1.id === user?.id 
    ? chat.participant2 
    : chat.participant1;

  const handlePress = () => {
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

  const getMessageStatus = (): 'sending' | 'sent' | 'delivered' | 'read' | 'none' => {
    const lastMessage = chat.last_message;
    if (!lastMessage) return 'none';
    if (lastMessage.send_failed) return 'none';
    const isOptimistic = typeof lastMessage.id === 'string' && lastMessage.id.startsWith('temp-');
    if (isOptimistic) return 'sending';
    if (lastMessage.is_read) return 'read';
    if (lastMessage.delivered_at) return 'delivered';
    return 'sent';
  };

  const renderStatusIcon = () => {
    const status = getMessageStatus();
    if (status === 'none') return null;

    const icons = {
      sending: <Ionicons name="time-outline" size={12} color="#9CA3AF" />,
      sent: <Ionicons name="checkmark" size={12} color="#9CA3AF" />,
      delivered: <Ionicons name="checkmark-done" size={12} color="#9CA3AF" />,
      read: <Ionicons name="checkmark-done" size={12} color="#3B82F6" />,
    };

    return icons[status];
  };

  const isOwnMessage = chat.last_message?.sender?.id === user?.id;
  const truncate = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  };

  return (
    <Pressable 
      onPress={handlePress}
      className="p-4 border-b border-gray-100 bg-white"
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
        },
      ]}
    >
      <View className="flex-row items-start gap-3">
        {/* Ad Image Container - Full Height (56px width) */}
        <View className="relative flex-shrink-0" style={{ width: 56 }}>
          {chat.ad_image ? (
            <Image 
              source={{ uri: chat.ad_image }} 
              style={{ width: 56, height: '100%' }}
              className="rounded-lg bg-gray-100"
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: 56 }} className="h-full rounded-lg bg-gray-200 items-center justify-center">
              <Ionicons name="image-outline" size={28} color="#9CA3AF" />
            </View>
          )}
          
          {/* User Avatar Overlaid at bottom-right with proper offset */}
          <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white bg-white" style={{ transform: [{ translateX: 2 }, { translateY: 2 }] }}>
            <Avatar 
              src={otherParticipant.avatar} 
              alt={otherParticipant.full_name || otherParticipant.username || "User"}
              size={20}
            />
          </View>
        </View>

        {/* Chat Info */}
        <View className="flex-1 min-w-0">
          <View className="flex-row justify-between items-center mb-1">
            <AppText 
              className={`text-sm flex-1 ${chat.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`} 
              numberOfLines={1}
            >
              {otherParticipant.full_name || otherParticipant.username}
            </AppText>
            <View className="flex-row items-center gap-2 flex-shrink-0">
              <AppText className="text-xs text-gray-400">
                {formatTime(chat.last_message?.created_at || chat.last_message_at)}
              </AppText>
              {chat.unread_count > 0 && (
                <View className="bg-primary px-2 py-0.5 rounded-full min-w-[20px] items-center">
                  <AppText className="text-white text-xs font-bold">
                    {chat.unread_count}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          {chat.ad_title && (
            <AppText className="text-sm font-bold text-gray-900 mb-1" numberOfLines={1}>
              {truncate(chat.ad_title, 40)}
            </AppText>
          )}

          <View className="flex-row items-center gap-2">
            <AppText 
              className={`text-sm flex-1 ${chat.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`} 
              numberOfLines={1}
            >
              {chat.last_message?.content ? (
                <>
                  {isOwnMessage && <AppText className="text-gray-400">You: </AppText>}
                  {truncate(chat.last_message.content, isOwnMessage ? 55 : 60)}
                </>
              ) : (
                'No messages yet'
              )}
            </AppText>
            {isOwnMessage && (
              <View className="flex-shrink-0">
                {renderStatusIcon()}
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
