import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import AdForm from "@/components/ads/AdForm";
import { useAdDetails, useUpdateAd } from "@/hooks/useAds";
import BackButton from "@/components/ui/BackButton";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";

import ScreenHeader from "@/components/ui/ScreenHeader";

export default function EditAdScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { alertConfig, showAlert, hideAlert } = useAlert();
    const { data: ad, isLoading, error } = useAdDetails(id || "");
    const updateAdMutation = useUpdateAd(id || "");

    const handleSubmit = async (payload: any) => {
        try {
            await updateAdMutation.mutateAsync(payload);
            router.push(`/ads/${id}`);
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || "Failed to update ad. Please try again.";
            showAlert({
                title: "Error",
                message: msg,
                icon: "alert-circle-outline",
                iconColor: "#ef4444",
                buttons: [{ text: "OK" }]
            });
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#FF4F18" />
            </View>
        );
    }

    if (error || !ad) {
        return (
            <View className="flex-1 bg-white">
                <ScreenHeader title="Error" variant="white" />
                <View className="flex-1 items-center justify-center p-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                    <AppText weight="bold" className="text-xl mt-4 text-center">Failed to load ad details</AppText>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-6 bg-primary px-6 py-3 rounded-full"
                    >
                        <AppText weight="semibold" className="text-white">Go Back</AppText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <ScreenHeader
                title="Edit Listing"
                subtitle="Updates will be live immediately"
            />

            <AdForm
                initialData={ad}
                onSubmit={handleSubmit}
                isSubmitting={updateAdMutation.isPending}
                submitLabel="Save Changes"
                mode="edit"
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
