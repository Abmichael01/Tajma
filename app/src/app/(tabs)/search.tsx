import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "@/components/ui/AppText";
import { SearchBar } from "@/components/home/Hero";
import AdsList from "@/components/ads/AdsList";
import RegionModal from "@/components/ads/RegionModal";
import { useAdsList } from "@/hooks/useAds";
import { useRegions, Region } from "@/hooks/useRegions";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import CategoryModal from "@/components/ads/CategoryModal";

export default function SearchScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ q?: string; region?: string; category?: string; regionName?: string }>();

    const [searchQuery, setSearchQuery] = useState(params.q || "");
    const { data: regions } = useRegions();

    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [isRegionModalVisible, setIsRegionModalVisible] = useState(false);

    const { categories } = useCategories();
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

    // Sync state with URL params
    useEffect(() => {
        if (params.q !== undefined) setSearchQuery(params.q);
        if (params.region !== undefined && regions) {
            if (params.region === "") {
                setSelectedRegion(null);
            } else {
                const region = regions.find(r => r.slug === params.region);
                if (region) setSelectedRegion(region);
            }
        }
        if (params.category !== undefined && categories) {
            if (params.category === "") {
                setSelectedCategory(null);
            } else {
                const category = categories.find(c => c.slug === params.category);
                if (category) setSelectedCategory(category);
            }
        }
    }, [params.q, params.region, params.category, regions, categories]);

    const { data: ads, isLoading, refetch } = useAdsList({
        search: searchQuery,
        region: selectedRegion?.slug,
        category: selectedCategory?.slug || params.category,
        status: 'published'
    });

    const handleSearch = () => {
        refetch();
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />

            {/* Standard App Header */}
            <View className="bg-primary px-6 pt-16 pb-6 shadow-sm">
                <View className="flex-row items-center gap-4 mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-white/20"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <AppText weight="bold" className="text-white text-3xl">
                        Search
                    </AppText>
                </View>

                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <SearchBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            selectedRegion={selectedRegion?.name || "All Regions"}
                            onRegionPress={() => setIsRegionModalVisible(true)}
                            onSearch={handleSearch}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsCategoryModalVisible(true)}
                        className={`w-12 h-12 items-center justify-center rounded-2xl ${selectedCategory ? 'bg-white' : 'bg-white/20'}`}
                    >
                        <Ionicons
                            name={selectedCategory ? "grid" : "grid-outline"}
                            size={20}
                            color={selectedCategory ? "#FF4F18" : "white"}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Context Info */}
                {(searchQuery || selectedRegion) && (
                    <View className="px-6 py-4 flex-row items-center flex-wrap gap-2">
                        <AppText className="text-gray-400">Results for</AppText>
                        {searchQuery ? (
                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                <AppText weight="bold" className="text-secondary">"{searchQuery}"</AppText>
                            </View>
                        ) : null}
                        {selectedRegion ? (
                            <>
                                <AppText className="text-gray-400">in</AppText>
                                <View className="bg-primary/10 px-3 py-1 rounded-full">
                                    <AppText weight="bold" className="text-primary">{selectedRegion.name}</AppText>
                                </View>
                            </>
                        ) : null}
                        {selectedCategory ? (
                            <>
                                <AppText className="text-gray-400">matching</AppText>
                                <View className="bg-secondary/10 px-3 py-1 rounded-full">
                                    <AppText weight="bold" className="text-secondary">{selectedCategory.name}</AppText>
                                </View>
                            </>
                        ) : null}
                    </View>
                )}

                {isLoading ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <ActivityIndicator size="large" color="#FF4F18" />
                        <AppText className="text-gray-500 mt-4">Searching for ads...</AppText>
                    </View>
                ) : ads && ads.length > 0 ? (
                    <View>
                        <View className="px-6 mb-2 flex-row items-center justify-between">
                            <AppText weight="bold" className="text-gray-900 text-lg">
                                {ads.length} Ads Found
                            </AppText>
                        </View>
                        <AdsList ads={ads as any} />
                    </View>
                ) : (
                    <View className="flex-1 items-center justify-center py-20 px-10">
                        <View className="w-24 h-24 bg-gray-50 rounded-full items-center justify-center mb-6 border border-gray-100">
                            <Ionicons name="search" size={48} color="#cbd5e1" />
                        </View>
                        <AppText variant="subheading" weight="bold" className="text-center text-gray-900 mb-2">
                            No results found
                        </AppText>
                        <AppText className="text-center text-gray-500 leading-5">
                            We couldn't find any ads matching "{searchQuery}" in {selectedRegion?.name || "all regions"}.
                        </AppText>
                        <TouchableOpacity
                            className="mt-8 bg-primary px-10 py-4 rounded-full shadow-md shadow-primary/30"
                            onPress={() => {
                                setSearchQuery("");
                                setSelectedRegion(null);
                                setSelectedCategory(null);
                                handleSearch();
                            }}
                        >
                            <AppText weight="bold" className="text-white">Clear All Filters</AppText>
                        </TouchableOpacity>
                    </View>
                )}
                <View className="h-32" />
            </ScrollView>

            <RegionModal
                visible={isRegionModalVisible}
                onClose={() => setIsRegionModalVisible(false)}
                onSelect={setSelectedRegion}
                selectedRegionId={selectedRegion?.id}
            />

            <CategoryModal
                visible={isCategoryModalVisible}
                onClose={() => setIsCategoryModalVisible(false)}
                onSelect={setSelectedCategory}
                selectedCategoryId={selectedCategory?.id}
            />
        </View>
    );
}
