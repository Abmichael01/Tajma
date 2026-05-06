import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import AppText from "@/components/ui/AppText";
import { cn } from "@/utils/cn";

function WelcomeButton({
  label,
  onPress,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  const bg = variant === "primary" ? "bg-primary" : "bg-secondary";

  return (
    <Pressable
      onPress={onPress}
      className={cn("w-full rounded-full px-6 py-4 flex-row items-center", bg)}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
    >
      {/* Left spacer — same size as the icon so text is perfectly centered */}
      <View style={{ width: 20 }} />

      <AppText
        weight="semibold"
        className="flex-1 text-center text-white text-lg"
      >
        {label}
      </AppText>

      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
    </Pressable>
  );
}

export default function WelcomeButtons() {
  const router = useRouter();

  return (
    <View className="w-full gap-3">
      <WelcomeButton
        label="Login"
        onPress={() => router.push("/(auth)/login")}
        variant="primary"
      />
      <WelcomeButton
        label="Create an account"
        onPress={() => router.push("/(auth)/register")}
        variant="secondary"
      />
    </View>
  );
}
