import React, { useState, useMemo, useEffect, useRef } from "react";
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
      onSelect(category);
      onClose();
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
        className={`w-12 h-12 rounded-2xl items-center justify-center ${isSelected ? "bg-primary" : "bg-primary/10"}`}
      >
        <Ionicons
          name={(category.icon as any) || "apps-outline"}
          size={24}
          color={isSelected ? "white" : "#FF4F18"}
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
            ? "Subcategories"
            : "Categories"
      }
      onClose={onClose}
      snapPoints={["85%"]}
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
              placeholder="Search categories..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Categories List Content */}
        {!activeParentId && !searchQuery && (
          <TouchableOpacity
            className={`flex-row items-center justify-between py-5 mb-2 rounded-full ${!selectedCategoryId ? "bg-primary/5 px-4 border border-primary/20" : ""}`}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${!selectedCategoryId ? "bg-primary" : "bg-gray-100"}`}
              >
                <Ionicons
                  name="grid-outline"
                  size={24}
                  color={!selectedCategoryId ? "white" : "#2D2D2D"}
                />
              </View>
              <View>
                <AppText
                  weight="bold"
                  className={`text-lg ${!selectedCategoryId ? "text-primary" : "text-gray-900"}`}
                >
                  All Categories
                </AppText>
                <AppText className="text-gray-500 text-xs mt-0.5">
                  Explore everything on Tajma
                </AppText>
              </View>
            </View>
            {!selectedCategoryId && (
              <Ionicons name="checkmark-circle" size={24} color="#FF4F18" />
            )}
          </TouchableOpacity>
        )}

        {/* Option to select current parent as category */}
        {activeCategory && !searchQuery && (
          <TouchableOpacity
            className={`flex-row items-center justify-between py-5 mb-2 rounded-full ${selectedCategoryId === activeCategory.id ? "bg-primary/5 px-4 border border-primary/20" : ""}`}
            onPress={() => {
              onSelect(activeCategory);
              onClose();
            }}
          >
            <View className="flex-row items-center gap-4">
              <CategoryImage
                category={activeCategory}
                isSelected={selectedCategoryId === activeCategory.id}
              />
              <View className="flex-1">
                <AppText
                  weight="bold"
                  className={`text-lg ${selectedCategoryId === activeCategory.id ? "text-primary" : "text-gray-900"}`}
                >
                  All in {activeCategory.name}
                </AppText>
                <AppText
                  className="text-gray-500 text-xs mt-0.5"
                  numberOfLines={1}
                >
                  Select this category
                </AppText>
              </View>
            </View>
            {selectedCategoryId === activeCategory.id && (
              <Ionicons name="checkmark-circle" size={24} color="#FF4F18" />
            )}
          </TouchableOpacity>
        )}

        <View className="h-4" />
        <AppText
          weight="bold"
          className="text-gray-400 text-[10px] tracking-widest mb-3 px-1 uppercase"
        >
          {searchQuery
            ? "Search Results"
            : activeParentId
              ? "Subcategories"
              : "Main Categories"}
        </AppText>

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#FF4F18" />
            <AppText className="text-gray-400 mt-4">
              Loading categories...
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
                className={`flex-row items-center justify-between py-5 mb-2 rounded-full ${isSelected ? "bg-primary/5 px-4 border border-primary/20" : ""}`}
                onPress={() => handleCategoryPress(category)}
              >
                <View className="flex-row items-center gap-4 flex-1">
                  <CategoryImage category={category} isSelected={isSelected} />
                  <View className="flex-1">
                    <AppText
                      weight="bold"
                      className={`text-lg ${isSelected ? "text-primary" : "text-gray-900"}`}
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
                      color="#FF4F18"
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
              No categories found
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
