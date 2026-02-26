import { TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BackButtonProps {
  className?: string;
  iconColor?: string;
  iconSize?: number;
  onPress?: () => void;
}

export default function BackButton({
  className = "",
  iconColor = "#0f172b",
  iconSize = 22,
  onPress
}: BackButtonProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Determine standard top offset (10 usually, or 4 if standard)
  // top-10 is 40px in Tailwind (10 * 4).
  // We'll use 10 logical pixels + insets.top? No, tailwind 10 is 40 units?
  // React Native defaults: numbers are DP.
  // Tailwind `top-10` = 40dp.
  // So `insets.top + 10` (10dp) might be too small if we want 40dp.
  // But usually `top-10` (40dp) includes the status bar space if `translucent`.
  // If status bar is 50dp, `top-10` puts it BEHIND status bar.
  // So we want `top: insets.top + 10` where 10 is the margin FROM status bar.

  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      style={{ top: insets.top + 10 }}
      className={`absolute left-4 z-50 w-10 h-10 rounded-full bg-white border border-gray-100 items-center justify-center shadow-sm ${className}`}
    >
      <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

