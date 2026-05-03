import React, {
  useCallback,
  useEffect,
  useMemo,
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

type PromotionType = "boost" | "featured";

interface PromoteAdModalProps {
  visible: boolean;
  onClose: () => void;
  ad: any;
}

const getPackagePrice = (pkg?: PromotionPackage | null) => {
  if (!pkg) return "...";
  const price = pkg.discount_price || pkg.price;
  return `${Number.parseFloat(price).toLocaleString()} XOF`;
};

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

export default function PromoteAdModal({
  visible,
  onClose,
  ad,
}: PromoteAdModalProps) {
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const [isLoading, setIsLoading] = useState<PromotionType | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const data = await paymentsApi.getPromotionPackages();
      setPackages(data);
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

  const availableDurations = useMemo(
    () =>
      Array.from(new Set(packages.map((pkg) => pkg.duration_days))).sort(
        (a, b) => a - b,
      ),
    [packages],
  );

  useEffect(() => {
    if (
      availableDurations.length > 0 &&
      !availableDurations.includes(selectedDuration)
    ) {
      setSelectedDuration(availableDurations[0]);
    }
  }, [availableDurations, selectedDuration]);

  const handlePromote = async (type: PromotionType) => {
    if (!ad?.id) {
      Alert.alert("Promotion failed", "This listing is missing an ad ID.");
      return;
    }

    const selectedPackage = packages.find(
      (pkg) =>
        pkg.promotion_type === type && pkg.duration_days === selectedDuration,
    );
    if (!selectedPackage) {
      Alert.alert(
        "Package unavailable",
        "Please choose another duration or try again in a moment.",
      );
      return;
    }

    setIsLoading(type);
    try {
      const response = await paymentsApi.initiatePromotion(
        String(ad.id),
        type,
        selectedDuration,
      );
      if (response.checkout_url) {
        await WebBrowser.openBrowserAsync(response.checkout_url);
        onClose();
      } else {
        Alert.alert(
          "Promotion failed",
          "Payment checkout URL was not returned.",
        );
      }
    } catch (error: any) {
      console.error("Promotion error:", error);
      Alert.alert("Promotion failed", getErrorMessage(error));
    } finally {
      setIsLoading(null);
    }
  };

  if (!ad) return null;

  const renderPackage = (type: PromotionType) => {
    const pkg = packages.find(
      (item) =>
        item.promotion_type === type && item.duration_days === selectedDuration,
    );
    if (!pkg && !isFetching) return null;

    const isProcessing = isLoading === type;
    const config =
      type === "boost"
        ? {
            name: "Ad Boost",
            icon: "flash-outline" as const,
            color: "#FF4F18",
            bgColor: "#fff7ed",
            description: "Move your ad to the top of search results once.",
            features: ["Priority placement", "Highlight badge"],
          }
        : {
            name: "Featured Ad",
            icon: "star-outline" as const,
            color: "#1e1b4b",
            bgColor: "#f5f3ff",
            description: "Sticky placement on homepage and category top.",
            features: [
              "Homepage placement",
              "Fixed position",
              "Max visibility",
            ],
          };

    return (
      <View
        key={type}
        style={{ backgroundColor: config.bgColor }}
        className="p-5 rounded-[24px] border border-transparent mb-4"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center gap-3 flex-1 pr-4">
            <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center shadow-sm">
              <Ionicons name={config.icon} size={20} color={config.color} />
            </View>
            <View className="flex-1">
              <AppText weight="bold" className="text-gray-900">
                {config.name}
              </AppText>
              <AppText className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {selectedDuration} Days
              </AppText>
            </View>
          </View>
          <AppText weight="bold" className="text-lg text-gray-900">
            {getPackagePrice(pkg)}
          </AppText>
        </View>

        <AppText className="text-xs text-gray-600 mb-4 italic leading-5">
          {config.description}
        </AppText>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {config.features.map((feature) => (
            <View
              key={feature}
              className="flex-row items-center gap-1 bg-white/50 px-2.5 py-1 rounded-full"
            >
              <Ionicons name="checkmark-circle" size={12} color="#10b981" />
              <AppText weight="semibold" className="text-[10px] text-gray-700">
                {feature}
              </AppText>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => handlePromote(type)}
          disabled={isLoading !== null || isFetching || !pkg}
          style={{
            backgroundColor: type === "featured" ? "#1e1b4b" : "#FF4F18",
            opacity: isFetching || !pkg ? 0.5 : 1,
          }}
          className="w-full h-12 rounded-full items-center justify-center shadow-sm"
        >
          {isProcessing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <View className="flex-row items-center">
              <AppText weight="bold" className="text-white mr-2">
                Select {config.name}
              </AppText>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      title="Promote Listing"
      onClose={onClose}
      snapPoints={["85%"]}
    >
      <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
        <AppText className="text-gray-500 mb-6 text-sm text-center">
          Choose a duration and package for {"\n"}
          <AppText weight="bold" className="text-gray-900">
            {`"${ad.title}"`}
          </AppText>
        </AppText>

        {fetchError ? (
          <View className="bg-red-50 border border-red-100 rounded-3xl p-5 mb-6">
            <View className="flex-row items-start gap-3">
              <Ionicons name="alert-circle-outline" size={22} color="#ef4444" />
              <View className="flex-1">
                <AppText weight="bold" className="text-red-600 mb-1">
                  Could not load packages
                </AppText>
                <AppText className="text-red-500 text-xs leading-5">
                  {fetchError}
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              onPress={fetchPackages}
              className="h-11 rounded-full bg-red-500 items-center justify-center mt-4"
            >
              <AppText weight="bold" className="text-white">
                Retry
              </AppText>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="flex-row justify-center gap-2 mb-8 flex-wrap">
          {availableDurations.length > 0 ? (
            availableDurations.map((duration) => (
              <TouchableOpacity
                key={duration}
                onPress={() => setSelectedDuration(duration)}
                className={cn(
                  "px-6 py-3 rounded-full border-2",
                  selectedDuration === duration
                    ? "border-primary bg-primary/5"
                    : "border-gray-100 bg-gray-50",
                )}
              >
                <AppText
                  weight="bold"
                  className={cn(
                    "text-xs",
                    selectedDuration === duration
                      ? "text-primary"
                      : "text-gray-400",
                  )}
                >
                  {duration} {duration === 1 ? "DAY" : "DAYS"}
                </AppText>
              </TouchableOpacity>
            ))
          ) : isFetching ? (
            <ActivityIndicator size="small" color="#FF4F18" />
          ) : (
            <AppText className="text-gray-400 text-sm">
              No promotion packages are available.
            </AppText>
          )}
        </View>

        <View className="space-y-4">
          {renderPackage("boost")}
          {renderPackage("featured")}
        </View>

        <View className="mt-4 items-center">
          <AppText className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            Secured by Paystack
          </AppText>
        </View>

        <View className="h-20" />
      </ScrollView>
    </BottomSheet>
  );
}
