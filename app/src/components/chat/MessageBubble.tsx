import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import { ChatMessage } from "@/api/types";
import { useAuthStore } from "@/store/authStore";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const isMe = message.sender.id === user?.id;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getMessageStatus = (): 'sending' | 'sent' | 'delivered' | 'read' | 'failed' => {
    if (message.send_failed) return 'failed';
    const isOptimistic = typeof message.id === 'string' && message.id.startsWith('temp-');
    if (isOptimistic) return 'sending';
    if (message.is_read) return 'read';
    if (message.delivered_at) return 'delivered';
    return 'sent';
  };

  const renderStatusIcon = () => {
    if (!isMe) return null;
    const status = getMessageStatus();

    const iconProps = {
      sending: { name: 'time-outline' as const, color: '#9CA3AF', size: 18 },
      sent: { name: 'checkmark' as const, color: '#9CA3AF', size: 18 },
      delivered: { name: 'checkmark-done' as const, color: '#9CA3AF', size: 18 },
      read: { name: 'checkmark-done' as const, color: '#3B82F6', size: 18 },
      failed: { name: 'alert-circle' as const, color: '#EF4444', size: 18 },
    };

    const icon = iconProps[status];
    return <Ionicons name={icon.name} size={icon.size} color={icon.color} />;
  };

  return (
    <View className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
      <View className="flex-row gap-2 max-w-[75%]">
        {!isMe && (
          <Avatar
            src={message.sender.avatar}
            alt={message.sender.full_name || message.sender.username || "User"}
            size={36}
          />
        )}

        <View className={`flex ${isMe ? 'items-end' : 'items-start'}`}>
          <View
            className={`px-4 py-2 rounded-2xl shadow-sm ${
              isMe
                ? 'bg-primary rounded-br-sm'
                : 'bg-white rounded-bl-sm border border-gray-100'
            }`}
          >
            <AppText className={`text-base leading-relaxed ${isMe ? 'text-white' : 'text-gray-900'}`}>
              {message.content}
            </AppText>
          </View>

          <View className={`flex-row items-center gap-1 mt-1 px-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <AppText className="text-xs text-gray-400">
              {formatTime(message.created_at)}
            </AppText>
            {isMe && (
              <View className="flex items-center">
                {renderStatusIcon()}
              </View>
            )}
          </View>
        </View>

        {isMe && (
          <Avatar
            src={user?.avatar}
            alt={user?.full_name || user?.username || "You"}
            size={36}
          />
        )}
      </View>
    </View>
  );
}
