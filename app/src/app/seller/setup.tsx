import { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";

import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TextArea from "@/components/ui/TextArea";
import Avatar from "@/components/ui/Avatar";
import ProgressStepper from "@/components/create-ad/ProgressStepper";
import ScreenHeader from "@/components/ui/ScreenHeader";
import CountryModal from "@/components/ads/CountryModal";
import LocationSelector from "@/components/ads/LocationSelector";
import FormGroup from "@/components/ui/FormGroup";

import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile } from "@/hooks/useAuth";
import { useCountries } from "@/hooks/useLocations";
import { uriToBase64 } from "@/utils/imageUtils";

const STEPS = [
  { num: 1, label: "Contact", desc: "Contact Details" },
  { num: 2, label: "Business", desc: "Business Info" },
  { num: 3, label: "Review", desc: "Final Review" },
];

export default function SellerSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, completeSellerSetup } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const { data: countries } = useCountries();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);

  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    country_id: user?.country_id || undefined,
    country_name: "",
    location: user?.location || "",
    location_id: user?.location_id || undefined,
    address: user?.address || "",
    business_name: user?.business_name || "",
    business_type: user?.business_type || "",
    website: user?.website || "",
    bio: user?.bio || "",
    avatar: user?.avatar || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsAvatarLoading(true);
      try {
        const base64 = await uriToBase64(result.assets[0].uri);
        handleInputChange("avatar", base64);
      } catch (err) {
        console.error("Failed to process image:", err);
      } finally {
        setIsAvatarLoading(false);
      }
    }
  };

  const handleLocationSelected = (item: any) => {
    if (!item) {
      setFormData((prev) => ({
        ...prev,
        location: "",
        location_id: undefined,
        country_id: undefined,
        country_name: "",
      }));
    } else {
      const country = countries?.find(
        (c) => c.id === (item.country_id || item.id),
      );
      setFormData((prev) => ({
        ...prev,
        location: item.name,
        location_id: item.level === 2 ? item.id : undefined,
        country_id: item.country_id || (item.level === 0 ? item.id : undefined),
        country_name: country?.name || "",
      }));
    }
    setIsLocationPickerVisible(false);
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.phone.trim()) newErrors.phone = t("common.required");
      if (!formData.country_id) newErrors.location = t("common.required");
      if (!formData.address.trim()) newErrors.address = t("common.required");
    } else if (currentStep === 2) {
      if (!formData.business_name.trim()) newErrors.business_name = t("common.required");
      if (!formData.business_type.trim()) newErrors.business_type = t("common.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        phone: formData.phone,
        location: formData.location_id || formData.location || undefined,
        country: formData.country_id,
        address: formData.address,
        business_name: formData.business_name,
        business_type: formData.business_type,
        website: formData.website || undefined,
        bio: formData.bio || undefined,
        avatar: formData.avatar?.startsWith("data:") ? formData.avatar : undefined,
      };

      await updateProfile.mutateAsync(payload);
      completeSellerSetup();
      router.replace("/profile");
    } catch (error: any) {
      console.error(error);
      Alert.alert(t("common.error"), error?.response?.data?.message || "Failed to update profile");
    }
  };

  const renderStep1 = () => (
    <Animated.View
      entering={FadeInRight.duration(400)}
      exiting={FadeOutLeft.duration(400)}
      className="gap-4"
    >
      <View className="items-center mb-6">
        <TouchableOpacity onPress={handlePickImage} className="relative">
          <Avatar
            src={formData.avatar}
            size={120}
            fallback={user?.first_name?.[0] || "U"}
            className="rounded-full border-4 border-white shadow-lg"
          />
          <View className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full items-center justify-center border-4 border-white shadow-md">
            <Ionicons name="camera" size={18} color="white" />
          </View>
        </TouchableOpacity>
        <AppText weight="bold" className="text-gray-900 mt-4 text-lg">
          {t("profile.uploadPhoto")}
        </AppText>
      </View>

      <FormGroup label={t("profile.phone")} error={errors.phone}>
        <Input
          value={formData.phone}
          onChangeText={(v) => handleInputChange("phone", v)}
          keyboardType="phone-pad"
          placeholder="+227 -- -- -- --"
          error={!!errors.phone}
          leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
        />
      </FormGroup>

      <LocationSelector
        locationName={formData.location}
        countryName={formData.country_name}
        onPress={() => setIsLocationPickerVisible(true)}
        error={errors.location}
      />

      <FormGroup label={t("profile.address")} error={errors.address}>
        <Input
          value={formData.address}
          onChangeText={(v) => handleInputChange("address", v)}
          placeholder={t("profile.addressPlaceholder")}
          error={!!errors.address}
          leftIcon={<Ionicons name="map-outline" size={20} color="#9ca3af" />}
        />
      </FormGroup>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View
      entering={FadeInRight.duration(400)}
      exiting={FadeOutLeft.duration(400)}
      className="gap-4"
    >
      <FormGroup label={t("profile.businessName")} error={errors.business_name}>
        <Input
          value={formData.business_name}
          onChangeText={(v) => handleInputChange("business_name", v)}
          placeholder={t("profile.businessNamePlaceholder")}
          error={!!errors.business_name}
          leftIcon={<Ionicons name="business-outline" size={20} color="#9ca3af" />}
        />
      </FormGroup>

      <FormGroup label={t("profile.businessType")} error={errors.business_type}>
        <Input
          value={formData.business_type}
          onChangeText={(v) => handleInputChange("business_type", v)}
          placeholder="e.g. Retail, Service, Individual"
          error={!!errors.business_type}
          leftIcon={<Ionicons name="pricetag-outline" size={20} color="#9ca3af" />}
        />
      </FormGroup>

      <FormGroup label={t("profile.website")}>
        <Input
          value={formData.website}
          onChangeText={(v) => handleInputChange("website", v)}
          placeholder="https://example.com"
          autoCapitalize="none"
          keyboardType="url"
          leftIcon={<Ionicons name="globe-outline" size={20} color="#9ca3af" />}
        />
      </FormGroup>

      <FormGroup label={t("profile.bio")}>
        <TextArea
          value={formData.bio}
          onChangeText={(v) => handleInputChange("bio", v)}
          placeholder={t("profile.bioPlaceholder")}
        />
      </FormGroup>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View
      entering={FadeInRight.duration(400)}
      exiting={FadeOutLeft.duration(400)}
      className="gap-4"
    >
      <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <View className="flex-row items-center mb-6">
          <Avatar src={formData.avatar} size={60} fallback="U" className="rounded-full" />
          <View className="ml-4 flex-1">
            <AppText weight="bold" className="text-gray-900 text-lg">
              {formData.business_name || user?.full_name}
            </AppText>
            <AppText className="text-gray-500">{formData.business_type}</AppText>
          </View>
        </View>

        <View className="gap-4">
          <View className="flex-row items-center">
            <Ionicons name="call" size={18} color="#FF4F18" />
            <AppText className="ml-3 text-gray-700">{formData.phone}</AppText>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location" size={18} color="#FF4F18" />
            <AppText className="ml-3 text-gray-700">
              {formData.country_name}
              {formData.location ? ` > ${formData.location}` : ""}
            </AppText>
          </View>
          {formData.website && (
            <View className="flex-row items-center">
              <Ionicons name="globe" size={18} color="#FF4F18" />
              <AppText className="ml-3 text-gray-700">{formData.website}</AppText>
            </View>
          )}
          <View className="mt-2 border-t border-gray-50 pt-4">
            <AppText weight="bold" className="text-gray-900 mb-2">
              {t("profile.bio")}
            </AppText>
            <AppText className="text-gray-600 leading-5">
              {formData.bio || t("profile.noBio")}
            </AppText>
          </View>
        </View>
      </View>
      
      <View className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex-row items-center">
        <Ionicons name="information-circle" size={24} color="#FF4F18" />
        <AppText className="ml-3 text-orange-800 text-xs flex-1">
          {t("profile.setupInfoNotice")}
        </AppText>
      </View>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      <ScreenHeader
        title={t("profile.sellerSetup")}
        subtitle={STEPS[currentStep - 1].label}
        onBackPress={handleBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8">
            <ProgressStepper currentStep={currentStep} steps={STEPS} />
          </View>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <Button
          onPress={handleNext}
          loading={updateProfile.isPending}
          className="w-full"
        >
          {currentStep === STEPS.length ? t("common.finish") : t("common.continue")}
        </Button>
      </View>

      <CountryModal
        visible={isLocationPickerVisible}
        onClose={() => setIsLocationPickerVisible(false)}
        onSelect={handleLocationSelected}
        selectedCountryId={formData.country_id}
      />
    </View>
  );
}
