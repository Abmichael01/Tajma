import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import {
    conditionOptions,
    transmissionOptions,
    fuelTypeOptions,
    furnishingOptions,
    availabilityOptions,
    CustomFieldConfig
} from '@/data/categoriesData';

interface DynamicFormFieldsProps {
    formData: any;
    customFields: CustomFieldConfig[] | string[];
    onInputChange: (field: string, value: any) => void;
}

// Helper to convert old format (string[]) to new format (CustomFieldConfig[])
const normalizeCustomFields = (fields: CustomFieldConfig[] | string[]): CustomFieldConfig[] => {
    if (fields.length === 0) return [];

    // Check if it's already the new format
    if (typeof fields[0] === 'object' && 'name' in fields[0]) {
        return fields as CustomFieldConfig[];
    }

    // Convert old format to new format
    const oldFields = fields as string[];
    const fieldConfigs: Record<string, CustomFieldConfig> = {
        brand: { name: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g., Apple, Samsung' },
        model: { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g., iPhone 14 Pro Max' },
        condition: { name: 'condition', label: 'Condition', type: 'select', options: conditionOptions },
        year: { name: 'year', label: 'Year', type: 'number', placeholder: 'e.g., 2023', min: 1900, max: new Date().getFullYear() + 1 },
        mileage: { name: 'mileage', label: 'Mileage (km)', type: 'number', placeholder: 'e.g., 45000' },
        transmission: { name: 'transmission', label: 'Transmission', type: 'select', options: transmissionOptions },
        fuel_type: { name: 'fuel_type', label: 'Fuel Type', type: 'select', options: fuelTypeOptions },
        bedrooms: { name: 'bedrooms', label: 'Bedrooms', type: 'number', placeholder: 'e.g., 3', min: 0 },
        bathrooms: { name: 'bathrooms', label: 'Bathrooms', type: 'number', placeholder: 'e.g., 2', min: 0 },
        furnishing: { name: 'furnishing', label: 'Furnishing', type: 'select', options: furnishingOptions },
        availability: { name: 'availability', label: 'Availability', type: 'select', options: availabilityOptions },
    };

    return oldFields.map(field => fieldConfigs[field] || { name: field, label: field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' '), type: 'text' });
};

// Simple Select Component using Modal
const Select = ({
    label,
    value,
    options,
    onSelect,
    placeholder = "Select option",
    required = false
}: {
    label: string,
    value: string,
    options?: { value: string, label: string }[],
    onSelect: (val: string) => void,
    placeholder?: string,
    required?: boolean
}) => {
    const [visible, setVisible] = useState(false);
    const selectedOption = options?.find(o => o.value === value);

    return (
        <View>
            <AppText className="mb-2 text-gray-700 font-medium">
                {label} {required && <AppText className="text-red-500">*</AppText>}
            </AppText>
            <TouchableOpacity
                onPress={() => setVisible(true)}
                className="bg-gray-50 border border-gray-200 rounded-full px-5 py-4 flex-row justify-between items-center"
            >
                <AppText className={`text-base ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </AppText>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="slide">
                <Pressable
                    className="flex-1 bg-black/50 justify-end"
                    onPress={() => setVisible(false)}
                >
                    <View className="bg-white rounded-t-3xl max-h-[70%]">
                        <View className="px-5 py-4 border-b border-gray-100 flex-row justify-between items-center">
                            <AppText variant="heading" className="text-lg">Select {label}</AppText>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
                            {options?.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => {
                                        onSelect(opt.value);
                                        setVisible(false);
                                    }}
                                    className={`py-4 px-4 rounded-xl mb-2 flex-row justify-between items-center ${value === opt.value ? 'bg-primary/10' : 'active:bg-gray-50'}`}
                                >
                                    <AppText className={`text-base font-medium ${value === opt.value ? 'text-primary' : 'text-gray-900'}`}>{opt.label}</AppText>
                                    {value === opt.value && <Ionicons name="checkmark" size={20} color="#FF4F18" />}
                                </TouchableOpacity>
                            ))}
                            <View className="h-10" />
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

// Checkbox Component
const Checkbox = ({ label, checked, onChange, required }: { label: string, checked: boolean, onChange: (val: boolean) => void, required?: boolean }) => (
    <TouchableOpacity
        onPress={() => onChange(!checked)}
        className="flex-row items-center gap-3 mb-4"
    >
        <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${checked ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
            {checked && <Ionicons name="checkmark" size={18} color="white" />}
        </View>
        <AppText className="text-gray-700 font-medium">
            {label} {required && <AppText className="text-red-500">*</AppText>}
        </AppText>
    </TouchableOpacity>
);

// Tags Input Component for Mobile
const TagsInput = ({ label, value, onChange, placeholder, required }: { label: string, value: string[] | undefined, onChange: (val: string[]) => void, placeholder?: string, required?: boolean }) => {
    const [tagInput, setTagInput] = useState('');
    const tags = Array.isArray(value) ? value : [];

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter(t => t !== tag));
    };

    return (
        <View className="mb-6">
            <AppText className="mb-2 text-gray-700 font-medium">
                {label} {required && <AppText className="text-red-500">*</AppText>}
            </AppText>
            <View className="bg-gray-50 border border-gray-200 rounded-3xl p-3 min-h-[100px]">
                <View className="flex-row flex-wrap gap-2 mb-2">
                    {tags.map((tag, idx) => (
                        <View key={idx} className="bg-primary/10 px-3 py-1.5 rounded-full flex-row items-center gap-2">
                            <AppText className="text-primary text-sm font-medium">{tag}</AppText>
                            <TouchableOpacity onPress={() => removeTag(tag)}>
                                <Ionicons name="close-circle" size={16} color="#FF4F18" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
                <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={addTag}
                    onBlur={addTag}
                    placeholder={placeholder || "Type and press enter"}
                    placeholderTextColor="#9ca3af"
                    className="text-base text-gray-900 px-2 py-1"
                    style={{ fontFamily: 'WorkSans-Regular' }}
                />
            </View>
            <AppText className="text-xs text-gray-400 mt-1 ml-2">Press enter to add a tag</AppText>
        </View>
    );
};

export default function DynamicFormFields({
    formData,
    customFields,
    onInputChange
}: DynamicFormFieldsProps) {
    const normalizedFields = normalizeCustomFields(customFields);

    if (normalizedFields.length === 0) return null;

    const handleArrayAdd = (fieldName: string) => {
        const current = formData[fieldName] || [];
        onInputChange(fieldName, [...current, {}]);
    };

    const handleArrayRemove = (fieldName: string, index: number) => {
        const current = formData[fieldName] || [];
        onInputChange(fieldName, current.filter((_: any, i: number) => i !== index));
    };

    const handleArrayItemChange = (fieldName: string, index: number, key: string, value: any) => {
        const current = formData[fieldName] || [];
        const updated = [...current];
        updated[index] = { ...updated[index], [key]: value };
        onInputChange(fieldName, updated);
    };

    const renderField = (field: CustomFieldConfig) => {
        const value = formData[field.name];

        switch (field.type) {
            case 'select':
                return (
                    <View key={field.name} className="mb-6">
                        <Select
                            label={field.label}
                            value={value}
                            options={field.options}
                            onSelect={(val) => onInputChange(field.name, val)}
                            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
                            required={field.required}
                        />
                    </View>
                );

            case 'textarea':
                return (
                    <View key={field.name} className="mb-6">
                        <AppText className="mb-2 text-gray-700 font-medium">
                            {field.label} {field.required && <AppText className="text-red-500">*</AppText>}
                        </AppText>
                        <TextArea
                            value={value}
                            onChangeText={(val) => onInputChange(field.name, val)}
                            className="rounded-3xl"
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        />
                    </View>
                );

            case 'number':
                return (
                    <View key={field.name} className="mb-6">
                        <AppText className="mb-2 text-gray-700 font-medium">
                            {field.label} {field.required && <AppText className="text-red-500">*</AppText>}
                        </AppText>
                        <Input
                            value={value ? String(value) : ""}
                            onChangeText={(val) => onInputChange(field.name, val)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            keyboardType="numeric"
                            error={field.required && !value}
                        />
                    </View>
                );

            case 'checkbox':
                return (
                    <Checkbox
                        key={field.name}
                        label={field.label}
                        checked={!!value}
                        onChange={(val) => onInputChange(field.name, val)}
                        required={field.required}
                    />
                );

            case 'tags':
                return (
                    <TagsInput
                        key={field.name}
                        label={field.label}
                        value={value}
                        onChange={(tags) => onInputChange(field.name, tags)}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );

            case 'array':
                const arrayValue = Array.isArray(value) ? value : [];
                return (
                    <View key={field.name} className="mb-6 space-y-4">
                        <View className="flex-row items-center justify-between mb-2">
                            <AppText className="text-gray-700 font-medium">
                                {field.label} {field.required && <AppText className="text-red-500">*</AppText>}
                            </AppText>
                            <TouchableOpacity
                                onPress={() => handleArrayAdd(field.name)}
                                className="bg-primary/10 px-4 py-2 rounded-full flex-row items-center gap-2"
                            >
                                <Ionicons name="add" size={18} color="#FF4F18" />
                                <AppText className="text-primary font-semibold text-xs text-center leading-none">Add Item</AppText>
                            </TouchableOpacity>
                        </View>

                        {arrayValue.length === 0 && (
                            <View className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-300 items-center">
                                <AppText className="text-gray-400 text-sm">No {field.label.toLowerCase()} added yet</AppText>
                            </View>
                        )}

                        {arrayValue.map((item: any, index: number) => (
                            <View key={index} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm mb-4">
                                <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-50">
                                    <AppText className="text-gray-500 font-bold text-xs uppercase tracking-widest">{field.label} #{index + 1}</AppText>
                                    <TouchableOpacity onPress={() => handleArrayRemove(field.name, index)}>
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>

                                {field.children && field.children.length > 0 ? (
                                    <View className="gap-4">
                                        {field.children.map((childField) => (
                                            <View key={childField.name}>
                                                <AppText className="text-xs text-gray-500 mb-1 ml-2">{childField.label}</AppText>
                                                {childField.options && childField.options.length > 0 ? (
                                                    <Select
                                                        label=""
                                                        value={item[childField.name]}
                                                        options={childField.options}
                                                        onSelect={(val) => handleArrayItemChange(field.name, index, childField.name, val)}
                                                        placeholder={childField.placeholder || `Select ${childField.label}`}
                                                    />
                                                ) : (
                                                    <Input
                                                        value={item[childField.name] ? String(item[childField.name]) : ""}
                                                        onChangeText={(val) => handleArrayItemChange(field.name, index, childField.name, val)}
                                                        placeholder={childField.placeholder || `Enter ${childField.label}`}
                                                        keyboardType={childField.type === 'number' ? 'numeric' : 'default'}
                                                        className="text-sm h-12"
                                                    />
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <Input
                                        value={item.value || ''}
                                        onChangeText={(val) => handleArrayItemChange(field.name, index, 'value', val)}
                                        placeholder={field.placeholder || `Enter value`}
                                        className="text-sm h-12"
                                    />
                                )}
                            </View>
                        ))}
                    </View>
                );

            default:
                return (
                    <View key={field.name} className="mb-6">
                        <AppText className="mb-2 text-gray-700 font-medium">
                            {field.label} {field.required && <AppText className="text-red-500">*</AppText>}
                        </AppText>
                        <Input
                            value={value}
                            onChangeText={(val) => onInputChange(field.name, val)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        />
                    </View>
                );
        }
    };

    return (
        <View>
            {normalizedFields.map(renderField)}
        </View>
    );
}
