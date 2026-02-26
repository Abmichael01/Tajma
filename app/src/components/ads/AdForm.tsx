import { useState, useEffect } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import BasicInfoStep from "@/components/create-ad/BasicInfoStep";
import DetailsStep from "@/components/create-ad/DetailsStep";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import { uriToBase64 } from "@/utils/imageUtils";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
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
    initialData,
    onSubmit,
    isSubmitting,
    submitLabel = "Publish Now",
    mode = 'create'
}: AdFormProps) {
    const { getCategoryBySlug } = useCategories();
    const insets = useSafeAreaInsets();
    const { alertConfig, showAlert, hideAlert } = useAlert();

    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [dynamicFields, setDynamicFields] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<FormData>({
        category: initialData?.category || "",
        title: initialData?.title || "",
        description: initialData?.description || "",
        price: initialData?.price ? String(initialData.price) : "",
        location: initialData?.location || "",
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
    };

    const normalizeFields = (fields: any[] | string[]): any[] => {
        if (!fields || fields.length === 0) return [];
        if (typeof fields[0] === 'object' && 'name' in fields[0]) return fields;

        const fieldConfigs: Record<string, any> = {
            brand: { name: 'brand', label: 'Brand', type: 'text' },
            model: { name: 'model', label: 'Model', type: 'text' },
            condition: { name: 'condition', label: 'Condition', type: 'select', options: conditionOptions },
            year: { name: 'year', label: 'Year', type: 'number' },
            mileage: { name: 'mileage', label: 'Mileage (km)', type: 'number' },
            transmission: { name: 'transmission', label: 'Transmission', type: 'select', options: transmissionOptions },
            fuel_type: { name: 'fuel_type', label: 'Fuel Type', type: 'select', options: fuelTypeOptions },
            bedrooms: { name: 'bedrooms', label: 'Bedrooms', type: 'number' },
            bathrooms: { name: 'bathrooms', label: 'Bathrooms', type: 'number' },
            furnishing: { name: 'furnishing', label: 'Furnishing', type: 'select', options: furnishingOptions },
            availability: { name: 'availability', label: 'Availability', type: 'select', options: availabilityOptions },
        };

        return (fields as string[]).map(field => fieldConfigs[field] || { name: field, label: field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' '), type: 'text' });
    };

    const validateForm = (): boolean => {
        const nextErrors: Record<string, string> = {};

        if (!formData.title.trim() || formData.title.trim().length < 5) {
            nextErrors.title = "Title must be at least 5 characters";
            showAlert({
                title: "Required",
                message: "Please enter a valid title",
                icon: "alert-circle-outline",
                iconColor: "#FF4F18",
                buttons: [{ text: "OK" }]
            });
            return false;
        }

        if (!formData.category) {
            showAlert({
                title: "Required",
                message: "Please select a category",
                icon: "list-outline",
                iconColor: "#FF4F18",
                buttons: [{ text: "OK" }]
            });
            return false;
        }

        if (images.length === 0) {
            showAlert({
                title: "Required",
                message: "Please add at least one photo",
                icon: "camera-outline",
                iconColor: "#FF4F18",
                buttons: [{ text: "OK" }]
            });
            return false;
        }

        if (!formData.description.trim() || formData.description.trim().length < 20) {
            nextErrors.description = "Description must be at least 20 characters";
        }
        if (!formData.location.trim()) {
            nextErrors.location = "Location is required";
        }

        // Robust custom fields validation
        const normalizedFields = normalizeFields(dynamicFields);
        for (const field of normalizedFields) {
            const value = formData[field.name];
            if (field.required) {
                if (field.type === 'array') {
                    if (!Array.isArray(value) || value.length === 0) {
                        toastError(`${field.label} is required`);
                        return false;
                    }
                } else if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
                    toastError(`${field.label} is required`);
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
            title: "Required",
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
                location: formData.location,
                is_negotiable: formData.isNegotiable,
                images: processedImages,
                attributes: buildAttributes(),
                status: "published" as const,
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
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                    <BasicInfoStep
                        formData={formData}
                        errors={errors}
                        onInputChange={handleInputChange}
                        onCategorySelect={handleCategorySelect}
                        isEdit={mode === 'edit'}
                    />

                    <View className="border-t border-gray-100 my-4" />

                    <DetailsStep
                        formData={formData}
                        errors={errors}
                        images={images}
                        dynamicFields={dynamicFields}
                        onInputChange={handleInputChange}
                        onImagesChange={setImages}
                    />

                    <View className="h-40" />
                </ScrollView>

                {/* Unified Button Container */}
                <View className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-gray-100 bg-white" style={{ marginBottom: 12 + insets.bottom / 2 + 76 }}>
                    <Button
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        className="w-full"
                        style={{ backgroundColor: '#FF4F18' }}
                    >
                        {submitLabel}
                    </Button>
                </View>
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
        </View>
    );
}
