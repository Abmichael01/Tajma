import { View, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import AppText from "@/components/ui/AppText";

interface CategoryCardProps {
  category: {
    id: string;
    slug: string;
    name: string;
    imageUrl?: string | null;
    adsCount?: number;
  };
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  // Get full image URL if it's a relative path
  const getImageUrl = () => {
    if (!category.imageUrl) return null;
    
    // If it's already a full URL, return as-is
    if (category.imageUrl.startsWith('http://') || category.imageUrl.startsWith('https://')) {
      return category.imageUrl;
    }
    
    // If it's a relative path, construct full URL using API media endpoint
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    
    // If it starts with /media/, convert to API endpoint
    if (category.imageUrl.startsWith('/media/')) {
      const path = category.imageUrl.replace('/media/', '');
      return `${apiUrl}/api/media/${path}`;
    }
    
    // If it's just a path starting with /, try API endpoint
    if (category.imageUrl.startsWith('/')) {
      const path = category.imageUrl.replace(/^\//, '');
      return `${apiUrl}/api/media/${path}`;
    }
    
    // Relative path (e.g., 'categories/uuid.jpg'), use API endpoint
    return `${apiUrl}/api/media/${category.imageUrl}`;
  };

  const fullImageUrl = getImageUrl();

  const handlePress = () => {
    router.push(`/(tabs)/category/${category.slug}`);
  };

  return (
    <TouchableOpacity
      className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Image at top - fills width, rectangular */}
      <View className="relative w-full h-20 bg-gray-100">
        {fullImageUrl && !imageError ? (
          <Image
            source={{ uri: fullImageUrl }}
            className="w-full h-full"
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="w-full h-full bg-gray-200 items-center justify-center">
            <View className="w-8 h-8 rounded bg-gray-300" />
          </View>
        )}
      </View>
      
      {/* Text content below image */}
      <View className="items-center justify-center p-3 pt-2">
        <AppText variant="default" weight="semibold" className="text-center text-gray-900" numberOfLines={2}>
          {category.name}
        </AppText>
        {typeof category.adsCount === 'number' && category.adsCount >= 0 && (
          <AppText variant="default" className="text-gray-500 mt-0.5 text-sm">
            {String(category.adsCount)} ads
          </AppText>
        )}
      </View>
    </TouchableOpacity>
  );
}

