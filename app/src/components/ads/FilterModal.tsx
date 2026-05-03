import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import { Region } from "@/hooks/useRegions";
import { Category } from "@/types/category";
import RegionModal from "./RegionModal";
import CategoryModal from "./CategoryModal";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  mode?: "all" | "price";
}

export interface FilterState {
  region: Region | null;
  category: Category | null;
  minPrice: string;
  maxPrice: string;
  condition: string[];
}

const CONDITIONS = [
  { label: "Brand New", value: "brand-new" },
  { label: "Foreign Used", value: "foreign-used" },
  { label: "Open Box", value: "open-box" },
  { label: "Refurbished", value: "refurbished" },
];

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
  mode = "all",
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isRegionModalVisible, setIsRegionModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const hasPriceFilter = Boolean(filters.minPrice || filters.maxPrice);
  const activeFilterCount = [
    filters.region,
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
    onApply(filters);
    onClose();
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
      region: null,
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
        title={mode === "price" ? "Price Range" : "Refine Search"}
        onClose={onClose}
        snapPoints={mode === "price" ? ["55%"] : ["90%"]}
        headerLeft={
          <TouchableOpacity
            onPress={clearAll}
            className="px-2"
            disabled={!hasActiveFilters}
          >
            <AppText
              weight="bold"
              className={
                hasActiveFilters
                  ? "text-gray-600 text-sm"
                  : "text-gray-300 text-sm"
              }
            >
              Reset
            </AppText>
          </TouchableOpacity>
        }
        footer={
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={clearAll}
              disabled={!hasActiveFilters}
              className={`h-14 px-5 rounded-full items-center justify-center border ${hasActiveFilters ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}`}
            >
              <AppText
                weight="bold"
                className={hasActiveFilters ? "text-gray-700" : "text-gray-300"}
              >
                Reset
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              className="flex-1 h-14 rounded-full bg-primary items-center justify-center shadow-md shadow-primary/30"
            >
              <AppText weight="bold" className="text-white">
                {hasActiveFilters
                  ? `Show Results (${activeFilterCount})`
                  : "Show Results"}
              </AppText>
            </TouchableOpacity>
          </View>
        }
      >
        <View className="px-6 pt-4 pb-3">
          <View className="bg-[#111111] rounded-[28px] px-5 py-4 mb-6 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <AppText weight="bold" className="text-white text-base">
                {hasActiveFilters
                  ? `${activeFilterCount} active filter${activeFilterCount > 1 ? "s" : ""}`
                  : "All ads are showing"}
              </AppText>
              <AppText className="text-white/60 text-xs mt-1">
                Tune location, category, price and condition.
              </AppText>
            </View>
            <View className="w-11 h-11 rounded-full bg-white/10 items-center justify-center">
              <Ionicons name="options-outline" size={22} color="#FF4F18" />
            </View>
          </View>

          {mode === "all" && (
            <>
              {/* Region Section */}
              <View className="mb-6">
                <AppText
                  weight="bold"
                  className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase"
                >
                  Location
                </AppText>
                <TouchableOpacity
                  onPress={() => setIsRegionModalVisible(true)}
                  className={`flex-row items-center justify-between rounded-full p-4 border ${filters.region ? "bg-primary/10 border-primary/20" : "bg-gray-50 border-gray-100"}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100">
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color="#FF4F18"
                      />
                    </View>
                    <View>
                      <AppText
                        weight="bold"
                        className={
                          filters.region ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {filters.region?.name || "All Regions"}
                      </AppText>
                      <AppText className="text-gray-400 text-xs mt-0.5">
                        Where buyers should search
                      </AppText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Category Section */}
              <View className="mb-6">
                <AppText
                  weight="bold"
                  className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase"
                >
                  Category
                </AppText>
                <TouchableOpacity
                  onPress={() => setIsCategoryModalVisible(true)}
                  className={`flex-row items-center justify-between rounded-full p-4 border ${filters.category ? "bg-secondary/10 border-secondary/20" : "bg-gray-50 border-gray-100"}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100">
                      <Ionicons name="grid-outline" size={20} color="#FF4F18" />
                    </View>
                    <View>
                      <AppText
                        weight="bold"
                        className={
                          filters.category ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {filters.category?.name || "All Categories"}
                      </AppText>
                      <AppText className="text-gray-400 text-xs mt-0.5">
                        Narrow results by type
                      </AppText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Price Section */}
          <View className="mb-6">
            <AppText
              weight="bold"
              className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase"
            >
              Price Range (Fr)
            </AppText>
            <View className="flex-row gap-3">
              <View
                className={`flex-1 border rounded-[22px] p-4 ${filters.minPrice ? "bg-primary/10 border-primary/20" : "bg-gray-50 border-gray-100"}`}
              >
                <AppText className="text-[10px] text-gray-400 mb-1">
                  Min
                </AppText>
                <TextInput
                  className="text-gray-900 font-bold p-0 text-base"
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
                className={`flex-1 border rounded-[22px] p-4 ${filters.maxPrice ? "bg-primary/10 border-primary/20" : "bg-gray-50 border-gray-100"}`}
              >
                <AppText className="text-[10px] text-gray-400 mb-1">
                  Max
                </AppText>
                <TextInput
                  className="text-gray-900 font-bold p-0 text-base"
                  placeholder="Any"
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

          {mode === "all" && (
            <View className="mb-8">
              <AppText
                weight="bold"
                className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase"
              >
                Condition
              </AppText>
              <View className="gap-3">
                {CONDITIONS.map((cond) => {
                  const isSelected = filters.condition.includes(cond.value);
                  return (
                    <TouchableOpacity
                      key={cond.value}
                      onPress={() => toggleCondition(cond.value)}
                      className={`px-4 py-4 rounded-[22px] border flex-row items-center justify-between ${isSelected ? "bg-primary border-primary" : "bg-gray-50 border-gray-100"}`}
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
                            color="#FF4F18"
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

      <RegionModal
        visible={isRegionModalVisible}
        onClose={() => setIsRegionModalVisible(false)}
        onSelect={(region) => setFilters({ ...filters, region })}
        selectedRegionId={filters.region?.id}
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
