import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface BackButtonProps {
  className?: string;
  iconColor?: string;
  iconSize?: number;
}

export default function BackButton({ 
  className = "", 
  iconColor = "#0f172b",
  iconSize = 24 
}: BackButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.back()}
      className={`absolute top-10 left-4 z-20 w-12 h-12 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm ${className}`}
    >
      <Ionicons name="chevron-back" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

