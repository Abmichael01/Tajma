import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ui/ScreenHeader";
import AppText from "@/components/ui/AppText";
import { useCreateReport } from "@/hooks/useSupport";
import * as Haptics from "expo-haptics";

const REPORT_TYPES = [
  { label: "Support Request", value: "support", icon: "help-circle-outline" },
  { label: "General Feedback", value: "feedback", icon: "chatbox-outline" },
  { label: "Technical Issue", value: "support", icon: "build-outline" },
];

const REASONS = [
  { label: "Account Issue", value: "other" },
  { label: "Payment Problem", value: "other" },
  { label: "Safety Concern", value: "scam" },
  { label: "Bug Report", value: "other" },
  { label: "Feature Request", value: "other" },
  { label: "Other", value: "other" },
];

export default function CreateSupportTicketScreen() {
  const router = useRouter();
  const createMutation = useCreateReport();

  const [type, setType] = useState("support");
  const [reason, setReason] = useState("other");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Required", "Please provide a description of your issue.");
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await createMutation.mutateAsync({
        report_type: type as any,
        reason: reason,
        description: description,
      });
      router.back();
    } catch (error) {
      console.error("Failed to create ticket:", error);
      Alert.alert("Error", "Failed to submit your request. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="New Ticket" subtitle="How can we help you?" />

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <AppText weight="bold" className="text-slate-900 text-lg mb-4">
          Request Type
        </AppText>
        <View className="flex-row flex-wrap gap-3 mb-8">
          {REPORT_TYPES.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setType(item.value);
              }}
              className={`flex-row items-center gap-2 px-5 py-3 rounded-full border ${
                type === item.value
                  ? "bg-primary/5 border-primary"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={type === item.value ? "#FF4F18" : "#64748B"}
              />
              <AppText
                weight={type === item.value ? "bold" : "semibold"}
                className={`text-[14px] ${type === item.value ? "text-primary" : "text-slate-500"}`}
              >
                {item.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <AppText weight="bold" className="text-slate-900 text-lg mb-4">
          Reason
        </AppText>
        <View className="flex-row flex-wrap gap-3 mb-8">
          {REASONS.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setReason(item.value);
              }}
              className={`px-5 py-3 rounded-full border ${
                reason === item.value
                  ? "bg-slate-900 border-slate-900"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <AppText
                weight={reason === item.value ? "bold" : "semibold"}
                className={`text-[14px] ${reason === item.value ? "text-white" : "text-slate-500"}`}
              >
                {item.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <AppText weight="bold" className="text-slate-900 text-lg mb-4">
          Description
        </AppText>
        <View className="bg-slate-50 rounded-3xl p-5 border border-slate-100 mb-10">
          <TextInput
            multiline
            numberOfLines={6}
            placeholder="Please describe your issue in detail..."
            placeholderTextColor="#94A3B8"
            className="text-slate-900 text-[16px] min-h-[150px]"
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          className={`w-full py-4 rounded-full items-center justify-center mb-10 ${createMutation.isPending ? "bg-slate-200" : "bg-primary shadow-lg shadow-primary/30"}`}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <AppText weight="bold" className="text-white text-lg">
              Submit Ticket
            </AppText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
