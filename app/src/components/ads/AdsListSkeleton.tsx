import { View } from "react-native";
import AdCardSkeleton from "./AdCardSkeleton";

interface AdsListSkeletonProps {
  columns?: 2 | 3;
}

export default function AdsListSkeleton({ columns = 2 }: AdsListSkeletonProps) {
  // Create skeleton cards for each column
  const skeletonCount = 6; // Show 6 skeleton cards per column
  
  return (
    <View className="flex-row gap-2 p-4">
      {Array.from({ length: columns }).map((_, columnIndex) => (
        <View key={columnIndex} className="flex-1 gap-2">
          {Array.from({ length: skeletonCount }).map((_, cardIndex) => (
            <AdCardSkeleton key={cardIndex} />
          ))}
        </View>
      ))}
    </View>
  );
}

