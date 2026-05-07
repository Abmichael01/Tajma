import React from 'react';
import { View, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';

interface AdMapProps {
  latitude: number;
  longitude: number;
  title: string;
  locationName?: string;
}

export default function AdMap({ latitude, longitude, title, locationName }: AdMapProps) {
  const openInMaps = () => {
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = title;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100 shadow-sm mx-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 mr-4">
          <AppText variant="heading" className="text-xl text-gray-900">Location</AppText>
          {locationName && (
            <AppText className="text-gray-500 text-xs mt-0.5" numberOfLines={2}>
              {locationName}
            </AppText>
          )}
        </View>
        <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
          <Ionicons name="location" size={24} color="#FF4F18" />
        </View>
      </View>

      <TouchableOpacity 
        onPress={openInMaps}
        activeOpacity={0.8}
        className="bg-gray-50 rounded-[24px] border border-gray-100 p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
            <Ionicons name="map-outline" size={20} color="#0f172b" />
          </View>
          <View className="ml-3">
            <AppText weight="bold" className="text-gray-900">View on Map</AppText>
            <AppText className="text-gray-500 text-[10px]">Open in your favorite map app</AppText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </TouchableOpacity>
    </View>
  );
}
