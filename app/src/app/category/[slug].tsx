import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { SearchBar } from "@/components/home/Hero";
import AdsList from "@/components/ads/AdsList";
import CategoryCard from "@/components/ads/CategoryCard";
import { useCategories } from "@/hooks/useCategories";
import { useAdsList } from "@/hooks/useAds";

export default function CategoryDetailScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();
    const { getCategoryBySlug, getSubcategories, loading: categoriesLoading } = useCategories();

    const [searchQuery, setSearchQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    const category = useMemo(() => getCategoryBySlug(slug || ""), [getCategoryBySlug, slug]);
    const subcategories = useMemo(() =>
        category ? getSubcategories(category.id) : [],
        [category, getSubcategories]);

    const { data: ads, isLoading: adsLoading } = useAdsList({
        category: slug,
        search: searchQuery,
        status: 'published'
    });

    const isLoading = categoriesLoading || adsLoading;

    if (!category && !categoriesLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-6">
                <Ionicons name="alert-circle-outline" size={64} color="#FF4F18" />
                <AppText variant="subheading" weight="bold" className="mt-4 text-gray-900">Category Not Found</AppText>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-6 bg-primary px-8 py-3 rounded-full"
                >
                    <AppText weight="bold" className="text-white">Go Back</AppText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />

            <ScreenHeader title={category?.name || "Category"}>
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedRegion="All Niger"
                    onRegionPress={() => { }} // Disabled for category-specific search for now
                    onSearch={() => { }}
                />
            </ScreenHeader>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingTop: 16 }}
            >
                {isLoading && (
                    <View className="py-10 items-center">
                        <ActivityIndicator size="large" color="#FF4F18" />
                    </View>
                )}

                {!isLoading && subcategories.length > 0 && !searchQuery && (
                    <View className="px-5 py-4 border-b border-gray-100">
                        <TouchableOpacity
                            onPress={() => setIsExpanded(!isExpanded)}
                            className="flex-row items-center justify-between py-2"
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center">
                                <Ionicons
                                    name={isExpanded ? "chevron-down" : "chevron-forward"}
                                    size={20}
                                    color="#2D2D2D"
                                />
                                <AppText variant="default" weight="bold" className="text-gray-900 ml-2">
                                    Subcategories in {category?.name}
                                </AppText>
                            </View>
                            <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                                <AppText variant="caption" className="text-gray-500">
                                    {subcategories.length}
                                </AppText>
                            </View>
                        </TouchableOpacity>

                        {isExpanded && (
                            <View className="mt-2">
                                {subcategories.map((sub) => (
                                    <TouchableOpacity
                                        key={sub.id}
                                        onPress={() => router.push(`/category/${sub.slug}`)}
                                        className="flex-row items-center justify-between py-4 border-b border-gray-50"
                                        activeOpacity={0.6}
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4">
                                                <Ionicons
                                                    name={sub.icon as any || "apps-outline"}
                                                    size={20}
                                                    color="#FF4F18"
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <AppText variant="default" weight="semibold" className="text-gray-900">
                                                    {sub.name}
                                                </AppText>
                                                <AppText variant="caption" className="text-gray-500">
                                                    {sub.adsCount || 0} ads
                                                </AppText>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                <View className="mt-4">
                    {!isLoading && (
                        <View className="flex-row items-center justify-between mb-2 px-5">
                            <AppText variant="default" weight="bold" className="text-gray-900">
                                {searchQuery ? `Search results in ${category?.name}` : `Listings in ${category?.name}`}
                            </AppText>
                            {ads && ads.length > 0 && (
                                <AppText variant="caption" className="text-gray-500">
                                    {ads.length} items
                                </AppText>
                            )}
                        </View>
                    )}

                    {!isLoading && ads && ads.length > 0 ? (
                        <AdsList ads={ads as any} columns={2} />
                    ) : !isLoading && (
                        <View className="py-20 items-center">
                            <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                                <Ionicons name="search-outline" size={32} color="#cbd5e1" />
                            </View>
                            <AppText weight="bold" className="text-gray-900 text-lg">No listings found</AppText>
                            <AppText className="text-gray-500 text-center px-10 mt-1">
                                {searchQuery
                                    ? `No matches for "${searchQuery}" in this category.`
                                    : "There are no active listings in this category yet."}
                            </AppText>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
