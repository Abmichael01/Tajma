import { View, Image } from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/ui/AppText";
import WelcomeButtons from "@/components/welcome/WelcomeButtons";
import { useAuthStore } from "@/store/authStore";

export default function WelcomeScreen() {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Hero image — fills the upper area, fades smoothly into the base */}
      <View className="flex-1 w-full relative">
        <Image
          source={require("@/assets/images/welcome.png")}
          className="w-full h-full"
          resizeMode="cover"
        />
        {/* White-to-transparent gradient at the bottom of the image so the
            base of the screen blends seamlessly up into the picture. */}
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
          locations={[0, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 160,
          }}
        />
      </View>

      {/* Welcome copy + actions — sits on the faded base */}
      <SafeAreaView edges={["bottom"]} className="bg-white">
        <View className="px-6 pb-2">
          <AppText
            className="text-left text-gray-900 mb-8"
            style={{
              fontFamily: "BebasNeue-Regular",
              fontSize: 56,
              lineHeight: 58,
              letterSpacing: 0.5,
            }}
          >
            Your all-in-one marketplace for amazing deals
          </AppText>

          <WelcomeButtons />
        </View>
      </SafeAreaView>
    </View>
  );
}
