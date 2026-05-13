import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import AdForm from "@/components/ads/AdForm";
import { useAdDetails, useUpdateAd } from "@/hooks/useAds";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useTranslation } from "react-i18next";

export default function EditAdScreen() {
    const { t } = useTranslation();
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
            const msg = error?.response?.data?.message || t('ads.updateError');
            showAlert({
                title: t('common.error'),
                message: msg,
                icon: "alert-circle-outline",
                iconColor: "#ef4444",
                buttons: [{ text: t('common.ok') }]
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
                <ScreenHeader title={t('common.error')} variant="white" />
                <View className="flex-1 items-center justify-center p-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                    <AppText weight="bold" className="text-xl mt-4 text-center">{t('ads.loadErrorDetails')}</AppText>
                    <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-primary px-6 py-3 rounded-full">
                        <AppText weight="semibold" className="text-white">{t('common.goBack')}</AppText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <ScreenHeader title={t('ads.editListingTitle')} subtitle={t('ads.editListingSubtitle')} />
            <AdForm initialData={ad} onSubmit={handleSubmit} isSubmitting={updateAdMutation.isPending} submitLabel={t('ads.saveChanges')} mode="edit" />
            <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} icon={alertConfig.icon} iconColor={alertConfig.iconColor} buttons={alertConfig.buttons} onDismiss={hideAlert} />
        </View>
    );
}
