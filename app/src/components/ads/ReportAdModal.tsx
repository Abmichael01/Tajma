import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";
import { reportsApi } from "@/api/reports";
import { useAuthStore } from "@/store/authStore";

interface ReportAdModalProps {
  visible: boolean;
  onClose: () => void;
  ad: any;
}

const reportReasons = [
  { value: "scam", label: "Scam or Fraud" },
  { value: "counterfeit", label: "Fake or Counterfeit Items" },
  { value: "offensive", label: "Inappropriate Content" },
  { value: "spam", label: "Spam or Harassment" },
  { value: "duplicate", label: "Duplicate Listing" },
  { value: "wrong_category", label: "Wrong Category" },
  { value: "prohibited", label: "Prohibited Items" },
  { value: "other", label: "Other" },
];

const getReportErrorMessage = (error: any) => {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;
  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue[0])
      return String(firstValue[0]);
    if (typeof firstValue === "string") return firstValue;
  }
  return "Failed to submit report. Please try again.";
};

export default function ReportAdModal({
  visible,
  onClose,
  ad,
}: ReportAdModalProps) {
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert(
        "Selection Required",
        "Please select a reason for reporting.",
      );
      return;
    }

    if (description.length < 10) {
      Alert.alert(
        "More Details Needed",
        "Please provide a clearer description (min 10 chars).",
      );
      return;
    }

    setIsLoading(true);
    try {
      await reportsApi.create({
        report_type: "ad",
        related_ad: ad.id,
        reason: selectedReason,
        description: description,
        contact_email: user?.email || undefined,
      });

      Alert.alert(
        "Report Submitted",
        "Thank you for your report. Our team will review it shortly.",
        [{ text: "OK", onPress: onClose }],
      );

      // Success reset
      setSelectedReason(null);
      setDescription("");
    } catch (error: any) {
      console.error("Report submission error:", error);
      Alert.alert("Error", getReportErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (!ad) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      title="Report This Ad"
      onClose={onClose}
      snapPoints={["80%"]}
    >
      <View className="px-6 py-4">
        <AppText className="text-gray-500 mb-6 text-sm">
          Help us keep Tajma safe. Why are you reporting {"\n"}
          <AppText weight="bold" className="text-gray-900">
            "{ad.title}"
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
                  selectedReason === reason.value
                    ? "text-primary"
                    : "text-gray-700"
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
          Description
        </AppText>
        <View className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-8">
          <TextInput
            multiline
            numberOfLines={4}
            placeholder="Provide more details about the issue..."
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
              Submit Report
            </AppText>
          )}
        </TouchableOpacity>

        <View className="mt-4 items-center mb-8">
          <AppText className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
            False reports may lead to account suspension
          </AppText>
        </View>

        <View className="h-20" />
      </View>
    </BottomSheet>
  );
}
