import { Stack, useRouter, useSegments } from "expo-router";
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

import QueryProvider from "@/providers/QueryProvider";
import { useAuthStore } from "@/store/authStore";
import AppSplashScreenComponent from "@/components/ui/SplashScreen";
import { usePresence } from "@/hooks/usePresence";
import { usePushNotifications } from "@/hooks/useNotifications";

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

function AuthNavigationGuard() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && inTabsGroup) {
      router.replace("/");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/home");
    }
  }, [isAuthenticated, hasHydrated, router, segments]);

  return null;
}

function RootLayoutContent() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  // Manage user presence
  usePresence();

  // Register for Push Notifications
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
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const configureNavigationBar = async () => {
        try {
          await NavigationBar.setButtonStyleAsync("dark");
        } catch (e) {
          console.warn("Failed to configure navigation bar:", e);
        }
      };
      configureNavigationBar();
    }
  }, []);

  const showOverlay = !isSplashComplete;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <AuthNavigationGuard />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />

      {showOverlay && (
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
    </SafeAreaProvider>
  );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryProvider>
          <RootLayoutContent />
        </QueryProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
