import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { useToggleSaveAd } from "@/hooks/useSavedAds";

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
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  const handleToggleFavorite = () => {
    if (isAuthenticated) {
      // Pass ad.id for the API call - optimistic update will find the ad by id or slug
      toggleSaveAd(ad.id);
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
          className={`p-2.5 rounded-full ${
            ad.is_saved
              ? 'bg-red-50'
              : 'bg-gray-100'
          }`}
        >
          <Ionicons
            name={ad.is_saved ? "heart" : "heart-outline"}
            size={24}
            color={ad.is_saved ? "#ef4444" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      {/* Price */}
      <AppText variant="heading" weight="semibold" className="text-primary mb-6 text-3xl">
        {formattedPrice}
      </AppText>

      {/* Info Items */}
      <View className="space-y-6 mb-6">
        <View className="flex-row items-center gap-2">
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <AppText variant="default" className="text-gray-600">{location}</AppText>
        </View>
        {ad.views !== undefined && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="eye-outline" size={16} color="#6b7280" />
            <AppText variant="default" className="text-gray-600">
              {String(ad.views)} views
            </AppText>
          </View>
        )}
        {ad.saved_count !== undefined && ad.saved_count > 0 && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="heart-outline" size={16} color="#6b7280" />
            <AppText variant="default" className="text-gray-600">
              {String(ad.saved_count)} {ad.saved_count === 1 ? 'person saved' : 'people saved'}
            </AppText>
          </View>
        )}
        {categoryName && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="pricetag-outline" size={16} color="#6b7280" />
            <AppText variant="default" className="text-gray-600 capitalize">{categoryName}</AppText>
          </View>
        )}
        {ad.created_at && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <AppText variant="default" className="text-gray-600">
              {new Date(ad.created_at).toLocaleDateString()}
            </AppText>
          </View>
        )}
      </View>

      {/* Actions */}
      {isOwner ? (
        <View className="space-y-3 mt-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            leftIcon={<Ionicons name="create-outline" size={20} color="#0f172b" />}
            onPress={() => {
              // TODO: Navigate to edit ad
              console.log("Edit ad");
            }}
          >
            Edit Ad
          </Button>
        </View>
      ) : (
        <View className="flex flex-col gap-5 mt-2">
          {!showContactForm ? (
            <Button
              variant="default"
              size="lg"
              className="w-full"
              leftIcon={<Ionicons name="chatbubble-ellipses-outline" size={20} color="#ffffff" />}
              onPress={handleContactSeller}
            >
              Contact Seller
            </Button>
          ) : (
            <View className="space-y-3">
              {/* TODO: Add contact form */}
              <AppText className="text-gray-600">Contact form coming soon...</AppText>
            </View>
          )}
          {ad.seller?.phone && (
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              leftIcon={<Ionicons name="call-outline" size={20} color="#ffffff" />}
              onPress={handleCallSeller}
            >
              Call Seller
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

