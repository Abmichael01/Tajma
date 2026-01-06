import { View } from "react-native";
import Skeleton from "@/components/ui/Skeleton";

export default function AdCardSkeleton() {
  return (
    <View className="bg-white border border-gray-200">
      {/* Image skeleton - random height for Pinterest style */}
      <Skeleton className="w-full" style={{ height: Math.random() * 200 + 200 }} />
      
      {/* Content skeleton */}
      <View className="p-3">
        {/* Price skeleton */}
        <Skeleton variant="text" className="w-24 h-5 mb-2" />
        
        {/* Title skeleton */}
        <Skeleton variant="text" className="w-full h-4 mb-1" />
        <Skeleton variant="text" className="w-3/4 h-4 mb-2" />
        
        {/* Description skeleton */}
        <Skeleton variant="text" className="w-full h-3 mb-1" />
        <Skeleton variant="text" className="w-2/3 h-3 mb-2" />
        
        {/* Location and views skeleton */}
        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-12 h-3" />
        </View>
      </View>
    </View>
  );
}

