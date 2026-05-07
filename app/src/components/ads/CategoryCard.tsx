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
  const hasImage = fullImageUrl && !imageError;

  const colorIndex = category.name.charCodeAt(0) % BG_COLORS.length;
  const bgColor = BG_COLORS[colorIndex];
  const accentColor = ACCENT_COLORS[colorIndex];

  return (
    <TouchableOpacity
      onPress={() => router.push(`/category/${category.slug}`)}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.container}>
        {/* Background Layer: Image or Fallback Icon */}
        <View style={[styles.background, { backgroundColor: bgColor }]}>
          {hasImage ? (
            <Image
              source={{ uri: fullImageUrl }}
              style={styles.fullImage}
              contentFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <AppText
              weight="bold"
              style={{
                fontSize: 72,
                color: accentColor,
                opacity: 0.25,
                lineHeight: 80,
              }}
            >
              {category.name.charAt(0).toUpperCase()}
            </AppText>
          )}
        </View>

        {/* Dark Gradient Overlay at the base — fades up to transparent */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.95)']}
          locations={[0, 0.55, 1]}
          style={styles.gradient}
        />

        {/* Text Content at the base */}
        <View style={styles.textContainer}>
          <AppText weight="bold" numberOfLines={1} style={styles.name}>
            {category.name}
          </AppText>
          <View style={styles.metaRow}>
            <Ionicons name="apps-outline" size={10} color="#E2E8F0" style={{ opacity: 0.8 }} />
            <AppText style={styles.count}>
              {category.adsCount || 0} ads
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 0.70, // Taller 'long' cards
  },
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    justifyContent: 'flex-end',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: -0.5,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      }
    })
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  count: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'WorkSans-Medium',
  },
});
