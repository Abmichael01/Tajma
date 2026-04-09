import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/ui/AppText';
import { Region } from '@/hooks/useRegions';
import { Category } from '@/types/category';
import RegionModal from './RegionModal';
import CategoryModal from './CategoryModal';
import BottomSheet, { BottomSheetRef } from '@/components/ui/BottomSheet';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters: FilterState;
    mode?: 'all' | 'price';
}

export interface FilterState {
    region: Region | null;
    category: Category | null;
    minPrice: string;
    maxPrice: string;
    condition: string[];
}

const CONDITIONS = [
    { label: 'Brand New', value: 'brand-new' },
    { label: 'Foreign Used', value: 'foreign-used' },
    { label: 'Open Box', value: 'open-box' },
    { label: 'Refurbished', value: 'refurbished' },
];

export default function FilterModal({ visible, onClose, onApply, initialFilters, mode = 'all' }: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [isRegionModalVisible, setIsRegionModalVisible] = useState(false);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const bottomSheetRef = useRef<BottomSheetRef>(null);

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
            ? current.filter(v => v !== value)
            : [...current, value];
        setFilters({ ...filters, condition: next });
    };

    const clearAll = () => {
        setFilters({
            region: null,
            category: null,
            minPrice: '',
            maxPrice: '',
            condition: [],
        });
    };

    return (
        <>
            <BottomSheet
                ref={bottomSheetRef}
                title={mode === 'price' ? 'Price Range' : 'Filters'}
                onClose={onClose}
                snapPoints={mode === 'price' ? ['40%'] : ['85%']}
                headerLeft={
                    <TouchableOpacity onPress={clearAll} className="px-2">
                        <AppText weight="bold" className="text-gray-500 text-sm">Clear</AppText>
                    </TouchableOpacity>
                }
                headerRight={
                    <TouchableOpacity onPress={handleApply} className="px-2">
                        <AppText weight="bold" className="text-primary text-sm">Apply</AppText>
                    </TouchableOpacity>
                }
            >
                <View className="px-6 pt-4">
                    {mode === 'all' && (
                        <>
                            {/* Region Section */}
                            <View className="mb-6">
                                <AppText weight="bold" className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase">Location</AppText>
                                <TouchableOpacity
                                    onPress={() => setIsRegionModalVisible(true)}
                                    className="flex-row items-center justify-between bg-gray-50 border border-gray-100 rounded-full p-4"
                                >
                                    <View className="flex-row items-center gap-3">
                                        <Ionicons name="location-outline" size={20} color="#FF4F18" />
                                        <AppText weight="bold" className={filters.region ? "text-gray-900" : "text-gray-400"}>
                                            {filters.region?.name || "All Regions"}
                                        </AppText>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>

                            {/* Category Section */}
                            <View className="mb-6">
                                <AppText weight="bold" className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase">Category</AppText>
                                <TouchableOpacity
                                    onPress={() => setIsCategoryModalVisible(true)}
                                    className="flex-row items-center justify-between bg-gray-50 border border-gray-100 rounded-full p-4"
                                >
                                    <View className="flex-row items-center gap-3">
                                        <Ionicons name="grid-outline" size={20} color="#FF4F18" />
                                        <AppText weight="bold" className={filters.category ? "text-gray-900" : "text-gray-400"}>
                                            {filters.category?.name || "All Categories"}
                                        </AppText>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* Price Section */}
                    <View className="mb-6">
                        <AppText weight="bold" className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase">Price Range (Fr)</AppText>
                        <View className="flex-row gap-4">
                            <View className="flex-1 bg-gray-50 border border-gray-100 rounded-full p-3 px-5">
                                <AppText className="text-[10px] text-gray-400 mb-1">Min</AppText>
                                <TextInput
                                    className="text-gray-900 font-bold p-0"
                                    placeholder="Min"
                                    keyboardType="numeric"
                                    value={filters.minPrice}
                                    onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                                />
                            </View>
                            <View className="flex-1 bg-gray-50 border border-gray-100 rounded-full p-3 px-5">
                                <AppText className="text-[10px] text-gray-400 mb-1">Max</AppText>
                                <TextInput
                                    className="text-gray-900 font-bold p-0"
                                    placeholder="Max"
                                    keyboardType="numeric"
                                    value={filters.maxPrice}
                                    onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                                />
                            </View>
                        </View>
                    </View>

                    {mode === 'all' && (
                        <View className="mb-8">
                            <AppText weight="bold" className="text-gray-400 text-[10px] tracking-widest mb-3 uppercase">Condition</AppText>
                            <View className="flex-row flex-wrap gap-2">
                                {CONDITIONS.map((cond) => {
                                    const isSelected = filters.condition.includes(cond.value);
                                    return (
                                        <TouchableOpacity
                                            key={cond.value}
                                            onPress={() => toggleCondition(cond.value)}
                                            className={`px-6 py-3 rounded-full border ${isSelected ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-100'}`}
                                        >
                                            <AppText weight="bold" className={isSelected ? 'text-white' : 'text-gray-600'}>
                                                {cond.label}
                                            </AppText>
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
