import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AppText from "@/components/ui/AppText";
import { SearchBar } from "@/components/home/Hero";
import AdsList from "@/components/ads/AdsList";
import { useAdsInfiniteList } from "@/hooks/useAds";
import { useRegions, Region } from "@/hooks/useRegions";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import FilterModal, { FilterState } from "@/components/ads/FilterModal";
import ScreenHeader from "@/components/ui/ScreenHeader";

export default function SearchScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    q?: string;
    region?: string;
    category?: string;
    regionName?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState(params.q || "");
  const { data: regions } = useRegions();

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

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

    let newRegion: Region | null = null;
    let newCategory: Category | null = null;

    if (params.region !== undefined && regions) {
      if (params.region === "") {
        newRegion = null;
      } else {
        const region = regions.find((r) => r.slug === params.region);
        if (region) newRegion = region;
      }
    }
    if (params.category !== undefined && categories) {
      if (params.category === "") {
        newCategory = null;
      } else {
        const category = categories.find((c) => c.slug === params.category);
        if (category) newCategory = category;
      }
    }

    setFilterState((prev) => ({
      ...prev,
      region: newRegion,
      category: newCategory,
    }));
    setSelectedRegion(newRegion);
    setSelectedCategory(newCategory);
  }, [params.q, params.region, params.category, regions, categories]);

  const {
    data: adsData,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdsInfiniteList({
    search: searchQuery,
    region: filterState.region?.slug || selectedRegion?.slug,
    category:
      filterState.category?.slug || selectedCategory?.slug || params.category,
    min_price: filterState.minPrice || undefined,
    max_price: filterState.maxPrice || undefined,
    condition:
      filterState.condition.length > 0
        ? filterState.condition.join(",")
        : undefined,
    status: "published",
  });

  const ads = adsData?.pages.flatMap((page) => page.results) || [];
  const loadingMoreRef = useRef(false);

  const handleSearch = () => {
    refetch();
  };

  const handleLoadMore = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (layoutMeasurement.height + contentOffset.y);

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
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={t('search.title')} showBackButton={true}>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedRegion={filterState.region?.name || t('search.allRegions')}
              onRegionPress={() => setIsFilterModalVisible(true)}
              onSearch={handleSearch}
            />
          </View>
          <TouchableOpacity
            onPress={() => setIsFilterModalVisible(true)}
            className={`w-12 h-12 items-center justify-center rounded-full ${filterState.category || filterState.minPrice || filterState.maxPrice || filterState.condition.length > 0 ? "bg-white" : "bg-white/20"}`}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={
                filterState.category ||
                filterState.minPrice ||
                filterState.maxPrice ||
                filterState.condition.length > 0
                  ? "#FF4F18"
                  : "white"
              }
            />
          </TouchableOpacity>
        </View>
      </ScreenHeader>

      {/* Content Area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleLoadMore}
        scrollEventThrottle={16}
      >
        {/* Search Context Info */}
        {(searchQuery ||
          filterState.region ||
          filterState.category ||
          filterState.minPrice ||
          filterState.maxPrice) && (
          <View className="px-6 py-4 flex-row items-center flex-wrap gap-2">
            <AppText className="text-gray-400">{t('search.resultsFor')}</AppText>
            {searchQuery ? (
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <AppText weight="bold" className="text-secondary">
                  {`"${searchQuery}"`}
                </AppText>
              </View>
            ) : null}
            {filterState.region ? (
              <>
                <AppText className="text-gray-400">{t('search.in')}</AppText>
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <AppText weight="bold" className="text-primary">
                    {filterState.region.name}
                  </AppText>
                </View>
              </>
            ) : null}
            {filterState.category ? (
              <>
                <AppText className="text-gray-400">{t('search.matching')}</AppText>
                <View className="bg-secondary/10 px-3 py-1 rounded-full">
                  <AppText weight="bold" className="text-secondary">
                    {filterState.category.name}
                  </AppText>
                </View>
              </>
            ) : null}
            {(filterState.minPrice || filterState.maxPrice) && (
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <AppText weight="bold" className="text-gray-600">
                  {filterState.minPrice ? `Fr ${filterState.minPrice}` : "0"} -{" "}
                  {filterState.maxPrice ? `Fr ${filterState.maxPrice}` : "∞"}
                </AppText>
              </View>
            )}
          </View>
        )}

        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#FF4F18" />
            <AppText className="text-gray-500 mt-4">
              {t('search.searching')}
            </AppText>
          </View>
        ) : ads.length > 0 ? (
          <View>
            <View className="px-6 mb-2 flex-row items-center justify-between">
              <AppText weight="bold" className="text-gray-900 text-lg">
                {t('search.adsFound', { count: ads.length })}
              </AppText>
            </View>
            <AdsList ads={ads as any} />
            {isFetchingNextPage && (
              <View className="py-6">
                <ActivityIndicator size="small" color="#FF4F18" />
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20 px-10">
            <View className="w-24 h-24 bg-gray-50 rounded-full items-center justify-center mb-6 border border-gray-100">
              <Ionicons name="search" size={48} color="#cbd5e1" />
            </View>
            <AppText
              variant="subheading"
              weight="bold"
              className="text-center text-gray-900 mb-2"
            >
              {t('search.noResults')}
            </AppText>
            <AppText className="text-center text-gray-500 leading-5">
              {t('search.noResultsDesc', { query: searchQuery, region: selectedRegion?.name || t('search.allRegions') })}
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
              <AppText weight="bold" className="text-white">
                {t('search.clearFilters')}
              </AppText>
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
          setSelectedRegion(newFilters.region);
          setSelectedCategory(newFilters.category);
        }}
        initialFilters={filterState}
      />
    </View>
  );
}
