import { View, Pressable, Animated, StyleSheet, Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import * as Haptics from "expo-haptics";

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
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusText = () => {
    if (isTyping) return null;
    if (isOnline) return "Online";
    if (lastSeen) return `Last seen ${formatRelativeTime(lastSeen)}`;
    return "Offline";
  };

  const statusOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
    <View style={styles.headerContainer}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#FF4F18", "#E63E0B"]}
        style={[styles.gradient, { paddingTop: insets.top + 8, paddingBottom: 12 }]}
      >
        <View className="flex-row items-center px-2">
          {/* Back Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBackPress();
            }}
            className="w-10 h-10 items-center justify-center mr-1"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </Pressable>

          {/* User Info */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAvatarPress?.();
            }}
            className="flex-1 flex-row items-center gap-3"
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            disabled={!onAvatarPress}
          >
            <View className="relative">
              <Avatar
                src={avatarSrc}
                alt={userName}
                size={42}
                className="border-2 border-white/20 bg-white/10"
                textClassName="text-white font-bold"
              />
              {isOnline && (
                <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#FF4F18] rounded-full" />
              )}
            </View>
            <View className="flex-1">
              <AppText weight="bold" className="text-[17px] text-white leading-tight" numberOfLines={1}>
                {userName}
              </AppText>
              <Animated.View style={{ opacity: statusOpacity }}>
                {isTyping ? (
                  <AppText className="text-[12px] text-white/90 font-semibold italic">typing...</AppText>
                ) : (
                  <AppText className="text-[12px] text-white/70 font-medium">{getStatusText()}</AppText>
                )}
              </Animated.View>
            </View>
          </Pressable>

          {/* Action Buttons */}
          <View className="flex-row items-center">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsMenuOpen(!isMenuOpen);
              }}
              className="w-10 h-10 items-center justify-center"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* Simple Dropdown Menu */}
      {isMenuOpen && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsMenuOpen(false)}
          />
          <View style={styles.dropdownMenu}>
            <Pressable
              onPress={() => {
                setIsMenuOpen(false);
                onMenuPress?.();
              }}
              className="flex-row items-center px-4 py-3.5"
              style={({ pressed }) => [{ backgroundColor: pressed ? '#F8FAFC' : 'transparent' }]}
            >
              <Ionicons name="search-outline" size={22} color="#475569" />
              <AppText className="ml-3 text-slate-700 text-[15px]" weight="medium">Search Messages</AppText>
            </Pressable>
            <View className="h-[1px] bg-slate-100 mx-4" />
            <Pressable
              onPress={() => {
                setIsMenuOpen(false);
                onAvatarPress?.();
              }}
              className="flex-row items-center px-4 py-3.5"
              style={({ pressed }) => [{ backgroundColor: pressed ? '#F8FAFC' : 'transparent' }]}
            >
              <Ionicons name="information-circle-outline" size={22} color="#475569" />
              <AppText className="ml-3 text-slate-700 text-[15px]" weight="medium">View Profile</AppText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#FF4F18",
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    width: "100%",
  },
  dropdownMenu: {
    position: "absolute",
    right: 12,
    top: "100%",
    marginTop: 4,
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 4,
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  }
});
