import { View, Image } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import AppText from "@/components/ui/AppText";
import ProductGridBackground from "@/components/welcome/ProductGridBackground";
import GradientOverlay from "@/components/welcome/GradientOverlay";
import WelcomeButtons from "@/components/welcome/WelcomeButtons";
import { useAuthStore } from "@/store/authStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  // Redirect to home tab if user is already logged in
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Don't render welcome screen if user is authenticated
  if (hasHydrated && isAuthenticated) {
    return null;
  }

  return (
    <View className="flex-1 bg-white">
      {/* Background Grid */}
      <ProductGridBackground />
      
      {/* Gradient Overlay */}
      <GradientOverlay />
      
      {/* Main Content - Logo, Text, and Buttons */}
      <View className="flex-1 flex-col justify-between z-10 px-4 pt-12 pb-8">
        {/* Logo at top */}
        <View className="items-center">
          <Image
            source={require("@/assets/images/logo.jpg")}
            className="w-32 h-10"
            resizeMode="contain"
          />
        </View>

        {/* Hero Text - Centered */}
        <View className="px-2 items-center">
          <AppText 
            className="text-primary text-center"
            style={{ 
              fontFamily: "BebasNeue-Regular",
              fontSize: 70,
              lineHeight: 80,
            }}
          >
            Find{'\n'}Everything{'\n'}You Need Right Here
          </AppText>
        </View>

        {/* Buttons at bottom */}
        <WelcomeButtons />
      </View>
    </View>
  );
}
