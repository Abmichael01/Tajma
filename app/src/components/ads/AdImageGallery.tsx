import { View, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AppText from "@/components/ui/AppText";

interface AdImageGalleryProps {
  images: string[];
  title: string;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onThumbnailClick: (index: number) => void;
}

export default function AdImageGallery({
  images,
  title,
  currentIndex,
  onPrev,
  onNext,
  onThumbnailClick,
}: AdImageGalleryProps) {
  const [imageError, setImageError] = useState(false);

  // Get full image URL if it's a relative path
  const getImageUrl = (imageUrl: string) => {
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

  const currentImage = images[currentIndex];
  const fullImageUrl = currentImage ? getImageUrl(currentImage) : null;

  if (images.length === 0) {
    return (
      <View className="w-full aspect-video bg-gray-100 items-center justify-center">
        <Ionicons name="image-outline" size={64} color="#9ca3af" />
        <AppText className="mt-2 text-gray-500">No images available</AppText>
      </View>
    );
  }

  return (
    <View className="bg-white border-b border-gray-200">
      {/* Main Image */}
      <View className="relative w-full aspect-video bg-gray-100">
        {fullImageUrl && !imageError ? (
          <Image
            source={{ uri: fullImageUrl }}
            className="w-full h-full"
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="w-full h-full bg-gray-200 items-center justify-center">
            <Ionicons name="image-outline" size={64} color="#9ca3af" />
          </View>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <TouchableOpacity
              onPress={onPrev}
              disabled={currentIndex === 0}
              className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full ${
                currentIndex === 0 ? 'opacity-50' : ''
              }`}
            >
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              disabled={currentIndex === images.length - 1}
              className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full ${
                currentIndex === images.length - 1 ? 'opacity-50' : ''
              }`}
            >
              <Ionicons name="chevron-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <View className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded">
            <AppText className="text-white text-sm">
              {currentIndex + 1} / {images.length}
            </AppText>
          </View>
        )}
      </View>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <View className="p-4 border-t border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {images.map((image, index) => {
              const thumbnailUrl = getImageUrl(image);
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onThumbnailClick(index)}
                  className={`w-20 h-20 overflow-hidden border-2 rounded ${
                    index === currentIndex
                      ? 'border-secondary'
                      : 'border-gray-200'
                  }`}
                >
                  {thumbnailUrl ? (
                    <Image
                      source={{ uri: thumbnailUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full bg-gray-200 items-center justify-center">
                      <Ionicons name="image-outline" size={20} color="#9ca3af" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

