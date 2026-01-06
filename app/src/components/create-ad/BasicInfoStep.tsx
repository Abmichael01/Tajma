import React from 'react';
import { View } from 'react-native';
import Input from '../ui/Input';
import CategorySelector from './CategorySelector';
import { Category } from '@/types/category';

interface BasicInfoStepProps {
  formData: any;
  errors: any;
  onInputChange: (field: string, value: any) => void;
  onCategorySelect: (category: Category) => void;
}

export default function BasicInfoStep({
  formData,
  errors,
  onInputChange,
  onCategorySelect,
}: BasicInfoStepProps) {
  return (
    <View className="space-y-4">
      <CategorySelector
        selectedCategorySlug={formData.category}
        onSelectCategory={onCategorySelect}
        error={errors.category}
      />

      <Input
        placeholder="e.g., iPhone 14 Pro Max 256GB"
        value={formData.title}
        onChangeText={(value) => onInputChange('title', value)}
        error={!!errors.title}
        maxLength={100}
      />
    </View>
  );
}
