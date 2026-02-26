import { View, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useRef, useEffect } from "react";
import Hero, { SearchBar } from "@/components/home/Hero";
import CategoriesSection from "@/components/home/CategoriesSection";
import AdsList from "@/components/ads/AdsList";
import AdsListSkeleton from "@/components/ads/AdsListSkeleton";
import RegionModal from "@/components/ads/RegionModal";
import { useCategories } from "@/hooks/useCategories";
import { useAdsList } from "@/hooks/useAds";
import { useRouter } from "expo-router";
import { Region } from "@/hooks/useRegions";

export default function HomeScreen() {
    const router = useRouter();
    const { rootCategories: categoriesData, loading: categoriesLoading } = useCategories();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [isRegionModalVisible, setIsRegionModalVisible] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;
    const stickyOpacity = useRef(new Animated.Value(0)).current;
    const [showStickySearch, setShowStickySearch] = useState(false);

    const { data: adsData, isLoading: adsLoading } = useAdsList({
        status: 'published',
        region: selectedRegion?.slug
    });

    const categories = Array.isArray(categoriesData) ? categoriesData : [];
    const ads = Array.isArray(adsData) ? adsData : [];

    const handleSearch = () => {
        if (searchQuery.trim() || selectedRegion) {
            const regionParam = selectedRegion ? `&region=${selectedRegion.slug}&regionName=${encodeURIComponent(selectedRegion.name)}` : "";
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${regionParam}` as any);
        }
    };

    const stickyTranslateY = useRef(new Animated.Value(-150)).current;

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: true,
            listener: (event: any) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                const shouldShow = offsetY > 200;

                if (shouldShow !== showStickySearch) {
                    setShowStickySearch(shouldShow);

                    Animated.parallel([
                        Animated.timing(stickyOpacity, {
                            toValue: shouldShow ? 1 : 0,
                            duration: shouldShow ? 400 : 300,
                            useNativeDriver: true,
                        }),
                        Animated.spring(stickyTranslateY, {
                            toValue: shouldShow ? 0 : -150,
                            friction: shouldShow ? 9 : 10,
                            tension: shouldShow ? 45 : 30,
                            useNativeDriver: true,
                        })
                    ]).start();
                }
            },
        }
    );

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />

            <Animated.View
                className="absolute top-0 left-0 right-0 z-50 bg-primary border-b border-gray-200 shadow-sm"
                style={{
                    opacity: stickyOpacity,
                    transform: [{ translateY: stickyTranslateY }],
                    pointerEvents: showStickySearch ? 'auto' : 'none'
                }}
            >
                <SafeAreaView edges={['top']}>
                    <View className="px-4 py-3">
                        <SearchBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            selectedRegion={selectedRegion?.name || "All Regions"}
                            onRegionPress={() => setIsRegionModalVisible(true)}
                            onSearch={handleSearch}
                        />
                    </View>
                </SafeAreaView>
            </Animated.View>

            <Animated.ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                <View className="absolute top-[-1000px] left-0 right-0 h-[1000px] bg-primary" />

                <Hero
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedRegion={selectedRegion?.name || "All Regions"}
                    onRegionPress={() => setIsRegionModalVisible(true)}
                    onSearch={handleSearch}
                />

                <CategoriesSection categories={categoriesData} loading={categoriesLoading} />

                {adsLoading ? (
                    <AdsListSkeleton columns={2} />
                ) : (
                    <AdsList ads={ads as any} columns={2} />
                )}
                <View className="h-24" />
            </Animated.ScrollView>

            <RegionModal
                visible={isRegionModalVisible}
                onClose={() => setIsRegionModalVisible(false)}
                onSelect={setSelectedRegion}
                selectedRegionId={selectedRegion?.id}
            />
        </View>
    );
}
