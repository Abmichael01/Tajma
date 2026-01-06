import { View } from "react-native";
import Skeleton from "@/components/ui/Skeleton";

export default function CategoryCardSkeleton() {
  return (
    <View className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="w-full h-20" />
      
      {/* Text content skeleton */}
      <View className="items-center justify-center p-3 pt-2">
        <Skeleton variant="text" className="w-16 h-3 mb-1" />
        <Skeleton variant="text" className="w-12 h-2" />
      </View>
    </View>
  );
}

