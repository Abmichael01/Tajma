// Comprehensive marketplace categories data
// This structure is designed to work seamlessly with backend APIs

export const conditionOptions = [
    { value: 'new', label: 'Brand New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'refurbished', label: 'Refurbished' }
];

export const transmissionOptions = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' }
];

export const fuelTypeOptions = [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' }
];

export const furnishingOptions = [
    { value: 'furnished', label: 'Fully Furnished' },
    { value: 'semi-furnished', label: 'Semi-Furnished' },
    { value: 'unfurnished', label: 'Unfurnished' }
];

export const availabilityOptions = [
    { value: 'immediately', label: 'Immediately' },
    { value: '1-week', label: 'Within 1 Week' },
    { value: '2-weeks', label: 'Within 2 Weeks' },
    { value: '1-month', label: 'Within 1 Month' },
    { value: 'flexible', label: 'Flexible' }
];

export interface CustomFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea' | 'array' | 'checkbox' | 'tags';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    children?: CustomFieldConfig[];
    required?: boolean;
    min?: number;
    max?: number;
}
