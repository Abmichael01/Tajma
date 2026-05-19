/**
 * InAppNotificationBanner — slide-from-top banner shown while the app is in
 * the foreground. Replaces the OS-level toast (which is suppressed by the
 * Notifications handler in useNotifications.ts when AppState is "active").
 *
 * Triggered via useInAppNotificationStore.show(). Auto-dismisses after 4s.
 * Swipe up to dismiss; tap to follow the deep link.
 */
import React, { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Avatar from "@/components/ui/Avatar";
import AppText from "@/components/ui/AppText";
import { useInAppNotificationStore } from "@/store/inAppNotificationStore";

const DEFAULT_TTL_MS = 4000;
const DISMISS_DRAG_PX = -40;

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "message":
      return "chatbubble-ellipses";
    case "favorite":
      return "heart";
    case "review":
      return "star";
    case "ad_status":
      return "megaphone";
    case "phone_view":
    case "ad_view":
      return "eye";
    default:
      return "notifications";
  }
}

export default function InAppNotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const current = useInAppNotificationStore((s) => s.current);
  const dismiss = useInAppNotificationStore((s) => s.dismiss);

  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  const hide = useCallback(() => {
    translateY.value = withTiming(-200, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(dismiss)();
    });
  }, [dismiss, opacity, translateY]);

  useEffect(() => {
    if (!current) return;
    // Smooth slide-in with an ease-out curve. No spring overshoot — settles
    // cleanly at its resting position, matching the WhatsApp banner feel.
    translateY.value = withTiming(insets.top + 8, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, { duration: 180 });

    const ttl = current.ttlMs ?? DEFAULT_TTL_MS;
    const timer = setTimeout(hide, ttl);
    return () => {
      clearTimeout(timer);
      cancelAnimation(translateY);
    };
  }, [current, hide, insets.top, opacity, translateY]);

  const handleTap = useCallback(() => {
    const link = current?.deepLink;
    hide();
    if (link) {
      try {
        router.push(link as any);
      } catch {
        // Deep link malformed — fall back to leaving the user where they are.
      }
    }
  }, [current?.deepLink, hide, router]);

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 999])
    .onUpdate((e) => {
      // Upward drag only — banner shouldn't grow when pulled down.
      translateY.value = insets.top + 8 + Math.min(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY < DISMISS_DRAG_PX || e.velocityY < -400) {
        runOnJS(hide)();
      } else {
        // Settle back without bounce.
        translateY.value = withTiming(insets.top + 8, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!current) return null;

  return (
    <Animated.View style={[styles.wrap, containerStyle]} pointerEvents="box-none">
      <GestureDetector gesture={pan}>
        <Pressable onPress={handleTap} style={styles.card}>
          {current.avatarUrl ? (
            <Avatar src={current.avatarUrl} size={40} />
          ) : (
            <View style={styles.iconBubble}>
              <Ionicons
                name={iconForType(current.type)}
                size={20}
                color="#FF4F18"
              />
            </View>
          )}
          <View style={styles.text}>
            <AppText weight="bold" style={styles.title} numberOfLines={1}>
              {current.title || "Tajma"}
            </AppText>
            {!!current.body && (
              <AppText style={styles.body} numberOfLines={2}>
                {current.body}
              </AppText>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1EC",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  title: { fontSize: 14, color: "#0F172A" },
  body: { fontSize: 13, color: "#475569", marginTop: 1 },
});
