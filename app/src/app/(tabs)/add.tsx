import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AppText from "@/components/ui/AppText";
import AdForm from "@/components/ads/AdForm";
import { useCreateAd } from "@/hooks/useAds";
import ScreenHeader from "@/components/ui/ScreenHeader";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";

export default function AddScreen() {
  const router = useRouter();
  const createAdMutation = useCreateAd();
  const { alertConfig, showAlert, hideAlert } = useAlert();

  const handleSubmit = async (payload: any) => {
    try {
      await createAdMutation.mutateAsync(payload);
      router.push("/profile/my-ads");
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Failed to create ad. Please try again.";
      showAlert({
        title: "Error",
        message: msg,
        icon: "alert-circle-outline",
        iconColor: "#ef4444",
        buttons: [{ text: "OK" }]
      });
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      {/* Header */}
      <ScreenHeader
        title="What are you listing?"
        subtitle="Fill in the details for your new ad"
        showBackButton={false}
      />

      <AdForm
        onSubmit={handleSubmit}
        isSubmitting={createAdMutation.isPending}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
}
