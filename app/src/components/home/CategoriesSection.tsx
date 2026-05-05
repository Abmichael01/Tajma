import { useRef } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import CategoryCard from "@/components/ads/CategoryCard";
import CategoriesSkeleton from "@/components/ads/CategoriesSkeleton";

interface Category {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  adsCount?: number;
}

interface CategoriesSectionProps {
  categories: Category[];
  loading?: boolean;
}

export default function CategoriesSection({ categories = [], loading }: CategoriesSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);

  // Show up to 10 categories
  const displayedCategories = Array.isArray(categories) ? categories.slice(0, 10) : [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollTo({ x: scrollX.current + offset, animated: true });
    }
  };

  if (loading) return <CategoriesSkeleton />;
  if (displayedCategories.length === 0) return null;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <AppText weight="bold" style={styles.title}>Catégories</AppText>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => scroll('left')} style={styles.scrollBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scroll('right')} style={styles.scrollBtn} hitSlop={10}>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/categories")}
            activeOpacity={0.6}
            style={styles.seeAll}
          >
            <AppText weight="semibold" style={styles.seeAllText}>Show all</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Single Unified Horizontal Scroll - Continuous Momentum */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="normal"
        onScroll={(e) => {
          scrollX.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {displayedCategories.map((category) => (
          <View key={category.id} style={styles.itemWrapper}>
            <CategoryCard category={category} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: '#111827',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scrollBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAll: {
    marginLeft: 4,
  },
  seeAllText: {
    color: '#FF4F18',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 14, // (Outer padding - cell padding)
  },
  itemWrapper: {
    width: 160, // Narrower but taller cards
    paddingHorizontal: 8,
  },
});
