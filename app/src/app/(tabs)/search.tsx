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
import FilterModal, { FilterState } from "@/components/ads/FilterModal";
import ScreenHeader from "@/components/ui/ScreenHeader";

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

    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [filterState, setFilterState] = useState<FilterState>({
        region: null,
        category: null,
        minPrice: "",
        maxPrice: "",
        condition: [],
    });

    // Sync state with URL params
    useEffect(() => {
        if (params.q !== undefined) setSearchQuery(params.q);
        
        let newRegion = filterState.region;
        let newCategory = filterState.category;

        if (params.region !== undefined && regions) {
            if (params.region === "") {
                newRegion = null;
            } else {
                const region = regions.find(r => r.slug === params.region);
                if (region) newRegion = region;
            }
        }
        if (params.category !== undefined && categories) {
            if (params.category === "") {
                newCategory = null;
            } else {
                const category = categories.find(c => c.slug === params.category);
                if (category) newCategory = category;
            }
        }

        setFilterState(prev => ({
            ...prev,
            region: newRegion,
            category: newCategory
        }));
        setSelectedRegion(newRegion);
        setSelectedCategory(newCategory);
    }, [params.q, params.region, params.category, regions, categories]);

    const { data: ads, isLoading, refetch } = useAdsList({
        search: searchQuery,
        region: filterState.region?.slug || selectedRegion?.slug,
        category: filterState.category?.slug || selectedCategory?.slug || params.category,
        min_price: filterState.minPrice || undefined,
        max_price: filterState.maxPrice || undefined,
        condition: filterState.condition.length > 0 ? filterState.condition.join(',') : undefined,
        status: 'published'
    });

    const handleSearch = () => {
        refetch();
    };

    return (
        <View className="flex-1 bg-white">
            <ScreenHeader
                title="Search"
                showBackButton={true}
            >
                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <SearchBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            selectedRegion={filterState.region?.name || "All Regions"}
                            onRegionPress={() => setIsFilterModalVisible(true)}
                            onSearch={handleSearch}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsFilterModalVisible(true)}
                        className={`w-12 h-12 items-center justify-center rounded-2xl ${filterState.category || filterState.minPrice || filterState.maxPrice || filterState.condition.length > 0 ? 'bg-white' : 'bg-white/20'}`}
                    >
                        <Ionicons
                            name="options-outline"
                            size={20}
                            color={filterState.category || filterState.minPrice || filterState.maxPrice || filterState.condition.length > 0 ? "#FF4F18" : "white"}
                        />
                    </TouchableOpacity>
                </View>
            </ScreenHeader>

            {/* Content Area */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Context Info */}
                {(searchQuery || filterState.region || filterState.category || filterState.minPrice || filterState.maxPrice) && (
                    <View className="px-6 py-4 flex-row items-center flex-wrap gap-2">
                        <AppText className="text-gray-400">Results for</AppText>
                        {searchQuery ? (
                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                <AppText weight="bold" className="text-secondary">"{searchQuery}"</AppText>
                            </View>
                        ) : null}
                        {filterState.region ? (
                            <>
                                <AppText className="text-gray-400">in</AppText>
                                <View className="bg-primary/10 px-3 py-1 rounded-full">
                                    <AppText weight="bold" className="text-primary">{filterState.region.name}</AppText>
                                </View>
                            </>
                        ) : null}
                        {filterState.category ? (
                            <>
                                <AppText className="text-gray-400">matching</AppText>
                                <View className="bg-secondary/10 px-3 py-1 rounded-full">
                                    <AppText weight="bold" className="text-secondary">{filterState.category.name}</AppText>
                                </View>
                            </>
                        ) : null}
                        {(filterState.minPrice || filterState.maxPrice) && (
                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                <AppText weight="bold" className="text-gray-600">
                                    {filterState.minPrice ? `Fr ${filterState.minPrice}` : "0"} - {filterState.maxPrice ? `Fr ${filterState.maxPrice}` : "∞"}
                                </AppText>
                            </View>
                        )}
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
                                setFilterState({
                                    region: null,
                                    category: null,
                                    minPrice: "",
                                    maxPrice: "",
                                    condition: [],
                                });
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

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onApply={(newFilters) => {
                    setFilterState(newFilters);
                    handleSearch();
                }}
                initialFilters={filterState}
            />
        </View>
    );
}
