import { View, Image, Dimensions } from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AppText from "@/components/ui/AppText";
import WelcomeButtons from "@/components/welcome/WelcomeButtons";
import { useAuthStore } from "@/store/authStore";

const { width } = Dimensions.get('window');

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

      <View className="flex-1 items-center justify-center px-10">
        {/* Large Logo */}
        <Image
          source={require("@/assets/images/logo.jpg")}
          className="w-48 h-48 mb-8"
          resizeMode="contain"
        />
        
        {/* Branding */}
        <AppText weight="bold" className="text-5xl text-gray-900 tracking-[10px] text-center uppercase">
          TAJMA
        </AppText>
        <View className="h-1.5 w-20 bg-primary rounded-full mt-4 mb-10" />
        
        {/* Minimal Tagline */}
        <AppText className="text-gray-500 text-center text-lg leading-7 mb-16 font-medium">
          The most trusted way to buy, sell, and discover in your community.
        </AppText>

        {/* Action Buttons */}
        <View className="w-full">
            <WelcomeButtons />
        </View>
      </View>

      {/* Subtle Footer */}
      <View className="pb-10 items-center">
        <AppText className="text-gray-300 text-xs tracking-widest uppercase">
          tajma.com • Niger
        </AppText>
      </View>
    </View>
  );
}
