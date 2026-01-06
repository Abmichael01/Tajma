import React from 'react';
import { View } from 'react-native';
import Input from '../ui/Input';
import AdImagePicker from './AdImagePicker';

interface DetailsStepProps {
  formData: any;
  errors: any;
  images: string[];
  dynamicFields: any[];
  onInputChange: (field: string, value: any) => void;
  onImagesChange: (images: string[]) => void;
}

export default function DetailsStep({
  formData,
  errors,
  images,
  dynamicFields,
  onInputChange,
  onImagesChange,
}: DetailsStepProps) {
  return (
    <View className="space-y-4">
      <AdImage Picker 
        images={images} 
        onImagesChange={onImagesChange} 
        maxImages={10} 
      />

      <Input
        placeholder="Price in XOF"
        keyboardType="numeric"
        value={formData.price}
        onChangeText={(value) => onInputChange('price', value)}
        error={!!errors.price}
      />

      <Input
        placeholder="Location (City, Neighborhood)"
        value={formData.location}
        onChangeText={(value) => onInputChange('location', value)}
        error={!!errors.location}
      />

      {/* Dynamic Fields */}
      {dynamicFields.map((field: any) => (
        <Input
          key={field.name}
          placeholder={field.placeholder || field.label}
          value={formData[field.name]}
          onChangeText={(value) => onInputChange(field.name, value)}
          keyboardType={field.type === 'number' ? 'numeric' : 'default'}
        />
      ))}

      <Input
        placeholder="Describe your item in detail..."
        multiline
        numberOfLines={6}
        value={formData.description}
        onChangeText={(value) => onInputChange('description', value)}
        error={!!errors.description}
        className="h-40 pt-3"
        textAlignVertical="top"
      />
    </View>
  );
}
