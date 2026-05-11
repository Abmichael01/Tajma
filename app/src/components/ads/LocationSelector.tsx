import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "../ui/AppText";
import { useTranslation } from "react-i18next";

interface LocationSelectorProps {
  locationName?: string;
  countryName?: string;
  onPress: () => void;
  error?: string;
}

export default function LocationSelector({
  locationName,
  countryName,
  onPress,
  error,
}: LocationSelectorProps) {
  const { t } = useTranslation();

  const displayText =
    countryName && locationName
      ? `${countryName} > ${locationName}`
      : countryName || locationName || t("create_ad.fields.locationPlaceholder");

  return (
    <View className="mb-6">
      <AppText className="mb-2 text-gray-700 font-medium">
        {t("create_ad.fields.location")}
      </AppText>
      <TouchableOpacity
        onPress={onPress}
        className={`flex-row items-center bg-gray-50 border ${
          error ? "border-red-500" : "border-gray-200"
        } rounded-full px-4 py-4`}
      >
        <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center mr-3">
          <Ionicons name="location" size={18} color="#FF4F18" />
        </View>
        <AppText
          className={`flex-1 text-base ${
            locationName || countryName ? "text-gray-900" : "text-gray-400"
          }`}
          numberOfLines={1}
        >
          {displayText}
        </AppText>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>
      {error && <AppText className="text-red-500 text-xs mt-1 ml-2">{error}</AppText>}
    </View>
  );
}
