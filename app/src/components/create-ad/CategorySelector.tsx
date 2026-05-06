import React, { useState, useEffect } from 'react';
import { View, Pressable, Modal, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { categoryTree, categories, getCategoryBySlug, loading } = useCategories();

  const [currentLevelNodes, setCurrentLevelNodes] = useState<CategoryTree[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string, nodes: CategoryTree[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (modalVisible && categoryTree.length > 0 && currentLevelNodes.length === 0) {
      setCurrentLevelNodes(categoryTree);
    }
  }, [modalVisible, categoryTree]);

  const selectedCategory = selectedCategorySlug ? getCategoryBySlug(selectedCategorySlug) : null;

  // Filter categories based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, categories]);

  const handleSelect = (node: CategoryTree | Category) => {
    // If it's a tree node and has children, navigate down (ONLY if not searching)
    const isTreeNode = (n: any): n is CategoryTree => 'children' in n;

    if (!searchQuery && isTreeNode(node) && node.children && node.children.length > 0) {
      setBreadcrumbs([...breadcrumbs, { name: node.name, nodes: currentLevelNodes }]);
      setCurrentLevelNodes(node.children);
    } else {
      // It's a leaf node or we are searching -> select it
      onSelectCategory(node as Category);
      setModalVisible(false);
      setBreadcrumbs([]);
      setCurrentLevelNodes([]);
      setSearchQuery('');
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
      setSearchQuery('');
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
        className={`bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-2xl p-4 flex-row justify-between items-center`}
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
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center mb-4">
              <Pressable onPress={handleBack} className="mr-4" style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
                <Ionicons name={breadcrumbs.length > 0 && !searchQuery ? "arrow-back" : "close"} size={24} color="#000" />
              </Pressable>
              <AppText variant="subheading" weight="bold">
                {searchQuery ? 'Search Categories' : (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Select Category')}
              </AppText>
            </View>

            <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-base text-gray-900"
                placeholder="Search categories..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
          </View>

          {loading && categoryTree.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#FF4F18" />
              <AppText className="mt-2 text-gray-500">Loading categories...</AppText>
            </View>
          ) : (
            <ScrollView className="flex-1">
              {searchQuery ? (
                filteredCategories.length === 0 ? (
                  <View className="flex-1 justify-center items-center py-10">
                    <AppText className="text-gray-500">No categories found matching "{searchQuery}"</AppText>
                  </View>
                ) : (
                  filteredCategories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => handleSelect(cat)}
                      className="p-4 border-b border-gray-50 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-3">
                        <AppText className="text-xl">{cat.icon || '📦'}</AppText>
                        <View>
                          <AppText className="text-base text-gray-900 font-medium">{cat.name}</AppText>
                        </View>
                      </View>
                      {selectedCategorySlug === cat.slug && (
                        <Ionicons name="checkmark" size={20} color="#FF4F18" />
                      )}
                    </Pressable>
                  ))
                )
              ) : (
                currentLevelNodes.length === 0 ? (
                  <View className="flex-1 justify-center items-center py-10">
                    <AppText className="text-gray-500">No categories available</AppText>
                  </View>
                ) : (
                  currentLevelNodes.map((node) => (
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
                          <Ionicons name="checkmark" size={20} color="#FF4F18" />
                        )
                      )}
                    </Pressable>
                  ))
                )
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
