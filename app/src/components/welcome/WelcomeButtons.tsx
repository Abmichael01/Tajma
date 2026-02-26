import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";

export default function WelcomeButtons() {
  const router = useRouter();

  return (
    <View className="w-full">
      <Button
        size="lg"
        className="mb-3 w-full"
        leftIcon={<Ionicons name="log-in-outline" size={24} color="#FFFFFF" />}
        onPress={() => router.push("/(auth)/login")}
      >
        Login
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        leftIcon={<Ionicons name="person-add-outline" size={24} color="#FFFFFF" />}
        onPress={() => router.push("/(auth)/register")}
      >
        Register
      </Button>
    </View>
  );
}

