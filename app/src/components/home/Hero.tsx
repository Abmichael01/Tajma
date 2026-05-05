import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import AppText from "@/components/ui/AppText";

import { useTranslation } from "react-i18next";

// ─── Reusable SearchBar (unchanged API — used by home.tsx and the sticky header)
export function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedRegion,
  onRegionPress,
  onFilterPress,
  onSearch,
  showRegion = true,
  showFilter = true,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRegion: string;
  onRegionPress: () => void;
  onFilterPress?: () => void;
  onSearch: () => void;
  showRegion?: boolean;
  showFilter?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-row gap-2">
      {/* Search Input */}
      <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-full px-4 py-2">
        <Ionicons name="search-outline" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-base text-gray-900 py-1"
          placeholder={t('search.placeholder')}
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} className="ml-2">
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Region Selector */}
      {showRegion && (
        <TouchableOpacity
          className="flex-row items-center bg-white border border-gray-200 rounded-full px-4 h-12"
          onPress={onRegionPress}
        >
          <Ionicons name="location-outline" size={18} color="#FF4F18" style={{ marginRight: 4 }} />
          <AppText weight="medium" className="text-gray-700 text-xs" numberOfLines={1}>
            {selectedRegion}
          </AppText>
        </TouchableOpacity>
      )}

      {/* Filter */}
      {showFilter && (
        <TouchableOpacity
          className="flex-row items-center justify-center p-2.5 bg-white border border-gray-200 rounded-full w-12 h-12"
          onPress={onFilterPress}
        >
          <Ionicons name="options-outline" size={22} color="#FF4F18" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Banner carousel (mirrors the web Hero)
const BANNERS = [
  { id: 1, image: require("@/assets/images/hero/electronics.png"), href: "/category/electronics" },
  { id: 2, image: require("@/assets/images/hero/vehicles.png"), href: "/category/vehicles" },
  { id: 3, image: require("@/assets/images/hero/fashion.png"), href: "/category/fashion" },
  { id: 4, image: require("@/assets/images/hero/real-estate.png"), href: "/category/real-estate" },
  { id: 5, image: require("@/assets/images/hero/furniture.png"), href: "/category/home-furniture-garden" },
] as const;

const HORIZONTAL_PADDING = 16;
const AUTO_ADVANCE_MS = 8000;
// Banner aspect ratio matches source image (1619 / 971)
const BANNER_ASPECT_RATIO = 1619 / 971;

export default function Hero() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [slideWidth, setSlideWidth] = useState(
    Dimensions.get("window").width - HORIZONTAL_PADDING * 2
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const userInteractingRef = useRef(false);
  const slideHeight = slideWidth / BANNER_ASPECT_RATIO;

  // Auto-advance every 8s, pause while user is dragging
  useEffect(() => {
    if (slideWidth <= 0) return;
    const interval = setInterval(() => {
      if (userInteractingRef.current) return;
      const next = (currentSlide + 1) % BANNERS.length;
      listRef.current?.scrollToOffset({
        offset: next * slideWidth,
        animated: true,
      });
      setCurrentSlide(next);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [currentSlide, slideWidth]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / slideWidth);
    if (index !== currentSlide) setCurrentSlide(index);
    userInteractingRef.current = false;
  };

  return (
    <View
      className="px-4 pt-3"
    >
      <View
        className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-200"
        style={{ height: slideHeight }}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - slideWidth) > 0.5) setSlideWidth(w);
        }}
      >
        {slideWidth > 0 && (
          <FlatList
            ref={listRef}
            data={BANNERS as unknown as typeof BANNERS[number][]}
            keyExtractor={(item) => String(item.id)}
            horizontal
            snapToInterval={slideWidth}
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => {
              userInteractingRef.current = true;
            }}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => router.push(item.href as any)}
                style={{ width: slideWidth, height: slideHeight }}
              >
                <Image
                  source={item.image}
                  style={{ width: slideWidth, height: slideHeight }}
                  contentFit="cover"
                  transition={300}
                  priority="high"
                />
              </TouchableOpacity>
            )}
          />
        )}

        {/* Pagination dots */}
        <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-2">
          {BANNERS.map((_, index) => (
            <View
              key={index}
              style={{
                height: 6,
                width: index === currentSlide ? 24 : 6,
                borderRadius: 3,
                backgroundColor:
                  index === currentSlide
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
