import { View, Image, ImageProps, Pressable, PressableProps } from "react-native";
import { useState } from "react";
import AppText from "./AppText";
import { cn } from "@/utils/cn";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: number;
  className?: string;
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

// Helper function to normalize avatar URL
const normalizeAvatarUrl = (url?: string | null): string | null => {
  if (!url || url.trim() === '') return null;
  
  const trimmedUrl = url.trim();
  
  // If it's already a full URL, return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // If it's a relative path, construct full URL using API media endpoint
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  
  // If it starts with /api/media/, just prepend the base URL
  if (trimmedUrl.startsWith('/api/media/')) {
    return `${apiUrl}${trimmedUrl}`;
  }
  
  // If it starts with /media/, convert to API endpoint
  if (trimmedUrl.startsWith('/media/')) {
    const path = trimmedUrl.replace('/media/', '');
    return `${apiUrl}/api/media/${path}`;
  }
  
  // If it's just a path starting with /, try API endpoint
  if (trimmedUrl.startsWith('/')) {
    const path = trimmedUrl.replace(/^\//, '');
    return `${apiUrl}/api/media/${path}`;
  }
  
  // Relative path (e.g., 'avatars/uuid.jpg'), use API endpoint
  return `${apiUrl}/api/media/${trimmedUrl}`;
};

export default function Avatar({
  src,
  alt,
  fallback,
  size = 40,
  className,
  onPress,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const normalizedSrc = normalizeAvatarUrl(src);
  const showImage = normalizedSrc && !imageError;
  const initials = fallback || getInitials(alt);

  const sizeStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const fontSize = size * 0.4; // 40% of size for font

  const content = (
    <View
      className={cn("items-center justify-center overflow-hidden", className)}
      style={sizeStyle}
    >
      {showImage ? (
        <Image
          source={{ uri: normalizedSrc }}
          style={sizeStyle}
          resizeMode="cover"
          onError={(error) => {
            console.log('Avatar image error:', error.nativeEvent.error, 'URL:', normalizedSrc);
            setImageError(true);
          }}
          onLoad={() => {
            // Reset error state if image loads successfully
            setImageError(false);
          }}
        />
      ) : (
        <View
          className="w-full h-full bg-primary/10 items-center justify-center"
          style={sizeStyle}
        >
          <AppText weight="semibold" className="text-primary" style={{ fontSize }}>
            {initials}
          </AppText>
        </View>
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

