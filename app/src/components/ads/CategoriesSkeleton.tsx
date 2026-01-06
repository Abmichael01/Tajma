import { View } from "react-native";
import CategoryCardSkeleton from "./CategoryCardSkeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function CategoriesSkeleton() {
  return (
    <View className="py-6 px-4 bg-white">
      {/* Header skeleton */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Skeleton variant="text" className="w-32 h-5 mb-1" />
          <Skeleton variant="text" className="w-48 h-3" />
        </View>
        <Skeleton variant="text" className="w-16 h-4" />
      </View>

      {/* 3 columns grid skeleton */}
      <View className="flex-row flex-wrap gap-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <View key={index} className="w-[31%]">
            <CategoryCardSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}

