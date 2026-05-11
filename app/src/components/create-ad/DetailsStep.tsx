import React from 'react';
import { View, Switch, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import AdImagePicker from './AdImagePicker';
import DynamicFormFields from './DynamicFormFields';
import LocationSelector from '../ads/LocationSelector';
import FormGroup from '../ui/FormGroup';

interface DetailsStepProps {
  formData: any;
  errors: any;
  images: string[];
  dynamicFields: any[];
  onInputChange: (name: string, value: any) => void;
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
  onOpenMapPicker
}: DetailsStepProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1">
      {/* Images — moved to top: photos sell, encourage upload first */}
      <View className="bg-primary-50/50 border-2 border-dashed border-primary-200 rounded-[32px] p-6 mb-6">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
            <Ionicons name="images" size={20} color="#FF4F18" />
          </View>
          <View>
            <AppText variant="heading" className="text-lg text-gray-900">{t('create_ad.actions.addPhotos')} ({images.length}/10)</AppText>
            <AppText className="text-gray-500 text-xs">{t('create_ad.actions.addPhotos')}</AppText>
          </View>
        </View>

        <AdImagePicker
          images={images}
          onImagesChange={onImagesChange}
          maxImages={10}
        />
      </View>

      {/* Category-specific dynamic fields (Brand, Model, Year, etc.) */}
      {dynamicFields && dynamicFields.length > 0 && (
        <DynamicFormFields
          formData={formData}
          customFields={dynamicFields}
          onInputChange={onInputChange}
        />
      )}

      {/* Price Section */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-2">
          <AppText className="text-gray-700 font-medium">{t('create_ad.fields.price')}</AppText>
          {formData.isNegotiable && !formData.contactForPrice && (
            <View className="bg-primary/10 px-2 py-0.5 rounded-md">
              <AppText className="text-primary text-[10px] font-bold uppercase">{t('create_ad.fields.negotiable')}</AppText>
            </View>
          )}
        </View>

        <View className="mb-4">
          <Input
            placeholder={t('create_ad.fields.pricePlaceholder')}
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
              <AppText className="text-gray-900 font-medium text-base">{t('create_ad.fields.contactForPrice')}</AppText>
              <AppText className="text-gray-500 text-xs mt-0.5">{t('create_ad.fields.contactForPrice')}</AppText>
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
                <AppText className="text-gray-900 font-medium text-base">{t('create_ad.fields.negotiable')}</AppText>
                <AppText className="text-gray-500 text-xs mt-0.5">{t('create_ad.fields.negotiable')}</AppText>
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
      <LocationSelector
        locationName={formData.location}
        countryName={formData.country_name}
        onPress={onOpenMapPicker}
        error={errors.location}
      />

      {/* Description */}
      <FormGroup label={t('create_ad.fields.description')} error={errors.description}>
        <TextArea
          placeholder={t('create_ad.fields.descriptionPlaceholder')}
          value={formData.description}
          onChangeText={(value) => onInputChange('description', value)}
          error={!!errors.description}
          className="h-40 rounded-3xl leading-6"
        />
      </FormGroup>
    </View>
  );
}
