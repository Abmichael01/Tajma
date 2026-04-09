import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import BottomSheet, { BottomSheetRef } from '../ui/BottomSheet';
import Button from '../ui/Button';

interface AdLocationPickerProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
    location_name?: string;
  };
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    location_name: string;
  }) => void;
  onClose: () => void;
}

export interface AdLocationPickerRef {
  present: () => void;
  dismiss: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AdLocationPicker = forwardRef<AdLocationPickerRef, AdLocationPickerProps>(
  ({ initialLocation, onLocationSelected, onClose }, ref) => {
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState<Region>({
      latitude: initialLocation?.latitude || 12.6392, // Default to Bamako
      longitude: initialLocation?.longitude || -8.0029,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

    const [markerPosition, setMarkerPosition] = useState({
      latitude: initialLocation?.latitude || 12.6392,
      longitude: initialLocation?.longitude || -8.0029,
    });

    const [locationName, setLocationName] = useState(initialLocation?.location_name || '');
    const [isLocating, setIsLocating] = useState(false);
    const [isReversing, setIsReversing] = useState(false);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    // Reverse geocode when marker moves
    const reverseGeocode = async (coords: { latitude: number, longitude: number }) => {
      setIsReversing(true);
      try {
        const results = await Location.reverseGeocodeAsync(coords);
        if (results.length > 0) {
          const item = results[0];
          const name = [item.street, item.district, item.city, item.region]
            .filter(Boolean)
            .join(', ');
          setLocationName(name || 'Unknown Location');
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      } finally {
        setIsReversing(false);
      }
    };

    const handleGetCurrentLocation = async () => {
      setIsLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setRegion(newRegion);
        setMarkerPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        mapRef.current?.animateToRegion(newRegion, 1000);
        reverseGeocode(location.coords);
      } catch (error) {
        Alert.alert('Error', 'Could not get your current location.');
      } finally {
        setIsLocating(false);
      }
    };

    const onMapPress = (e: any) => {
      const coords = e.nativeEvent.coordinate;
      setMarkerPosition(coords);
      reverseGeocode(coords);
    };

    const handleConfirm = () => {
        if (!locationName && !isReversing) {
            // If we don't have a name yet, try one last time or use coordinates
            onLocationSelected({
                ...markerPosition,
                location_name: locationName || `${markerPosition.latitude.toFixed(4)}, ${markerPosition.longitude.toFixed(4)}`
            });
        } else {
            onLocationSelected({
                ...markerPosition,
                location_name: locationName
            });
        }
        bottomSheetRef.current?.dismiss();
    };

    return (
      <BottomSheet
        ref={bottomSheetRef}
        title="Pin Your Location"
        onClose={onClose}
        snapPoints={['90%']}
        scrollable={false}
        footer={
          <Button
            onPress={handleConfirm}
            disabled={isReversing}
            className="w-full"
          >
            Confirm Location
          </Button>
        }
      >
        <View className="flex-1 relative">
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            onPress={onMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={markerPosition}
              draggable
              onDragEnd={(e) => {
                setMarkerPosition(e.nativeEvent.coordinate);
                reverseGeocode(e.nativeEvent.coordinate);
              }}
            >
                <View className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center p-2">
                    <View className="w-8 h-8 bg-primary rounded-full border-2 border-white items-center justify-center shadow-lg">
                        <Ionicons name="pin" size={16} color="white" />
                    </View>
                </View>
            </Marker>
          </MapView>

          {/* Map Overlay Controls */}
          <View className="absolute top-4 left-4 right-4 gap-3">
            <View className="bg-white/90 backdrop-blur-md rounded-2xl p-4 flex-row items-center shadow-sm border border-gray-100">
              <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                <Ionicons name="location" size={20} color="#FF4F18" />
              </View>
              <View className="flex-1">
                <AppText weight="bold" className="text-gray-900 text-sm" numberOfLines={1}>
                  {isReversing ? 'Locating...' : (locationName || 'Tap anywhere on map')}
                </AppText>
                <AppText className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                  {isReversing ? 'Updating address' : 'Current Pin Location'}
                </AppText>
              </View>
              {isReversing && <ActivityIndicator size="small" color="#FF4F18" />}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleGetCurrentLocation}
            className="absolute bottom-10 right-6 w-14 h-14 bg-white rounded-full items-center justify-center shadow-lg border border-gray-100"
          >
            {isLocating ? (
              <ActivityIndicator color="#FF4F18" />
            ) : (
              <Ionicons name="locate" size={28} color="#FF4F18" />
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7, // Adjust based on bottom sheet height
    flex: 1,
  },
});

export default AdLocationPicker;
