import { View, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AppText from "@/components/ui/AppText";

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
}

interface AdCardProps {
  ad: Ad;
  onToggleFavorite?: (adId: string) => void;
}

export default function AdCard({ ad, onToggleFavorite }: AdCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  // Get first image or placeholder
  const imageUrl = ad.images && ad.images.length > 0
    ? ad.images[0]
    : null;
  
  // Format price
  const formattedPrice = ad.price
    ? `${ad.currency || 'Fr'} ${parseFloat(String(ad.price)).toLocaleString()}`
    : 'Contact for price';
  
  // Get location from seller
  const location = ad.seller?.location || 'Location not specified';
  
  // Get category name
  const categoryName = ad.category_details?.name || 'Uncategorized';

  const handlePress = () => {
    router.push(`/ads/${ad.slug}`);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(ad.id);
    }
  };

  // Get full image URL if it's a relative path
  const getImageUrl = () => {
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    
    if (imageUrl.startsWith('/media/')) {
      const path = imageUrl.replace('/media/', '');
      return `${apiUrl}/api/media/${path}`;
    }
    
    if (imageUrl.startsWith('/')) {
      const path = imageUrl.replace(/^\//, '');
      return `${apiUrl}/api/media/${path}`;
    }
    
    return `${apiUrl}/api/media/${imageUrl}`;
  };

  const fullImageUrl = getImageUrl();

  return (
    <Pressable
      className="bg-white border border-gray-200"
      onPress={handlePress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      {/* Image Container - Maintains natural aspect ratio for Pinterest style */}
      <View className="relative w-full bg-gray-100">
        {fullImageUrl && !imageError ? (
          <Image
            source={{ uri: fullImageUrl }}
            style={{ 
              width: '100%', 
              aspectRatio: imageAspectRatio || 1,
            }}
            resizeMode="cover"
            onError={() => setImageError(true)}
            onLoad={(e) => {
              // Calculate and set aspect ratio to maintain natural image proportions for Pinterest style
              const { width, height } = e.nativeEvent.source;
              if (width && height && height > 0) {
                setImageAspectRatio(width / height);
              } else {
                // Default to square if dimensions not available
                setImageAspectRatio(1);
              }
            }}
          />
        ) : (
          <View className="w-full bg-gray-200 items-center justify-center" style={{ aspectRatio: 1 }}>
            <Ionicons name="image-outline" size={40} color="#9ca3af" />
          </View>
        )}
        
        {/* Category Badge */}
        {categoryName && (
          <View className="absolute top-2 left-2 bg-secondary/90 px-2 py-1">
            <AppText variant="caption" weight="medium" className="text-white text-xs">
              {categoryName}
            </AppText>
          </View>
        )}
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <Pressable
            onPress={handleFavoritePress}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full items-center justify-center"
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
          >
            <Ionicons
              name={ad.is_saved ? "heart" : "heart-outline"}
              size={20}
              color={ad.is_saved ? "#cb234a" : "#666"}
            />
          </Pressable>
        )}
      </View>

      {/* Content */}
      <View className="p-3">
        {/* Price - Before Title */}
        <View className="mb-1.5">
          <AppText variant="subheading" weight="semibold" className="text-primary">
            {formattedPrice}
          </AppText>
        </View>
        
        {/* Title */}
        <AppText
          variant="default"
          weight="semibold"
          className="text-gray-900 mb-1.5"
          numberOfLines={2}
        >
          {ad.title}
        </AppText>
        
        {/* Description - Truncated */}
        {ad.description && (
          <AppText
            variant="caption"
            className="text-gray-600 mb-2"
            numberOfLines={2}
          >
            {ad.description}
          </AppText>
        )}
        
        {/* Location and Views */}
        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <View className="flex-row items-center gap-1 flex-1">
            <Ionicons name="location-outline" size={12} color="#6b7280" />
            <AppText variant="caption" className="text-gray-500" numberOfLines={1}>
              {location}
            </AppText>
          </View>
          
          {ad.views && ad.views > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="eye-outline" size={12} color="#6b7280" />
              <AppText variant="caption" className="text-gray-500">
                {String(ad.views)}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
