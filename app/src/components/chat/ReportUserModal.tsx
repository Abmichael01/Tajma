import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";
import { reportsApi } from "@/api/reports";
import { useAuthStore } from "@/store/authStore";

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: string | number;
    username?: string;
    full_name?: string;
  };
}

const getReportReasons = (t: any) => [
  { value: "scam", label: t("report.reasons.scam") },
  { value: "offensive", label: t("report.reasons.offensive") },
  { value: "spam", label: t("report.reasons.spam") },
  { value: "other", label: t("report.reasons.other") },
];

export default function ReportUserModal({
  visible,
  onClose,
  user,
}: ReportUserModalProps) {
  const { t } = useTranslation();
  const reportReasons = getReportReasons(t);
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const { user: currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const getErrorMessage = (error: any) => {
    const data = error?.response?.data;
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;
    if (data && typeof data === "object") {
      const firstValue = Object.values(data)[0];
      if (Array.isArray(firstValue) && firstValue[0]) return String(firstValue[0]);
      if (typeof firstValue === "string") return firstValue;
    }
    return t("common.error");
  };

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert(t("report.selectionRequired"), t("report.selectReason"));
      return;
    }
    if (description.length < 10) {
      Alert.alert(t("report.moreDetails"), t("report.clearerDesc"));
      return;
    }

    setIsLoading(true);
    try {
      await reportsApi.create({
        report_type: "user",
        reported_user: String(user.id),
        reason: selectedReason,
        description,
        contact_email: currentUser?.email || undefined,
      });

      Alert.alert(t("report.submittedTitle"), t("report.submittedDesc"), [
        { text: t("common.ok"), onPress: onClose },
      ]);

      setSelectedReason(null);
      setDescription("");
    } catch (error: any) {
      Alert.alert(t("common.error"), getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = user.full_name || user.username || "User";

  return (
    <BottomSheet
      ref={bottomSheetRef}
      title={t("report.reportUser")}
      onClose={onClose}
      snapPoints={["80%"]}
    >
      <View className="px-6 py-4">
        <AppText className="text-gray-500 mb-6 text-sm">
          {t("report.helpUs")}{"\n"}
          <AppText weight="bold" className="text-gray-900">
            "{displayName}"
          </AppText>
          ?
        </AppText>

        <View className="space-y-2 mb-6 gap-2">
          {reportReasons.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              onPress={() => setSelectedReason(reason.value)}
              className={`flex-row items-center justify-between p-4 rounded-full border ${
                selectedReason === reason.value
                  ? "bg-primary/5 border-primary"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <AppText
                weight={selectedReason === reason.value ? "bold" : "medium"}
                className={
                  selectedReason === reason.value ? "text-primary" : "text-gray-700"
                }
              >
                {reason.label}
              </AppText>
              {selectedReason === reason.value && (
                <Ionicons name="checkmark-circle" size={20} color="#FF4F18" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <AppText weight="bold" className="text-gray-900 mb-2">
          {t("report.description")}
        </AppText>
        <View className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-8">
          <TextInput
            multiline
            numberOfLines={4}
            placeholder={t("report.detailsPlaceholder")}
            placeholderTextColor="#94a3b8"
            className="text-gray-900 text-sm h-32"
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="w-full h-14 bg-gray-900 rounded-full items-center justify-center shadow-sm"
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <AppText weight="bold" className="text-white text-lg">
              {t("report.submit")}
            </AppText>
          )}
        </TouchableOpacity>

        <View className="mt-4 items-center mb-8">
          <AppText className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
            {t("report.warning")}
          </AppText>
        </View>

        <View className="h-20" />
      </View>
    </BottomSheet>
  );
}
