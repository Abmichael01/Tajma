import { Stack } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import "../../global.css";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as NavigationBar from "expo-navigation-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "@/i18n";
import QueryProvider from "@/providers/QueryProvider";
import AppSplashScreenComponent from "@/components/ui/SplashScreen";
import LanguageSelectionGate from "@/components/onboarding/LanguageSelectionGate";
import { usePresence } from "@/hooks/usePresence";
import { usePushNotifications } from "@/hooks/useNotifications";
import { useNotificationWebSocket } from "@/hooks/useWebSocket";
import InAppNotificationBanner from "@/components/InAppNotificationBanner";
import { installFcmBackgroundHandler } from "@/lib/fcmBackgroundHandler";

// Side-effect: register the data-only FCM handler at module load so it's
// alive before any push arrives, including the "app launched from quit by a
// background push" case. Must run before the React tree mounts.
installFcmBackgroundHandler();

// Hooks that depend on React-Query's QueryClient must live UNDER QueryProvider.
// This tiny component renders nothing — its only job is to call those hooks
// from a position in the tree where the provider is in scope.
function ProviderScopedHooks() {
  useNotificationWebSocket();
  return null;
}

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  usePresence();
  usePushNotifications();

  const [fontsLoaded, fontError] = useFonts({
    "Quicksand-Light": require("../assets/fonts/Quicksand/static/Quicksand-Light.ttf"),
    "Quicksand-Regular": require("../assets/fonts/Quicksand/static/Quicksand-Regular.ttf"),
    "Quicksand-Medium": require("../assets/fonts/Quicksand/static/Quicksand-Medium.ttf"),
    "Quicksand-SemiBold": require("../assets/fonts/Quicksand/static/Quicksand-SemiBold.ttf"),
    "Quicksand-Bold": require("../assets/fonts/Quicksand/static/Quicksand-Bold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins/Poppins-Bold.ttf"),
    "BebasNeue-Regular": require("../assets/fonts/BebasNeue/BebasNeue-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setIsAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardProvider>
        <QueryProvider>
          <ProviderScopedHooks />
          <BottomSheetModalProvider>
            <SafeAreaProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
              {!isSplashComplete && (
                <View
                  style={StyleSheet.absoluteFill}
                  pointerEvents={isSplashComplete ? "none" : "auto"}
                >
                  {isAppReady ? (
                    <AppSplashScreenComponent
                      onAnimationComplete={() => setIsSplashComplete(true)}
                    />
                  ) : (
                    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />
                  )}
                </View>
              )}
              {isSplashComplete && <LanguageSelectionGate />}
              <InAppNotificationBanner />
            </SafeAreaProvider>
          </BottomSheetModalProvider>
        </QueryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
