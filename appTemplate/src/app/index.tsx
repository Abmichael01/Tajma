import { View, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-white px-4">
      <View className="items-center mb-10">
        <View className="bg-blue-50 rounded-full p-4 mb-4">
          <Ionicons name="sparkles" size={48} color="#007AFF" />
        </View>
        <AppText variant="heading" weight="bold" className="mb-2">Welcome</AppText>
        <AppText variant="caption" center>Get started with Tajma</AppText>
      </View>
      
      <View className="w-full mb-6">
        <AppText variant="subheading" weight="semibold" center className="mb-4">Authentication</AppText>
        <Button
          variant="default"
          size="lg"
          className="mb-3 w-full"
          leftIcon={<Ionicons name="log-in-outline" size={24} color="#FFFFFF" />}
          onPress={() => router.push("/(auth)/login")}
        >
          Login
        </Button>
        <Button
          variant="secondary"
          size="md"
          className="w-full"
          leftIcon={<Ionicons name="person-add-outline" size={20} color="#FFFFFF" />}
          onPress={() => router.push("/(auth)/register")}
        >
          Register
        </Button>
      </View>

      <View className="w-full">
        <AppText variant="subheading" weight="semibold" center className="mb-4">Tabs</AppText>
        <View className="flex-row flex-wrap justify-center gap-2">
          <Link href="/(tabs)" asChild>
            <TouchableOpacity className="bg-gray-100 px-4 py-3 rounded-lg flex-1 min-w-[100px] items-center">
              <Ionicons name="home-outline" size={20} color="#374151" />
              <AppText variant="caption" weight="medium" className="text-gray-700 mt-1">Home</AppText>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/alerts" asChild>
            <TouchableOpacity className="bg-gray-100 px-4 py-3 rounded-lg flex-1 min-w-[100px] items-center">
              <Ionicons name="notifications-outline" size={20} color="#374151" />
              <AppText variant="caption" weight="medium" className="text-gray-700 mt-1">Alerts</AppText>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/add" asChild>
            <TouchableOpacity className="bg-gray-100 px-4 py-3 rounded-lg flex-1 min-w-[100px] items-center">
              <Ionicons name="add-circle-outline" size={20} color="#374151" />
              <AppText variant="caption" weight="medium" className="text-gray-700 mt-1">Add</AppText>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/chat" asChild>
            <TouchableOpacity className="bg-gray-100 px-4 py-3 rounded-lg flex-1 min-w-[100px] items-center">
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#374151" />
              <AppText variant="caption" weight="medium" className="text-gray-700 mt-1">Chat</AppText>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/profile" asChild>
            <TouchableOpacity className="bg-gray-100 px-4 py-3 rounded-lg flex-1 min-w-[100px] items-center">
              <Ionicons name="person-outline" size={20} color="#374151" />
              <AppText variant="caption" weight="medium" className="text-gray-700 mt-1">Profile</AppText>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
