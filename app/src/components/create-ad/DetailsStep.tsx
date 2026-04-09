import React from 'react';
import { View, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import AppText from '../ui/AppText';
import AdImagePicker from './AdImagePicker';
import DynamicFormFields from './DynamicFormFields';
import { CustomFieldConfig } from '@/data/categoriesData';

interface DetailsStepProps {
  formData: any;
  errors: any;
  images: string[];
  dynamicFields: CustomFieldConfig[] | string[];
  onInputChange: (field: string, value: any) => void;
  onImagesChange: (images: string[]) => void;
  onOpenMapPicker: () => void;
}

export default function DetailsStep({
  formData,
  errors,
  images,
  dynamicFields,
  onInputChange,
  onImagesChange,
  onOpenMapPicker,
}: DetailsStepProps) {
  return (
    <View className="pb-20">

      {/* Dynamic Fields */}
      <DynamicFormFields
        formData={formData}
        customFields={dynamicFields}
        onInputChange={onInputChange}
      />

      {/* Price Section */}
      <View className="mb-6">
        <View className="mb-6">
          <AppText className="mb-2 text-gray-700 font-medium">Price (XOF)</AppText>
          <Input
            placeholder={formData.contactForPrice ? "Contact for Price" : "0"}
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(value) => onInputChange('price', value)}
            error={!!errors.price}
            editable={!formData.contactForPrice}
            className={formData.contactForPrice ? "bg-gray-100 text-gray-400" : ""}
          />
          {errors.price && <AppText className="text-red-500 text-xs mt-1 ml-2">{errors.price}</AppText>}
        </View>

        {/* Price Toggles */}
        <View className="bg-gray-50 rounded-3xl p-5 space-y-5 border border-gray-100">
          <View className="flex-row justify-between items-center">
            <View>
              <AppText className="text-gray-900 font-medium text-base">Contact for price</AppText>
              <AppText className="text-gray-500 text-xs mt-0.5">Hide price from listing</AppText>
            </View>
            <Switch
              value={formData.contactForPrice}
              onValueChange={(val) => {
                onInputChange('contactForPrice', val);
                if (val) onInputChange('price', '');
              }}
              trackColor={{ false: "#e2e8f0", true: "#FF4F18" }}
            />
          </View>

          {!formData.contactForPrice && (
            <View className="flex-row justify-between items-center pt-5 border-t border-gray-200">
              <View>
                <AppText className="text-gray-900 font-medium text-base">Negotiable</AppText>
                <AppText className="text-gray-500 text-xs mt-0.5">Open to offers</AppText>
              </View>
              <Switch
                value={formData.isNegotiable}
                onValueChange={(val) => onInputChange('isNegotiable', val)}
                trackColor={{ false: "#e2e8f0", true: "#FF4F18" }}
              />
            </View>
          )}
        </View>
      </View>

      {/* Location */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-2">
          <AppText className="text-gray-700 font-medium">Location</AppText>
          <TouchableOpacity 
            onPress={onOpenMapPicker}
            className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full"
          >
            <Ionicons name="map-outline" size={14} color="#FF4F18" />
            <AppText weight="bold" className="text-primary text-[10px] ml-1 uppercase">Pick on Map</AppText>
          </TouchableOpacity>
        </View>
        <Input
          placeholder="e.g. Niamey, Plateau"
          value={formData.location}
          onChangeText={(value) => onInputChange('location', value)}
          error={!!errors.location}
          rightIcon={
            formData.latitude && formData.longitude ? (
              <Ionicons name="location" size={20} color="#FF4F18" />
            ) : undefined
          }
        />
        {formData.latitude && formData.longitude && (
          <AppText className="text-[10px] text-gray-400 mt-1 ml-2 font-medium italic">
            Coordinates saved: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
          </AppText>
        )}
        {errors.location && <AppText className="text-red-500 text-xs mt-1 ml-2">{errors.location}</AppText>}
      </View>

      {/* Description */}
      <View className="mb-8">
        <AppText className="mb-2 text-gray-700 font-medium">Description</AppText>
        <TextArea
          placeholder="Describe your item in detail—condition, features, reason for selling..."
          value={formData.description}
          onChangeText={(value) => onInputChange('description', value)}
          error={!!errors.description}
          className="h-40 rounded-3xl leading-6"
        />
        {errors.description && <AppText className="text-red-500 text-xs mt-1 ml-2">{errors.description}</AppText>}
      </View>

      {/* Images (Bottom) - Standout Section */}
      <View className="bg-primary-50/50 border-2 border-dashed border-primary-200 rounded-[32px] p-6 mb-10">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
            <Ionicons name="images" size={20} color="#FF4F18" />
          </View>
          <View>
            <AppText variant="heading" className="text-lg text-gray-900">Photos ({images.length}/10)</AppText>
            <AppText className="text-gray-500 text-xs">Add up to 10 photos</AppText>
          </View>
        </View>

        <AdImagePicker
          images={images}
          onImagesChange={onImagesChange}
          maxImages={10}
        />
      </View>

    </View>
  );
}
