import React from 'react';
import { View, Animated, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppText from './AppText';

interface ScrollAwareHeaderProps {
  title: string;
  scrollY: Animated.Value;
  showAt?: number;
  rightElement?: React.ReactNode;
}

export default function ScrollAwareHeader({ 
  title, 
  scrollY, 
  showAt = 140,
  rightElement 
}: ScrollAwareHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const headerOpacity = scrollY.interpolate({
    inputRange: [showAt, showAt + 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [showAt, showAt + 40],
    outputRange: [-20, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top,
          height: insets.top + 56,
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }]
        }
      ]}
      className="bg-white border-b border-gray-100 shadow-sm"
    >
      <View className="flex-row items-center px-4 h-full">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="#0f172b" />
        </TouchableOpacity>
        
        <View className="flex-1 px-2">
          <AppText weight="bold" className="text-gray-900 text-lg" numberOfLines={1}>
            {title}
          </AppText>
        </View>

        {rightElement ? (
          <View className="w-10 h-10 items-center justify-center">
            {rightElement}
          </View>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
