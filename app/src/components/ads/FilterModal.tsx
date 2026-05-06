import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import { Country } from "@/hooks/useLocations";
import { Category } from "@/types/category";
import CountryModal from "./CountryModal";
import CategoryModal from "./CategoryModal";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  mode?: "all" | "price" | "category" | "condition";
}

export interface FilterState {
  country: Country | null;
  category: Category | null;
  minPrice: string;
  maxPrice: string;
  condition: string[];
}

const getConditions = (t: any) => [
  { label: t('search.filters.brandNew'), value: "brand-new" },
  { label: t('search.filters.foreignUsed'), value: "foreign-used" },
  { label: t('search.filters.openBox'), value: "open-box" },
  { label: t('search.filters.refurbished'), value: "refurbished" },
];

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
  mode = "all",
}: FilterModalProps) {
  const { t } = useTranslation();
  const CONDITIONS = getConditions(t);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const hasPriceFilter = Boolean(filters.minPrice || filters.maxPrice);
  const activeFilterCount = [
    filters.country,
    filters.category,
    hasPriceFilter,
    filters.condition.length > 0,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onClose();
    setTimeout(() => {
      onApply(filters);
    }, 100);
  };

  const toggleCondition = (value: string) => {
    const current = filters.condition;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ ...filters, condition: next });
  };

  const clearAll = () => {
    setFilters({
      country: null,
      category: null,
      minPrice: "",
      maxPrice: "",
      condition: [],
    });
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        title={
          mode === "price" ? t('search.filters.priceRange') : 
          mode === "category" ? t('create_ad.fields.category') :
          mode === "condition" ? t('search.filters.condition') :
          t('search.filters.title')
        }
        onClose={onClose}
        snapPoints={["90%"]}
        headerLeft={
          <TouchableOpacity
            onPress={clearAll}
            className={`px-4 py-2 rounded-full ${hasActiveFilters ? "bg-slate-100" : "bg-gray-50"}`}
            disabled={!hasActiveFilters}
          >
            <AppText
              weight="bold"
              className={
                hasActiveFilters
                  ? "text-slate-900 text-xs"
                  : "text-gray-300 text-xs"
              }
            >
              {t('search.filters.reset')}
            </AppText>
          </TouchableOpacity>
        }
        headerRight={
          <TouchableOpacity
            onPress={handleApply}
            className="px-4 py-2 bg-primary rounded-full"
          >
            <AppText
              weight="bold"
              className="text-white text-xs"
            >
              {t('common.apply')}
            </AppText>
          </TouchableOpacity>
        }
      >
        <View className="px-6 pt-4 pb-24">
          {(mode === "all" || mode === "category") && (
              <View className="mb-6">
                <AppText
                  weight="bold"
                  className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase"
                >
                  {t('create_ad.fields.category')}
                </AppText>
                <TouchableOpacity
                  onPress={() => setIsCategoryModalVisible(true)}
                  className={`flex-row items-center justify-between rounded-full p-4 border ${filters.category ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100"}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100">
                      <Ionicons name="grid-outline" size={20} color="#FF4F18" />
                    </View>
                    <View>
                      <AppText
                        weight="bold"
                        className={
                          filters.category ? "text-white" : "text-gray-500"
                        }
                      >
                        {filters.category?.name || t('create_ad.fields.category')}
                      </AppText>
                      {filters.category && (
                         <AppText className="text-gray-400 text-xs mt-0.5">
                            Selected
                         </AppText>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
          )}

          {(mode === "all" || mode === "price") && (
            <View className="mb-6">
              <AppText
                weight="bold"
                className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase"
              >
                {t('search.filters.priceRange')} ({t('common.currency')})
              </AppText>
              <View className="flex-row gap-3">
                <View
                  className={`flex-1 border rounded-[22px] p-4 ${filters.minPrice ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100"}`}
                >
                  <AppText className={`text-[10px] ${filters.minPrice ? "text-white/60" : "text-gray-400"} mb-1`}>
                    {t('search.filters.min')}
                  </AppText>
                  <TextInput
                    className={`${filters.minPrice ? "text-white" : "text-gray-900"} font-bold p-0 text-base`}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={filters.minPrice}
                    onChangeText={(text) =>
                      setFilters({ ...filters, minPrice: text })
                    }
                  />
                </View>
                <View
                  className={`flex-1 border rounded-[22px] p-4 ${filters.maxPrice ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100"}`}
                >
                  <AppText className={`text-[10px] ${filters.maxPrice ? "text-white/60" : "text-gray-400"} mb-1`}>
                    {t('search.filters.max')}
                  </AppText>
                  <TextInput
                    className={`${filters.maxPrice ? "text-white" : "text-gray-900"} font-bold p-0 text-base`}
                    placeholder={t('common.all')}
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={filters.maxPrice}
                    onChangeText={(text) =>
                      setFilters({ ...filters, maxPrice: text })
                    }
                  />
                </View>
              </View>
            </View>
          )}

          {(mode === "all" || mode === "condition") && (
            <View className="mb-8">
                <AppText
                weight="bold"
                className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase"
              >
                {t('search.filters.condition')}
              </AppText>
              <View className="gap-3">
                {CONDITIONS.map((cond) => {
                  const isSelected = filters.condition.includes(cond.value);
                  return (
                    <TouchableOpacity
                      key={cond.value}
                      onPress={() => toggleCondition(cond.value)}
                      className={`px-4 py-4 rounded-[22px] border flex-row items-center justify-between ${isSelected ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100"}`}
                    >
                      <AppText
                        weight="bold"
                        className={isSelected ? "text-white" : "text-gray-600"}
                      >
                        {cond.label}
                      </AppText>
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center ${isSelected ? "bg-white" : "bg-white border border-gray-200"}`}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#1e293b"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </BottomSheet>

      <CountryModal
        visible={isCountryModalVisible}
        onClose={() => setIsCountryModalVisible(false)}
        onSelect={(country) => setFilters({ ...filters, country })}
        selectedCountryId={filters.country?.id}
      />

      <CategoryModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={(category) => setFilters({ ...filters, category })}
        selectedCategoryId={filters.category?.id}
      />
    </>
  );
}
