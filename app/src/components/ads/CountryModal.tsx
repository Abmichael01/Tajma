import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import { useLocations, useCountries, Country } from "@/hooks/useLocations";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";

interface CountryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country | null) => void;
  selectedCountryId?: number;
  mode?: "filter" | "picker";
}

export default function CountryModal({
  visible,
  onClose,
  onSelect,
  selectedCountryId,
  mode = "filter",
}: CountryModalProps) {
  const { t } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState(0); // Start at country level
  const [parentId, setParentId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [selectionHistory, setSelectionHistory] = useState<any[]>([]);
 
  const { data: countries, isLoading: isCountriesLoading } = useCountries();
  const { data: locations, isLoading: isLocationsLoading } = useLocations(parentId, currentLevel > 0 ? currentLevel : undefined, countryId || undefined);
  
  const isLoading = currentLevel === 0 ? isCountriesLoading : isLocationsLoading;
  const [searchQuery, setSearchQuery] = useState("");
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
      // Reset state when closing
      setParentId(null);
      setCountryId(null);
      setCurrentLevel(0);
      setSelectionHistory([]);
    }
  }, [visible]);

  const handleSelect = (item: any) => {
    if (!item) {
      onClose();
      setTimeout(() => {
        onSelect(null);
      }, 100);
      return;
    }

    if (currentLevel === 0) {
      // Selecting a country
      setSelectionHistory([
        ...selectionHistory,
        { ...item, prevParentId: null, prevCountryId: null, prevLevel: 0 },
      ]);
      setCountryId(item.id);
      setCurrentLevel(1);
      setSearchQuery("");
    } else if (item.level && item.level < 2) {
      // Drilling down into department - STOP AT DEPARTMENT (Level 2)
      setSelectionHistory([
        ...selectionHistory,
        { ...item, prevParentId: parentId, prevCountryId: countryId, prevLevel: currentLevel },
      ]);
      setParentId(item.id);
      setCurrentLevel((item.level as number) + 1);
      setSearchQuery("");
    } else {
      // Final selection (Department level 2 reached or already at leaf)
      onClose();
      setTimeout(() => {
        onSelect(item);
      }, 100);
    }
  };

  const handleBack = () => {
    if (selectionHistory.length > 0) {
      const last = selectionHistory[selectionHistory.length - 1];
      setParentId(last.prevParentId ?? null);
      setCountryId(last.prevCountryId ?? null);
      setCurrentLevel(last.prevLevel ?? 0);
      setSelectionHistory(selectionHistory.slice(0, -1));
    }
  };

  const dataArray = currentLevel === 0 
    ? (countries || [])
    : (Array.isArray(locations) ? locations : (locations as any)?.results || []);

  const filteredData = dataArray.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTitle = () => {
    if (currentLevel === 0) return t('search.location.selectCountry');
    return t('search.location.selectDepartment');
  };

  const getBreadcrumbBase = () => {
    if (currentLevel === 0) return t('search.location.allCountries');
    const countryEntry = selectionHistory.find(h => h.prevLevel === 0);
    return countryEntry ? countryEntry.name : t('search.location.allCountries');
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      title={getTitle()}
      onClose={onClose}
      snapPoints={["90%"]}
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
                placeholder={currentLevel === 0 ? t('search.location.searchCountry') : t('search.location.searchDepartment')}
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Breadcrumbs */}
          {selectionHistory.length > 0 && (
            <View className="flex-row items-center flex-wrap mb-2">
              <AppText className="text-gray-400 text-xs">{getBreadcrumbBase()}</AppText>
              {selectionHistory.slice(currentLevel === 0 ? 0 : 1).map((item, index) => (
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

        {/* All Locations / Back to Parent option */}
        {!searchQuery && (
          <TouchableOpacity
            className={`flex-row items-center justify-between py-4 mb-2 rounded-full ${!selectedCountryId && currentLevel === 0 ? "bg-slate-900/5 px-4 border border-slate-900/10" : ""}`}
            onPress={() => {
              onClose();
              setTimeout(() => {
                if (currentLevel === 0) {
                  onSelect(null);
                } else {
                  // Select the current parent region/department/country
                  const parentObj = selectionHistory[selectionHistory.length - 1];
                  onSelect(parentObj);
                }
              }, 100);
            }}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-10 h-10 rounded-2xl items-center justify-center ${!selectedCountryId && currentLevel === 0 ? "bg-slate-900" : "bg-gray-100"}`}
              >
                <Ionicons
                  name={
                    currentLevel === 0 ? "globe-outline" : "location-outline"
                  }
                  size={20}
                  color={
                    !selectedCountryId && currentLevel === 0
                      ? "white"
                      : "#2D2D2D"
                  }
                />
              </View>
              <View>
                <AppText
                  weight="bold"
                  className={`text-base ${!selectedCountryId && currentLevel === 0 ? "text-slate-900" : "text-gray-900"}`}
                >
                  {currentLevel === 0
                    ? t('search.location.allLocations')
                    : mode === "picker" ? "Select this location" : t('search.location.allOf', { name: selectionHistory[selectionHistory.length - 1]?.name })}
                </AppText>
                <AppText className="text-gray-500 text-[10px] mt-0.5">
                  {currentLevel === 0
                    ? t('search.location.adsFromAllCountries')
                    : t('search.location.adsInAllAreas')}
                </AppText>
              </View>
            </View>
            {!selectedCountryId && currentLevel === 0 && (
              <Ionicons name="checkmark-circle" size={22} color="#1e293b" />
            )}
          </TouchableOpacity>
        )}

        <View className="h-2" />
        <AppText
          weight="bold"
          className="text-gray-400 text-[10px] tracking-widest mb-3 px-1 uppercase"
        >
          {currentLevel === 0
            ? t('search.location.countries')
            : t('search.location.departments')}
        </AppText>

        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#FF4F18" />
            <AppText className="text-gray-400 mt-4">{t('common.loading')}</AppText>
          </View>
        ) : (
          filteredData.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              className={`flex-row items-center justify-between py-4 mb-2 rounded-full ${selectedCountryId === item.id ? "bg-slate-900/5 px-4 border border-slate-900/10" : ""}`}
              onPress={() => handleSelect(item)}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className={`w-10 h-10 rounded-2xl items-center justify-center ${selectedCountryId === item.id ? "bg-slate-900" : "bg-slate-900/10"}`}
                >
                  {currentLevel === 0 && item.flag_emoji ? (
                    <AppText className="text-lg">{item.flag_emoji}</AppText>
                  ) : (
                    <Ionicons
                      name="location"
                      size={20}
                      color={selectedCountryId === item.id ? "white" : "#1e293b"}
                    />
                  )}
                </View>
                <View className="flex-1">
                  <AppText
                    weight="bold"
                    className={`text-base ${selectedCountryId === item.id ? "text-slate-900" : "text-gray-900"}`}
                  >
                    {item.name}
                  </AppText>
                  <AppText className="text-gray-500 text-[10px] mt-0.5">
                    {item.adsCount || 0} listings
                  </AppText>
                </View>
                {((currentLevel === 0) || (item.level && item.level < 2)) && !searchQuery && (
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                )}
              </View>
              {selectedCountryId === item.id && (
                <Ionicons name="checkmark-circle" size={22} color="#1e293b" />
              )}
            </TouchableOpacity>
          ))
        )}

        {!isLoading && filteredData?.length === 0 && (
          <View className="py-20 items-center">
            <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="location-outline" size={32} color="#cbd5e1" />
            </View>
            <AppText weight="bold" className="text-gray-400 text-lg">
              {t('search.location.noMatches')}
            </AppText>
            <AppText className="text-gray-400 text-center px-10 mt-1">
              {t('search.location.noMatchesDesc', { query: searchQuery })}
            </AppText>
          </View>
        )}
        <View className="h-20" />
      </View>
    </BottomSheet>
  );
}
