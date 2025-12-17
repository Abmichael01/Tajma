import { Stack } from "expo-router";
import "../../global.css";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "WorkSans-Regular": require("../assets/fonts/Work_Sans/static/WorkSans-Regular.ttf"),
    "WorkSans-Medium": require("../assets/fonts/Work_Sans/static/WorkSans-Medium.ttf"),
    "WorkSans-SemiBold": require("../assets/fonts/Work_Sans/static/WorkSans-SemiBold.ttf"),
    "WorkSans-Bold": require("../assets/fonts/Work_Sans/static/WorkSans-Bold.ttf"),
  });

  useEffect(() => {
    // Fonts are loading
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
