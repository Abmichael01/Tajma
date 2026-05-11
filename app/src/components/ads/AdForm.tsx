import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import BasicInfoStep from "@/components/create-ad/BasicInfoStep";
import DetailsStep from "@/components/create-ad/DetailsStep";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import { uriToBase64 } from "@/utils/imageUtils";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import CountryModal from "./CountryModal";
import { useAuthStore } from "@/store/authStore";
import { useCountries } from "@/hooks/useLocations";
import { useRef } from "react";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";
import {
    conditionOptions,
    transmissionOptions,
    fuelTypeOptions,
    furnishingOptions,
    availabilityOptions,
} from '@/data/categoriesData';

interface FormData {
    category: string;
    title: string;
    description: string;
    price: string;
    location: string;
    location_id?: number;
    country_id?: number;
    country_name?: string;
    latitude?: number;
    longitude?: number;
    isNegotiable: boolean;
    contactForPrice: boolean;
    [key: string]: any;
}

interface AdFormProps {
    initialData?: any;
    onSubmit: (payload: any) => Promise<void>;
    isSubmitting: boolean;
    submitLabel?: string;
    mode?: 'create' | 'edit';
}

export default function AdForm({
    onSubmit,
    isSubmitting,
    initialData,
    submitLabel,
    mode = 'create'
}: AdFormProps) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { data: countries } = useCountries();
    const { getCategoryBySlug } = useCategories();
    const { alertConfig, showAlert, hideAlert } = useAlert();
    const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
    const sellerSetupSheetRef = useRef<BottomSheetRef>(null);
    const router = useRouter();

    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [dynamicFields, setDynamicFields] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<FormData>({
        category: initialData?.category || "",
        title: initialData?.title || "",
        description: initialData?.description || "",
        price: initialData?.price ? String(initialData.price) : "",
        location: initialData?.location || user?.location || "",
        location_id: initialData?.location_id || user?.location_id || undefined,
        country_id: initialData?.country_id || user?.country_id || undefined,
        country_name: initialData?.country_name || (countries?.find(c => c.id === user?.country_id)?.name) || "",
        latitude: initialData?.latitude,
        longitude: initialData?.longitude,
        isNegotiable: initialData?.is_negotiable ?? true,
        contactForPrice: initialData?.price === null,
        ...(initialData?.attributes || {})
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

    // Show setup reminder on mount if not setup
    useEffect(() => {
        if (!user?.is_seller_account_setup && mode === 'create') {
            const timer = setTimeout(() => {
                sellerSetupSheetRef.current?.present();
            }, 500); // Small delay for smooth entry
            return () => clearTimeout(timer);
        }
    }, [user?.is_seller_account_setup, mode]);

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
        if (mode === 'edit') return; // Cannot change category during edit
        handleInputChange('category', category.slug);
        
        // Check if seller setup is required (not for jobs)
        if (category.slug !== 'jobs' && category.type !== 'job' && !user?.is_seller_account_setup) {
            sellerSetupSheetRef.current?.present();
        }
    };

    const handleLocationSelected = (item: any) => {
        if (!item) {
            setFormData(prev => ({
                ...prev,
                location: "",
                location_id: undefined,
                country_id: undefined,
                country_name: ""
            }));
        } else {
            // Find country name if possible
            const country = countries?.find(c => c.id === (item.country_id || item.id));
            
            setFormData(prev => ({
                ...prev,
                location: item.name,
                location_id: item.level === 2 ? item.id : undefined,
                country_id: item.country_id || (item.level === 0 ? item.id : undefined),
                country_name: country?.name || ""
            }));
        }
        setIsLocationPickerVisible(false);
    };

    const normalizeFields = (fields: any[] | string[]): any[] => {
        if (!fields || fields.length === 0) return [];
        if (typeof fields[0] === 'object' && 'name' in fields[0]) return fields;

        const fieldConfigs: Record<string, any> = {
            brand: { name: 'brand', label: t('create_ad.fields.brand'), type: 'text' },
            model: { name: 'model', label: t('create_ad.fields.model'), type: 'text' },
            condition: { name: 'condition', label: t('create_ad.fields.condition'), type: 'select', options: conditionOptions },
            year: { name: 'year', label: t('create_ad.fields.year'), type: 'number' },
            mileage: { name: 'mileage', label: t('create_ad.fields.mileage'), type: 'number' },
            transmission: { name: 'transmission', label: t('create_ad.fields.transmission'), type: 'select', options: transmissionOptions },
            fuel_type: { name: 'fuel_type', label: t('create_ad.fields.fuelType'), type: 'select', options: fuelTypeOptions },
            bedrooms: { name: 'bedrooms', label: t('create_ad.fields.bedrooms'), type: 'number' },
            bathrooms: { name: 'bathrooms', label: t('create_ad.fields.bathrooms'), type: 'number' },
            furnishing: { name: 'furnishing', label: t('create_ad.fields.furnishing'), type: 'select', options: furnishingOptions },
            availability: { name: 'availability', label: t('create_ad.fields.availability'), type: 'select', options: availabilityOptions },
        };

        return (fields as string[]).map(field => fieldConfigs[field] || { name: field, label: field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' '), type: 'text' });
    };

    const validateForm = (): boolean => {
        const nextErrors: Record<string, string> = {};

        if (!formData.title.trim() || formData.title.trim().length < 5) {
            nextErrors.title = t('create_ad.validation.titleMin');
            showAlert({
                title: t('common.required'),
                message: t('create_ad.validation.titleRequired'),
                icon: "alert-circle-outline",
                iconColor: "#FF4F18",
                buttons: [{ text: "OK" }]
            });
            return false;
        }

        if (!formData.category) {
            showAlert({
                title: t('common.required'),
                message: t('create_ad.validation.categoryRequired'),
                icon: "list-outline",
                iconColor: "#FF4F18",
                buttons: [{ text: "OK" }]
            });
            return false;
        }

        if (images.length === 0) {
            showAlert({
                title: t('common.required'),
                message: t('create_ad.validation.photoRequired'),
                icon: "camera-outline",
                iconColor: "#FF4F18",
                buttons: [{ text: "OK" }]
            });
            return false;
        }

        if (!formData.description.trim() || formData.description.trim().length < 20) {
            nextErrors.description = t('create_ad.validation.descriptionMin');
        }
        // Location is optional now as it fallbacks to profile

        // Robust custom fields validation
        const normalizedFields = normalizeFields(dynamicFields);
        for (const field of normalizedFields) {
            const value = formData[field.name];
            if (field.required) {
                if (field.type === 'array') {
                    if (!Array.isArray(value) || value.length === 0) {
                        toastError(t('create_ad.validation.fieldRequired', { field: field.label }));
                        return false;
                    }
                } else if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
                    toastError(t('create_ad.validation.fieldRequired', { field: field.label }));
                    return false;
                }
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return false;
        }

        setErrors(nextErrors);
        return true;
    };

    const toastError = (msg: string) => {
        showAlert({
            title: t('common.required'),
            message: msg,
            icon: "alert-circle-outline",
            iconColor: "#FF4F18",
            buttons: [{ text: "OK" }]
        });
    };

    const buildAttributes = () => {
        const attributes: Record<string, any> = {};
        const normalizedFields = normalizeFields(dynamicFields);

        normalizedFields.forEach(field => {
            const value = formData[field.name];

            if (value !== undefined && value !== '' && value !== null) {
                if (field.type === 'array') {
                    attributes[field.name] = Array.isArray(value) ? value : [];
                } else {
                    attributes[field.name] = value;
                }
            }
        });

        // Add CV file markers if present (like frontend)
        if (formData.cv_file_name) {
            attributes.cv_file_name = formData.cv_file_name;
        }

        return attributes;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const processedImages = await Promise.all(
                images.map(async (uri) => {
                    if (uri.startsWith('http') || uri.startsWith('/media/')) {
                        return uri;
                    }
                    return await uriToBase64(uri);
                })
            );

            const payload = {
                title: formData.title,
                description: formData.description,
                price: formData.contactForPrice ? null : formData.price,
                currency: "XOF",
                category: formData.category,
                location: formData.location || user?.location || "",
                location_id: formData.location_id || user?.location_id,
                country: formData.country_id || user?.country_id,
                is_negotiable: formData.isNegotiable,
                images: processedImages,
                attributes: buildAttributes(),
                status: "draft" as const, // Always create as draft for preview
                latitude: formData.latitude,
                longitude: formData.longitude,
            };

            await onSubmit(payload);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
            >
                <ScrollView
                    className="flex-1 px-4 pt-6"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                >
                    <BasicInfoStep
                        formData={formData}
                        errors={errors}
                        onInputChange={handleInputChange}
                        onCategorySelect={handleCategorySelect}
                        isEdit={mode === 'edit'}
                    />

                    {formData.category ? (
                        <>
                            <View className="border-t border-gray-100 my-4" />

                            <DetailsStep
                                formData={formData}
                                errors={errors}
                                images={images}
                                dynamicFields={dynamicFields}
                                onInputChange={handleInputChange}
                                onImagesChange={setImages}
                                onOpenMapPicker={() => setIsLocationPickerVisible(true)}
                            />
                        </>
                    ) : (
                        <View className="items-center py-10 px-6">
                            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                                <AppText className="text-3xl">📋</AppText>
                            </View>
                            <AppText weight="bold" className="text-gray-900 text-base text-center mb-1">
                                {t('create_ad.pickCategoryTitle')}
                            </AppText>
                            <AppText className="text-gray-500 text-sm text-center">
                                {t('create_ad.pickCategoryDesc')}
                            </AppText>
                        </View>
                    )}

                    {/* Publish button — flows at the end of the form, not pinned to viewport */}
                    <View className="px-2 pt-2 pb-2">
                        <Button
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            disabled={!formData.category}
                            className="w-full"
                            style={{ backgroundColor: formData.category ? '#FF4F18' : '#cbd5e1' }}
                        >
                            {submitLabel || (mode === 'create' ? t('common.preview') : t('create_ad.actions.update'))}
                        </Button>
                    </View>

                    {/* Bottom spacer so the button clears the tab bar */}
                    <View style={{ height: 100 + insets.bottom }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                icon={alertConfig.icon}
                iconColor={alertConfig.iconColor}
                buttons={alertConfig.buttons}
                onDismiss={hideAlert}
            />

            <CountryModal
                visible={isLocationPickerVisible}
                onClose={() => setIsLocationPickerVisible(false)}
                onSelect={handleLocationSelected}
                selectedCountryId={formData.country_id}
                mode="picker"
            />

            <BottomSheet
                ref={sellerSetupSheetRef}
                title={t('profile.completeSetupTitle')}
                snapPoints={["55%"]}
                scrollable={false}
            >
                <View className="px-10 py-6 items-center">
                    <View className="w-24 h-24 bg-primary/10 rounded-[32px] items-center justify-center mb-6 rotate-[-10deg]">
                        <Ionicons name="storefront" size={48} color="#FF4F18" />
                    </View>
                    
                    <AppText weight="bold" className="text-gray-900 text-2xl text-center mb-3">
                        {t('profile.completeSetupTitle')}
                    </AppText>
                    
                    <AppText className="text-gray-500 text-center leading-6 text-base mb-8">
                        {t('profile.completeSetupDesc')}
                    </AppText>
                    
                    <Button 
                        onPress={() => {
                            sellerSetupSheetRef.current?.dismiss();
                            router.push("/seller/setup");
                        }}
                        className="w-full h-14 rounded-full"
                    >
                        {t('profile.sellerSetup')}
                    </Button>
                    
                    <TouchableOpacity 
                        onPress={() => sellerSetupSheetRef.current?.dismiss()}
                        className="mt-4 p-2"
                    >
                        <AppText className="text-gray-400 font-bold">{t('profile.maybeLater')}</AppText>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </View>
    );
}
