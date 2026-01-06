import { View } from "react-native";
import AppText from "@/components/ui/AppText";

interface AdSafetyTipsProps {
  className?: string;
}

export default function AdSafetyTips({ className = "" }: AdSafetyTipsProps) {
  return (
    <View className={`bg-blue-50 border-b border-blue-200 px-4 py-6 ${className}`}>
      <AppText variant="default" weight="semibold" className="text-blue-900 mb-3">
        Safety Tips
      </AppText>
      <View className="space-y-2">
        <AppText variant="default" className="text-blue-800">• Meet in a public place</AppText>
        <AppText variant="default" className="text-blue-800">• Inspect the item before paying</AppText>
        <AppText variant="default" className="text-blue-800">• Never pay in advance</AppText>
        <AppText variant="default" className="text-blue-800">• Report suspicious activity</AppText>
      </View>
    </View>
  );
}

