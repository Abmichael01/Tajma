import { View, ScrollView, StyleSheet } from "react-native";
import CategoryCardSkeleton from "./CategoryCardSkeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function CategoriesSkeleton() {
  return (
    <View style={styles.section}>
      {/* Header — mirrors CategoriesSection header */}
      <View style={styles.header}>
        <Skeleton variant="text" className="w-28 h-5" />
        <View style={styles.actions}>
          <Skeleton variant="circular" className="w-8 h-8" />
          <Skeleton variant="circular" className="w-8 h-8" />
          <Skeleton variant="text" className="w-16 h-4" />
        </View>
      </View>

      {/* Horizontal scroll of card placeholders */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={styles.itemWrapper}>
            <CategoryCardSkeleton />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scrollContent: {
    paddingHorizontal: 14,
  },
  itemWrapper: {
    width: 160,
    paddingHorizontal: 8,
  },
});
