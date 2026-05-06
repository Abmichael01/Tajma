import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AppText from "@/components/ui/AppText";
import { SearchBar } from "@/components/home/Hero";
import AdsList from "@/components/ads/AdsList";
import { useAdsInfiniteList } from "@/hooks/useAds";
import { useLocations } from "@/hooks/useLocations";
import { useCategories } from "@/hooks/useCategories";
import FilterModal, { FilterState } from "@/components/ads/FilterModal";
import CategoryModal from "@/components/ads/CategoryModal";
import CountryModal from "@/components/ads/CountryModal";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useQueryClient } from "@tanstack/react-query";
import { Category } from "@/types/category";

export default function SearchScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Local state for search bar text
  const [searchQuery, setSearchQuery] = useState((params.q as string) || "");

  // Sync search bar with URL params
  useEffect(() => {
    if (params.q !== undefined) {
      setSearchQuery((params.q as string) || "");
    }
  }, [params.q]);

  const { categories } = useCategories();
  const { data: countries } = useLocations(null, 0);

  // Derive filter state from URL params
  const filterState: FilterState = useMemo(() => {
    const country = params.country ? countries?.find((c: any) => c.slug === params.country) : null;
    const category = params.category ? (categories as Category[])?.find((c: Category) => c.slug === params.category) : null;
    const conditionRaw = params.condition;
    const condition = Array.isArray(conditionRaw) 
      ? conditionRaw 
      : (typeof conditionRaw === 'string' && conditionRaw.length > 0 ? conditionRaw.split(',') : []);

    return {
      country: country || null,
      category: category || null,
      minPrice: (params.min_price as string) || "",
      maxPrice: (params.max_price as string) || "",
      condition,
    };
  }, [params, countries, categories]);

  const queryParams = useMemo(() => ({
    search: searchQuery || undefined,
    country: filterState.country?.level === 0 ? filterState.country.slug : undefined,
    region: filterState.country?.level === 1 ? filterState.country.slug : undefined,
    category: filterState.category?.slug || undefined,
    min_price: filterState.minPrice || undefined,
    max_price: filterState.maxPrice || undefined,
    condition: filterState.condition.length > 0 ? filterState.condition.join(",") : undefined,
    status: "published",
  }), [searchQuery, filterState]);

  const {
    data: adsData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdsInfiniteList(queryParams);

  const ads = adsData?.pages.flatMap((page) => page.results) || [];

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "price" | "condition">("all");

  const updateFilters = (updates: Partial<Record<string, string | null>>) => {
    const newParams = { ...params, ...updates };
    Object.keys(newParams).forEach(key => {
      if (newParams[key] === null || newParams[key] === undefined || newParams[key] === "") {
        delete newParams[key];
      }
    });
    router.replace({ pathname: "/search", params: newParams as any });
    queryClient.invalidateQueries({ queryKey: ["ads", "infinite"] });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterState.category) count++;
    if (filterState.country) count++;
    if (filterState.minPrice || filterState.maxPrice) count++;
    if (filterState.condition.length > 0) count++;
    return count;
  }, [filterState]);

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader 
        title={t('search.title')} 
        variant="primary" // Changed to primary for consistent orange background
        showBackButton={false}
      >
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCountry={filterState.country?.name || t('search.allCountries')}
          onCountryPress={() => setIsCountryModalVisible(true)}
          onSearch={() => updateFilters({ q: searchQuery })}
          showFilter={false}
        />
      </ScreenHeader>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="py-3 bg-white border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          >
            <TouchableOpacity 
              onPress={() => setIsCategoryModalVisible(true)}
              className={"flex-row items-center px-4 py-2 rounded-full border " + (filterState.category ? "bg-slate-900 border-slate-900" : "bg-white border-gray-200")}
            >
              <Ionicons name="grid-outline" size={16} color={filterState.category ? "white" : "#1e293b"} style={{ marginRight: 6 }} />
              <AppText weight="medium" className={"text-xs " + (filterState.category ? "text-white" : "text-gray-700")}>
                {filterState.category ? filterState.category.name : t('search.category.categories')}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setFilterMode("price");
                setIsFilterModalVisible(true);
              }}
              className={"flex-row items-center px-4 py-2 rounded-full border " + (filterState.minPrice || filterState.maxPrice ? "bg-slate-900 border-slate-900" : "bg-white border-gray-200")}
            >
              <Ionicons name="cash-outline" size={16} color={filterState.minPrice || filterState.maxPrice ? "white" : "#1e293b"} style={{ marginRight: 6 }} />
              <AppText weight="medium" className={"text-xs " + (filterState.minPrice || filterState.maxPrice ? "text-white" : "text-gray-700")}>
                {filterState.minPrice || filterState.maxPrice ? `${filterState.minPrice}-${filterState.maxPrice}` : t('search.filters.priceRange')}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setFilterMode("condition");
                setIsFilterModalVisible(true);
              }}
              className={"flex-row items-center px-4 py-2 rounded-full border " + (filterState.condition.length > 0 ? "bg-slate-900 border-slate-900" : "bg-white border-gray-200")}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color={filterState.condition.length > 0 ? "white" : "#1e293b"} style={{ marginRight: 6 }} />
              <AppText weight="medium" className={"text-xs " + (filterState.condition.length > 0 ? "text-white" : "text-gray-700")}>
                {filterState.condition.length > 0 ? `${filterState.condition.length} ${t('search.filters.condition')}` : t('search.filters.condition')}
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
            if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={16}
        >
          {isLoading ? (
            <View className="justify-center items-center py-20">
              <ActivityIndicator size="large" color="#FF4F18" />
              <AppText className="text-gray-500 mt-4">{t('search.searching')}</AppText>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-20 px-10">
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <AppText weight="bold" className="text-gray-900 mt-4 text-center">{t('common.error')}</AppText>
              <TouchableOpacity className="mt-6 bg-slate-900 px-6 py-3 rounded-full" onPress={() => refetch()}>
                <AppText className="text-white" weight="bold">Retry</AppText>
              </TouchableOpacity>
            </View>
          ) : ads.length > 0 ? (
            <>
              <AdsList ads={ads as any} />
              {isFetchingNextPage && (
                <View className="py-6">
                  <ActivityIndicator size="small" color="#FF4F18" />
                </View>
              )}
            </>
          ) : (
            <View className="flex-1 items-center justify-center py-20 px-10">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
                <Ionicons name="search-outline" size={40} color="#cbd5e1" />
              </View>
              <AppText weight="bold" className="text-gray-900 text-xl text-center">{t('search.noResults')}</AppText>
              <AppText className="text-gray-500 text-center mt-2">
                {t('search.noResultsDesc', { query: searchQuery || (params.q as string) || "", country: filterState.country?.name || t('search.allCountries') })}
              </AppText>
              <TouchableOpacity 
                className="mt-8 bg-slate-900 px-8 py-4 rounded-full"
                onPress={() => updateFilters({ q: null, category: null, country: null, min_price: null, max_price: null, condition: null })}
              >
                <AppText weight="bold" className="text-white">{t('search.clearFilters')}</AppText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={(newFilters) => {
          setIsFilterModalVisible(false);
          updateFilters({
            category: newFilters.category?.slug || null,
            country: newFilters.country?.slug || null,
            min_price: newFilters.minPrice || null,
            max_price: newFilters.maxPrice || null,
            condition: newFilters.condition.length > 0 ? newFilters.condition.join(",") : null,
          });
        }}
        initialFilters={filterState}
        mode={filterMode}
      />

      <CountryModal
        visible={isCountryModalVisible}
        onClose={() => setIsCountryModalVisible(false)}
        onSelect={(country) => {
          setIsCountryModalVisible(false);
          updateFilters({ country: country?.slug || null });
        }}
        selectedCountryId={filterState.country?.id}
      />

      <CategoryModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={(category) => {
          setIsCategoryModalVisible(false);
          updateFilters({ category: category?.slug || null });
        }}
        selectedCategoryId={filterState.category?.id}
      />
    </View>
  );
}
