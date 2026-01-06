import { Text, StyleSheet } from "react-native";
import React from "react";

interface OutlinedTextProps {
  children: React.ReactNode;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  lineHeight?: number;
}

export default function OutlinedText({
  children,
  fontSize = 70,
  fontFamily = "Poppins-Bold",
  color = "#FFFFFF",
  outlineColor = "#000000",
  outlineWidth = 3,
  lineHeight,
}: OutlinedTextProps) {
  const styles = StyleSheet.create({
    text: {
      fontSize,
      fontFamily,
      color,
      lineHeight: lineHeight || fontSize * 1.15,
      textShadowColor: outlineColor,
      textShadowOffset: { width: -outlineWidth, height: -outlineWidth },
      textShadowRadius: 0,
    },
  });

  // Create outline effect using multiple text shadows
  const outlineShadows = [
    { width: -outlineWidth, height: -outlineWidth },
    { width: outlineWidth, height: -outlineWidth },
    { width: -outlineWidth, height: outlineWidth },
    { width: outlineWidth, height: outlineWidth },
    { width: 0, height: -outlineWidth },
    { width: 0, height: outlineWidth },
    { width: -outlineWidth, height: 0 },
    { width: outlineWidth, height: 0 },
  ];

  return (
    <Text
      style={[
        styles.text,
        {
          textShadowColor: outlineColor,
          textShadowOffset: outlineShadows[0],
          textShadowRadius: 0,
        },
      ]}
    >
      {children}
    </Text>
  );
}


