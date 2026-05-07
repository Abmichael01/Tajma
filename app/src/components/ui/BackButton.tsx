import { TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BackButtonProps {
  className?: string;
  iconColor?: string;
  iconSize?: number;
  onPress?: () => void;
  isStatic?: boolean;
}

export default function BackButton({
  className = "",
  iconColor = "#0f172b",
  iconSize = 22,
  onPress,
  isStatic = false
}: BackButtonProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      style={!isStatic ? { top: insets.top + 10 } : {}}
      className={`${!isStatic ? 'absolute left-4 z-50' : ''} w-10 h-10 rounded-full bg-white border border-gray-100 items-center justify-center shadow-sm ${className}`}
    >
      <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

