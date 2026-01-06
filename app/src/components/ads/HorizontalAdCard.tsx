import { View, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import { Ad } from "@/api/types";

interface HorizontalAdCardProps {
  ad: Ad;
  showStatus?: boolean;
}

export default function HorizontalAdCard({ ad, showStatus = false }: HorizontalAdCardProps) {
  const imageUrl =
    ad.images && ad.images.length > 0
      ? ad.images[0]
      : "https://via.placeholder.com/400x300?text=No+Image";

  const formattedPrice = ad.price
    ? `${ad.currency || "Fr"} ${parseFloat(String(ad.price)).toLocaleString()}`
    : "Contact for price";

  // Status badge config
  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    published: { label: 'Active', color: '#16a34a', bgColor: '#dcfce7' },
    archived: { label: 'Archived', color: '#4b5563', bgColor: '#f3f4f6' },
    draft: { label: 'Draft', color: '#ca8a04', bgColor: '#fef9c3' },
  };
  
  const statusInfo = ad.status ? statusConfig[ad.status] : null;

  return (
    <Link href={`/ads/${ad.slug || ad.id}`} asChild>
      <TouchableOpacity 
        className="flex-row bg-white rounded-xl mb-3 overflow-hidden border border-gray-200"
        activeOpacity={0.7}
      >
        {/* Image Section */}
        <View className="w-32 h-32 relative">
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full bg-gray-100"
            resizeMode="cover"
          />
          {showStatus && statusInfo && (
            <View 
              className="absolute top-2 left-2 px-2 py-0.5 rounded"
              style={{ backgroundColor: statusInfo.bgColor }}
            >
              <AppText 
                variant="caption" 
                weight="bold" 
                style={{ color: statusInfo.color, fontSize: 10 }}
              >
                {statusInfo.label}
              </AppText>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View className="flex-1 p-3 flex justify-between">
          <View>
            {/* Category */}
            <AppText variant="caption" className="text-gray-500 mb-1" numberOfLines={1}>
              {ad.category_details?.name || ad.category || "Uncategorized"}
            </AppText>
            
            {/* Title */}
            <AppText variant="default" weight="semibold" className="text-gray-900 mb-1" numberOfLines={2}>
              {ad.title}
            </AppText>
            
            {/* Price */}
            <AppText weight="bold" className="text-primary text-base">
              {formattedPrice}
            </AppText>
          </View>

          {/* Footer Info */}
          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="location-outline" size={12} color="#6b7280" />
              <AppText variant="caption" className="text-gray-500 ml-1" numberOfLines={1}>
                {ad.seller?.location || "No Location"}
              </AppText>
            </View>
            
            {ad.views !== undefined && (
              <View className="flex-row items-center bg-gray-50 px-1.5 py-0.5 rounded">
                <Ionicons name="eye-outline" size={12} color="#6b7280" />
                <AppText variant="caption" className="text-gray-500 ml-1">
                  {ad.views}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
