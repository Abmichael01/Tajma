import { View, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";

export default function RegisterScreen() {
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
        <View className="bg-green-50 rounded-full p-4 mb-4">
          <Ionicons name="person-add-outline" size={48} color="#10B981" />
        </View>
        <AppText variant="heading" weight="bold" className="mb-2">Register</AppText>
        <AppText variant="caption" center>Create a new account to get started</AppText>
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

