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
  variant?: 'default' | 'secondary';
}

export default function FilterChips({ chips, onClearAll, variant = 'default' }: FilterChipsProps) {
  const allChip = chips.find(c => c.id === 'all');
  const otherChips = chips.filter(c => c.id !== 'all');
  const hasActiveFilters = chips.some(c => c.id !== 'all' && c.isActive);

  const isSecondary = variant === 'secondary';

  return (
    <View className="py-4 border-b border-gray-100 bg-white">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        className="flex-row"
      >
        {/* Main Filter Icon Chip */}
        {allChip && (
          <TouchableOpacity
            onPress={allChip.onPress}
            className={cn(
              "flex-row items-center gap-2 px-5 py-2 rounded-full",
              allChip.isActive 
                ? isSecondary ? "bg-secondary shadow-sm shadow-secondary/20" : "bg-slate-900 shadow-sm shadow-slate-900/20" 
                : isSecondary ? "bg-white border border-secondary" : "bg-slate-50 border border-slate-100"
            )}
          >
            <Ionicons 
              name={allChip.icon || "options-outline"} 
              size={14} 
              color={allChip.isActive ? 'white' : isSecondary ? '#2D2D2D' : '#64748B'} 
            />
            <AppText weight="bold" className={cn("text-[12px]", allChip.isActive ? "text-white" : isSecondary ? "text-secondary" : "text-slate-600")}>
              {allChip.label}
            </AppText>
          </TouchableOpacity>
        )}

        {otherChips.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            onPress={chip.onPress}
            className={cn(
              "flex-row items-center gap-2 px-5 py-2 rounded-full",
              chip.isActive 
                ? isSecondary ? "bg-secondary shadow-sm shadow-secondary/20" : "bg-slate-900 shadow-sm shadow-slate-900/20" 
                : isSecondary ? "bg-white border border-secondary" : "bg-slate-50 border border-slate-100"
            )}
          >
            {chip.icon && (
              <Ionicons 
                name={chip.icon} 
                size={14} 
                color={chip.isActive ? 'white' : isSecondary ? '#2D2D2D' : '#64748B'} 
              />
            )}
            <AppText
              weight="bold"
              className={cn("text-[12px]", chip.isActive ? "text-white" : isSecondary ? "text-secondary" : "text-slate-600")}
            >
              {chip.label}
            </AppText>
            {chip.isActive && (
              <View className="ml-2 w-1 h-1 rounded-full bg-white opacity-80" />
            )}
          </TouchableOpacity>
        ))}

        {hasActiveFilters && onClearAll && (
          <TouchableOpacity
            onPress={onClearAll}
            className={cn(
              "flex-row items-center gap-2 rounded-full px-5 py-2",
              isSecondary ? "bg-white border border-secondary" : "bg-red-50 border border-red-100"
            )}
          >
            <Ionicons 
              name="close-circle-outline" 
              size={14} 
              color={isSecondary ? "#2D2D2D" : "#ef4444"} 
            />
            <AppText weight="bold" className={cn("text-[12px]", isSecondary ? "text-secondary" : "text-red-500")}>
              Clear
            </AppText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
