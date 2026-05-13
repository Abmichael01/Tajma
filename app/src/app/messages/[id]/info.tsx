import { View, ScrollView, TouchableOpacity, Image, Switch, FlatList, Linking, ActivityIndicator } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Avatar from "@/components/ui/Avatar";
import { useChatDetail, useChatMessages, useClearChat, useBlockUser, useMuteChat } from "@/hooks/useChat";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAlert } from "@/hooks/useAlert";
import CustomAlert from "@/components/ui/CustomAlert";
import ReportUserModal from "@/components/chat/ReportUserModal";
import { useTranslation } from "react-i18next";

export default function ChatInfoScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { alertConfig, showAlert, hideAlert } = useAlert();

    const { data: chat, isLoading } = useChatDetail(id!);
    const { data: messagesData } = useChatMessages(id!);

    const clearChatMutation = useClearChat();
    const blockUserMutation = useBlockUser();
    const muteChatMutation = useMuteChat();

    const [isMuted, setIsMuted] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        if (chat) {
            setIsMuted(chat.is_muted || false);
        }
    }, [chat]);

    const { user: currentUser } = useAuthStore();
    const otherParticipant = chat?.participant1?.id === currentUser?.id
        ? chat?.participant2
        : chat?.participant1;
    const messages = messagesData?.pages.flatMap(page => page.results) || [];

    // Extract shared content
    const mediaMessages = messages.filter(msg => msg.message_type === 'image' && msg.attachment);
    const docMessages = messages.filter(msg => msg.message_type === 'document' && msg.attachment);
    const linkMessages = messages.filter(msg => !!msg.link_url);
    const totalShared = mediaMessages.length + docMessages.length + linkMessages.length;

    const handleCall = () => {
        if (otherParticipant?.phone) {
            Linking.openURL(`tel:${otherParticipant.phone}`);
        } else {
            showAlert({
                title: t("chat_info.unavailable"),
                message: t("chat_info.phone_not_provided"),
                buttons: [{ text: t("common.ok"), onPress: hideAlert }]
            });
        }
    };

    const handleClearChat = () => {
        showAlert({
            title: t("chat_info.clear_chat_q"),
            message: t("chat_info.clear_chat_desc"),
            buttons: [
                { text: t("common.cancel"), onPress: hideAlert, style: 'cancel' },
                { 
                    text: t("common.delete"), 
                    style: 'destructive',
                    onPress: () => {
                        clearChatMutation.mutate(id!, {
                            onSuccess: () => {
                                hideAlert();
                                router.back();
                            }
                        });
                    }
                }
            ]
        });
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <ScreenHeader title={t("chat_info.contact_info")} onBack={() => router.back()} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#000" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title={t("chat_info.contact_info")} onBack={() => router.back()} />
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* User Info Header */}
                <View className="items-center py-8 bg-white border-b border-gray-100">
                    <Avatar 
                        uri={otherParticipant?.avatar} 
                        name={`${otherParticipant?.first_name} ${otherParticipant?.last_name}`}
                        size={100}
                    />
                    <AppText className="text-xl font-bold mt-4">
                        {otherParticipant?.first_name} {otherParticipant?.last_name}
                    </AppText>
                    <AppText className="text-gray-500 mt-1">
                        @{otherParticipant?.username}
                    </AppText>

                    {/* Quick Actions */}
                    <View className="flex-row mt-6 gap-6">
                        <TouchableOpacity onPress={handleCall} className="items-center">
                            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
                                <Ionicons name="call" size={20} color="#000" />
                            </View>
                            <AppText className="text-xs mt-1 text-gray-600">{t("chat_info.call")}</AppText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => router.push(`/user/${otherParticipant?.id}`)} 
                            className="items-center"
                        >
                            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
                                <Ionicons name="person" size={20} color="#000" />
                            </View>
                            <AppText className="text-xs mt-1 text-gray-600">{t("chat_info.profile")}</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {}} className="items-center">
                            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
                                <Ionicons name="search" size={20} color="#000" />
                            </View>
                            <AppText className="text-xs mt-1 text-gray-600">{t("chat_info.search")}</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Linked Listing */}
                {chat?.ad && (
                    <View className="mt-2 bg-white p-4 border-y border-gray-100">
                        <AppText className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            {t("chat_info.linked_listing")}
                        </AppText>
                        <TouchableOpacity 
                            onPress={() => router.push(`/ads/${chat.ad!.id}`)}
                            className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-100"
                        >
                            <Image 
                                source={{ uri: chat.ad.cover_image || 'https://via.placeholder.com/150' }}
                                className="w-16 h-16 rounded-lg bg-gray-200"
                            />
                            <View className="flex-1 ml-3">
                                <AppText className="font-bold text-base" numberOfLines={1}>{chat.ad.title}</AppText>
                                <AppText className="text-primary font-bold mt-0.5">{chat.ad.price ? `${chat.ad.price} Fr` : t("ads.contactForPrice")}</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Media, Links and Docs */}
                <View className="mt-2 bg-white border-y border-gray-100">
                    <TouchableOpacity className="p-4 flex-row items-center justify-between">
                        <View>
                            <AppText className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                {t("chat_info.media_links_docs")}
                            </AppText>
                            <AppText className="text-xs text-gray-400">
                                {totalShared > 0 ? totalShared : t("chat_info.no_media_shared")}
                            </AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {/* Options Section */}
                <View className="mt-2 bg-white border-y border-gray-100">
                    <View className="p-4 flex-row items-center justify-between border-b border-gray-50">
                        <AppText className="text-base">{t("chat_info.mute_notifications")}</AppText>
                        <Switch 
                            value={isMuted} 
                            onValueChange={(val) => {
                                setIsMuted(val);
                                muteChatMutation.mutate(id!);
                            }} 
                            trackColor={{ false: "#e5e7eb", true: "#000" }}
                        />
                    </View>
                    <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-50">
                        <AppText className="text-base">{t("chat_info.notification_sound")}</AppText>
                        <View className="flex-row items-center">
                            <AppText className="text-gray-400 mr-1">Default</AppText>
                            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity className="p-4 flex-row items-center justify-between">
                        <AppText className="text-base">{t("chat_info.starred_messages")}</AppText>
                        <View className="flex-row items-center">
                            <AppText className="text-gray-400 mr-1">None</AppText>
                            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View className="mt-2 bg-white border-y border-gray-100 mb-8">
                    <TouchableOpacity className="p-4 flex-row items-center gap-3 border-b border-gray-50">
                        <Ionicons name="ban-outline" size={20} color="#ef4444" />
                        <AppText className="text-base text-red-500">{t("chat_info.block_user", { name: otherParticipant?.first_name })}</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setShowReportModal(true)}
                        className="p-4 flex-row items-center gap-3 border-b border-gray-50"
                    >
                        <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
                        <AppText className="text-base text-red-500">{t("chat_info.report_user", { name: otherParticipant?.first_name })}</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleClearChat}
                        className="p-4 flex-row items-center gap-3"
                    >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        <AppText className="text-base text-red-500">{t("chat_info.clear_chat_history")}</AppText>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <CustomAlert {...alertConfig} />
            
            <ReportUserModal 
                visible={showReportModal}
                onClose={() => setShowReportModal(false)}
                userId={otherParticipant?.id || ''}
                userName={`${otherParticipant?.first_name} ${otherParticipant?.last_name}`}
            />
        </SafeAreaView>
    );
}
