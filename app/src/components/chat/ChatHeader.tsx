import { View, Pressable, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";

interface ChatHeaderProps {
  avatarSrc?: string | null;
  userName: string;
  isOnline?: boolean;
  lastSeen?: string | null;
  isTyping?: boolean;
  onBackPress: () => void;
  onMenuPress?: () => void;
  onAvatarPress?: () => void;
}

export default function ChatHeader({
  avatarSrc,
  userName,
  isOnline,
  lastSeen,
  isTyping,
  onBackPress,
  onMenuPress,
  onAvatarPress,
}: ChatHeaderProps) {
  // Animated values for typing dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isTyping) return;

    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animations.start();

    return () => {
      animations.stop();
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    };
  }, [isTyping, dot1, dot2, dot3]);

  const formatRelativeTime = (timestamp: string) => {
    const now = Date.now();
    const date = new Date(timestamp).getTime();
    const diffSeconds = Math.max(0, Math.floor((now - date) / 1000));
    if (diffSeconds < 60) return `${diffSeconds || 1}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  };

  const getStatusText = () => {
    if (isTyping) return null; // Will show typing animation instead
    if (isOnline) return "Online";
    if (lastSeen) return `Last seen ${formatRelativeTime(lastSeen)}`;
    return "Offline";
  };

  const dotStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View className="bg-white border-b border-gray-100" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
      <View className="flex-row items-center px-2 py-2" style={{ height: 60 }}>
        {/* Back Button */}
        <Pressable
          onPress={onBackPress}
          className="w-10 h-10 items-center justify-center mr-1"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>

        {/* User Info */}
        <Pressable
          onPress={onAvatarPress}
          className="flex-1 flex-row items-center gap-3"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          disabled={!onAvatarPress}
        >
          <View className="relative">
            <Avatar src={avatarSrc} alt={userName} size={40} />
            {isOnline && (
              <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </View>
          <View className="flex-1">
            <AppText weight="semibold" className="text-base text-gray-900" numberOfLines={1}>
              {userName}
            </AppText>
            {isTyping ? (
              <View className="flex-row items-center gap-1">
                <View className="flex-row gap-0.5">
                  <Animated.View 
                    className="w-1 h-1 bg-gray-500 rounded-full"
                    style={dotStyle(dot1)}
                  />
                  <Animated.View 
                    className="w-1 h-1 bg-gray-500 rounded-full"
                    style={dotStyle(dot2)}
                  />
                  <Animated.View 
                    className="w-1 h-1 bg-gray-500 rounded-full"
                    style={dotStyle(dot3)}
                  />
                </View>
                <AppText className="text-xs text-gray-500">typing...</AppText>
              </View>
            ) : (
              <AppText className="text-xs text-gray-500">{getStatusText()}</AppText>
            )}
          </View>
        </Pressable>

        {/* Menu Button */}
        <Pressable
          onPress={onMenuPress}
          className="w-10 h-10 items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          disabled={!onMenuPress}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#000" />
        </Pressable>
      </View>
    </View>
  );
}
