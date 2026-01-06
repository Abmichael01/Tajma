import React from 'react';
import { View, Image, ScrollView } from 'react-native';
import AppText from '../ui/AppText';

interface ReviewStepProps {
  formData: any;
  images: string[];
  selectedCategory: any;
  dynamicFields: any[];
}

export default function ReviewStep({
  formData,
  images,
  selectedCategory,
  dynamicFields,
}: ReviewStepProps) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="space-y-4">
        <View>
          <AppText variant="subheading" weight="bold" className="mb-1">
            Review Your Listing
          </AppText>
          <AppText className="text-sm text-gray-600">
            Please review all details before publishing
          </AppText>
        </View>

        {/* Images Preview */}
        {images.length > 0 && (
          <View>
            <AppText weight="bold" className="mb-2">Photos ({images.length})</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  className="w-24 h-24 rounded-lg"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category */}
        <View>
          <AppText className="text-sm text-gray-500">Category</AppText>
          <AppText weight="semibold" className="text-base mt-1">
            {selectedCategory?.name || formData.category}
          </AppText>
        </View>

        {/* Title */}
        <View>
          <AppText className="text-sm text-gray-500">Title</AppText>
          <AppText weight="semibold" className="text-base mt-1">
            {formData.title}
          </AppText>
        </View>

        {/* Price */}
        {formData.price && (
          <View>
            <AppText className="text-sm text-gray-500">Price</AppText>
            <AppText weight="semibold" className="text-base mt-1">
              {formData.price} XOF
            </AppText>
          </View>
        )}

        {/* Location */}
        <View>
          <AppText className="text-sm text-gray-500">Location</AppText>
          <AppText weight="semibold" className="text-base mt-1">
            {formData.location}
          </AppText>
        </View>

        {/* Dynamic Fields */}
        {dynamicFields.length > 0 && dynamicFields.map((field: any) => {
          const value = formData[field.name];
          if (!value) return null;
          return (
            <View key={field.name}>
              <AppText className="text-sm text-gray-500">{field.label}</AppText>
              <AppText weight="semibold" className="text-base mt-1">
                {value}
              </AppText>
            </View>
          );
        })}

        {/* Description */}
        <View>
          <AppText className="text-sm text-gray-500">Description</AppText>
          <AppText className="text-base mt-1">
            {formData.description}
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}
