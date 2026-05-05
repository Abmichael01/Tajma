import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import EditProfileForm from "@/components/settings/EditProfileForm";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import { useTranslation } from "react-i18next";

import ScreenHeader from "@/components/ui/ScreenHeader";

type SettingsTab = "profile" | "security";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      {/* Tab Selector */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row gap-3">
          {[
            { id: "profile", label: t('settings.editProfile'), icon: "person-outline" },
            {
              id: "security",
              label: t('settings.security'),
              icon: "shield-checkmark-outline",
            },
          ].map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex-1 h-11 flex-row items-center justify-center rounded-full border ${
                activeTab === tab.id
                  ? "bg-secondary border-secondary"
                  : "bg-white border-gray-200"
              }`}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.id ? "#FFFFFF" : "#9ca3af"}
              />
              <AppText
                weight={activeTab === tab.id ? "bold" : "medium"}
                className={`ml-2 ${activeTab === tab.id ? "text-white" : "text-gray-500"}`}
              >
                {tab.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Form Content */}
      <View className="flex-1">
        {activeTab === "profile" ? <EditProfileForm /> : <ChangePasswordForm />}
      </View>
    </View>
  );
}
