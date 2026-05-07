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

export default function ChatInfoScreen() {
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
                title: "Unavailable",
                message: "This user hasn't provided a phone number.",
                icon: "call-outline",
                iconColor: "#FF4F18",
                buttons: [{ text: "OK" }]
            });
        }
    };

    const handleToggleMute = (value: boolean) => {
        setIsMuted(value);
        muteChatMutation.mutate({ chatId: id!, isMuted: value });
    };

    const handleClearChat = () => {
        showAlert({
            title: "Clear Chat?",
            message: "This will delete all messages in this conversation for you. This action cannot be undone.",
            icon: "trash-outline",
            iconColor: "#ef4444",
            buttons: [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    onPress: () => {
                        clearChatMutation.mutate(id!, {
                            onSuccess: () => {
                                router.back();
                            }
                        });
                    }
                }
            ]
        });
    };

    const handleBlockUser = () => {
        showAlert({
            title: `Block ${otherParticipant?.username}?`,
            message: "They won't be able to message you or see your ads. You can unblock them in settings.",
            icon: "ban-outline",
            iconColor: "#ef4444",
            buttons: [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Block",
                    onPress: () => {
                        if (otherParticipant?.id) {
                            blockUserMutation.mutate(otherParticipant.id, {
                                onSuccess: () => {
                                    router.replace("/(tabs)/messages");
                                }
                            });
                        }
                    }
                }
            ]
        });
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#FF4F18" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F9F9F9]">
            <Stack.Screen options={{ headerShown: false }} />

            <ScreenHeader
                title="Contact Info"
                variant="white"
                onBackPress={() => router.back()}
            />

            <ScrollView className="flex-1">
                {/* Header User/Ad Section */}
                <View className="bg-white items-center py-8 px-6 border-b border-gray-100">
                    <Avatar
                        src={otherParticipant?.avatar}
                        size={120}
                        className="mb-4"
                    />
                    <AppText weight="bold" className="text-2xl text-gray-900">
                        {otherParticipant?.full_name || otherParticipant?.username || "User"}
                    </AppText>
                    <AppText className="text-gray-500 mt-1">{otherParticipant?.phone || otherParticipant?.email}</AppText>

                    <View className="flex-row mt-6 gap-8">
                        <TouchableOpacity className="items-center" onPress={handleCall}>
                            <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-1">
                                <Ionicons name="call-outline" size={24} color="#FF4F18" />
                            </View>
                            <AppText className="text-primary text-xs font-bold">Call</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity className="items-center" onPress={() => router.push(`/users/${otherParticipant?.username}`)}>
                            <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-1">
                                <Ionicons name="person-outline" size={24} color="#0f172b" />
                            </View>
                            <AppText className="text-gray-900 text-xs font-bold">Profile</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity className="items-center" onPress={() => router.push(`/messages/${id}?search=true`)}>
                            <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-1">
                                <Ionicons name="search-outline" size={24} color="#0f172b" />
                            </View>
                            <AppText className="text-gray-900 text-xs font-bold">Search</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Related Ad Section */}
                {chat?.ad && (
                    <View className="bg-white mt-3 px-6 py-4 border-y border-gray-100">
                        <AppText weight="bold" className="text-gray-500 text-xs uppercase mb-3">Linked Listing</AppText>
                        <TouchableOpacity
                            onPress={() => router.push(`/ads/${chat.ad_slug}`)}
                            className="flex-row items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100"
                        >
                            <Image
                                source={{ uri: chat.ad_image || 'https://via.placeholder.com/150' }}
                                className="w-16 h-16 rounded-xl"
                            />
                            <View className="flex-1">
                                <AppText weight="bold" className="text-gray-900" numberOfLines={1}>{chat.ad_title}</AppText>
                                <AppText className="text-primary font-bold mt-1">{chat.ad_currency} {chat.ad_price}</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Media Section */}
                <View className="bg-white mt-3 py-4 border-y border-gray-100">
                    <View className="flex-row items-center justify-between px-6 mb-4">
                        <AppText weight="bold" className="text-gray-500 text-xs uppercase">Media, Links and Docs</AppText>
                        <TouchableOpacity
                            className="flex-row items-center"
                            onPress={() => router.push(`/messages/${id}/media`)}
                        >
                            <AppText className="text-primary text-xs font-bold">{totalShared}</AppText>
                            <Ionicons name="chevron-forward" size={14} color="#FF4F18" />
                        </TouchableOpacity>
                    </View>

                    {mediaMessages.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6" contentContainerStyle={{ gap: 8 }}>
                            {mediaMessages.slice(0, 10).map((msg, idx) => (
                                <Image
                                    key={idx}
                                    source={{ uri: msg.attachment! }}
                                    className="w-20 h-20 rounded-xl bg-gray-100"
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View className="px-6 pb-2">
                            <AppText className="text-gray-400 text-sm italic">No media shared yet</AppText>
                        </View>
                    )}
                </View>

                {/* Settings Section */}
                <View className="bg-white mt-3 border-y border-gray-100">
                    <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50">
                        <View className="flex-row items-center gap-4">
                            <Ionicons name="notifications-outline" size={22} color="#4b5563" />
                            <AppText className="text-gray-700 font-medium">Mute Notifications</AppText>
                        </View>
                        <Switch
                            value={isMuted}
                            onValueChange={handleToggleMute}
                            trackColor={{ false: "#e5e7eb", true: "#FF4F18" }}
                        />
                    </View>

                    <TouchableOpacity
                        className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50"
                        onPress={() => router.push("/settings/notifications/sounds")}
                    >
                        <View className="flex-row items-center gap-4">
                            <Ionicons name="musical-notes-outline" size={22} color="#4b5563" />
                            <AppText className="text-gray-700 font-medium">Notification Sound</AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                    </TouchableOpacity>

                    <TouchableOpacity className="px-6 py-4 flex-row items-center gap-4">
                        <Ionicons name="star-outline" size={22} color="#4b5563" />
                        <AppText className="text-gray-700 font-medium">Starred Messages</AppText>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View className="bg-white mt-3 border-y border-gray-100 mb-10">
                    <TouchableOpacity
                        className="px-6 py-4 flex-row items-center gap-4 border-b border-gray-50"
                        onPress={handleBlockUser}
                    >
                        <Ionicons name="ban-outline" size={22} color="#ef4444" />
                        <AppText className="text-red-500 font-medium">Block {otherParticipant?.full_name || otherParticipant?.username}</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="px-6 py-4 flex-row items-center gap-4 border-b border-gray-50"
                        onPress={() => setShowReportModal(true)}
                    >
                        <Ionicons name="flag-outline" size={22} color="#ef4444" />
                        <AppText className="text-red-500 font-medium">Report {otherParticipant?.full_name || otherParticipant?.username}</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="px-6 py-4 flex-row items-center gap-4"
                        onPress={handleClearChat}
                    >
                        <Ionicons name="trash-outline" size={22} color="#ef4444" />
                        <AppText className="text-red-500 font-medium">Clear Chat History</AppText>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {otherParticipant && (
                <ReportUserModal
                    visible={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    user={{
                        id: otherParticipant.id,
                        username: otherParticipant.username ?? undefined,
                        full_name: otherParticipant.full_name ?? undefined,
                    }}
                />
            )}

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
