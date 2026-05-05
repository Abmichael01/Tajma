import React, { forwardRef, useImperativeHandle } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
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

const AdLocationPicker = forwardRef<AdLocationPickerRef, AdLocationPickerProps>(
  ({ initialLocation, onLocationSelected, onClose }, ref) => {
    const bottomSheetRef = React.useRef<BottomSheetRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const handleConfirm = () => {
      onLocationSelected({
        latitude: initialLocation?.latitude || 13.5116,
        longitude: initialLocation?.longitude || 2.1254,
        location_name: initialLocation?.location_name || "Niamey",
      });
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
            className="w-full"
          >
            Confirm Default Location
          </Button>
        }
      >
        <View style={styles.container}>
          <AppText className="text-gray-500 text-center px-4">
            Interactive map view is not supported on web yet. The default location will be used.
          </AppText>
        </View>
      </BottomSheet>
    );
  },
);

AdLocationPicker.displayName = "AdLocationPicker";

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
});

export default AdLocationPicker;
