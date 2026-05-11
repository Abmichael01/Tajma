import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/ui/AppText";
import { resolveImageUrl } from "@/utils/imageUtils";

interface CategoryCardProps {
  category: {
    id: string;
    slug: string;
    name: string;
    imageUrl?: string | null;
    adsCount?: number;
  };
  size?: 'featured' | 'compact';
}

// Deterministic soft background per category for fallbacks
const BG_COLORS = ['#F9FAFB', '#FFF7F5', '#F5F7FF', '#F0FDF4', '#FFFBEB', '#FDF4FF'];
const ACCENT_COLORS = ['#374151', '#FF4F18', '#3B82F6', '#10B981', '#F59E0B', '#D946EF'];

export default function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const fullImageUrl = resolveImageUrl(category.imageUrl);
  const hasImage = !!(fullImageUrl && !imageError);

  const colorIndex = category.name.charCodeAt(0) % BG_COLORS.length;
  const bgColor = BG_COLORS[colorIndex];
  const accentColor = ACCENT_COLORS[colorIndex];

  return (
    <TouchableOpacity
      onPress={() => router.push(`/category/${category.slug}`)}
      activeOpacity={0.9}
      className="w-full mb-3"
    >
      <View className="rounded-[24px] overflow-hidden bg-white border-[1.5px] border-slate-200">
        {/* Top Section: Image or Letter Fallback */}
        <View 
            className="h-[120px] items-center justify-center overflow-hidden" 
            style={{ backgroundColor: bgColor }}
        >
          {hasImage ? (
            <Image
              source={{ uri: fullImageUrl }}
              className="w-full h-full"
              contentFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <AppText
              weight="bold"
              style={{
                fontSize: 32,
                color: accentColor,
                includeFontPadding: true,
                textAlignVertical: 'center',
              }}
            >
              {category.name.charAt(0).toUpperCase()}
            </AppText>
          )}
        </View>

        {/* Bottom Section: Info with White Background */}
        <View className="px-4 py-3 bg-white justify-center">
          <AppText 
            weight="bold" 
            numberOfLines={1}
            className="text-slate-800 text-[15px] mb-1"
          >
            {category.name}
          </AppText>
          
          <View className="flex-row items-center space-x-1 opacity-80">
            <Ionicons name="apps-outline" size={12} color="#64748B" />
            <AppText weight="semibold" className="text-slate-500 text-[11px]">
              {category.adsCount || 0} ads
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}






