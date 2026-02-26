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
import ScreenHeader from "@/components/ui/ScreenHeader";

export default function SearchScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ q?: string; region?: string; category?: string; regionName?: string }>();

    const [searchQuery, setSearchQuery] = useState(params.q || "");
    const { data: regions } = useRegions();

    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [isRegionModalVisible, setIsRegionModalVisible] = useState(false);

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
    }, [params.q, params.region, regions]);

    const { data: ads, isLoading, refetch } = useAdsList({
        search: searchQuery,
        region: selectedRegion?.slug,
        category: params.category,
        status: 'published'
    });

    const handleSearch = () => {
        refetch();
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />

            {/* Standard App Header */}
            <ScreenHeader title="Search">
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedRegion={selectedRegion?.name || "All Regions"}
                    onRegionPress={() => setIsRegionModalVisible(true)}
                    onSearch={handleSearch}
                />
            </ScreenHeader>

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
        </View>
    );
}
