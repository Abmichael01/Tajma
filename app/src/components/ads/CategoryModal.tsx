import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";
import { resolveImageUrl } from "@/utils/imageUtils";

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: Category | null) => void;
  selectedCategoryId?: string;
  parentId?: string | null;
}

export default function CategoryModal({
  visible,
  onClose,
  onSelect,
  selectedCategoryId,
  parentId = null,
}: CategoryModalProps) {
  const { t } = useTranslation();
  const { categories, rootCategories, loading } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeParentId, setActiveParentId] = useState<string | null>(parentId);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      setActiveParentId(parentId);
      setNavigationHistory([]);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, parentId]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeParentId),
    [categories, activeParentId],
  );

  const displayedCategories = useMemo(() => {
    if (searchQuery) {
      return categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (activeParentId) {
      return categories.filter((cat) => cat.parentId === activeParentId);
    }

    return rootCategories;
  }, [categories, rootCategories, searchQuery, activeParentId]);

  const handleCategoryPress = (category: Category) => {
    const hasSubcategories = categories.some(
      (cat) => cat.parentId === category.id,
    );

    if (hasSubcategories && !searchQuery) {
      setNavigationHistory((prev) =>
        [...prev, activeParentId as string].filter(Boolean),
      );
      setActiveParentId(category.id);
    } else {
      onClose();
      setTimeout(() => {
        onSelect(category);
      }, 100);
    }
  };

  const handleBack = () => {
    const newHistory = [...navigationHistory];
    const prevId = newHistory.pop() || null;
    setNavigationHistory(newHistory);
    setActiveParentId(prevId);
  };

  const getBreadcrumb = (category: Category) => {
    const parts: string[] = [category.name];
    let currentParentId = category.parentId;

    // Limit to 3 levels to keep it concise
    let depth = 0;
    while (currentParentId && depth < 2) {
      const parent = categories.find((c) => c.id === currentParentId);
      if (parent) {
        parts.unshift(parent.name);
        currentParentId = parent.parentId;
      } else {
        break;
      }
      depth++;
    }

    return parts.join(" > ");
  };

const sanitizeIconName = (name: string | null | undefined): any => {
  if (!name) return "apps-outline";
  let sanitized = name.toLowerCase();
  
  // Handle common Ionicons/Lucide mismatches
  if (sanitized === "home") sanitized = "home-outline";
  if (sanitized === "tv") sanitized = "tv-outline";
  if (sanitized === "car") sanitized = "car-outline";
  if (sanitized === "phone" || sanitized === "smartphone") sanitized = "smartphone-outline";
  if (sanitized === "shirt") sanitized = "shirt-outline";
  if (sanitized === "briefcase") sanitized = "briefcase-outline";
  if (sanitized === "heart") sanitized = "heart-outline";
  
  return sanitized;
};

const CategoryImage = ({
  category,
  isSelected,
}: {
  category: Category;
  isSelected: boolean;
}) => {
    if (category.imageUrl) {
      return (
        <Image
          source={{ uri: resolveImageUrl(category.imageUrl) || undefined }}
          className="w-12 h-12 rounded-2xl"
          resizeMode="cover"
        />
      );
    }
    return (
      <View
        className={`w-12 h-12 rounded-2xl items-center justify-center ${isSelected ? "bg-slate-900" : "bg-slate-900/10"}`}
      >
        <Ionicons
          name={sanitizeIconName(category.icon)}
          size={24}
          color={isSelected ? "white" : "#1e293b"}
        />
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      title={
        activeCategory
          ? activeCategory.name
          : parentId
            ? t('search.category.subcategories')
            : t('search.category.categories')
      }
      onClose={onClose}
      snapPoints={["90%"]}
      headerLeft={
        navigationHistory.length > 0 ? (
          <TouchableOpacity onPress={handleBack} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#2D2D2D" />
          </TouchableOpacity>
        ) : null
      }
    >
      <View className="px-6">
        {/* Search Input */}
        <View className="py-5">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-full px-5 py-3.5">
            <Ionicons
              name="search-outline"
              size={20}
              color="#9ca3af"
              style={{ marginRight: 10 }}
            />
            <TextInput
              className="flex-1 text-base text-gray-900 py-1"
              placeholder={t('search.category.searchPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* All Categories / Select This Category option */}
        {!searchQuery && (
          <TouchableOpacity
            className={`flex-row items-center justify-between py-4 mb-2 rounded-full ${(!selectedCategoryId && !activeParentId) || selectedCategoryId === activeParentId ? "bg-slate-900/5 px-4 border border-slate-900/10" : ""}`}
            onPress={() => {
              onClose();
              setTimeout(() => {
                if (!activeCategory) {
                  onSelect(null);
                } else {
                  onSelect(activeCategory);
                }
              }, 100);
            }}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-10 h-10 rounded-2xl items-center justify-center ${(!selectedCategoryId && !activeParentId) || selectedCategoryId === activeParentId ? "bg-slate-900" : "bg-gray-100"}`}
              >
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={(!selectedCategoryId && !activeParentId) || selectedCategoryId === activeParentId ? "white" : "#2D2D2D"}
                />
              </View>
              <View>
                <AppText
                  weight="bold"
                  className={`text-base ${(!selectedCategoryId && !activeParentId) || selectedCategoryId === activeParentId ? "text-slate-900" : "text-gray-900"}`}
                >
                  {activeCategory?.name 
                    ? t('search.category.allIn', { name: activeCategory.name })
                    : t('search.category.allCategories')}
                </AppText>
                <AppText className="text-gray-500 text-[10px] mt-0.5">
                  {activeCategory
                    ? t('search.category.selectThisCategory')
                    : t('search.category.exploreEverything')}
                </AppText>
              </View>
            </View>
            {((!selectedCategoryId && !activeParentId) || selectedCategoryId === activeParentId) && (
              <Ionicons name="checkmark-circle" size={22} color="#1e293b" />
            )}
          </TouchableOpacity>
        )}

        <AppText
          weight="bold"
          className="text-gray-400 text-[10px] tracking-widest mb-3 px-1 uppercase"
        >
          {searchQuery
            ? t('search.category.searchResults')
            : activeParentId
              ? t('search.category.subcategories')
              : t('search.category.mainCategories')}
        </AppText>

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#FF4F18" />
            <AppText className="text-gray-400 mt-4">
              {t('search.category.loadingCategories')}
            </AppText>
          </View>
        ) : (
          displayedCategories.map((category) => {
            const hasSubcategories = categories.some(
              (cat) => cat.parentId === category.id,
            );
            const isSelected = selectedCategoryId === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                className={`flex-row items-center justify-between py-5 mb-2 rounded-full ${isSelected ? "bg-slate-900/5 px-4 border border-slate-900/10" : ""}`}
                onPress={() => handleCategoryPress(category)}
              >
                <View className="flex-row items-center gap-4 flex-1">
                  <CategoryImage category={category} isSelected={isSelected} />
                  <View className="flex-1">
                    <AppText
                      weight="bold"
                      className={`text-lg ${isSelected ? "text-slate-900" : "text-gray-900"}`}
                    >
                      {category.name}
                    </AppText>
                    <AppText className="text-gray-500 text-xs mt-0.5">
                      {category.adsCount || 0} listings
                    </AppText>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#1e293b"
                    />
                  )}
                  {hasSubcategories && !searchQuery && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9ca3af"
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {!loading && displayedCategories.length === 0 && (
          <View className="py-20 items-center">
            <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="search-outline" size={32} color="#cbd5e1" />
            </View>
            <AppText weight="bold" className="text-gray-400 text-lg">
              {t('search.category.noCategoriesFound')}
            </AppText>
            <AppText className="text-gray-400 text-center px-10 mt-1">
              {t('search.category.noMatchesDesc', { query: searchQuery })}
            </AppText>
          </View>
        )}
        <View className="h-20" />
      </View>
    </BottomSheet>
  );
}
