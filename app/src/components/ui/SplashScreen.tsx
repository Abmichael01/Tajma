import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const logoWidth = Math.min(width * 0.82, 320);
const logoHeight = logoWidth * (192 / 688);

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export default function AppSplashScreen({
  onAnimationComplete,
}: SplashScreenProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);

  useEffect(() => {
    // Logo fades in and scales up slightly
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
    });

    // Finish after 2.5 seconds
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, onAnimationComplete]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View className="items-center">
        <Animated.View style={logoStyle}>
          <Image
            source={require("../../../assets/splash-logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: logoWidth,
    height: logoHeight,
  },
});
