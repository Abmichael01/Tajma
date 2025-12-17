import { View } from "react-native";
import AppText from "@/components/ui/AppText";

export default function ChatScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <AppText variant="heading" weight="bold">Chat</AppText>
    </View>
  );
}

