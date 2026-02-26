import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { useToggleSaveAd } from "@/hooks/useSavedAds";
import { useLeads } from "@/hooks/useLeads";

interface Ad {
  id: string;
  slug: string;
  title: string;
  price?: string | number;
  currency?: string;
  views?: number;
  saved_count?: number;
  created_at?: string;
  seller?: {
    id: string;
    phone?: string;
  };
  is_saved?: boolean;
  is_negotiable?: boolean;
}

interface AdProductInfoProps {
  ad: Ad;
  user: any;
  isOwner: boolean;
  formattedPrice: string;
  location: string;
  categoryName: string;
}

export default function AdProductInfo({
  ad,
  user,
  isOwner,
  formattedPrice,
  location,
  categoryName,
}: AdProductInfoProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { mutate: toggleSaveAd } = useToggleSaveAd();
  const { recordInteraction } = useLeads();
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  const handleToggleFavorite = () => {
    if (isAuthenticated) {
      // Pass ad.id for the API call - optimistic update will find the ad by id or slug
      toggleSaveAd(ad.id);

      // If we are saving (not unsaving), track as lead
      if (!ad.is_saved && ad.seller?.id) {
        recordInteraction({
          seller_id: ad.seller.id,
          source: 'save_ad',
          ad_id: ad.id
        }).catch(console.error);
      }
    } else {
      router.push("/(auth)/login");
    }
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    setShowContactForm(true);
  };

  const handleCallSeller = () => {
    if (ad.seller?.phone) {
      // TODO: Implement phone call functionality
      console.log("Call seller:", ad.seller.phone);
    }
  };

  return (
    <View className="bg-white border-b border-gray-200 px-4 py-6">
      {/* Title and Favorite */}
      <View className="flex-row items-start justify-between gap-3 mb-5">
        <AppText variant="heading" weight="semibold" className="flex-1 text-gray-900 leading-tight">
          {ad.title}
        </AppText>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          className={`p-2.5 rounded-full ${ad.is_saved
            ? 'bg-primary'
            : 'bg-gray-100'
            }`}
        >
          <Ionicons
            name={ad.is_saved ? "heart" : "heart-outline"}
            size={24}
            color={ad.is_saved ? "#ffffff" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      {/* Price */}
      <View className="flex-row items-baseline gap-2 mb-6">
        <AppText weight="bold" className="text-[#FF4F18] text-4xl">
          {formattedPrice}
        </AppText>
        {ad.is_negotiable && (
          <View className="bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
            <AppText weight="bold" className="text-[#FF4F18] text-[10px] uppercase">Negotiable</AppText>
          </View>
        )}
      </View>

      {/* Info Items */}
      <View className="flex-row flex-wrap gap-4 mb-2">
        <View className="flex-row items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
          <Ionicons name="location" size={14} color="#6b7280" />
          <AppText variant="caption" className="text-gray-600">{location}</AppText>
        </View>

        {categoryName && (
          <View className="flex-row items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <Ionicons name="grid" size={14} color="#6b7280" />
            <AppText variant="caption" className="text-gray-600 capitalize">{categoryName}</AppText>
          </View>
        )}

        {ad.views !== undefined && (
          <View className="flex-row items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <Ionicons name="eye" size={14} color="#6b7280" />
            <AppText variant="caption" className="text-gray-600">
              {String(ad.views)}
            </AppText>
          </View>
        )}
      </View>

      {/* Metrics Row */}
      <View className="flex-row gap-4 mt-4 border-t border-gray-50 pt-4">
        {ad.created_at && (
          <View className="flex-1">
            <AppText className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Posted</AppText>
            <AppText weight="semibold" className="text-gray-700 mt-1">
              {new Date(ad.created_at).toLocaleDateString()}
            </AppText>
          </View>
        )}
        {ad.saved_count !== undefined && (
          <View className="flex-1">
            <AppText className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Saved</AppText>
            <AppText weight="semibold" className="text-gray-700 mt-1">
              {String(ad.saved_count)} times
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

