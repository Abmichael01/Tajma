import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/ui/AppText';

export interface BreadcrumbItem {
    id: string | null;
    name: string;
    slug?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    onPress: (item: BreadcrumbItem) => void;
    className?: string;
}

export default function Breadcrumbs({ items, onPress, className = "" }: BreadcrumbsProps) {
    return (
        <View className={className}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 4, alignItems: 'center', gap: 6 }}
            >
                {items.map((item, index) => (
                    <React.Fragment key={item.id || 'root'}>
                        <TouchableOpacity onPress={() => onPress(item)}>
                            <AppText 
                                className={`text-xs ${index === items.length - 1 ? "text-primary bg-primary/5 px-2 py-0.5 rounded-md" : "text-gray-500"}`}
                                weight={index === items.length - 1 ? "bold" : "medium"}
                            >
                                {item.name}
                            </AppText>
                        </TouchableOpacity>
                        {index < items.length - 1 && (
                            <Ionicons name="chevron-forward" size={12} color="#9ca3af" />
                        )}
                    </React.Fragment>
                ))}
            </ScrollView>
        </View>
    );
}
