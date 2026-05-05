import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';

interface AdMapProps {
  latitude: number | string;
  longitude: number | string;
  title: string;
  locationName?: string;
}

export default function AdMap({ latitude, longitude, title, locationName }: AdMapProps) {
  return (
    <View className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100 shadow-sm mx-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <AppText variant="heading" className="text-xl text-gray-900">Location</AppText>
          {locationName && (
            <AppText className="text-gray-500 text-xs mt-0.5">
              {locationName}
            </AppText>
          )}
        </View>
        <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
            <Ionicons name="map-outline" size={20} color="#FF4F18" />
        </View>
      </View>

      <View className="rounded-[24px] overflow-hidden border border-gray-100 h-48 bg-gray-100 items-center justify-center">
        <AppText className="text-gray-500">Map view is not available on web.</AppText>
      </View>
    </View>
  );
}
