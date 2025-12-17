import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";

export default function HomeScreen() {
  const router = useRouter();

  const handleBackToWelcome = () => {
    router.replace("/");
  };

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <TouchableOpacity 
        className="absolute top-12 left-5 p-2 z-10"
        onPress={handleBackToWelcome}
      >
        <View className="flex-row items-center">
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <AppText weight="medium" className="text-blue-500 ml-1">Back to Welcome</AppText>
        </View>
      </TouchableOpacity>
      
      <AppText variant="heading" weight="bold">Home</AppText>
    </View>
  );
}

