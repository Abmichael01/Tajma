import { View, ScrollView } from "react-native";
import { useState, useMemo } from "react";
import AppText from "@/components/ui/AppText";
import AdCard from "./AdCard";

interface Ad {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price?: string | number;
  currency?: string;
  images?: string[];
  seller?: {
    location?: string;
  };
  category_details?: {
    name?: string;
  };
  views?: number;
  is_saved?: boolean;
  created_at?: string;
}

interface AdsListProps {
  ads: Ad[];
  columns?: 2 | 3;
  onToggleFavorite?: (adId: string) => void;
  className?: string;
  sortBy?: SortOption;
}

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'views' | 'title';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'title', label: 'Title A-Z' },
];

// Sort function for backend Ad format
const sortAds = (ads: Ad[], sortBy: SortOption): Ad[] => {
  const sorted = [...ads];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });
    case 'price-low':
      return sorted.sort((a, b) => {
        if (!a.price || a.price === '') return 1;
        if (!b.price || b.price === '') return -1;
        const priceA = parseFloat(String(a.price)) || 0;
        const priceB = parseFloat(String(b.price)) || 0;
        return priceA - priceB;
      });
    case 'price-high':
      return sorted.sort((a, b) => {
        if (!a.price || a.price === '') return 1;
        if (!b.price || b.price === '') return -1;
        const priceA = parseFloat(String(a.price)) || 0;
        const priceB = parseFloat(String(b.price)) || 0;
        return priceB - priceA;
      });
    case 'views':
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
};

export default function AdsList({ 
  ads, 
  columns = 2, 
  onToggleFavorite,
  className = "",
  sortBy: externalSortBy
}: AdsListProps & { sortBy?: SortOption }) {
  const [internalSortBy, setInternalSortBy] = useState<SortOption>('newest');
  const sortBy = externalSortBy || internalSortBy;

  // Sort ads
  const sortedAds = useMemo(() => sortAds(ads, sortBy), [ads, sortBy]);

  // Distribute sorted ads across columns for Pinterest-style masonry layout
  const columnArrays: Ad[][] = useMemo(() => {
    const arrays: Ad[][] = Array.from({ length: columns }, () => []);
    sortedAds.forEach((ad, index) => {
      const columnIndex = index % columns;
      arrays[columnIndex].push(ad);
    });
    return arrays;
  }, [sortedAds, columns]);

  return (
    <View className={className}>
      {/* Pinterest-style masonry grid - Small gaps, images maintain natural aspect ratio */}
      <View className="flex-row gap-2 p-4">
        {columnArrays.map((columnAds, columnIndex) => (
          <View key={columnIndex} className="flex-1 gap-2">
            {columnAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

