import { View, StyleSheet } from "react-native";
import Skeleton from "@/components/ui/Skeleton";

export default function CategoryCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton className="w-full h-full" />
      <View style={styles.textOverlay}>
        <Skeleton variant="text" className="w-3/4 h-4 mb-1.5" />
        <Skeleton variant="text" className="w-1/3 h-2.5" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    position: "relative",
  },
  textOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 16,
  },
});
