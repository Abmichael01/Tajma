import { View } from "react-native";
import AppText from "@/components/ui/AppText";

interface TypingIndicatorProps {
  // avatarSrc and userName are still passed but no longer used for the minimal UI
  avatarSrc?: string | null;
  userName?: string;
}

export default function TypingIndicator({ }: TypingIndicatorProps) {
  return (
    <View className="mb-3 flex-row justify-start">
      <View className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm ml-1">
        <AppText className="text-gray-500 text-[14px] italic">typing...</AppText>
      </View>
    </View>
  );
}
