import { View, Animated, ActivityIndicator, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useRef } from "react";
import Hero, { SearchBar } from "@/components/home/Hero";
import CategoriesSection from "@/components/home/CategoriesSection";
import AdsList from "@/components/ads/AdsList";
import AdsListSkeleton from "@/components/ads/AdsListSkeleton";
import CountryModal from "@/components/ads/CountryModal";
import CategoryModal from "@/components/ads/CategoryModal";
import AppText from "@/components/ui/AppText";
import { useCategories } from "@/hooks/useCategories";
import { useAdsInfiniteList } from "@/hooks/useAds";
import { useRouter } from "expo-router";
import { useLocations, Country } from "@/hooks/useLocations";
import { Category } from "@/types/category";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { rootCategories: categoriesData, loading: categoriesLoading } =
    useCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const stickyOpacity = useRef(new Animated.Value(0)).current;
  const loadingMoreRef = useRef(false);
  const [showStickySearch, setShowStickySearch] = useState(false);

  const {
    data: adsData,
    isLoading: adsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdsInfiniteList({
    status: "published",
    country: selectedCountry?.slug,
    category: selectedCategory?.slug,
  });

  const ads = adsData?.pages.flatMap((page) => page.results) || [];

  const handleSearch = () => {
    if (searchQuery.trim() || selectedCountry || selectedCategory) {
      const countryParam = selectedCountry
        ? `&country=${selectedCountry.slug}&countryName=${encodeURIComponent(selectedCountry.name)}`
        : "";
      const categoryParam = selectedCategory
        ? `&category=${selectedCategory.slug}`
        : "";
      router.push(
        `/search?q=${encodeURIComponent(searchQuery.trim())}${countryParam}${categoryParam}` as any,
      );
    }
  };

  const stickyTranslateY = useRef(new Animated.Value(-150)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } =
          event.nativeEvent;
        const offsetY = contentOffset.y;
        const shouldShow = offsetY > 200;
        const distanceFromBottom =
          contentSize.height - (layoutMeasurement.height + offsetY);

        if (
          distanceFromBottom < 600 &&
          hasNextPage &&
          !isFetchingNextPage &&
          !loadingMoreRef.current
        ) {
          loadingMoreRef.current = true;
          fetchNextPage().finally(() => {
            loadingMoreRef.current = false;
          });
        }

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
            }),
          ]).start();
        }
      },
    },
  );

  const greetingName = user?.first_name || user?.username;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <Animated.View
        className="absolute top-0 left-0 right-0 z-50"
        renderToHardwareTextureAndroid={true}
        style={[
          {
            opacity: stickyOpacity,
            transform: [{ translateY: stickyTranslateY }],
            pointerEvents: showStickySearch ? "auto" : "none",
            backgroundColor: "#FF4F18",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.15)",
          },
        ]}
      >
        <SafeAreaView edges={["top"]}>
          <View className="px-4 py-3">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCountry={selectedCountry?.name || t('search.allCountries')}
              onCountryPress={() => setIsCountryModalVisible(true)}
              showFilter={false}
              
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
        {/* Simple Primary Header */}
        <View style={{ backgroundColor: "#FF4F18", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" }}>
          <SafeAreaView edges={["top"]}>
            <View className="flex-row justify-between items-center px-5 pt-2 pb-3">
              <View>
                <AppText
                  weight="bold"
                  style={{ fontSize: 22, lineHeight: 28, color: "#FFFFFF" }}
                >
                  {greetingName ? `${t('common.welcome')}, ${greetingName}` : t('common.welcome')}
                </AppText>
                <AppText style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                  {t('home.discoverDeals')}
                </AppText>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity 
                  onPress={() => router.push('/search' as any)}
                  className="w-10 h-10 items-center justify-center rounded-full border border-white/40"
                >
                  <Ionicons name="search" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setIsCountryModalVisible(true)}
                  className={`w-10 h-10 items-center justify-center rounded-full border ${selectedCountry ? "bg-white border-white" : "border-white/40"}`}
                >
                  <Ionicons name="location" size={20} color={selectedCountry ? "#FF4F18" : "white"} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Banner carousel hero (mirrors web) */}
        <Hero />

        <CategoriesSection
          categories={categoriesData}
          loading={categoriesLoading}
        />

        {adsLoading ? (
          <AdsListSkeleton columns={2} />
        ) : (
          <>
            <AdsList ads={ads as any} columns={2} />
            {isFetchingNextPage && (
              <View className="py-6">
                <ActivityIndicator size="small" color="#FF4F18" />
              </View>
            )}
          </>
        )}
        <View className="h-24" />
      </Animated.ScrollView>

      <CountryModal
        visible={isCountryModalVisible}
        onClose={() => setIsCountryModalVisible(false)}
        onSelect={setSelectedCountry}
        selectedCountryId={selectedCountry?.id}
      />

      <CategoryModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={(category) => {
          setSelectedCategory(category);
          if (category) {
            const countryParam = selectedCountry
              ? `&country=${selectedCountry.slug}&countryName=${encodeURIComponent(selectedCountry.name)}`
              : "";
            router.push(`/search?category=${category.slug}${countryParam}` as any);
          }
        }}
        selectedCategoryId={selectedCategory?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 20,
  },
});
