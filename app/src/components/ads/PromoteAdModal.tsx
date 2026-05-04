import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import AppText from "@/components/ui/AppText";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";
import { paymentsApi, type PromotionPackage } from "@/api/payments";
import { cn } from "@/utils/cn";

interface PromoteAdModalProps {
  visible: boolean;
  onClose: () => void;
  ad: any;
}

const getErrorMessage = (error: any) => {
  const data = error?.response?.data;
  const message =
    data?.error ||
    data?.message ||
    data?.detail ||
    (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null);

  if (message) return message;
  if (error?.code === "ERR_NETWORK") {
    return "Could not reach the payment server. Please check your connection and try again.";
  }
  return "Failed to initiate promotion. Please try again.";
};

const CARD_COLORS = [
  { bg: "#f5f3ff", text: "#1e1b4b", icon: "#4f46e5" }, // Purple
  { bg: "#fff7ed", text: "#7c2d12", icon: "#ea580c" }, // Orange
  { bg: "#f0fdf4", text: "#064e3b", icon: "#16a34a" }, // Green
  { bg: "#ecfeff", text: "#164e63", icon: "#0891b2" }, // Cyan
];

export default function PromoteAdModal({
  visible,
  onClose,
  ad,
}: PromoteAdModalProps) {
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const data = await paymentsApi.getPromotionPackages();
      // Filter for active packages only
      setPackages(data.filter((p) => p.is_active));
    } catch (error) {
      console.error("Error fetching packages:", error);
      setPackages([]);
      setFetchError(getErrorMessage(error));
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      fetchPackages();
    } else {
      bottomSheetRef.current?.dismiss();
      setIsLoading(null);
      setFetchError(null);
    }
  }, [fetchPackages, visible]);

  const handlePromote = async (pkg: PromotionPackage) => {
    if (!ad?.id) {
      Alert.alert("Error", "This listing is missing an ID.");
      return;
    }

    setIsLoading(pkg.id);
    try {
      const response = await paymentsApi.initiatePromotion(
        String(ad.id),
        pkg.promotion_type,
        pkg.duration_days,
      );
      if (response.checkout_url) {
        await WebBrowser.openBrowserAsync(response.checkout_url);
        onClose();
      } else {
        Alert.alert("Error", "Payment checkout URL was not returned.");
      }
    } catch (error: any) {
      console.error("Promotion error:", error);
      Alert.alert("Promotion failed", getErrorMessage(error));
    } finally {
      setIsLoading(null);
    }
  };

  if (!ad) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      title="Promote Listing"
      onClose={onClose}
      snapPoints={["85%"]}
    >
      <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
        <AppText className="text-gray-500 mb-8 text-sm text-center px-4">
          Boost visibility for {"\n"}
          <AppText weight="bold" className="text-gray-900">
            {`"${ad.title}"`}
          </AppText>
        </AppText>

        {isFetching && (
          <View className="py-10 items-center">
            <ActivityIndicator color="#FF4F18" />
            <AppText className="text-gray-400 text-xs mt-4">
              Fetching available plans...
            </AppText>
          </View>
        )}

        {fetchError && (
          <View className="bg-red-50 border border-red-100 rounded-3xl p-5 mb-6">
            <AppText weight="bold" className="text-red-600 mb-1">
              Connection Error
            </AppText>
            <AppText className="text-red-500 text-xs leading-5 mb-4">
              {fetchError}
            </AppText>
            <TouchableOpacity
              onPress={fetchPackages}
              className="h-10 rounded-full bg-red-500 items-center justify-center"
            >
              <AppText weight="bold" className="text-white text-xs">
                Try Again
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        <View className="gap-y-4">
          {packages.map((pkg, index) => {
            const color = CARD_COLORS[index % CARD_COLORS.length];
            const isProcessing = isLoading === pkg.id;
            const price = pkg.discount_price || pkg.price;
            const formattedPrice = `${Number.parseFloat(price).toLocaleString()} XOF`;

            return (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => handlePromote(pkg)}
                disabled={isLoading !== null}
                style={{ backgroundColor: color.bg }}
                className="p-5 rounded-[24px] flex-row items-center"
              >
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons
                      name={
                        pkg.promotion_type === "featured"
                          ? "star"
                          : "flash"
                      }
                      size={14}
                      color={color.icon}
                    />
                    <AppText
                      weight="bold"
                      className="text-gray-900 text-[15px]"
                    >
                      {pkg.name}
                    </AppText>
                  </View>

                  <AppText className="text-gray-500 text-[11px] mb-3 leading-4">
                    {pkg.description || `Promote your ad for ${pkg.duration_days} days.`}
                  </AppText>

                  <View className="flex-row items-center gap-3">
                    <View className="bg-white/60 px-2 py-0.5 rounded-md">
                      <AppText weight="bold" className="text-[10px] text-gray-600">
                        {pkg.duration_days} DAYS
                      </AppText>
                    </View>
                    <AppText weight="bold" className="text-primary text-sm">
                      {formattedPrice}
                    </AppText>
                  </View>
                </View>

                <View
                  style={{ backgroundColor: color.icon }}
                  className="w-10 h-10 rounded-full items-center justify-center shadow-sm"
                >
                  {isProcessing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {!isFetching && packages.length === 0 && !fetchError && (
            <View className="py-10 items-center">
              <Ionicons name="basket-outline" size={40} color="#e5e7eb" />
              <AppText className="text-gray-400 text-sm mt-2">
                No promotion plans available right now.
              </AppText>
            </View>
          )}
        </View>

        <View className="mt-12 items-center mb-10">
          <AppText className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
            Secured by Paystack
          </AppText>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
