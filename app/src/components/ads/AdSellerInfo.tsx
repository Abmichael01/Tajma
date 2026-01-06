import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

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
}

interface AdSellerInfoProps {
  seller: Seller;
  className?: string;
}

export default function AdSellerInfo({ seller, className = "" }: AdSellerInfoProps) {
  const router = useRouter();
  const sellerName = seller.first_name && seller.last_name
    ? `${seller.first_name} ${seller.last_name}`
    : seller.username || seller.email?.split('@')[0] || 'Unknown Seller';

  const sellerProfileSlug = seller.username || seller.email?.split('@')[0] || 'profile';

  const handleViewProfile = () => {
    router.push(`/users/${sellerProfileSlug}`);
  };

  return (
    <View className={`bg-white border-b border-gray-200 px-4 py-6 ${className}`}>
      <AppText variant="subheading" weight="semibold" className="text-gray-900 mb-5">
        Seller Information
      </AppText>
      
      <View className="flex-row items-center gap-3 mb-5">
        <Avatar
          src={seller.avatar}
          alt={sellerName}
          size={48}
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <AppText variant="default" weight="medium" className="text-gray-900">
              {sellerName}
            </AppText>
            {seller.is_verified && (
              <Ionicons name="shield-checkmark" size={16} color="#10b981" />
            )}
          </View>
          <AppText variant="caption" className="text-gray-600">
            {seller.location || 'Location not specified'}
          </AppText>
        </View>
      </View>

      {seller.date_joined && (
        <AppText variant="caption" className="text-gray-600 mb-5">
          Member since {new Date(seller.date_joined).getFullYear()}
        </AppText>
      )}

      <Button
        variant="outline"
        size="lg"
        className="w-full mt-2"
        onPress={handleViewProfile}
      >
        View Profile
      </Button>
    </View>
  );
}

