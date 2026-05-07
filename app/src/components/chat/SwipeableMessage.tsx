import React from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipe: () => void;
  isMe: boolean;
}

const SWIPE_THRESHOLD = 32;
const MAX_SWIPE = 60;

export default function SwipeableMessage({
  children,
  onSwipe,
  isMe,
}: SwipeableMessageProps) {
  const translateX = useSharedValue(0);
  const hapticFired = useSharedValue(false);

  function triggerHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function triggerSwipe() {
    onSwipe();
  }

  const pan = Gesture.Pan()
    .activeOffsetX(6)
    .failOffsetY([-14, 14])
    .onBegin(() => {
      "worklet";
      hapticFired.value = false;
    })
    .onUpdate((e) => {
      "worklet";
      if (e.translationX <= 0) {
        translateX.value = 0;
        return;
      }

      translateX.value = interpolate(
        e.translationX,
        [0, 70],
        [0, MAX_SWIPE],
        Extrapolate.CLAMP,
      );

      if (translateX.value >= 22 && !hapticFired.value) {
        hapticFired.value = true;
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd(() => {
      "worklet";
      if (translateX.value >= SWIPE_THRESHOLD) {
        runOnJS(triggerSwipe)();
      }
      hapticFired.value = false;
    })
    .onFinalize(() => {
      "worklet";
      translateX.value = withTiming(0, { duration: 110 });
      hapticFired.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, 16, 32],
      [0, 0.6, 1],
      Extrapolate.CLAMP,
    );
    const scale = interpolate(
      translateX.value,
      [0, 32],
      [0.6, 1],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
        <View style={styles.iconWrapper}>
          <Ionicons name="arrow-undo-outline" size={20} color="#FF4F18" />
        </View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "visible",
  },
  iconContainer: {
    position: "absolute",
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  iconWrapper: {
    backgroundColor: "rgba(255, 79, 24, 0.1)",
    padding: 8,
    borderRadius: 20,
  },
});
