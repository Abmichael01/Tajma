import React, { useState, useEffect } from 'react';
import { View, Pressable, Modal, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { useCategories } from '@/hooks/useCategories';
import { Category, CategoryTree } from '@/types/category';

interface CategorySelectorProps {
  selectedCategorySlug?: string;
  onSelectCategory: (category: Category) => void;
  error?: string;
}

export default function CategorySelector({
  selectedCategorySlug,
  onSelectCategory,
  error,
}: CategorySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { categoryTree, getCategoryBySlug, loading } = useCategories();
  
  const [currentLevelNodes, setCurrentLevelNodes] = useState<CategoryTree[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{name: string, nodes: CategoryTree[]}[]>([]);

  useEffect(() => {
    if (modalVisible && categoryTree.length > 0 && currentLevelNodes.length === 0) {
      setCurrentLevelNodes(categoryTree);
    }
  }, [modalVisible, categoryTree]);

  const selectedCategory = selectedCategorySlug ? getCategoryBySlug(selectedCategorySlug) : null;

  const handleSelect = (node: CategoryTree) => {
    if (node.children && node.children.length > 0) {
      setBreadcrumbs([...breadcrumbs, { name: node.name, nodes: currentLevelNodes }]);
      setCurrentLevelNodes(node.children);
    } else {
      const category: Category = {
        id: node.id,
        name: node.name,
        slug: node.slug,
        icon: node.icon,
        parentId: node.parentId,
        level: node.level,
        hasChildren: false,
        displayOrder: node.displayOrder,
        children: []
      };
      
      onSelectCategory(category);
      setModalVisible(false);
      setBreadcrumbs([]);
      setCurrentLevelNodes([]);
    }
  };

  const handleBack = () => {
    if (breadcrumbs.length > 0) {
      const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
      setCurrentLevelNodes(lastCrumb.nodes);
      setBreadcrumbs(breadcrumbs.slice(0, -1));
    } else {
      setModalVisible(false);
      setCurrentLevelNodes([]);
    }
  };

  const handleOpenModal = () => {
    setModalVisible(true);
    if (categoryTree.length > 0) {
      setCurrentLevelNodes(categoryTree);
    }
  };

  return (
    <View className="mb-4">
      <AppText className="mb-2 text-gray-700 font-medium">Category</AppText>
      
      <Pressable
        onPress={handleOpenModal}
        className={`bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl p-4 flex-row justify-between items-center`}
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? '#F3F4F6' : '#F9FAFB',
          },
        ]}
      >
        <View className="flex-row items-center gap-3 flex-1">
          {selectedCategory?.icon && (
            <AppText className="text-xl">{selectedCategory.icon}</AppText>
          )}
          <AppText className={`flex-1 ${selectedCategory ? 'text-gray-900' : 'text-gray-400'}`}>
            {selectedCategory ? selectedCategory.name : 'Select Category'}
          </AppText>
        </View>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>
      
      {error && <AppText className="text-red-500 text-xs mt-1">{error}</AppText>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="p-4 border-b border-gray-100 flex-row items-center">
            <Pressable onPress={handleBack} className="mr-4" style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Ionicons name={breadcrumbs.length > 0 ? "arrow-back" : "close"} size={24} color="#000" />
            </Pressable>
            <AppText variant="subheading" weight="bold">
              {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Select Category'}
            </AppText>
          </View>

          {loading && categoryTree.length === 0 ? (
           <View className="flex-1 justify-center items-center">
             <ActivityIndicator size="large" color="#cb234a" />
             <AppText className="mt-2 text-gray-500">Loading categories...</AppText>
           </View>
          ) : currentLevelNodes.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <AppText className="text-gray-500">No categories available</AppText>
            </View>
          ) : (
            <ScrollView className="flex-1">
              {currentLevelNodes.map((node) => (
                <Pressable
                  key={node.id}
                  onPress={() => handleSelect(node)}
                  className="p-4 border-b border-gray-50 flex-row items-center justify-between"
                  style={({ pressed }) => [
                    {
                      backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
                    },
                  ]}
                >
                  <View className="flex-row items-center gap-3">
                    <AppText className="text-xl">{node.icon || '📦'}</AppText>
                    <AppText className="text-base text-gray-900">{node.name}</AppText>
                  </View>
                  {node.children && node.children.length > 0 ? (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  ) : (
                    selectedCategorySlug === node.slug && (
                      <Ionicons name="checkmark" size={20} color="#cb234a" />
                    )
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
