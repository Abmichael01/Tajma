import { View, ScrollView, Platform } from "react-native";
import Skeleton from "@/components/ui/Skeleton";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdDetailSkeleton() {
  return (
    <View className="flex-1 bg-white">
      {/* Floating Back Button Skeleton */}
      <View className="absolute top-12 left-6 z-50">
        <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
          <Skeleton className="w-6 h-6 rounded-full" variant="circular" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image Gallery Skeleton */}
        <View className="bg-white">
          <Skeleton className="w-full aspect-[4/3]" />
          {/* Thumbnails Skeleton */}
          <View className="py-4 border-b border-gray-100 bg-white">
            <View className="flex-row px-5 gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="w-16 h-16 rounded-2xl" />
              ))}
            </View>
          </View>
        </View>

        {/* Product Info Skeleton */}
        <View className="bg-white px-6 py-8">
          {/* Category & Verified Badge area */}
          <View className="flex-row items-center gap-2 mb-4">
            <Skeleton variant="text" className="w-24 h-5 rounded-full" />
            <Skeleton className="w-4 h-4 rounded-full" variant="circular" />
          </View>

          {/* Title and Favorite */}
          <View className="flex-row items-start justify-between gap-4 mb-6">
            <View className="flex-1">
              <Skeleton variant="text" className="w-full h-8 mb-2" />
              <Skeleton variant="text" className="w-3/4 h-8" />
            </View>
            <Skeleton className="w-11 h-11 rounded-full" variant="circular" />
          </View>

          {/* Price */}
          <Skeleton variant="text" className="w-40 h-10 mb-8" />

          {/* Location & Time */}
          <View className="flex-row items-center gap-6 mb-8 pb-8 border-b border-gray-50">
            <View className="flex-row items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton variant="text" className="w-28 h-4" />
            </View>
            <View className="flex-row items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton variant="text" className="w-20 h-4" />
            </View>
          </View>

          {/* Description Skeleton */}
          <View className="mb-8">
            <Skeleton variant="text" className="w-40 h-6 mb-4" />
            <Skeleton variant="text" className="w-full h-4 mb-2" />
            <Skeleton variant="text" className="w-full h-4 mb-2" />
            <Skeleton variant="text" className="w-3/4 h-4" />
          </View>
        </View>

        {/* Seller Info Skeleton */}
        <View className="px-6 py-8 border-t border-gray-50">
          <View className="flex-row items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" variant="circular" />
            <View className="flex-1">
              <Skeleton variant="text" className="w-40 h-6 mb-2" />
              <Skeleton variant="text" className="w-32 h-4" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Skeleton */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex-row gap-3 items-center"
        style={{
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        }}
      >
        <Skeleton className="flex-1 h-14 rounded-2xl" />
        <Skeleton className="w-14 h-14 rounded-2xl" />
      </View>
    </View>
  );
}

