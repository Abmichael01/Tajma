import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import AppText from "@/components/ui/AppText";
import { SearchBar } from "@/components/home/Hero";
import AdsList from "@/components/ads/AdsList";
import CountryModal from "@/components/ads/CountryModal";
import FilterModal, { FilterState } from "@/components/ads/FilterModal";
import CategoryModal from "@/components/ads/CategoryModal";
import FilterChips, { FilterChip } from "@/components/ads/FilterChips";
import { useAdsInfiniteList } from "@/hooks/useAds";
import { useCategories } from "@/hooks/useCategories";
import type { Country } from "@/hooks/useLocations";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Breadcrumbs, { BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import SortModal, { SortOption } from "@/components/ads/SortModal";

export default function CategoryDetailScreen() {
  const { t } = useTranslation();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();

  const category = categories.find((c) => c.slug === slug);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(
    category || null,
  );
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "price">("all");
  const [isSubcategoryModalVisible, setIsSubcategoryModalVisible] =
    useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [filters, setFilters] = useState<FilterState>({
    country: null,
    category: category || null,
    minPrice: "",
    maxPrice: "",
    condition: [],
  });

  useEffect(() => {
    if (category) {
      setFilters((prev) => ({ ...prev, category }));
      setSelectedCategory(category);
    }
  }, [category]);

  const hasSubcategories = useMemo(() => {
    if (!category) return false;
    return categories.some((cat) => cat.parentId === category.id);
  }, [category, categories]);

  const {
    data: adsData,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdsInfiniteList({
    category: selectedCategory?.slug || slug || undefined,
    search: searchQuery,
    country: selectedCountry?.slug,
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
    setSelectedCountry(newFilters.country);
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
      id: "country",
      label: selectedCountry?.name || t('search.allCountries'),
      isActive: !!selectedCountry,
      onPress: () => setIsCountryModalVisible(true),
      icon: "location-outline" as any,
    },
    ...(hasSubcategories
      ? [
          {
            id: "subcategory",
            label: "Sub-category",
            isActive:
              !!selectedCategory && selectedCategory.id !== category?.id,
            onPress: () => setIsSubcategoryModalVisible(true),
            icon: "list-outline" as any,
          },
        ]
      : []),
  ];

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [{ id: null, name: "All" }];
    const currentCat = selectedCategory || category;
    if (!currentCat) return items;

    const path: BreadcrumbItem[] = [];
    let curr: any = currentCat;
    while (curr) {
      path.unshift({ id: curr.id, name: curr.name, slug: curr.slug });
      const parent = categories.find((c) => c.id === curr.parentId);
      curr = parent;
    }

    return [...items, ...path];
  }, [selectedCategory, category, categories]);

  if (categoriesLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF4F18" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <ScreenHeader
        title={selectedCategory?.name || category?.name || "Category"}
        showBackButton={true}
      >
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCountry={selectedCountry?.name || t('search.allCountries')}
          onCountryPress={() => setIsCountryModalVisible(true)}
          onFilterPress={() => setIsFilterModalVisible(true)}
          onSearch={handleSearch}
          showCountry={false}
          showFilter={false}
        />
      </ScreenHeader>

      {/* Horizontal Filter Chips */}
      <FilterChips
        chips={chips}
        onClearAll={() => {
          setFilters({
            country: null,
            category: category || null,
            minPrice: "",
            maxPrice: "",
            condition: [],
          });
          setSelectedCountry(null);
          setSelectedCategory(category);
          handleSearch();
        }}
      />

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
            <AppText className="text-gray-500 mt-4">Loading ads...</AppText>
          </View>
        ) : ads.length > 0 ? (
          <View>
            <Breadcrumbs
              items={breadcrumbItems}
              onPress={(item: BreadcrumbItem) => {
                if (!item.id) {
                  router.push("/search");
                  return;
                }
                const cat = categories.find((c) => c.id === item.id);
                setSelectedCategory(cat || null);
                setFilters((prev) => ({ ...prev, category: cat || null }));
              }}
              className="mt-4 px-6"
            />
            <AdsList ads={ads as any} sortBy={sortBy} />
            {isFetchingNextPage && (
              <View className="py-6">
                <ActivityIndicator size="small" color="#FF4F18" />
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20 px-10">
            <View className="w-24 h-24 bg-gray-50 rounded-full items-center justify-center mb-6 border border-gray-100">
              <Ionicons name="apps-outline" size={48} color="#cbd5e1" />
            </View>
            <AppText
              variant="subheading"
              weight="bold"
              className="text-center text-gray-900 mb-2"
            >
              No ads found
            </AppText>
            <AppText className="text-center text-gray-500 leading-5">
              {
                "We couldn't find any ads in this category matching your filters."
              }
            </AppText>
            <TouchableOpacity
              className="mt-8 bg-primary px-10 py-4 rounded-full shadow-md shadow-primary/30"
              onPress={() => {
                setFilters({
                  country: null,
                  category: category || null,
                  minPrice: "",
                  maxPrice: "",
                  condition: [],
                });
                setSelectedCountry(null);
                setSelectedCategory(category);
                handleSearch();
              }}
            >
              <AppText weight="bold" className="text-white">
                Clear Filters
              </AppText>
            </TouchableOpacity>
          </View>
        )}
        <View className="h-32" />
      </ScrollView>

      <CountryModal
        visible={isCountryModalVisible}
        onClose={() => setIsCountryModalVisible(false)}
        onSelect={(country) => {
          setSelectedCountry(country);
          setFilters((prev) => ({ ...prev, country }));
        }}
        selectedCountryId={selectedCountry?.id}
      />

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        mode={filterMode}
      />

      <CategoryModal
        visible={isSubcategoryModalVisible}
        onClose={() => setIsSubcategoryModalVisible(false)}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setFilters((prev) => ({
            ...prev,
            category: cat || category || null,
          }));
        }}
        selectedCategoryId={selectedCategory?.id}
        parentId={category?.id}
      />

      <SortModal
        visible={isSortModalVisible}
        onClose={() => setIsSortModalVisible(false)}
        onSelect={setSortBy}
        currentSort={sortBy}
      />
    </View>
  );
}
