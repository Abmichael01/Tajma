import { View, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, FlatList, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useLeads } from "@/hooks/useLeads";
import { useGetOrCreateChat } from "@/hooks/useChat";

function LeadCard({ lead, onMessage }: { lead: any, onMessage: (lead: any) => void }) {
    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'phone_view': return 'call-outline';
            case 'profile_view': return 'person-outline';
            case 'save_ad': return 'heart-outline';
            default: return 'flash-outline';
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'phone_view': return 'Viewed Phone';
            case 'profile_view': return 'Viewed Profile';
            case 'save_ad': return 'Saved your Ad';
            default: return 'Interacted';
        }
    };

    return (
        <View className="bg-white rounded-[32px] p-5 mb-4 border border-gray-100 shadow-sm mx-6">
            <View className="flex-row justify-between items-start mb-5">
                <View className="flex-row items-center gap-4">
                    <View className="relative">
                        <Avatar
                            src={lead.client_detail?.avatar}
                            size={56}
                            fallback={lead.client_detail?.first_name?.[0] || 'U'}
                        />
                        {!lead.messaged && (
                            <View className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-white" />
                        )}
                    </View>
                    <View>
                        <AppText weight="bold" className="text-gray-900 text-lg">
                            {lead.client_detail?.first_name} {lead.client_detail?.last_name}
                        </AppText>
                        <View className="flex-row items-center mt-0.5">
                            <Ionicons name={getSourceIcon(lead.source) as any} size={14} color="#64748b" />
                            <AppText className="text-gray-500 text-xs ml-1.5">
                                {getSourceLabel(lead.source)} • {new Date(lead.created_at).toLocaleDateString()}
                            </AppText>
                        </View>
                    </View>
                </View>

                <View className={`px-3 py-1.5 rounded-full ${lead.messaged ? 'bg-green-50' : 'bg-primary/10'}`}>
                    <AppText weight="bold" className={`text-[10px] uppercase tracking-wider ${lead.messaged ? 'text-green-600' : 'text-primary'}`}>
                        {lead.messaged ? 'Connected' : 'New Lead'}
                    </AppText>
                </View>
            </View>

            {lead.ad_detail && (
                <View className="bg-gray-50/80 rounded-2xl p-4 mb-5 flex-row items-center gap-3 border border-gray-100">
                    <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
                        <Ionicons name="pricetag" size={14} color="#FF4F18" />
                    </View>
                    <View className="flex-1">
                        <AppText className="text-gray-500 text-[10px] uppercase tracking-tighter font-bold">Interested In</AppText>
                        <AppText weight="semibold" className="text-gray-900 text-xs" numberOfLines={1}>
                            {lead.ad_detail.title}
                        </AppText>
                    </View>
                </View>
            )}

            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => onMessage(lead)}
                    className="flex-1 bg-primary h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-primary/20"
                >
                    <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                    <AppText weight="bold" className="text-white ml-2">Send Message</AppText>
                </TouchableOpacity>

                {lead.client_detail?.phone && (
                    <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${lead.client_detail.phone}`)}
                        className="w-14 h-14 rounded-2xl bg-gray-900 items-center justify-center"
                    >
                        <Ionicons name="call" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

export default function LeadsScreen() {
    const router = useRouter();
    const { leads, isLoading, markAsMessaged, refetch, isRefetching } = useLeads();
    const { mutateAsync: getOrCreateChat } = useGetOrCreateChat();

    const handleMessage = async (lead: any) => {
        try {
            const chat = await getOrCreateChat({
                participant2_id: lead.client,
                ad_id: lead.ad
            });

            await markAsMessaged(lead.id);
            router.push(`/messages/${chat.id}`);
        } catch (error) {
            console.error("Error messaging lead:", error);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <ScreenHeader
                title="Potential Clients"
                subtitle="People interested in your listings"
            />

            {isLoading && !isRefetching ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FF4F18" />
                </View>
            ) : (
                <FlatList
                    data={leads}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <LeadCard lead={item} onMessage={handleMessage} />
                    )}
                    className="flex-1"
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 60 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor="#FF4F18"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-24 px-10">
                            <View className="w-28 h-28 bg-primary/10 rounded-[40px] items-center justify-center mb-8 rotate-[-10deg]">
                                <Ionicons name="people" size={48} color="#FF4F18" />
                            </View>
                            <AppText weight="bold" className="text-gray-900 mb-2 text-2xl text-center">
                                No leads yet
                            </AppText>
                            <AppText className="text-gray-500 text-center leading-6 text-base">
                                When customers view your contact details or save your ads, they will appear here.
                            </AppText>
                        </View>
                    }
                    windowSize={10}
                    removeClippedSubviews={Platform.OS === 'android'}
                />
            )}
        </View>
    );
}
