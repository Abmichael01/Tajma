import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay,
  Easing
} from "react-native-reanimated";

const TypingDot = ({ delay }: { delay: number }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export default function TypingIndicator() {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <TypingDot delay={0} />
        <TypingDot delay={150} />
        <TypingDot delay={300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#94A3B8",
  },
});
