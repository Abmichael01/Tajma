import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import AppText from "@/components/ui/AppText";
import { SearchBar } from "@/components/home/Hero";
import AdsList from "@/components/ads/AdsList";
import RegionModal from "@/components/ads/RegionModal";
import FilterModal, { FilterState } from "@/components/ads/FilterModal";
import CategoryModal from "@/components/ads/CategoryModal";
import FilterChips, { FilterChip } from "@/components/ads/FilterChips";
import { useAdsInfiniteList } from "@/hooks/useAds";
import { useRegions, Region } from "@/hooks/useRegions";
import { useCategories } from "@/hooks/useCategories";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Breadcrumbs, { BreadcrumbItem } from "@/components/ui/Breadcrumbs";

export default function SearchScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    region?: string;
    category?: string;
    regionName?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState(params.q || "");
  const { data: regions } = useRegions();
  const { categories } = useCategories();

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isRegionModalVisible, setIsRegionModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "price">("all");
  const [isSubcategoryModalVisible, setIsSubcategoryModalVisible] =
    useState(false);

  const [filters, setFilters] = useState<FilterState>({
    region: null,
    category: null,
    minPrice: "",
    maxPrice: "",
    condition: [],
  });

  // Sync initial state with URL params
  useEffect(() => {
    if (params.q !== undefined) setSearchQuery(params.q);
    if (params.region !== undefined && regions) {
      const region = regions.find((r) => r.slug === params.region) || null;
      setSelectedRegion(region);
      setFilters((prev) => ({ ...prev, region }));
    }
    if (params.category !== undefined && categories) {
      const cat = categories.find((c) => c.slug === params.category) || null;
      setSelectedCategory(cat);
      setFilters((prev) => ({ ...prev, category: cat }));
    }
  }, [params.q, params.region, params.category, regions, categories]);

  const hasSubcategories = useMemo(() => {
    if (!selectedCategory) return false;
    return categories.some((cat) => cat.parentId === selectedCategory.id);
  }, [selectedCategory, categories]);

  const {
    data: adsData,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdsInfiniteList({
    search: searchQuery,
    region: selectedRegion?.slug,
    category: selectedCategory?.slug,
    min_price: filters.minPrice || undefined,
    max_price: filters.maxPrice || undefined,
    condition: filters.condition.join(","),
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

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setSelectedRegion(newFilters.region);
    setSelectedCategory(newFilters.category);
    setIsFilterModalVisible(false);
  };

  const chips: FilterChip[] = [
    {
      id: "all",
      label: "All Filters",
      isActive:
        filters.condition.length > 0 ||
        !!filters.minPrice ||
        !!filters.maxPrice,
      onPress: () => {
        setFilterMode("all");
        setIsFilterModalVisible(true);
      },
      icon: "options-outline" as any,
    },
    {
      id: "region",
      label: selectedRegion?.name || "Region",
      isActive: !!selectedRegion,
      onPress: () => setIsRegionModalVisible(true),
      icon: "location-outline" as any,
    },
    {
      id: "category",
      label: selectedCategory?.name || "Category",
      isActive: !!selectedCategory,
      onPress: () => setIsCategoryModalVisible(true),
      icon: "grid-outline" as any,
    },
    ...(hasSubcategories
      ? [
          {
            id: "subcategory",
            label: "Sub-category",
            isActive: !!selectedCategory && selectedCategory.level > 0,
            onPress: () => setIsSubcategoryModalVisible(true),
            icon: "list-outline" as any,
          },
        ]
      : []),
    {
      id: "price",
      label:
        filters.minPrice || filters.maxPrice
          ? `Price: ${filters.minPrice}-${filters.maxPrice}`
          : "Price",
      isActive: !!filters.minPrice || !!filters.maxPrice,
      onPress: () => {
        setFilterMode("price");
        setIsFilterModalVisible(true);
      },
      icon: "cash-outline" as any,
    },
    {
      id: "condition",
      label:
        filters.condition.length > 0
          ? `Condition: ${filters.condition.length}`
          : "Condition",
      isActive: filters.condition.length > 0,
      onPress: () => {
        setFilterMode("all");
        setIsFilterModalVisible(true);
      },
      icon: "shield-checkmark-outline" as any,
    },
  ];

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [{ id: null, name: "All" }];
    if (!selectedCategory) return items;

    const path: BreadcrumbItem[] = [];
    let curr: any = selectedCategory;
    while (curr) {
      path.unshift({ id: curr.id, name: curr.name, slug: curr.slug });
      const parent = categories.find((c) => c.id === curr.parentId);
      curr = parent;
    }

    return [...items, ...path];
  }, [selectedCategory, categories]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Standard App Header */}
      <ScreenHeader title={selectedCategory?.name || "Search"}>
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRegion={selectedRegion?.name || "All Regions"}
          onRegionPress={() => setIsRegionModalVisible(true)}
          onFilterPress={() => setIsFilterModalVisible(true)}
          onSearch={handleSearch}
          showRegion={false}
          showFilter={false}
        />
      </ScreenHeader>

      {/* Horizontal Filter Chips */}
      <FilterChips
        chips={chips}
        onClearAll={() => {
          setSearchQuery("");
          setSelectedRegion(null);
          setSelectedCategory(null);
          setFilters({
            region: null,
            category: null,
            minPrice: "",
            maxPrice: "",
            condition: [],
          });
          handleSearch();
        }}
      />

      {/* Content Area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleLoadMore}
        scrollEventThrottle={16}
      >
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#FF4F18" />
            <AppText className="text-gray-500 mt-4">
              Searching for ads...
            </AppText>
          </View>
        ) : ads.length > 0 ? (
          <View>
            <Breadcrumbs
              items={breadcrumbItems}
              onPress={(item: BreadcrumbItem) => {
                if (!item.id) {
                  setSelectedCategory(null);
                  setFilters((prev) => ({ ...prev, category: null }));
                  return;
                }
                const cat = categories.find((c) => c.id === item.id);
                setSelectedCategory(cat || null);
                setFilters((prev) => ({ ...prev, category: cat || null }));
              }}
              className="mt-4"
            />
            <View className="px-6 py-4">
              <AppText weight="bold" className="text-gray-900 text-lg">
                {ads.length}{" "}
                {searchQuery ? `matches for "${searchQuery}"` : "Ads found"}
              </AppText>
              {selectedRegion && (
                <AppText className="text-gray-500 text-xs mt-1">
                  in {selectedRegion.name}
                </AppText>
              )}
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
              No results found
            </AppText>
            <AppText className="text-center text-gray-500 leading-5">
              {"Adjust your filters to find what you're looking for."}
            </AppText>
            <TouchableOpacity
              className="mt-8 bg-primary px-10 py-4 rounded-full shadow-md shadow-primary/30"
              onPress={() => {
                setSearchQuery("");
                setSelectedRegion(null);
                setSelectedCategory(null);
                setFilters({
                  region: null,
                  category: null,
                  minPrice: "",
                  maxPrice: "",
                  condition: [],
                });
                handleSearch();
              }}
            >
              <AppText weight="bold" className="text-white">
                Clear All Filters
              </AppText>
            </TouchableOpacity>
          </View>
        )}
        <View className="h-32" />
      </ScrollView>

      <RegionModal
        visible={isRegionModalVisible}
        onClose={() => setIsRegionModalVisible(false)}
        onSelect={(region) => {
          setSelectedRegion(region);
          setFilters((prev) => ({ ...prev, region }));
        }}
        selectedRegionId={selectedRegion?.id}
      />

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        mode={filterMode}
      />

      <CategoryModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setFilters((prev) => ({ ...prev, category: cat }));
        }}
        selectedCategoryId={selectedCategory?.id}
      />

      <CategoryModal
        visible={isSubcategoryModalVisible}
        onClose={() => setIsSubcategoryModalVisible(false)}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setFilters((prev) => ({ ...prev, category: cat }));
        }}
        selectedCategoryId={selectedCategory?.id}
        parentId={selectedCategory?.id}
      />
    </View>
  );
}
