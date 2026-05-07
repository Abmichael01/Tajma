import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n";
import {
  getSuggestedLanguageForCountry,
  isLanguageCode,
  LANGUAGE_SELECTED_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  languages,
  type LanguageCode,
} from "@/i18n/languageConfig";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";

const getDeviceLanguage = (): LanguageCode => {
  const locale = Localization.getLocales()[0];
  return isLanguageCode(locale?.languageCode) ? locale.languageCode : "en";
};

const getInitialLanguage = (): LanguageCode => {
  const locale = Localization.getLocales()[0];
  return (
    getSuggestedLanguageForCountry(locale?.regionCode) || getDeviceLanguage()
  );
};

export default function LanguageSelectionGate() {
  const [isChecking, setIsChecking] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestedLanguage, setSuggestedLanguage] =
    useState<LanguageCode | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageCode>(getInitialLanguage);
  const hasManuallyPickedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const hasSelectedLanguage = await AsyncStorage.getItem(
          LANGUAGE_SELECTED_STORAGE_KEY,
        );

        if (hasSelectedLanguage === "true") {
          setIsVisible(false);
          return;
        }

        const localeCountry = Localization.getLocales()[0]?.regionCode;
        const localeSuggestion = getSuggestedLanguageForCountry(localeCountry);

        if (localeSuggestion) {
          setSuggestedLanguage(localeSuggestion);
          setSelectedLanguage(localeSuggestion);
        }

        setIsVisible(true);
        setIsChecking(false);

        try {
          const response = await fetch("https://ipapi.co/json/");
          const data = await response.json();
          const locationSuggestion = getSuggestedLanguageForCountry(
            data?.country_code,
          );

          if (isMounted && locationSuggestion) {
            setSuggestedLanguage(locationSuggestion);
            setSelectedLanguage((current) =>
              hasManuallyPickedRef.current ? current : locationSuggestion,
            );
          }
        } catch (error) {
          console.log("Language location suggestion skipped:", error);
        }
      } catch (error) {
        console.log("Language selection check failed:", error);
        if (isMounted) setIsVisible(true);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedOption = useMemo(
    () => languages.find((language) => language.code === selectedLanguage),
    [selectedLanguage],
  );
  const localizedText = useMemo(
    () => i18n.getFixedT(selectedLanguage),
    [selectedLanguage],
  );

  const handleSelectLanguage = (language: LanguageCode) => {
    hasManuallyPickedRef.current = true;
    setSelectedLanguage(language);
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      await i18n.changeLanguage(selectedLanguage);
      await AsyncStorage.multiSet([
        [LANGUAGE_STORAGE_KEY, selectedLanguage],
        [LANGUAGE_SELECTED_STORAGE_KEY, "true"],
      ]);
      setIsVisible(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isChecking || !isVisible) return null;

  return (
    <View className="absolute inset-0 z-50 bg-white">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-8">
          <View className="mb-8">
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-5">
              <Ionicons name="language-outline" size={28} color="#FF4F18" />
            </View>
            <AppText weight="bold" className="text-gray-950 text-3xl leading-9">
              {localizedText("onboarding.language.title")}
            </AppText>
            <AppText className="text-gray-500 text-base leading-6 mt-3">
              {localizedText("onboarding.language.subtitle")}
            </AppText>
          </View>

          <View className="gap-3">
            {languages.map((language) => {
              const isSelected = selectedLanguage === language.code;
              const isSuggested = suggestedLanguage === language.code;

              return (
                <TouchableOpacity
                  key={language.code}
                  activeOpacity={0.85}
                  onPress={() => handleSelectLanguage(language.code)}
                  className={`flex-row items-center p-5 rounded-[28px] border ${
                    isSelected
                      ? "bg-primary/5 border-primary"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      isSelected ? "bg-primary" : "bg-white"
                    }`}
                  >
                    <AppText style={{ fontSize: 24 }}>{language.flag}</AppText>
                  </View>

                  <View className="flex-1 ml-4">
                    <View className="flex-row items-center gap-2">
                      <AppText
                        weight="bold"
                        className={`text-lg ${
                          isSelected ? "text-primary" : "text-gray-900"
                        }`}
                      >
                        {language.nativeName}
                      </AppText>
                      {isSuggested && (
                        <View className="rounded-full bg-secondary/10 px-2 py-1">
                          <AppText
                            weight="bold"
                            className="text-secondary text-[10px]"
                          >
                            {localizedText("onboarding.language.suggested")}
                          </AppText>
                        </View>
                      )}
                    </View>
                    <AppText className="text-gray-400 text-sm mt-1">
                      {language.prompt}
                    </AppText>
                  </View>

                  {isSelected && (
                    <View className="w-7 h-7 rounded-full bg-primary items-center justify-center">
                      <Ionicons name="checkmark" size={18} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="mt-auto pb-6 pt-6">
            <Button
              size="lg"
              className="w-full"
              onPress={handleContinue}
              disabled={isSaving}
              loading={isSaving}
            >
              {selectedOption?.prompt || localizedText("common.continue")}
            </Button>
            <View className="items-center mt-4">
              {isSaving ? (
                <ActivityIndicator color="#FF4F18" />
              ) : (
                <AppText className="text-center text-gray-400 text-xs leading-5">
                  {localizedText("onboarding.language.changeLater")}
                </AppText>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
