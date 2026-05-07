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
import { useTranslation } from "react-i18next";

// We'll dynamically import or handle if SDK is not yet available to prevent crash
let SmileID: any;
try {
  SmileID = require("@smile_id/expo-smile-id-sdk").SmileID;
} catch (e) {
  console.log("Smile ID SDK not yet installed");
}

export default function KYCScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { initiateKYC, isInitiating } = useKYC();
  const { user } = useAuthStore();
  const [step, setStep] = useState<"intro" | "choice">("intro");
  const [selectedId, setSelectedId] = useState<string>("NATIONAL_ID");
  const [isVerifying, setIsVerifying] = useState(false);

  const startVerification = async () => {
    if (!SmileID) {
      Alert.alert(
        t('common.error'),
        t('kyc.errorGeneric'),
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
              t('kyc.successTitle'),
              t('kyc.successMessage'),
              [{ text: t('common.ok'), onPress: () => router.back() }],
            );
          } else {
            Alert.alert(
              t('kyc.failedTitle'),
              result.error?.message || t('kyc.errorGeneric'),
            );
          }
        })
        .catch((err: any) => {
          console.error("Smile ID Error:", err);
          Alert.alert(t('common.error'), t('kyc.errorStart'));
        })
        .finally(() => {
          setIsVerifying(false);
        });
    } catch (error) {
      console.error("Initiation Error:", error);
      Alert.alert(t('common.error'), t('kyc.errorInitiate'));
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title={t('kyc.title')}
        subtitle={t('kyc.subtitle')}
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
              {t('kyc.introTitle')}
            </AppText>

            <AppText className="text-gray-500 text-center mb-10 leading-6">
              {t('kyc.introDesc')}
            </AppText>

            <View className="w-full space-y-4 mb-12">
              {[
                {
                  icon: "document-text-outline",
                  text: t('kyc.idTypesList'),
                },
                { icon: "camera-outline", text: t('kyc.selfieCapture') },
                { icon: "time-outline", text: t('kyc.timeEstimate') },
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
                {t('common.continue')}
              </AppText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <AppText
              weight="bold"
              className="text-2xl text-gray-900 text-center mb-6"
            >
              {t('kyc.selectIdType')}
            </AppText>

            <View className="w-full space-y-3 mb-10">
              {[
                {
                  id: "NATIONAL_ID",
                  label: t('kyc.nationalId'),
                  icon: "card-outline",
                },
                { id: "PASSPORT", label: t('kyc.passport'), icon: "journal-outline" },
                {
                  id: "DRIVING_LICENSE",
                  label: t('kyc.drivingLicense'),
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
                  {t('kyc.startScanning')}
                </AppText>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep("intro")} className="mt-6">
              <AppText className="text-gray-400 font-semibold">{t('common.goBack')}</AppText>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-2">
          <AppText className="text-gray-400 font-semibold">
            {step === "intro" ? t('profile.maybeLater') : ""}
          </AppText>
        </TouchableOpacity>
      </View>

      <View className="px-8 pb-10">
        <AppText className="text-[10px] text-gray-400 text-center">
          {t('kyc.privacyNotice')}
        </AppText>
      </View>
    </View>
  );
}
