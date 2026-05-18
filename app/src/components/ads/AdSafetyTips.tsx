import { View } from "react-native";
import { useTranslation } from "react-i18next";
import AppText from "@/components/ui/AppText";

interface AdSafetyTipsProps {
  className?: string;
}

export default function AdSafetyTips({ className = "" }: AdSafetyTipsProps) {
  const { t } = useTranslation();
  return (
    <View className={`bg-blue-50 border-b border-blue-200 px-4 py-6 ${className}`}>
      <AppText variant="default" weight="semibold" className="text-blue-900 mb-3">
        {t("ads.safetyTips.title")}
      </AppText>
      <View className="space-y-2">
        <AppText variant="default" className="text-blue-800">
          • {t("ads.safetyTips.publicPlace")}
        </AppText>
        <AppText variant="default" className="text-blue-800">
          • {t("ads.safetyTips.inspect")}
        </AppText>
        <AppText variant="default" className="text-blue-800">
          • {t("ads.safetyTips.neverPayInAdvance")}
        </AppText>
        <AppText variant="default" className="text-blue-800">
          • {t("ads.safetyTips.report")}
        </AppText>
      </View>
    </View>
  );
}
