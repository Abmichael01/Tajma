import React, { useState, useEffect } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { useCategories } from '@/hooks/useCategories';
import { Category, CategoryTree } from '@/types/category';

import Input from '../ui/Input';

interface BasicInfoStepProps {
  formData: any;
  errors: any;
  onInputChange: (field: string, value: any) => void;
  onCategorySelect: (category: Category) => void;
  isEdit?: boolean;
}

export default function BasicInfoStep({
  formData,
  errors,
  onInputChange,
  onCategorySelect,
  isEdit = false,
}: BasicInfoStepProps) {
  const { categoryTree, categories, getCategoryBySlug, loading } = useCategories();

  const [currentLevelNodes, setCurrentLevelNodes] = useState<CategoryTree[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string, nodes: CategoryTree[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize with root categories
  useEffect(() => {
    if (categoryTree.length > 0 && currentLevelNodes.length === 0 && breadcrumbs.length === 0) {
      setCurrentLevelNodes(categoryTree);
    }
  }, [categoryTree]);

  // Filter categories based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, categories]);

  const handleSelect = (node: CategoryTree | Category) => {
    const isTreeNode = (n: any): n is CategoryTree => 'children' in n;

    // Create a generic Category object from the node to avoid type mismatch
    // If it's a CategoryTree, we can cast it safely as it shares properties or use helper
    // Here we ensure we pass a valid Category object
    const categoryToSelect = {
      id: node.id,
      name: node.name,
      slug: node.slug,
      icon: node.icon,
      description: node.description,
      parentId: 'parentId' in node ? node.parentId : null, // handle both types
      // ... other props map naturally
    } as Category;


    if (!searchQuery && isTreeNode(node) && node.children && node.children.length > 0) {
      setBreadcrumbs([...breadcrumbs, { name: node.name, nodes: currentLevelNodes }]);
      setCurrentLevelNodes(node.children);
    } else {
      // It's a leaf node or we are searching -> select it
      onCategorySelect(categoryToSelect);
    }
  };

  const handleBack = () => {
    if (breadcrumbs.length > 0) {
      const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
      setCurrentLevelNodes(lastCrumb.nodes);
      setBreadcrumbs(breadcrumbs.slice(0, -1));
    }
  };

  const currentCategoryName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'All Categories';

  const selectedCategoryObj = React.useMemo(() =>
    formData.category ? categories.find(cat => cat.slug === formData.category) : null
    , [formData.category, categories]);

  return (
    <View className="flex-1">
      {/* Title Input */}
      <View className="mb-6">
        <AppText className="mb-2 text-gray-700 font-medium">Ad Title</AppText>
        <Input
          placeholder="What are you selling? (e.g. iPhone 12 Pro)"
          value={formData.title}
          onChangeText={(value) => onInputChange('title', value)}
          maxLength={100}
          error={!!errors.title}
        />
        {errors.title && <AppText className="text-red-500 text-xs mt-1 ml-2">{errors.title}</AppText>}
      </View>

      {!isEdit && (
        <>
          <View className="flex-row items-center justify-between mb-2">
            <AppText className="text-gray-700 font-medium">Category</AppText>
            {selectedCategoryObj && (
              <TouchableOpacity onPress={() => onInputChange('category', '')}>
                <AppText className="text-primary font-semibold text-xs">Change</AppText>
              </TouchableOpacity>
            )}
          </View>

          {selectedCategoryObj ? (
            <Pressable
              onPress={() => onInputChange('category', '')}
              className="bg-white p-4 rounded-3xl border-2 border-primary/20 flex-row items-center gap-4 mb-4"
            >
              <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center">
                <Ionicons name="checkmark-circle" size={24} color="#FF4F18" />
              </View>
              <View className="flex-1">
                <AppText weight="bold" className="text-gray-900 text-base">{selectedCategoryObj.name}</AppText>
                <AppText className="text-xs text-gray-500">Tap to change category</AppText>
              </View>
              <Ionicons name="sync-outline" size={20} color="#FF4F18" />
            </Pressable>
          ) : (
            <>
              {/* Search Bar */}
              <View className="mb-4">
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="search" size={20} color="#64748b" />}
                  rightIcon={
                    searchQuery.length > 0 ? (
                      <Pressable onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                      </Pressable>
                    ) : undefined
                  }
                />
              </View>

              {/* Breadcrumbs (only if not searching) */}
              {!searchQuery && breadcrumbs.length > 0 && (
                <View className="flex-row items-center mb-4 pb-2 border-b border-gray-100">
                  <TouchableOpacity onPress={handleBack} className="mr-3 bg-gray-50 p-2 rounded-full">
                    <Ionicons name="arrow-back" size={20} color="#0f172b" />
                  </TouchableOpacity>
                  <View>
                    <AppText className="text-xs text-gray-400 uppercase tracking-wider">Browsing</AppText>
                    <AppText weight="bold" className="text-lg text-gray-900">{currentCategoryName}</AppText>
                  </View>
                </View>
              )}

              {/* Content */}
              <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                {loading && categoryTree.length === 0 ? (
                  <View className="justify-center items-center py-10">
                    <ActivityIndicator size="large" color="#FF4F18" />
                    <AppText className="mt-4 text-gray-500 font-medium">Loading categories...</AppText>
                  </View>
                ) : (
                  <View>
                    {searchQuery ? (
                      filteredCategories.length === 0 ? (
                        <View className="justify-center items-center py-12">
                          <View className="bg-gray-50 w-16 h-16 rounded-full items-center justify-center mb-4">
                            <Ionicons name="search-outline" size={32} color="#94a3b8" />
                          </View>
                          <AppText className="text-gray-500 font-medium">No results for "{searchQuery}"</AppText>
                        </View>
                      ) : (
                        filteredCategories.map((cat, index) => (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => handleSelect(cat)}
                            activeOpacity={0.7}
                            className={`p-4 flex-row items-center justify-between bg-white ${index !== filteredCategories.length - 1 ? 'border-b border-gray-50' : ''}`}
                          >
                            <View className="flex-row items-center gap-4 flex-1">
                              <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
                                <AppText weight="bold" className="text-xl text-primary">{cat.name.charAt(0).toUpperCase()}</AppText>
                              </View>
                              <View>
                                <AppText className="text-base text-gray-900 font-medium">{cat.name}</AppText>
                                <AppText className="text-xs text-gray-400 mt-0.5">Select Category</AppText>
                              </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                          </TouchableOpacity>
                        ))
                      )
                    ) : (
                      currentLevelNodes.length === 0 ? (
                        <View className="justify-center items-center py-12">
                          <AppText className="text-gray-500">No categories found</AppText>
                        </View>
                      ) : (
                        currentLevelNodes.map((node, index) => (
                          <TouchableOpacity
                            key={node.id}
                            onPress={() => handleSelect(node)}
                            activeOpacity={0.7}
                            className={`p-4 flex-row items-center justify-between bg-white ${index !== currentLevelNodes.length - 1 ? 'border-b border-gray-50' : ''}`}
                          >
                            <View className="flex-row items-center gap-4">
                              <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
                                <AppText weight="bold" className="text-xl text-primary">{node.name.charAt(0).toUpperCase()}</AppText>
                              </View>
                              <AppText className="text-base text-gray-900 font-medium">{node.name}</AppText>
                            </View>

                            {node.children && node.children.length > 0 ? (
                              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                            ) : (
                              <View className="bg-gray-50 px-3 py-1.5 rounded-full">
                                <AppText className="text-xs text-gray-500 font-semibold">Select</AppText>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))
                      )
                    )}
                  </View>
                )}
              </View>
            </>
          )}
        </>
      )}
      <View className="h-6" />
    </View>
  );
}
