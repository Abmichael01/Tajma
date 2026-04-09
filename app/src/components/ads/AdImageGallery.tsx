import { View, Image, TouchableOpacity, ScrollView, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/ui/AppText";
import ImageViewer from "@/components/ui/ImageViewer";
import { resolveImageUrl } from "@/utils/imageUtils";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdImageGalleryProps {
  images: string[];
  title: string;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onThumbnailClick: (index: number) => void;
  onShare: () => void;
  onReport: () => void;
  onIndexChange?: (index: number) => void;
}

export default function AdImageGallery({
  images,
  title,
  currentIndex,
  onPrev,
  onNext,
  onThumbnailClick,
  onShare,
  onReport,
  onIndexChange,
}: AdImageGalleryProps) {
  const [imageError, setImageError] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const lastSelectedIndex = useRef(currentIndex);

  // Sync scroll position when currentIndex changes from props (e.g. thumbnail click)
  useEffect(() => {
    // Only scroll if the index change came from outside and we aren't already there
    if (currentIndex !== lastSelectedIndex.current) {
      lastSelectedIndex.current = currentIndex;
      flatListRef.current?.scrollToIndex({
        index: currentIndex,
        animated: true,
      });
    }
  }, [currentIndex]);

  const onMomentumScrollEnd = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    
    if (index !== currentIndex) {
      lastSelectedIndex.current = index; // Update ref BEFORE calling onIndexChange to prevent useEffect trigger
      if (onIndexChange) onIndexChange(index);
    }
  };

  if (images.length === 0) {
    return (
      <View className="w-full aspect-video bg-gray-100 items-center justify-center">
        <Ionicons name="image-outline" size={64} color="#9ca3af" />
        <AppText className="mt-2 text-gray-500">No images available</AppText>
      </View>
    );
  }

  return (
    <View className="bg-white">
      {/* Main Image Container with Sliding Animation */}
      <View className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          keyExtractor={(_, index) => index.toString()}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item, index }) => {
            const fullImageUrl = resolveImageUrl(item);
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setViewerVisible(true)}
                style={{ width: SCREEN_WIDTH }}
                className="h-full bg-gray-100"
              >
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
              </TouchableOpacity>
            );
          }}
        />

        {/* Floating Actions on Gallery */}
        <View 
          className="absolute right-6 flex-col gap-3"
          style={{ top: insets.top + 10 }}
        >
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black/30 items-center justify-center backdrop-blur-md"
            onPress={onShare}
          >
            <Ionicons name="share-social-outline" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black/30 items-center justify-center backdrop-blur-md"
            onPress={onReport}
          >
            <Ionicons name="flag-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Improved Indicator dots */}
        {images.length > 1 && (
          <View className="absolute bottom-6 left-0 right-0 flex-row justify-center gap-1.5">
            {images.map((_, i) => (
              <View
                key={i}
                className={`h-1.5 rounded-full ${i === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </View>
        )}
      </View>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <View className="py-4 border-b border-gray-100 bg-white">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {images.map((image, index) => {
              const thumbnailUrl = resolveImageUrl(image);
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onThumbnailClick(index)}
                  className={`w-16 h-16 overflow-hidden border-2 rounded-2xl ${index === currentIndex
                    ? 'border-[#FF4F18]'
                    : 'border-transparent bg-gray-50'
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
                      <Ionicons name="image-outline" size={16} color="#9ca3af" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Full Screen Image Viewer */}
      {viewerVisible && (
        <ImageViewer
          images={images}
          initialIndex={currentIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          title={title}
        />
      )}
    </View>
  );
}
