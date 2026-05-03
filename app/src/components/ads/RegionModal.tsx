import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import { useRegions, Region } from "@/hooks/useRegions";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";

interface RegionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (region: Region | null) => void;
  selectedRegionId?: number;
}

export default function RegionModal({
  visible,
  onClose,
  onSelect,
  selectedRegionId,
}: RegionModalProps) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [parentId, setParentId] = useState<number | null>(null);
  const [selectionHistory, setSelectionHistory] = useState<
    { id: number | null; name: string; level: number }[]
  >([]);

  const { data: regions, isLoading } = useRegions(parentId, currentLevel);
  const [searchQuery, setSearchQuery] = useState("");
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
      // Reset state when closing
      setParentId(null);
      setCurrentLevel(1);
      setSelectionHistory([]);
    }
  }, [visible]);

  const handleSelect = (region: Region | null) => {
    if (!region) {
      onSelect(null);
      onClose();
      return;
    }

    // Check if there are children. If we are at levels 1 or 2, we should drill down
    // Unless it's the "Select all" option
    if (region.level && region.level < 3) {
      setSelectionHistory([
        ...selectionHistory,
        { id: parentId, name: region.name, level: currentLevel },
      ]);
      setParentId(region.id);
      setCurrentLevel((region.level as number) + 1);
      setSearchQuery("");
    } else {
      onSelect(region);
      onClose();
    }
  };

  const handleBack = () => {
    if (selectionHistory.length > 0) {
      const last = selectionHistory[selectionHistory.length - 1];
      setParentId(last.id);
      setCurrentLevel(last.level);
      setSelectionHistory(selectionHistory.slice(0, -1));
    }
  };

  const regionsArray = Array.isArray(regions)
    ? regions
    : (regions as any)?.results || [];

  const filteredRegions = regionsArray.filter((region: Region) =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTitle = () => {
    if (currentLevel === 1) return "Select Region";
    if (currentLevel === 2) return "Select Department";
    return "Select Commune";
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      title={getTitle()}
      onClose={onClose}
      snapPoints={["85%"]}
    >
      <View className="px-6">
        {/* Search & Navigation */}
        <View className="py-4">
          <View className="flex-row items-center gap-3 mb-4">
            {selectionHistory.length > 0 && (
              <TouchableOpacity
                onPress={handleBack}
                className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="arrow-back" size={20} color="#2D2D2D" />
              </TouchableOpacity>
            )}
            <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-full px-5 py-3">
              <Ionicons
                name="search-outline"
                size={18}
                color="#9ca3af"
                style={{ marginRight: 10 }}
              />
              <TextInput
                className="flex-1 text-base text-gray-900 py-0.5"
                placeholder={`Search ${currentLevel === 1 ? "region" : currentLevel === 2 ? "department" : "commune"}...`}
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Breadcrumbs */}
          {selectionHistory.length > 0 && (
            <View className="flex-row items-center flex-wrap mb-2">
              <AppText className="text-gray-400 text-xs">Niger</AppText>
              {selectionHistory.map((item, index) => (
                <React.Fragment key={index}>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color="#cbd5e1"
                    style={{ marginHorizontal: 4 }}
                  />
                  <AppText className="text-gray-400 text-xs">
                    {item.name}
                  </AppText>
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* All Regions / Back to Parent option */}
        {!searchQuery && (
          <TouchableOpacity
            className={`flex-row items-center justify-between py-4 mb-2 rounded-full ${!selectedRegionId && currentLevel === 1 ? "bg-primary/5 px-4 border border-primary/20" : ""}`}
            onPress={() => {
              if (currentLevel === 1) {
                onSelect(null);
                onClose();
              } else {
                // Select the current parent region/department
                const parentRegion =
                  regionsArray.find((r: Region) => r.id === parentId) ||
                  ({
                    id: parentId,
                    name: selectionHistory[selectionHistory.length - 1]?.name,
                  } as any);
                onSelect(parentRegion);
                onClose();
              }
            }}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-10 h-10 rounded-2xl items-center justify-center ${!selectedRegionId && currentLevel === 1 ? "bg-primary" : "bg-gray-100"}`}
              >
                <Ionicons
                  name={
                    currentLevel === 1 ? "globe-outline" : "location-outline"
                  }
                  size={20}
                  color={
                    !selectedRegionId && currentLevel === 1
                      ? "white"
                      : "#2D2D2D"
                  }
                />
              </View>
              <View>
                <AppText
                  weight="bold"
                  className={`text-base ${!selectedRegionId && currentLevel === 1 ? "text-primary" : "text-gray-900"}`}
                >
                  {currentLevel === 1
                    ? "All of Niger"
                    : `All of ${selectionHistory[selectionHistory.length - 1]?.name}`}
                </AppText>
                <AppText className="text-gray-500 text-[10px] mt-0.5">
                  {currentLevel === 1
                    ? "Ads from across the country"
                    : `Ads in all areas of this ${currentLevel === 2 ? "region" : "department"}`}
                </AppText>
              </View>
            </View>
            {!selectedRegionId && currentLevel === 1 && (
              <Ionicons name="checkmark-circle" size={22} color="#FF4F18" />
            )}
          </TouchableOpacity>
        )}

        <View className="h-2" />
        <AppText
          weight="bold"
          className="text-gray-400 text-[10px] tracking-widest mb-3 px-1 uppercase"
        >
          {currentLevel === 1
            ? "Regions"
            : currentLevel === 2
              ? "Departments"
              : "Communes"}
        </AppText>

        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#FF4F18" />
            <AppText className="text-gray-400 mt-4">Loading...</AppText>
          </View>
        ) : (
          regionsArray.map((region: Region) => (
            <TouchableOpacity
              key={region.id}
              className={`flex-row items-center justify-between py-4 mb-2 rounded-full ${selectedRegionId === region.id ? "bg-primary/5 px-4 border border-primary/20" : ""}`}
              onPress={() => handleSelect(region)}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className={`w-10 h-10 rounded-2xl items-center justify-center ${selectedRegionId === region.id ? "bg-primary" : "bg-primary/10"}`}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={selectedRegionId === region.id ? "white" : "#FF4F18"}
                  />
                </View>
                <View className="flex-1">
                  <AppText
                    weight="bold"
                    className={`text-base ${selectedRegionId === region.id ? "text-primary" : "text-gray-900"}`}
                  >
                    {region.name}
                  </AppText>
                  <AppText className="text-gray-500 text-[10px] mt-0.5">
                    {region.adsCount} listings
                  </AppText>
                </View>
                {region.level && region.level < 3 && !searchQuery && (
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                )}
              </View>
              {selectedRegionId === region.id && (
                <Ionicons name="checkmark-circle" size={22} color="#FF4F18" />
              )}
            </TouchableOpacity>
          ))
        )}

        {!isLoading && filteredRegions?.length === 0 && (
          <View className="py-20 items-center">
            <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="location-outline" size={32} color="#cbd5e1" />
            </View>
            <AppText weight="bold" className="text-gray-400 text-lg">
              No matches found
            </AppText>
            <AppText className="text-gray-400 text-center px-10 mt-1">
              We couldn't find matches for "{searchQuery}"
            </AppText>
          </View>
        )}
        <View className="h-20" />
      </View>
    </BottomSheet>
  );
}
