import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useKYC } from "@/hooks/useKYC";
import { useAuthStore } from "@/store/authStore";

// We'll dynamically import or handle if SDK is not yet available to prevent crash
let SmileID: any;
try {
  SmileID = require("@smile_id/expo-smile-id-sdk").SmileID;
} catch (e) {
  console.log("Smile ID SDK not yet installed");
}

export default function KYCScreen() {
  const router = useRouter();
  const { initiateKYC, isInitiating } = useKYC();
  const { user } = useAuthStore();
  const [step, setStep] = useState<"intro" | "choice">("intro");
  const [selectedId, setSelectedId] = useState<string>("NATIONAL_ID");
  const [isVerifying, setIsVerifying] = useState(false);

  const startVerification = async () => {
    if (!SmileID) {
      Alert.alert(
        "Error",
        "Verification SDK is not ready yet. Please try again later.",
      );
      return;
    }

    try {
      const tokenData = await initiateKYC({
        id_type: selectedId,
        country: "NE",
      });
      setIsVerifying(true);

      // Smile ID SDK configuration
      // We pass the token received from our backend
      SmileID.startDocumentVerification({
        userId: tokenData.user_id,
        jobId: tokenData.job_id,
        country: "NE", // Niger
        idType: selectedId,
        selfieRequired: true,
        captureBothSides: selectedId === "NATIONAL_ID", // Some ID cards need both sides
      })
        .then((result: any) => {
          console.log("Smile ID Result:", result);
          if (result.status === "success") {
            Alert.alert(
              "Success",
              "Your documents have been submitted and are being reviewed.",
              [{ text: "OK", onPress: () => router.back() }],
            );
          } else {
            Alert.alert(
              "Verification Failed",
              result.error?.message || "Something went wrong",
            );
          }
        })
        .catch((err: any) => {
          console.error("Smile ID Error:", err);
          Alert.alert("Error", "Verification failed to start");
        })
        .finally(() => {
          setIsVerifying(false);
        });
    } catch (error) {
      console.error("Initiation Error:", error);
      Alert.alert("Error", "Failed to start verification process");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Verify Identity"
        subtitle="Complete your KYC verification"
      />

      <View className="flex-1 px-8 py-12 items-center text-center">
        {step === "intro" ? (
          <>
            <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="shield-checkmark" size={48} color="#FF4F18" />
            </View>

            <AppText
              weight="bold"
              className="text-2xl text-gray-900 text-center mb-4"
            >
              Verify Your Identity
            </AppText>

            <AppText className="text-gray-500 text-center mb-10 leading-6">
              To provide a safe marketplace for everyone, we require sellers to
              verify their identity. You will need a valid government-issued ID
              from Niger and a quick selfie.
            </AppText>

            <View className="w-full space-y-4 mb-12">
              {[
                {
                  icon: "document-text-outline",
                  text: "Nigerien Passport / ID / DL",
                },
                { icon: "camera-outline", text: "Live Selfie Capture" },
                { icon: "time-outline", text: "Takes less than 2 minutes" },
              ].map((item, i) => (
                <View
                  key={i}
                  className="flex-row items-center bg-gray-50 p-4 rounded-2xl border border-gray-100"
                >
                  <Ionicons name={item.icon as any} size={20} color="#64748b" />
                  <AppText className="text-gray-700 ml-3 font-medium">
                    {item.text}
                  </AppText>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setStep("choice")}
              className="w-full bg-primary h-14 rounded-full items-center justify-center shadow-lg shadow-primary/30"
              style={{ backgroundColor: "#FF4F18" }}
            >
              <AppText weight="bold" className="text-white text-lg">
                Continue
              </AppText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <AppText
              weight="bold"
              className="text-2xl text-gray-900 text-center mb-6"
            >
              Select ID Type
            </AppText>

            <View className="w-full space-y-3 mb-10">
              {[
                {
                  id: "NATIONAL_ID",
                  label: "National ID Card (NiNE)",
                  icon: "card-outline",
                },
                { id: "PASSPORT", label: "Passport", icon: "journal-outline" },
                {
                  id: "DRIVING_LICENSE",
                  label: "Driver's License",
                  icon: "car-outline",
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedId(item.id)}
                  className={`flex-row items-center p-5 rounded-full border ${
                    selectedId === item.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={selectedId === item.id ? "#FF4F18" : "#64748b"}
                  />
                  <AppText
                    className={`ml-4 text-lg font-medium ${selectedId === item.id ? "text-primary" : "text-gray-900"}`}
                  >
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={startVerification}
              disabled={isInitiating || isVerifying}
              className="w-full bg-primary h-14 rounded-full items-center justify-center shadow-lg shadow-primary/30"
              style={{ backgroundColor: "#FF4F18" }}
            >
              {isInitiating || isVerifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText weight="bold" className="text-white text-lg">
                  Start Scanning
                </AppText>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep("intro")} className="mt-6">
              <AppText className="text-gray-400 font-semibold">Go Back</AppText>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-2">
          <AppText className="text-gray-400 font-semibold">
            {step === "intro" ? "Maybe Later" : ""}
          </AppText>
        </TouchableOpacity>
      </View>

      <View className="px-8 pb-10">
        <AppText className="text-[10px] text-gray-400 text-center">
          By continuing, you agree to share your identity data with our
          verification partner (Smile ID) strictly for account verification
          purposes.
        </AppText>
      </View>
    </View>
  );
}
