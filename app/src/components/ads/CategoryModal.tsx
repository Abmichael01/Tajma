import React, { useState, useMemo } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/ui/AppText';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/types/category';

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
    parentId = null
}: CategoryModalProps) {
    const { categories, rootCategories, loading } = useCategories();
    const [searchQuery, setSearchQuery] = useState('');

    const displayedCategories = useMemo(() => {
        if (searchQuery) {
            return categories.filter(cat =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (parentId) {
            return categories.filter(cat => cat.parentId === parentId);
        }

        return rootCategories;
    }, [categories, rootCategories, searchQuery, parentId]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/60 justify-end">
                <Pressable className="flex-1" onPress={onClose} />

                <View className="bg-white rounded-t-[40px] h-[80%]" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 }}>
                    {/* Handle bar for visual sheet effect */}
                    <View className="items-center pt-3 pb-1">
                        <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="px-6 pt-4 pb-4 flex-row items-center justify-between border-b border-gray-100">
                        <View>
                            <AppText variant="subheading" weight="bold" className="text-2xl text-gray-900">
                                {parentId ? 'Select Subcategory' : 'Select Category'}
                            </AppText>
                            <AppText className="text-gray-500 text-xs text-secondary">
                                {parentId ? 'Refine your search' : 'What are you looking for?'}
                            </AppText>
                        </View>
                        <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                            <Ionicons name="close" size={24} color="#2D2D2D" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View className="px-6 py-5">
                        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-[20px] px-5 py-3.5">
                            <Ionicons name="search-outline" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                            <TextInput
                                className="flex-1 text-base text-gray-900 py-1"
                                placeholder="Search categories..."
                                placeholderTextColor="#9ca3af"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* Categories List */}
                    <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                        {!parentId && !searchQuery && (
                            <TouchableOpacity
                                className={`flex-row items-center justify-between py-5 mb-2 rounded-2xl ${!selectedCategoryId ? 'bg-primary/5 px-4 border border-primary/20' : ''}`}
                                onPress={() => {
                                    onSelect(null);
                                    onClose();
                                }}
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${!selectedCategoryId ? 'bg-primary' : 'bg-gray-100'}`}>
                                        <Ionicons name="grid-outline" size={24} color={!selectedCategoryId ? 'white' : '#2D2D2D'} />
                                    </View>
                                    <View>
                                        <AppText weight="bold" className={`text-lg ${!selectedCategoryId ? 'text-primary' : 'text-gray-900'}`}>All Categories</AppText>
                                        <AppText className="text-gray-500 text-xs mt-0.5">Browse everything</AppText>
                                    </View>
                                </View>
                                {!selectedCategoryId && (
                                    <Ionicons name="checkmark-circle" size={24} color="#FF4F18" />
                                )}
                            </TouchableOpacity>
                        )}

                        <View className="h-4" />
                        <AppText weight="bold" className="text-gray-400 text-[10px] tracking-widest mb-3 px-1 uppercase">
                            {searchQuery ? 'Search Results' : (parentId ? 'Subcategories' : 'Main Categories')}
                        </AppText>

                        {loading ? (
                            <View className="py-20 items-center">
                                <ActivityIndicator size="large" color="#FF4F18" />
                                <AppText className="text-gray-400 mt-4">Loading categories...</AppText>
                            </View>
                        ) : (
                            displayedCategories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    className={`flex-row items-center justify-between py-5 mb-2 rounded-2xl ${selectedCategoryId === category.id ? 'bg-primary/5 px-4 border border-primary/20' : ''}`}
                                    onPress={() => {
                                        onSelect(category);
                                        onClose();
                                    }}
                                >
                                    <View className="flex-row items-center gap-4">
                                        <View
                                            className={`w-12 h-12 rounded-2xl items-center justify-center ${selectedCategoryId === category.id ? 'bg-primary' : 'bg-primary/10'}`}
                                        >
                                            {category.icon ? (
                                                <Ionicons name={category.icon as any} size={24} color={selectedCategoryId === category.id ? 'white' : '#FF4F18'} />
                                            ) : (
                                                <Ionicons name="apps-outline" size={24} color={selectedCategoryId === category.id ? 'white' : '#FF4F18'} />
                                            )}
                                        </View>
                                        <View>
                                            <AppText weight="bold" className={`text-lg ${selectedCategoryId === category.id ? 'text-primary' : 'text-gray-900'}`}>{category.name}</AppText>
                                            <AppText className="text-gray-500 text-xs mt-0.5">{category.adsCount || 0} listings</AppText>
                                        </View>
                                    </View>
                                    {selectedCategoryId === category.id && (
                                        <Ionicons name="checkmark-circle" size={24} color="#FF4F18" />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}

                        {!loading && displayedCategories.length === 0 && (
                            <View className="py-20 items-center">
                                <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="search-outline" size={32} color="#cbd5e1" />
                                </View>
                                <AppText weight="bold" className="text-gray-400 text-lg">No categories found</AppText>
                                <AppText className="text-gray-400 text-center px-10 mt-1">
                                    We couldn't find matches for "{searchQuery}"
                                </AppText>
                            </View>
                        )}
                        <View className="h-20" />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
