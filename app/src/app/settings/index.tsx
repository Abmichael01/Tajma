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
      <View className="px-6 py-6 bg-white">
        <View className="flex-row items-center bg-slate-50 p-1.5 rounded-full border border-slate-100">
          {[
            { id: "profile", label: t('settings.editProfile'), icon: "person" },
            {
              id: "security",
              label: t('settings.security'),
              icon: "lock-closed",
            },
          ].map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex-1 h-11 flex-row items-center justify-center rounded-full transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-white shadow-sm"
                  : ""
              }`}
            >
              <View className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${
                activeTab === tab.id ? "bg-primary" : "bg-slate-200"
              }`}>
                <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={activeTab === tab.id ? "#FFFFFF" : "#64748B"}
                />
              </View>
              <AppText
                weight={activeTab === tab.id ? "bold" : "medium"}
                className={`text-[12px] uppercase tracking-wider ${
                    activeTab === tab.id ? "text-slate-900" : "text-slate-400"
                }`}
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
