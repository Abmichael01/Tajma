import { View, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import AppText from "@/components/ui/AppText";
import ChatListItem from "@/components/chat/ChatListItem";
import { useChats } from "@/hooks/useChat";
import { useUnifiedChatWebSocket } from "@/hooks/useUnifiedChatWebSocket";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function ChatScreen() {
  const { data: chats, isLoading, refetch } = useChats();
  // Enable global WebSocket for notifications/updates when on this screen
  useUnifiedChatWebSocket({ enabled: true });
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !chats) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#cb234a" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-4 border-b border-gray-100">
        <AppText variant="heading" weight="bold">Messages</AppText>
      </View>

      {!chats || chats.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <AppText variant="subheading" className="text-gray-500 text-center mb-4">
            No conversations yet
          </AppText>
          <AppText className="text-gray-400 text-center mb-6">
            When you contact a seller or someone contacts you, your chats will appear here.
          </AppText>
          <Link href="/" asChild>
            <Button variant="outline">Browse Ads</Button>
          </Link>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatListItem chat={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#cb234a" />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
