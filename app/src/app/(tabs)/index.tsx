import { View, ScrollView, Animated } from "react-native";
import { useState, useRef } from "react";
import Hero, { SearchBar } from "@/components/home/Hero";
import CategoriesSection from "@/components/home/CategoriesSection";
import AdsList from "@/components/ads/AdsList";
import AdsListSkeleton from "@/components/ads/AdsListSkeleton";
import { useCategories } from "@/hooks/useCategories";
import { useAdsList } from "@/hooks/useAds";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: adsData, isLoading: adsLoading } = useAdsList({ status: 'published' });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const scrollY = useRef(new Animated.Value(0)).current;
  const stickyOpacity = useRef(new Animated.Value(0)).current;
  const [showStickySearch, setShowStickySearch] = useState(false);
  
  // Ensure categories is always an array
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  
  // Ensure ads is always an array
  const ads = Array.isArray(adsData) ? adsData : [];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const shouldShow = offsetY > 200;
        
        if (shouldShow !== showStickySearch) {
          setShowStickySearch(shouldShow);
          // Animate opacity
          Animated.timing(stickyOpacity, {
            toValue: shouldShow ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    }
  );

  return (
    <View className="flex-1 bg-white">
      {/* Sticky Search Bar */}
      {showStickySearch && (
        <Animated.View 
          className="absolute top-0 left-0 right-0 z-50 bg-gray-100 border-b border-gray-200 px-4 py-6 shadow-lg"
          style={{ 
            opacity: stickyOpacity,
          }}
        >
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            onSearch={handleSearch}
          />
        </Animated.View>
      )}

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <Hero
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          onSearch={handleSearch}
        />
        
        {/* Categories Section - 3 per row */}
        <CategoriesSection categories={categories} loading={categoriesLoading} />
        
        {/* Ads List Section - Pinterest style */}
        {adsLoading ? (
          <AdsListSkeleton columns={2} />
        ) : (
          <AdsList ads={ads} columns={2} />
        )}
      </Animated.ScrollView>
    </View>
  );
}

