import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AppText from '@/components/ui/AppText';
import BottomSheet, { BottomSheetRef } from '@/components/ui/BottomSheet';
import { paymentsApi } from '@/api/payments';

interface PromoteAdModalProps {
    visible: boolean;
    onClose: () => void;
    ad: any;
}

export default function PromoteAdModal({
    visible,
    onClose,
    ad
}: PromoteAdModalProps) {
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    const handlePromote = async (type: 'boost' | 'featured') => {
        setIsLoading(type);
        try {
            const response = await paymentsApi.initiatePromotion(ad.id, type);
            if (response.checkout_url) {
                // Open Paystack checkout in browser
                await WebBrowser.openBrowserAsync(response.checkout_url);
                onClose();
            } else {
                Alert.alert('Error', 'Failed to get checkout URL');
            }
        } catch (error: any) {
            console.error('Promotion error:', error);
            const errorMessage = error?.response?.data?.error || 'Failed to initiate promotion';
            Alert.alert('Promotion failed', errorMessage);
        } finally {
            setIsLoading(null);
        }
    };

    const packages = [
        {
            id: 'boost',
            name: 'Ad Boost',
            price: '1,000 XOF',
            duration: '7 Days',
            icon: 'flash-outline',
            color: '#FF4F18',
            bgColor: '#fff7ed',
            description: 'Move your ad to the top of search results once.',
            features: ['Priority placement', 'Highlight badge']
        },
        {
            id: 'featured',
            name: 'Featured Ad',
            price: '5,000 XOF',
            duration: '7 Days',
            icon: 'star-outline',
            color: '#1e1b4b',
            bgColor: '#f5f3ff',
            description: 'Sticky placement on homepage and category top.',
            features: ['Homepage placement', 'Fixed position', 'Max visibility']
        }
    ];

    if (!ad) return null;

    return (
        <BottomSheet
            ref={bottomSheetRef}
            title="Promote Listing"
            onClose={onClose}
            snapPoints={['70%']}
        >
            <View className="px-6 py-4">
                <AppText className="text-gray-500 mb-6 text-sm text-center">
                    Choose a promotion package for {"\n"}
                    <AppText weight="bold" className="text-gray-900">"{ad.title}"</AppText>
                </AppText>

                <View className="space-y-4">
                    {packages.map((pkg) => {
                        const isProcessing = isLoading === pkg.id;
                        
                        return (
                            <View 
                                key={pkg.id}
                                style={{ backgroundColor: pkg.bgColor }}
                                className="p-5 rounded-[24px] border border-transparent mb-4"
                            >
                                <View className="flex-row items-start justify-between mb-2">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center shadow-sm">
                                            <Ionicons name={pkg.icon as any} size={20} color={pkg.color} />
                                        </View>
                                        <View>
                                            <AppText weight="bold" className="text-gray-900">{pkg.name}</AppText>
                                            <AppText className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{pkg.duration}</AppText>
                                        </View>
                                    </View>
                                    <AppText weight="bold" className="text-lg text-gray-900">{pkg.price}</AppText>
                                </View>

                                <AppText className="text-xs text-gray-600 mb-4 italic leading-5">
                                    {pkg.description}
                                </AppText>

                                <View className="flex-row flex-wrap gap-2 mb-6">
                                    {pkg.features.map((feature, i) => (
                                        <View key={i} className="flex-row items-center gap-1 bg-white/50 px-2.5 py-1 rounded-full">
                                            <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                                            <AppText weight="semibold" className="text-[10px] text-gray-700">{feature}</AppText>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    onPress={() => handlePromote(pkg.id as any)}
                                    disabled={isLoading !== null}
                                    style={{ backgroundColor: pkg.id === 'featured' ? '#1e1b4b' : '#FF4F18' }}
                                    className="w-full h-12 rounded-full items-center justify-center shadow-sm"
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <View className="flex-row items-center">
                                            <AppText weight="bold" className="text-white mr-2">Select {pkg.name}</AppText>
                                            <Ionicons name="arrow-forward" size={16} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <View className="mt-4 items-center">
                    <AppText className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        Secured by Paystack
                    </AppText>
                </View>
                
                <View className="h-10" />
            </View>
        </BottomSheet>
    );
}
