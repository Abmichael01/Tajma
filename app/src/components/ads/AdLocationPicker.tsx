import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import AppText from "../ui/AppText";
import BottomSheet, { BottomSheetRef } from "../ui/BottomSheet";
import Button from "../ui/Button";

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Coordinates = {
  latitude: number;
  longitude: number;
};

const DEFAULT_COORDS: Coordinates = {
  latitude: 13.5116,
  longitude: 2.1254,
};

const formatCoordinateLocation = ({ latitude, longitude }: Coordinates) =>
  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

const formatAddress = (
  address: Location.LocationGeocodedAddress,
  fallback: Coordinates,
) => {
  if (address.formattedAddress) {
    return address.formattedAddress;
  }

  const parts = [address.street, address.district, address.city, address.region]
    .filter((part): part is string => Boolean(part))
    .filter((part, index, allParts) => allParts.indexOf(part) === index);

  return parts.join(", ") || formatCoordinateLocation(fallback);
};

const isPermissionError = (error: unknown) =>
  error instanceof Error && /not authorized|permission/i.test(error.message);

const AdLocationPicker = forwardRef<AdLocationPickerRef, AdLocationPickerProps>(
  ({ initialLocation, onLocationSelected, onClose }, ref) => {
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const mapRef = useRef<MapView>(null);
    const reverseGeocodeRequestRef = useRef(0);

    const [region, setRegion] = useState<Region>({
      latitude: initialLocation?.latitude || DEFAULT_COORDS.latitude, // Default to Niamey
      longitude: initialLocation?.longitude || DEFAULT_COORDS.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

    const [markerPosition, setMarkerPosition] = useState({
      latitude: initialLocation?.latitude || DEFAULT_COORDS.latitude,
      longitude: initialLocation?.longitude || DEFAULT_COORDS.longitude,
    });

    const [locationName, setLocationName] = useState(
      initialLocation?.location_name || "",
    );
    const [isLocating, setIsLocating] = useState(false);
    const [isReversing, setIsReversing] = useState(false);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);

    useEffect(() => {
      let isMounted = true;

      Location.getForegroundPermissionsAsync()
        .then(({ status }) => {
          if (isMounted) {
            setHasLocationPermission(
              status === Location.PermissionStatus.GRANTED,
            );
          }
        })
        .catch(() => {
          if (isMounted) {
            setHasLocationPermission(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }, []);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const hasForegroundLocationPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        const isGranted = status === Location.PermissionStatus.GRANTED;
        setHasLocationPermission(isGranted);
        return isGranted;
      } catch {
        setHasLocationPermission(false);
        return false;
      }
    };

    const requestForegroundLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const isGranted = status === Location.PermissionStatus.GRANTED;
      setHasLocationPermission(isGranted);
      return isGranted;
    };

    // Reverse geocode when marker moves
    const reverseGeocode = async (
      coords: Coordinates,
      options: { skipPermissionCheck?: boolean } = {},
    ) => {
      const requestId = reverseGeocodeRequestRef.current + 1;
      reverseGeocodeRequestRef.current = requestId;
      setIsReversing(true);
      try {
        const canReverseGeocode =
          options.skipPermissionCheck ||
          (await hasForegroundLocationPermission());

        if (!canReverseGeocode) {
          if (requestId === reverseGeocodeRequestRef.current) {
            setLocationName(formatCoordinateLocation(coords));
          }
          return;
        }

        const results = await Location.reverseGeocodeAsync(coords);
        if (requestId !== reverseGeocodeRequestRef.current) {
          return;
        }

        const name = results[0]
          ? formatAddress(results[0], coords)
          : formatCoordinateLocation(coords);
        setLocationName(name);
      } catch (error) {
        if (requestId !== reverseGeocodeRequestRef.current) {
          return;
        }

        if (isPermissionError(error)) {
          setHasLocationPermission(false);
        } else {
          console.warn("Reverse geocoding failed:", error);
        }

        setLocationName(formatCoordinateLocation(coords));
      } finally {
        if (requestId === reverseGeocodeRequestRef.current) {
          setIsReversing(false);
        }
      }
    };

    const handleGetCurrentLocation = async () => {
      setIsLocating(true);
      try {
        const hasPermission = await requestForegroundLocationPermission();
        if (!hasPermission) {
          Alert.alert(
            "Permission Denied",
            "Please enable location permissions to use this feature.",
          );
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

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setRegion(newRegion);
        setMarkerPosition(coords);

        mapRef.current?.animateToRegion(newRegion, 1000);
        await reverseGeocode(coords, { skipPermissionCheck: true });
      } catch {
        Alert.alert("Error", "Could not get your current location.");
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
          location_name:
            locationName ||
            `${markerPosition.latitude.toFixed(4)}, ${markerPosition.longitude.toFixed(4)}`,
        });
      } else {
        onLocationSelected({
          ...markerPosition,
          location_name: locationName,
        });
      }
      bottomSheetRef.current?.dismiss();
    };

    return (
      <BottomSheet
        ref={bottomSheetRef}
        title="Pin Your Location"
        onClose={onClose}
        snapPoints={["90%"]}
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
            initialRegion={region}
            onPress={onMapPress}
            showsUserLocation={hasLocationPermission}
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
                <AppText
                  weight="bold"
                  className="text-gray-900 text-sm"
                  numberOfLines={1}
                >
                  {isReversing
                    ? "Locating..."
                    : locationName || "Tap anywhere on map"}
                </AppText>
                <AppText className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                  {isReversing ? "Updating address" : "Current Pin Location"}
                </AppText>
              </View>
              {isReversing && (
                <ActivityIndicator size="small" color="#FF4F18" />
              )}
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
  },
);

AdLocationPicker.displayName = "AdLocationPicker";

const styles = StyleSheet.create({
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7, // Adjust based on bottom sheet height
    flex: 1,
  },
});

export default AdLocationPicker;
