import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function GradientOverlay() {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5,
      }}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 1)", // White at top
          "rgba(255, 255, 255, 0)", // Transparent in middle
          "rgba(255, 255, 255, 1)", // White at bottom
        ]}
        locations={[0, 0.5, 1]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 1)", // White at top
          "rgba(255, 255, 255, 0)", // Transparent in middle
          "rgba(255, 255, 255, 1)", // White at bottom
        ]}
        locations={[0, 0.7, 1]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        pointerEvents="none"
      />
    </View>
  );
}

