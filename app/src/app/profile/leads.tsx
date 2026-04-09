import { View, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, FlatList, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Avatar from "@/components/ui/Avatar";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useLeads } from "@/hooks/useLeads";
import { useGetOrCreateChat } from "@/hooks/useChat";
import { Lead, LeadSource } from "@/api/leads";

const SOURCE_CONFIG: Record<LeadSource, { icon: string; label: string }> = {
    phone_view:   { icon: 'call-outline',    label: 'Viewed number' },
    profile_view: { icon: 'person-outline',  label: 'Visited profile' },
    save_ad:      { icon: 'heart-outline',   label: 'Saved ad' },
}

function getInitials(firstName?: string, lastName?: string) {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || '?'
}

function LeadCard({ lead, onMessage, onIgnore }: {
    lead: Lead
    onMessage: (lead: Lead) => void
    onIgnore: (lead: Lead) => void
}) {
    const sources = lead.sources_used?.length ? lead.sources_used : [lead.last_source]

    return (
        <View className="bg-white rounded-[32px] p-5 mb-4 border border-gray-100 mx-6">
            {/* Top row: avatar + name + status badge */}
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center gap-4 flex-1">
                    <View className="relative">
                        <Avatar
                            src={lead.client_detail?.avatar}
                            size={56}
                            fallback={getInitials(lead.client_detail?.first_name, lead.client_detail?.last_name)}
                        />
                        {!lead.messaged && (
                            <View className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-white" />
                        )}
                    </View>
                    <View className="flex-1">
                        <AppText weight="bold" className="text-gray-900 text-base">
                            {lead.client_detail?.first_name} {lead.client_detail?.last_name}
                        </AppText>
                        <AppText className="text-gray-400 text-[10px] mt-0.5">
                            Last seen {new Date(lead.last_interacted_at).toLocaleDateString()}
                        </AppText>
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    <View className={`px-3 py-1.5 rounded-full ${lead.messaged ? 'bg-green-50' : 'bg-primary/10'}`}>
                        <AppText weight="bold" className={`text-[10px] uppercase tracking-wider ${lead.messaged ? 'text-green-600' : 'text-primary'}`}>
                            {lead.messaged ? 'Connected' : 'New Lead'}
                        </AppText>
                    </View>
                    {!lead.messaged && (
                        <TouchableOpacity
                            onPress={() => onIgnore(lead)}
                            className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="close" size={14} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* What the buyer did — sources_used badges */}
            <View className="flex-row flex-wrap gap-2 mb-4">
                {sources.map((src) => {
                    const cfg = SOURCE_CONFIG[src]
                    if (!cfg) return null
                    return (
                        <View key={src} className="flex-row items-center gap-1 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                            <Ionicons name={cfg.icon as any} size={11} color="#6b7280" />
                            <AppText className="text-gray-500 text-[11px]">{cfg.label}</AppText>
                        </View>
                    )
                })}
                {lead.interaction_count > 1 && (
                    <View className="flex-row items-center gap-1 bg-primary/5 border border-primary/10 rounded-full px-2.5 py-1">
                        <Ionicons name="repeat-outline" size={11} color="#FF4F18" />
                        <AppText weight="bold" className="text-primary text-[11px]">{lead.interaction_count}×</AppText>
                    </View>
                )}
            </View>

            {/* Ad context */}
            {lead.ad_detail && (
                <View className="bg-white rounded-full p-4 mb-4 flex-row items-center gap-3 border border-gray-50">
                    <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
                        <Ionicons name="pricetag" size={14} color="#FF4F18" />
                    </View>
                    <View className="flex-1">
                        <AppText className="text-gray-500 text-[10px] uppercase font-bold">Interested In</AppText>
                        <AppText weight="semibold" className="text-gray-900 text-xs" numberOfLines={1}>
                            {lead.ad_detail.title}
                        </AppText>
                    </View>
                </View>
            )}

            {/* Actions */}
            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => onMessage(lead)}
                    className="flex-1 bg-primary h-14 rounded-full flex-row items-center justify-center"
                >
                    <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                    <AppText weight="bold" className="text-white ml-2">Send Message</AppText>
                </TouchableOpacity>

                {lead.client_detail?.phone && (
                    <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${lead.client_detail!.phone}`)}
                        className="w-14 h-14 rounded-full bg-gray-900 items-center justify-center"
                    >
                        <Ionicons name="call" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

export default function LeadsScreen() {
    const router = useRouter();
    const { leads, isLoading, markAsMessaged, markIgnored, refetch, isRefetching } = useLeads();
    const { mutateAsync: getOrCreateChat } = useGetOrCreateChat();

    const handleMessage = async (lead: Lead) => {
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

    const handleIgnore = (lead: Lead) => {
        Alert.alert(
            'Ignore this lead?',
            'They will be removed from your list. If they interact again, they will reappear.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Ignore',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await markIgnored(lead.id)
                        } catch (error) {
                            console.error('Error ignoring lead:', error)
                        }
                    }
                }
            ]
        )
    }

    return (
        <View className="flex-1 bg-gray-50">
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
                        <LeadCard
                            lead={item}
                            onMessage={handleMessage}
                            onIgnore={handleIgnore}
                        />
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
