import { View, Pressable, PressableProps } from "react-native";
import { Image } from 'expo-image';
import { useState } from "react";
import AppText from "./AppText";
import { cn } from "@/utils/cn";
import { resolveImageUrl } from "@/utils/imageUtils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: number;
  className?: string;
  textClassName?: string;
  onPress?: () => void;
}

// Helper function to get initials from name or email
const getInitials = (name?: string, email?: string): string => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "U";
};



export default function Avatar({
  src,
  alt,
  fallback,
  size = 40,
  className,
  textClassName,
  onPress,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const normalizedSrc = resolveImageUrl(src);
  const showImage = normalizedSrc && !imageError;
  const initials = fallback || getInitials(alt);

  const sizeStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const fontSize = size * 4 * 0.1; // 40% of size for font

  const content = (
    <View
      className={cn("bg-primary/10 items-center justify-center overflow-hidden", className)}
      style={sizeStyle}
    >
      {showImage ? (
        <Image
          source={{ uri: normalizedSrc }}
          style={sizeStyle}
          contentFit="cover"
          transition={200}
          onError={(error) => {
            console.log('Avatar image error:', error.error, 'URL:', normalizedSrc);
            setImageError(true);
          }}
          onLoad={() => {
            // Reset error state if image loads successfully
            setImageError(false);
          }}
        />
      ) : (
        <AppText weight="bold" className={cn("text-primary", textClassName)} style={{ fontSize }}>
          {initials}
        </AppText>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

