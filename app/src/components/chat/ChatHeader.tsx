import { View, Pressable, Animated, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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
    if (isTyping) return null;
    if (isOnline) return "Online";
    if (lastSeen) return `Last seen ${formatRelativeTime(lastSeen)}`;
    return "Offline";
  };

  const statusOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade out then in when isTyping change to make transitions smoother
    Animated.sequence([
      Animated.timing(statusOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  }, [isTyping]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View className="bg-primary" style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, zIndex: 1000 }}>
      <StatusBar style="light" />
      <View className="flex-row items-center px-1 py-2" style={{ paddingTop: insets.top + 5, paddingBottom: 10 }}>
        {/* Back Button */}
        <Pressable
          onPress={onBackPress}
          className="w-10 h-10 items-center justify-center mr-1"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        {/* User Info */}
        <Pressable
          onPress={onAvatarPress}
          className="flex-1 flex-row items-center gap-2"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          disabled={!onAvatarPress}
        >
          <View className="relative">
            <Avatar
              src={avatarSrc}
              alt={userName}
              size={40}
              className="border border-white/20 bg-white/10"
              textClassName="text-white"
            />
            {isOnline && (
              <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </View>
          <View className="flex-1">
            <AppText weight="bold" className="text-[17px] text-white" numberOfLines={1}>
              {userName}
            </AppText>
            <Animated.View style={{ opacity: statusOpacity }}>
              {isTyping ? (
                <View className="h-4 justify-center">
                  <AppText className="text-[12px] text-white/95 font-medium italic">typing...</AppText>
                </View>
              ) : (
                <AppText className="text-[12px] text-white/80">{getStatusText()}</AppText>
              )}
            </Animated.View>
          </View>
        </Pressable>

        {/* Action Buttons */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 items-center justify-center"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Simple Dropdown Menu */}
      {isMenuOpen && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsMenuOpen(false)}
          />
          <View
            className="absolute right-2 top-[100%] bg-white rounded-xl shadow-xl py-1 min-w-[160px]"
            style={{
              marginTop: -5,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
            }}
          >
            <Pressable
              onPress={() => {
                setIsMenuOpen(false);
                onMenuPress?.(); // Trigger search
              }}
              className="flex-row items-center px-4 py-3"
              style={({ pressed }) => [{ backgroundColor: pressed ? '#f3f4f6' : 'transparent' }]}
            >
              <Ionicons name="search" size={20} color="#4b5563" />
              <AppText className="ml-3 text-gray-700 text-base">Search</AppText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
