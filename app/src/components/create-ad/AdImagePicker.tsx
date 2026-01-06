import React from 'react';
import { View, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';

interface AdImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function AdImagePicker({
  images = [],
  onImagesChange,
  maxImages = 5,
}: AdImagePickerProps) {
  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only add up to ${maxImages} images.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false, // Expo generic image picker often simpler with single selection loop for better control, or enable multiple if supported
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        onImagesChange([...images, newUri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <View className="mb-6">
      <AppText className="mb-2 text-gray-700 font-medium">
        Photos ({images.length}/{maxImages})
      </AppText>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {/* Add Button */}
          {images.length < maxImages && (
            <TouchableOpacity
              onPress={pickImage}
              className="w-24 h-24 bg-gray-100 rounded-xl items-center justify-center border border-dashed border-gray-300"
            >
              <Ionicons name="camera" size={28} color="#9CA3AF" />
              <AppText className="text-gray-400 text-xs mt-1">Add Photo</AppText>
            </TouchableOpacity>
          )}

          {/* Image List */}
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} className="relative">
              <Image
                source={{ uri }}
                className="w-24 h-24 rounded-xl bg-gray-200"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm"
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
