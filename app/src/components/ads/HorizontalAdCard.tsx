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
    published: { label: 'Active', color: '#16a34a', bgColor: '#f0fdf4' },
    archived: { label: 'Archived', color: '#6b7280', bgColor: '#f9fafb' },
    draft: { label: 'Draft', color: '#eab308', bgColor: '#fefce8' },
  };

  const statusInfo = ad.status ? statusConfig[ad.status] : null;

  return (
    <Link href={`/ads/${ad.slug || ad.id}`} asChild>
      <TouchableOpacity
        className="flex-row bg-white rounded-2xl mb-3 overflow-hidden border border-gray-100 shadow-sm"
        activeOpacity={0.7}
      >
        {/* Image Section */}
        <View className="w-28 h-28 relative m-2 rounded-xl overflow-hidden">
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full bg-gray-50"
            resizeMode="cover"
          />
          {showStatus && statusInfo && (
            <View
              className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: statusInfo.bgColor }}
            >
              <AppText
                variant="caption"
                weight="bold"
                style={{ color: statusInfo.color, fontSize: 9 }}
              >
                {statusInfo.label}
              </AppText>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View className="flex-1 py-3 pr-3 flex justify-between">
          <View>
            <View className="flex-row justify-between items-start">
              <AppText variant="caption" className="text-gray-400 mb-0.5" numberOfLines={1}>
                {ad.category_details?.name || ad.category || "Uncategorized"}
              </AppText>
              {ad.is_negotiable && (
                <View className="bg-primary-50 px-1.5 rounded">
                  <AppText className="text-[#FF4F18]" style={{ fontSize: 8 }} weight="bold">NEGOTIABLE</AppText>
                </View>
              )}
            </View>

            <AppText variant="default" weight="bold" className="text-gray-900 mb-1" numberOfLines={1}>
              {ad.title}
            </AppText>

            <AppText weight="bold" className="text-[#FF4F18] text-lg">
              {formattedPrice}
            </AppText>
          </View>

          {/* Footer Info */}
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="location-outline" size={10} color="#9ca3af" />
              <AppText variant="caption" className="text-gray-400 ml-1 text-[10px]" numberOfLines={1}>
                {ad.seller?.location || "No Location"}
              </AppText>
            </View>

            {ad.views !== undefined && (
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={10} color="#9ca3af" />
                <AppText variant="caption" className="text-gray-400 ml-1 text-[10px]">
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
