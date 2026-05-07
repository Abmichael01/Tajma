import React from 'react';
import { View, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../ui/AppText';
import ImageViewer from '../ui/ImageViewer';
import { useState } from 'react';

interface AdImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function AdImagePicker({
  images = [],
  onImagesChange,
  maxImages = 10,
}: AdImagePickerProps) {
  const { t } = useTranslation();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [initialViewerIndex, setInitialViewerIndex] = useState(0);

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert(t('create_ad.images.limitReached'), t('create_ad.images.limitReachedDesc', { max: maxImages }));
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('create_ad.images.permissionRequired'), t('create_ad.images.permissionDesc'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const remainingSlots = maxImages - images.length;
        const selectedAssets = result.assets.slice(0, remainingSlots);

        const newUris: string[] = [];

        for (const asset of selectedAssets) {
          // Check file size (5MB = 5 * 1024 * 1024 bytes)
          const info = await FileSystem.getInfoAsync(asset.uri);
          const size = info.exists ? info.size : 0;
          if (size > 5 * 1024 * 1024) {
            Alert.alert(t('create_ad.images.fileTooLarge'), t('create_ad.images.fileTooLargeDesc'));
            continue;
          }
          newUris.push(asset.uri);
        }

        if (newUris.length > 0) {
          onImagesChange([...images, ...newUris]);
        }

        if (result.assets.length > remainingSlots) {
          Alert.alert(t('create_ad.images.limitReached'), t('create_ad.images.onlyFirstAdded', { count: remainingSlots }));
        }
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('create_ad.images.failedToPick'));
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <View className="mb-2">

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
        <View className="flex-row gap-3">
          {/* Add Button */}
          {images.length < maxImages && (
            <TouchableOpacity
              onPress={pickImage}
              className="w-28 h-28 bg-gray-50 rounded-2xl items-center justify-center border-2 border-dashed border-gray-200 active:bg-gray-100"
            >
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-2">
                <Ionicons name="camera" size={20} color="#0f172b" />
              </View>
              <AppText className="text-gray-500 text-xs font-medium">{t('create_ad.images.addPhoto')}</AppText>
            </TouchableOpacity>
          )}

          {/* Image List */}
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} className="relative">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setInitialViewerIndex(index);
                  setViewerVisible(true);
                }}
              >
                <Image
                  source={{ uri }}
                  className="w-28 h-28 rounded-2xl bg-gray-100 border border-gray-100"
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-sm border border-gray-100"
              >
                <Ionicons name="close" size={14} color="#EF4444" />
              </TouchableOpacity>
              {index === 0 && (
                <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md">
                  <AppText className="text-white text-[10px] font-bold">{t('create_ad.images.cover')}</AppText>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <ImageViewer
        images={images}
        initialIndex={initialViewerIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        title="Preview Photos"
      />
    </View>
  );
}
