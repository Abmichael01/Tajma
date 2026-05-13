import { View, ScrollView, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import CategoryCard from "@/components/ads/CategoryCard";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "react-i18next";

export default function CategoriesScreen() {
    const { t } = useTranslation();
    const { rootCategories, loading } = useCategories();

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />
            <ScreenHeader title={t('search.category.allCategories')} />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="px-4 py-6">
                    <AppText variant="subheading" weight="bold" className="text-gray-900 mb-2">{t('search.category.browseByCategory')}</AppText>
                    <AppText variant="default" className="text-gray-500 mb-6">{t('search.category.exploreListings')}</AppText>
                    {loading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color="#FF4F18" />
                            <AppText className="text-gray-400 mt-4">{t('search.category.loadingCategories')}</AppText>
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap gap-3">
                            {rootCategories.map((category) => (
                                <View key={category.id} className="w-[31%]"><CategoryCard category={category} /></View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
