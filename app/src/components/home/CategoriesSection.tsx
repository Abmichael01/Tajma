import { View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
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
  
  // Show first 9 categories (3 rows x 3 columns)
  const displayedCategories = Array.isArray(categories) ? categories.slice(0, 9) : [];

  if (loading) {
    return <CategoriesSkeleton />;
  }

  if (displayedCategories.length === 0) {
    return (
      <View className="py-6 px-4">
        <AppText variant="default" className="text-gray-500 text-center">
          No categories available yet.
        </AppText>
      </View>
    );
  }

  return (
    <View className="py-6 px-4 bg-white">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <AppText variant="subheading" weight="bold" className="text-gray-900">
            Browse Categories
          </AppText>
          <AppText variant="caption" className="text-gray-500">
            Live data from the marketplace taxonomy.
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/categories")}
        >
          <AppText variant="caption" weight="semibold" className="text-secondary">
            View all
          </AppText>
        </TouchableOpacity>
      </View>

      {/* 3 columns grid */}
      <View className="flex-row flex-wrap gap-3">
        {displayedCategories.map((category) => (
          <View key={category.id} className="w-[31%]">
            <CategoryCard category={category} />
          </View>
        ))}
      </View>
    </View>
  );
}

