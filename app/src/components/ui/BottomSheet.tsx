import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import AppText from './AppText';

export interface BottomSheetProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  title?: string;
  snapPoints?: string[];
  onClose?: () => void;
  scrollable?: boolean;
}

export interface BottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  ({ children, footer, headerLeft, headerRight, title, snapPoints: customSnapPoints, onClose, scrollable = true }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Initial snap points
    const snapPoints = useMemo(() => customSnapPoints || ['50%', '90%'], [customSnapPoints]);

    // Handle presence
    useImperativeHandle(ref, () => ({
      present: () => bottomSheetModalRef.current?.present(),
      dismiss: () => bottomSheetModalRef.current?.dismiss(),
    }));

    // Backdrop implementation
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const ContentContainer = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        onDismiss={onClose}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
      >
        <View className="flex-1">
          {title && (
            <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between min-h-[64px]">
              <View className="flex-1 items-start">
                {headerLeft}
              </View>
              <View className="flex-[3] items-center">
                <AppText variant="subheading" weight="bold" className="text-xl text-gray-900 text-center">
                  {title}
                </AppText>
              </View>
              <View className="flex-1 items-end">
                {headerRight}
              </View>
            </View>
          )}
          <View className="flex-1">
            <ContentContainer style={styles.contentContainer}>
              {children}
            </ContentContainer>
          </View>
          {footer && (
            <View className="px-6 py-4 border-t border-gray-100 bg-white">
              {footer}
            </View>
          )}
        </View>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  indicator: {
    backgroundColor: '#e5e7eb',
    width: 48,
    height: 6,
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
  },
});

export default BottomSheet;
