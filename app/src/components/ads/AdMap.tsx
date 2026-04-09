import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';

interface AdMapProps {
  latitude: number;
  longitude: number;
  title: string;
  locationName?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdMap({ latitude, longitude, title, locationName }: AdMapProps) {
  const region = {
    latitude: typeof latitude === 'string' ? parseFloat(latitude) : latitude,
    longitude: typeof longitude === 'string' ? parseFloat(longitude) : longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100 shadow-sm mx-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <AppText variant="heading" className="text-xl text-gray-900">Location</AppText>
          {locationName && (
            <AppText className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
              {locationName}
            </AppText>
          )}
        </View>
        <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
            <Ionicons name="map-outline" size={20} color="#FF4F18" />
        </View>
      </View>

      <View className="rounded-[24px] overflow-hidden border border-gray-100 h-48">
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker coordinate={region}>
            <View className="w-8 h-8 bg-primary rounded-full border-2 border-white items-center justify-center shadow-lg">
                <Ionicons name="pin" size={14} color="white" />
            </View>
          </Marker>
        </MapView>
      </View>
    </View>
  );
}
