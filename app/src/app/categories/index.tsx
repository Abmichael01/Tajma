import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import CategoryCard from "@/components/ads/CategoryCard";
import { useCategories } from "@/hooks/useCategories";

export default function CategoriesScreen() {
    const { rootCategories, loading } = useCategories();
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />

            <ScreenHeader title="All Categories" />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <View className="px-4 py-6">
                    <AppText variant="subheading" weight="bold" className="text-gray-900 mb-2">
                        Browse by Category
                    </AppText>
                    <AppText variant="default" className="text-gray-500 mb-6">
                        Explore listings across different departments.
                    </AppText>

                    {loading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color="#FF4F18" />
                            <AppText className="text-gray-400 mt-4">Loading categories...</AppText>
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap gap-3">
                            {rootCategories.map((category) => (
                                <View key={category.id} className="w-[31%]">
                                    <CategoryCard category={category} />
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
