import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa', flag: '🇳🇬' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      
      <ScreenHeader 
        title={t('profile.language')} 
        showBackButton={true}
      />

      <ScrollView className="flex-1 px-6 pt-6">
        <AppText weight="bold" className="text-gray-400 text-xs uppercase tracking-widest mb-4">
          {t('common.select')} {t('profile.language')}
        </AppText>

        <View className="space-y-3">
          {LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                className={`flex-row items-center p-5 rounded-[24px] border ${
                  isSelected ? 'bg-primary/5 border-primary' : 'bg-gray-50/50 border-gray-100'
                }`}
              >
                <View className={`w-12 h-12 rounded-full items-center justify-center ${
                  isSelected ? 'bg-primary' : 'bg-white border border-gray-100'
                }`}>
                  <AppText style={{ fontSize: 24 }}>{lang.flag}</AppText>
                </View>

                <View className="ml-4 flex-1">
                  <AppText weight="bold" className={`text-lg ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                    {lang.name}
                  </AppText>
                  <AppText className="text-gray-400 text-sm">
                    {lang.nativeName}
                  </AppText>
                </View>

                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-10 p-6 bg-secondary/5 rounded-[32px] border border-secondary/10">
            <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle-outline" size={20} color="#FF4F18" />
                <AppText weight="bold" className="text-secondary ml-2">{t('common.note')}</AppText>
            </View>
            <AppText className="text-gray-500 text-xs leading-5">
                {t('settings.languageNote')}
            </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
