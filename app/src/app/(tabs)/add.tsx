import { useState, useEffect } from "react";
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Button from "@/components/ui/Button";
import ProgressStepper from "@/components/create-ad/ProgressStepper";
import BasicInfoStep from "@/components/create-ad/BasicInfoStep";
import DetailsStep from "@/components/create-ad/DetailsStep";
import ReviewStep from "@/components/create-ad/ReviewStep";
import { useCreateAd } from "@/hooks/useAds";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/category";

const STEPS = [
  { num: 1, label: 'Basic', desc: '' },
  { num: 2, label: 'Details', desc: '' },
  { num: 3, label: 'Review', desc: '' },
];

interface FormData {
  category: string;
  title: string;
  description: string;
  price: string;
  location: string;
  isNegotiable: boolean;
  contactForPrice: boolean;
  [key: string]: any;
}

export default function AddScreen() {
  const router = useRouter();
  const createAdMutation = useCreateAd();
  const { getCategoryBySlug } = useCategories();
  
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    category: "",
    title: "",
    description: "",
    price: "",
    location: "",
    isNegotiable: true,
    contactForPrice: false,
  });

  useEffect(() => {
    if (formData.category) {
      const categoryNode = getCategoryBySlug(formData.category);
      if (categoryNode) {
        setSelectedCategory(categoryNode);
        setDynamicFields((categoryNode as any).customFields || []);
      }
    } else {
      setDynamicFields([]);
      setSelectedCategory(null);
    }
  }, [formData.category, getCategoryBySlug]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCategorySelect = (category: Category) => {
    handleInputChange('category', category.slug);
  };

  const validateStep = (stepNumber: number): boolean => {
    const nextErrors: Record<string, string> = {};
    
    if (stepNumber === 1) {
      if (!formData.category) {
        Alert.alert("Required", "Please select a category");
        return false;
      }
      if (!formData.title.trim() || formData.title.trim().length < 5) {
        Alert.alert("Required", "Title must be at least 5 characters");
        return false;
      }
    }
    
    if (stepNumber === 2) {
      if (images.length === 0) {
        Alert.alert("Required", "Please add at least one photo");
        return false;
      }
      if (!formData.description.trim() || formData.description.trim().length < 20) {
        Alert.alert("Required", "Description must be at least 20 characters");
        return false;
      }
      if (!formData.location.trim()) {
        Alert.alert("Required", "Please enter a location");
        return false;
      }
      
      for (const field of dynamicFields) {
        if (field.required && !formData[field.name]) {
          Alert.alert("Required", `${field.label} is required`);
          return false;
        }
      }
    }

    setErrors(nextErrors);
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      const attributes: Record<string, any> = {};
      dynamicFields.forEach(field => {
        if (formData[field.name]) {
          attributes[field.name] = formData[field.name];
        }
      });

      const payload = {
        title: formData.title,
        description: formData.description,
        price: formData.contactForPrice ? null : formData.price,
        currency: "XOF",
        category: formData.category,
        location: formData.location,
        is_negotiable: formData.isNegotiable,
        images: images,
        attributes: attributes,
        status: "published" as const,
      };

      await createAdMutation.mutateAsync(payload);
      
      Alert.alert("Success", "Ad created successfully!", [
        { text: "OK", onPress: () => router.push("/profile/my-ads") }
      ]);
      
      setImages([]);
      setFormData({
        category: "",
        title: "",
        description: "",
        price: "",
        location: "",
        isNegotiable: true,
        contactForPrice: false,
      });
      setStep(1);
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Failed to create ad. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-6">
          <ProgressStepper currentStep={step} steps={STEPS} />

          {step === 1 && (
            <BasicInfoStep
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onCategorySelect={handleCategorySelect}
            />
          )}

          {step === 2 && (
            <DetailsStep
              formData={formData}
              errors={errors}
              images={images}
              dynamicFields={dynamicFields}
              onInputChange={handleInputChange}
              onImagesChange={setImages}
            />
          )}

          {step === 3 && (
            <ReviewStep
              formData={formData}
              images={images}
              selectedCategory={selectedCategory}
              dynamicFields={dynamicFields}
            />
          )}

          <View className="h-24" /> 
        </ScrollView>

        <View className="px-4 pb-6 pt-4 border-t border-gray-100 bg-white">
          <View className="flex-row gap-3">
            {step > 1 && (
              <Button 
                onPress={handlePrevious}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            <Button 
              onPress={step < 3 ? handleNext : handleSubmit}
              loading={isSubmitting}
              className={step === 1 ? "w-full" : "flex-1"}
            >
              {step < 3 ? 'Next' : 'Publish'}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
