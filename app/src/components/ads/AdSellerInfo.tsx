import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Alert } from "react-native";
import { useCreateNotification } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import { useLeads } from "@/hooks/useLeads";

interface Seller {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  is_verified?: boolean;
  date_joined?: string;
  location?: string;
  phone?: string;
}

interface AdSellerInfoProps {
  seller: Seller;
  adId?: string;
  className?: string;
}

export default function AdSellerInfo({
  seller,
  adId,
  className = "",
}: AdSellerInfoProps) {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { mutate: notifySeller } = useCreateNotification();
  const { recordInteraction } = useLeads();
  const [showPhone, setShowPhone] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const sellerName =
    seller.first_name && seller.last_name
      ? `${seller.first_name} ${seller.last_name}`
      : seller.username || seller.email?.split("@")[0] || "Unknown Seller";

  // Use username if available, otherwise fallback to ID.
  // Avoid using email or generic 'profile' as it breaks routing.
  const sellerProfileSlug = seller.username || seller.id;

  const handleViewProfile = () => {
    if (isAuthenticated && String(currentUser?.id) !== String(seller.id)) {
      recordInteraction({
        seller_id: seller.id,
        source: "profile_view",
        ad_id: adId,
      }).catch(console.error);
    }
    router.push(`/users/${sellerProfileSlug}`);
  };

  return (
    <View
      className={`bg-white border-b border-gray-200 px-4 py-6 ${className}`}
    >
      <AppText
        variant="subheading"
        weight="semibold"
        className="text-gray-900 mb-5"
      >
        Seller Information
      </AppText>

      <View className="flex-row items-center gap-3 mb-5">
        <Avatar src={seller.avatar} alt={sellerName} size={48} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <AppText
              variant="default"
              weight="medium"
              className="text-gray-900"
            >
              {sellerName}
            </AppText>
            {seller.is_verified && (
              <Ionicons name="shield-checkmark" size={16} color="#10b981" />
            )}
          </View>
          <AppText variant="caption" className="text-gray-600">
            {seller.location || "Location not specified"}
          </AppText>
        </View>
      </View>

      {seller.date_joined && (
        <AppText variant="caption" className="text-gray-600 mb-5">
          Member since {new Date(seller.date_joined).getFullYear()}
        </AppText>
      )}

      {/* Phone Number Section */}
      {seller.phone && (
        <View className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <AppText
                variant="caption"
                className="text-gray-500 mb-1 uppercase font-bold tracking-wider"
              >
                Seller Contact
              </AppText>
              <AppText weight="bold" className="text-gray-900 text-lg">
                {showPhone
                  ? seller.phone
                  : `${seller.phone.substring(0, 4)} ••• •••`}
              </AppText>
            </View>

            {!showPhone ? (
              <TouchableOpacity
                onPress={() => {
                  setShowPhone(true);
                  // Notify seller and record interaction
                  if (
                    isAuthenticated &&
                    String(currentUser?.id) !== String(seller.id)
                  ) {
                    recordInteraction({
                      seller_id: seller.id,
                      source: "phone_view",
                      ad_id: adId,
                    }).catch(console.error);

                    notifySeller({
                      recipient: Number(seller.id),
                      type: "phone_view",
                      title: "Phone Number Viewed",
                      message: `${currentUser?.full_name || currentUser?.username} viewed your phone number on an ad.`,
                      related_ad: adId,
                      related_user: Number(currentUser?.id),
                    });
                  }
                }}
                className="bg-primary px-4 py-2 rounded-full"
              >
                <AppText weight="bold" className="text-white text-xs">
                  Show
                </AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(seller.phone!);
                  setIsCopying(true);
                  setTimeout(() => setIsCopying(false), 2000);
                }}
                className="bg-gray-200 px-4 py-2 rounded-full flex-row items-center gap-2"
              >
                <Ionicons
                  name={isCopying ? "checkmark-circle" : "copy-outline"}
                  size={14}
                  color="#0f172b"
                />
                <AppText weight="bold" className="text-gray-900 text-xs">
                  {isCopying ? "Copied" : "Copy"}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View className="flex-row gap-3 mt-2">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onPress={handleViewProfile}
        >
          View Profile
        </Button>
      </View>
    </View>
  );
}
