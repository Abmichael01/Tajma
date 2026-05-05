import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/ui/AppText';
import { cn } from '@/utils/cn';

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  isActive: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
}

export default function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  const allChip = chips.find(c => c.id === 'all');
  const otherChips = chips.filter(c => c.id !== 'all');
  const hasActiveFilters = chips.some(c => c.id !== 'all' && c.isActive);

  return (
    <View className="py-4 border-b border-gray-100 bg-white">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
        className="flex-row"
      >
        {/* Main Filter Icon Chip */}
        {allChip && (
          <TouchableOpacity
            onPress={allChip.onPress}
            className={cn(
              "flex-row items-center justify-center border rounded-full h-10 px-4",
              allChip.isActive 
                ? "bg-primary border-primary" 
                : "bg-gray-50 border-gray-200"
            )}
          >
            <Ionicons 
              name={allChip.icon || "options-outline"} 
              size={18} 
              color={allChip.isActive ? 'white' : '#2D2D2D'} 
            />
            <AppText weight="bold" className={cn("ml-2 text-[14px]", allChip.isActive ? "text-white" : "text-gray-900")}>
              {allChip.label}
            </AppText>
          </TouchableOpacity>
        )}

        {otherChips.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            onPress={chip.onPress}
            className={cn(
              "flex-row items-center justify-center border rounded-full h-10 px-5",
              chip.isActive 
                ? "bg-primary border-primary" 
                : "bg-white border-gray-200"
            )}
          >
            {chip.icon && (
              <Ionicons 
                name={chip.icon} 
                size={16} 
                color={chip.isActive ? 'white' : '#FF4F18'} 
                style={{ marginRight: 6 }}
              />
            )}
            <AppText
              weight="bold"
              className={cn("text-[14px]", chip.isActive ? "text-white" : "text-gray-700")}
            >
              {chip.label}
            </AppText>
            {chip.isActive && (
              <View className="ml-2 w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            )}
          </TouchableOpacity>
        ))}

        {hasActiveFilters && onClearAll && (
          <TouchableOpacity
            onPress={onClearAll}
            className="flex-row items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-full h-10 px-5"
          >
            <Ionicons name="close-circle-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
            <AppText weight="bold" className="text-red-500 text-[14px]">Clear</AppText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
