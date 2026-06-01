import { View, FlatList, TouchableOpacity, Image, Linking, ActivityIndicator, useWindowDimensions } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useChatMessages } from "@/hooks/useChat";
import ImageViewer from "@/components/ui/ImageViewer";

type TabType = 'media' | 'links' | 'docs';

export default function MediaLinksDocsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<TabType>('media');

    const { data: messagesData, isLoading } = useChatMessages(id!);
    const messages = messagesData?.pages.flatMap(page => page.results) || [];

    const [viewerVisible, setViewerVisible] = useState(false);
    const [initialImageIndex, setInitialImageIndex] = useState(0);

    const mediaMessages = useMemo(() =>
        messages.filter(msg => msg.message_type === 'image' && msg.attachment),
        [messages]);

    const docMessages = useMemo(() =>
        messages.filter(msg => msg.message_type === 'document' && msg.attachment),
        [messages]);

    const linkMessages = useMemo(() =>
        messages.filter(msg => !!msg.link_url),
        [messages]);

    const imagesOnly = useMemo(() =>
        mediaMessages.map(msg => msg.attachment!).reverse(),
        [mediaMessages]);

    const handleOpenImage = (imageUrl: string) => {
        const index = imagesOnly.indexOf(imageUrl);
        if (index !== -1) {
            setInitialImageIndex(index);
            setViewerVisible(true);
        }
    };

    const renderMedia = () => {
        const itemSize = (width - 32) / 3;
        return (
            <FlatList
                data={mediaMessages}
                keyExtractor={item => item.id}
                numColumns={3}
                contentContainerStyle={{ padding: 16, gap: 2 }}
                columnWrapperStyle={{ gap: 2 }}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleOpenImage(item.attachment!)}>
                        <Image
                            source={{ uri: item.attachment! }}
                            style={{ width: itemSize, height: itemSize }}
                            className="bg-gray-100"
                        />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center pt-20">
                        <Ionicons name="images-outline" size={64} color="#d1d5db" />
                        <AppText className="text-gray-400 mt-4">No media shared yet</AppText>
                    </View>
                }
            />
        );
    };

    const renderDocs = () => (
        <FlatList
            data={docMessages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
                <TouchableOpacity
                    className="flex-row items-center p-4 bg-white rounded-2xl mb-3 border border-gray-100"
                    onPress={() => item.attachment && Linking.openURL(item.attachment)}
                >
                    <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center mr-4">
                        <Ionicons name="document-text" size={24} color="#FF4F18" />
                    </View>
                    <View className="flex-1">
                        <AppText weight="bold" className="text-gray-900" numberOfLines={1}>
                            {item.attachment?.split('/').pop()}
                        </AppText>
                        <AppText className="text-gray-500 text-xs mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                        </AppText>
                    </View>
                    <Ionicons name="download-outline" size={20} color="#9ca3af" />
                </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center pt-20">
                    <Ionicons name="document-outline" size={64} color="#d1d5db" />
                    <AppText className="text-gray-400 mt-4">No documents shared yet</AppText>
                </View>
            }
        />
    );

    const renderLinks = () => (
        <FlatList
            data={linkMessages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
                <TouchableOpacity
                    className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-100"
                    onPress={() => item.link_url && Linking.openURL(item.link_url)}
                >
                    {item.link_image && (
                        <Image source={{ uri: item.link_image }} className="w-full h-32" resizeMode="cover" />
                    )}
                    <View className="p-4">
                        <AppText weight="bold" className="text-gray-900" numberOfLines={2}>
                            {item.link_title || item.link_url}
                        </AppText>
                        {item.link_description && (
                            <AppText className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                                {item.link_description}
                            </AppText>
                        )}
                        <View className="flex-row items-center mt-2">
                            <Ionicons name="link" size={12} color="#9ca3af" />
                            <AppText className="text-primary text-[10px] ml-1 uppercase" numberOfLines={1}>
                                {item.link_url?.replace(/^https?:\/\//, '').split('/')[0]}
                            </AppText>
                        </View>
                    </View>
                </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center pt-20">
                    <Ionicons name="link-outline" size={64} color="#d1d5db" />
                    <AppText className="text-gray-400 mt-4">No links shared yet</AppText>
                </View>
            }
        />
    );

    return (
        <View className="flex-1 bg-[#F9F9F9]">
            <Stack.Screen options={{ headerShown: false }} />

            <ScreenHeader
                title={t('chat.sharedContentTitle')}
                onBackPress={() => router.back()}
                variant="white"
            />

            {/* Tabs */}
            <View className="flex-row bg-white border-b border-gray-100">
                {(['media', 'docs', 'links'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 items-center py-4 border-b-2 ${activeTab === tab ? 'border-primary' : 'border-transparent'}`}
                    >
                        <AppText
                            weight={activeTab === tab ? 'bold' : 'medium'}
                            className={`capitalize ${activeTab === tab ? 'text-primary' : 'text-gray-500'}`}
                        >
                            {tab}
                        </AppText>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#FF4F18" />
                </View>
            ) : (
                <View className="flex-1">
                    {activeTab === 'media' && renderMedia()}
                    {activeTab === 'docs' && renderDocs()}
                    {activeTab === 'links' && renderLinks()}
                </View>
            )}

            <ImageViewer
                images={imagesOnly}
                visible={viewerVisible}
                initialIndex={initialImageIndex}
                onClose={() => setViewerVisible(false)}
            />
        </View>
    );
}
