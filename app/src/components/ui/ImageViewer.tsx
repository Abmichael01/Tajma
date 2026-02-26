import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, TouchableOpacity, Dimensions, FlatList, Image, StyleSheet, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from './AppText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerProps {
    images: string[];
    initialIndex?: number;
    visible: boolean;
    onClose: () => void;
    title?: string;
}

export default function ImageViewer({
    images,
    initialIndex = 0,
    visible,
    onClose,
    title
}: ImageViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [loading, setLoading] = useState<Record<number, boolean>>({});
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            // Ensure flatlist scrolls to initial index after modal opens
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: initialIndex,
                    animated: false,
                });
            }, 50);
        }
    }, [visible, initialIndex]);

    const getImageUrl = (imageUrl: string) => {
        if (!imageUrl) return "";

        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

        if (imageUrl.startsWith('/media/')) {
            const path = imageUrl.replace('/media/', '');
            return `${apiUrl}/api/media/${path}`;
        }

        if (imageUrl.startsWith('/')) {
            const path = imageUrl.replace(/^\//, '');
            return `${apiUrl}/api/media/${path}`;
        }

        return `${apiUrl}/api/media/${imageUrl}`;
    };

    const handleScroll = (event: any) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / SCREEN_WIDTH);
        if (index !== currentIndex && index >= 0 && index < images.length) {
            setCurrentIndex(index);
        }
    };

    const handleThumbnailPress = (index: number) => {
        flatListRef.current?.scrollToIndex({
            index,
            animated: true,
        });
        setCurrentIndex(index);
    };

    const renderItem = ({ item, index }: { item: string, index: number }) => {
        const uri = getImageUrl(item);

        return (
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
                {loading[index] && (
                    <View style={StyleSheet.absoluteFill} className="items-center justify-center z-10">
                        <ActivityIndicator color="#FF4F18" size="large" />
                    </View>
                )}
                <Image
                    source={{ uri }}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                    resizeMode="contain"
                    onLoadStart={() => setLoading(prev => ({ ...prev, [index]: true }))}
                    onLoadEnd={() => setLoading(prev => ({ ...prev, [index]: false }))}
                />
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black">
                <StatusBar style="light" />

                {/* Header Overlay */}
                <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0 z-50 bg-black/40">
                    <View className="px-6 py-4 flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <View className="items-center">
                            {title && (
                                <AppText weight="bold" className="text-white text-base" numberOfLines={1}>
                                    {title}
                                </AppText>
                            )}
                            <AppText className="text-white/70 text-xs">
                                {currentIndex + 1} / {images.length}
                            </AppText>
                        </View>

                        <View className="w-10" />
                    </View>
                </SafeAreaView>

                {/* Main Content (Swipeable List) */}
                <FlatList
                    ref={flatListRef}
                    data={images}
                    renderItem={renderItem}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    windowSize={5}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 100));
                        wait.then(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                        });
                    }}
                />

                {/* Footer Navigation (Thumbnail Strip - WhatsApp Style) */}
                {images.length > 1 && (
                    <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 z-50 bg-black/40">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="px-4 py-4"
                            contentContainerStyle={{ gap: 10, paddingHorizontal: 10 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {images.map((img, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => handleThumbnailPress(idx)}
                                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${idx === currentIndex ? 'border-primary' : 'border-transparent opacity-60'}`}
                                >
                                    <Image
                                        source={{ uri: getImageUrl(img) }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </SafeAreaView>
                )}
            </View>
        </Modal>
    );
}
