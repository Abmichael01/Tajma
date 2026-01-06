import { View, ScrollView } from "react-native";
import Skeleton from "@/components/ui/Skeleton";

export default function AdDetailSkeleton() {
  return (
    <View className="flex-1 bg-white">
      {/* Back Button Skeleton */}
      <View className="absolute top-12 left-4 z-20">
        <View className="w-10 h-10 rounded-full border border-gray-200 bg-white items-center justify-center">
          <Skeleton className="w-6 h-6 rounded-full" variant="circular" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Gallery Skeleton */}
        <View className="bg-white border-b border-gray-200">
          <Skeleton className="w-full aspect-video" />
          {/* Thumbnails Skeleton */}
          <View className="p-4 border-t border-gray-200">
            <View className="flex-row gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="w-20 h-20 rounded" />
              ))}
            </View>
          </View>
        </View>

        {/* Product Info Skeleton */}
        <View className="bg-white border-b border-gray-200 px-4 py-6">
          {/* Title and Favorite */}
          <View className="flex-row items-start justify-between gap-3 mb-5">
            <View className="flex-1">
              <Skeleton variant="text" className="w-full h-6 mb-2" />
              <Skeleton variant="text" className="w-3/4 h-6" />
            </View>
            <Skeleton className="w-10 h-10 rounded-full" variant="circular" />
          </View>

          {/* Price */}
          <Skeleton variant="text" className="w-32 h-8 mb-6" />

          {/* Info Items */}
          <View className="space-y-4 mb-6">
            <View className="flex-row items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton variant="text" className="w-32 h-4" />
            </View>
            <View className="flex-row items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton variant="text" className="w-24 h-4" />
            </View>
            <View className="flex-row items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton variant="text" className="w-28 h-4" />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex flex-col gap-4">
            <Skeleton className="w-full h-12 rounded-full" />
            <Skeleton className="w-full h-12 rounded-full" />
          </View>
        </View>

        {/* Description Skeleton */}
        <View className="bg-white border-b border-gray-200 px-4 py-6">
          <Skeleton variant="text" className="w-32 h-6 mb-4" />
          <Skeleton variant="text" className="w-full h-4 mb-2" />
          <Skeleton variant="text" className="w-full h-4 mb-2" />
          <Skeleton variant="text" className="w-3/4 h-4" />
        </View>

        {/* Ad Info Skeleton */}
        <View className="bg-white border-b border-gray-200 px-4 py-6">
          <Skeleton variant="text" className="w-40 h-6 mb-5" />
          <View className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <View key={idx} className="space-y-2 border border-gray-200 rounded-xl p-4">
                <Skeleton variant="text" className="w-32 h-5" />
                <Skeleton variant="text" className="w-full h-4" />
              </View>
            ))}
          </View>
        </View>

        {/* Seller Info Skeleton */}
        <View className="bg-white border-b border-gray-200 px-4 py-6">
          <Skeleton variant="text" className="w-40 h-6 mb-5" />
          <View className="flex-row items-center gap-3 mb-5">
            <Skeleton className="w-12 h-12 rounded-full" variant="circular" />
            <View className="flex-1">
              <Skeleton variant="text" className="w-32 h-5 mb-2" />
              <Skeleton variant="text" className="w-24 h-4" />
            </View>
          </View>
          <Skeleton variant="text" className="w-28 h-4 mb-5" />
          <Skeleton className="w-full h-12 rounded-full" />
        </View>

        {/* Reviews Section Skeleton */}
        <View className="bg-white border-b border-gray-200 px-4 py-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Skeleton variant="text" className="w-40 h-6 mb-2" />
              <View className="flex-row items-center gap-2">
                <Skeleton className="w-20 h-5" />
                <Skeleton variant="text" className="w-12 h-5" />
                <Skeleton variant="text" className="w-20 h-5" />
              </View>
            </View>
          </View>

          {/* Rating Breakdown Skeleton */}
          <View className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Skeleton variant="text" className="w-32 h-5 mb-3" />
            <View className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <View key={idx} className="flex-row items-center gap-3">
                  <Skeleton className="w-6 h-4" />
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="flex-1 h-2 rounded-full" />
                  <Skeleton className="w-8 h-4" />
                </View>
              ))}
            </View>
          </View>

          {/* Review Items Skeleton */}
          <View className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <View key={idx} className="border-b border-gray-100 pb-6">
                <View className="flex-row items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" variant="circular" />
                  <View className="flex-1">
                    <Skeleton variant="text" className="w-32 h-5 mb-2" />
                    <View className="flex-row items-center gap-2 mb-2">
                      <Skeleton className="w-20 h-4" />
                      <Skeleton variant="text" className="w-24 h-4" />
                    </View>
                    <Skeleton variant="text" className="w-full h-4 mb-1" />
                    <Skeleton variant="text" className="w-3/4 h-4 mb-3" />
                    <Skeleton variant="text" className="w-20 h-4" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Safety Tips Skeleton */}
        <View className="bg-blue-50 border-b border-blue-200 px-4 py-6">
          <Skeleton variant="text" className="w-32 h-5 mb-3" />
          <View className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} variant="text" className="w-full h-4" />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

