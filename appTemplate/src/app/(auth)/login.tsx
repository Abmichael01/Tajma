import { View, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";

export default function LoginScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white px-4">
      <Link href="/" asChild>
        <TouchableOpacity className="absolute top-12 left-5 p-2 z-10">
          <View className="flex-row items-center">
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <AppText weight="medium" className="text-blue-500 ml-1">Back</AppText>
          </View>
        </TouchableOpacity>
      </Link>
      
      <View className="items-center mb-8">
        <View className="bg-blue-50 rounded-full p-4 mb-4">
          <Ionicons name="log-in-outline" size={48} color="#007AFF" />
        </View>
        <AppText variant="heading" weight="bold" className="mb-2">Login</AppText>
        <AppText variant="caption" center>Welcome back! Please sign in to continue</AppText>
      </View>
      
      <Button
        variant="outline"
        size="md"
        className="w-full mb-4"
        leftIcon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
      >
        Continue with Google
      </Button>
    </View>
  );
}

