import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";

export type SortOption =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "views"
  | "title";

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: SortOption) => void;
  currentSort: SortOption;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: any }[] = [
  { value: "newest", label: "Newest First", icon: "time-outline" },
  { value: "oldest", label: "Oldest First", icon: "hourglass-outline" },
  {
    value: "price-low",
    label: "Price: Low to High",
    icon: "trending-up-outline",
  },
  {
    value: "price-high",
    label: "Price: High to Low",
    icon: "trending-down-outline",
  },
  { value: "views", label: "Most Viewed", icon: "eye-outline" },
  { value: "title", label: "Title A-Z", icon: "text-outline" },
];

export default function SortModal({
  visible,
  onClose,
  onSelect,
  currentSort,
}: SortModalProps) {
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      title="Sort By"
      onClose={onClose}
      snapPoints={["50%"]}
    >
      <View className="px-6 pt-2 pb-10">
        {SORT_OPTIONS.map((option) => {
          const isSelected = currentSort === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              className={`flex-row items-center justify-between p-4 mb-2 rounded-full border ${
                isSelected
                  ? "bg-primary/5 border-primary/20"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    isSelected ? "bg-primary" : "bg-white"
                  }`}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? "white" : "#64748B"}
                  />
                </View>
                <AppText
                  weight={isSelected ? "bold" : "medium"}
                  className={isSelected ? "text-primary" : "text-gray-700"}
                >
                  {option.label}
                </AppText>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#FF4F18" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}
