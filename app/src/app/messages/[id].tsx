import { useEffect, useRef, useState, useCallback } from "react";
import { View, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable, ViewToken } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatInput from "@/components/chat/ChatInput";
import ChatHeader from "@/components/chat/ChatHeader";
import { useChatMessages, useChatDetail, useMarkChatAsRead, useOnlineStatuses } from "@/hooks/useChat";
import { useUnifiedChatWebSocket } from "@/hooks/useUnifiedChatWebSocket";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { useAuthStore } from "@/store/authStore";
import { useChatSounds } from "@/hooks/useChatSounds";
import AppText from "@/components/ui/AppText";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = id;
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const previousMessagesLength = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCountBelow, setUnreadCountBelow] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isParticipantTyping, setIsParticipantTyping] = useState(false);
  
  // Sound hooks
  const { playSentSound, playReceivedSound, playTypingSound } = useChatSounds();

  // Queries
  const { data: chat, isLoading: isChatLoading } = useChatDetail(chatId);
  const { 
    data: messagesData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: isMessagesLoading
  } = useChatMessages(chatId);

  // Mark as read mutation
  const { mutate: markAsRead } = useMarkChatAsRead();

  // Online statuses
  const { data: onlineStatuses } = useOnlineStatuses();

  // Flatten pages into single list of messages and reverse for inverted list
  const messages = messagesData?.pages.flatMap(page => page.results) || [];
  const reversedMessages = [...messages].reverse();

  // WebSocket connection
  const { sendMessage, sendTyping, isConnected } = useUnifiedChatWebSocket({
    activeChatIds: chatId ? [chatId] : [],
    enabled: true
  });

  // Real-time updates with typing callback
  useChatRealtime({
    activeConversationId: chatId || null,
    onTypingChange: (typing, userId, receivedChatId) => {
      // Only update if typing event is for current chat and not from current user
      if (receivedChatId === chatId && userId !== user?.id) {
        setIsParticipantTyping(typing);
      }
    },
  });

  // Get other participant
  const otherParticipant = chat?.participant1.id === user?.id 
    ? chat?.participant2 
    : chat?.participant1;

  // Get online status for participant
  const participantStatus = onlineStatuses?.find(
    status => status.user_id === otherParticipant?.id
  );

  // Scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0 && !isMessagesLoading && isAtBottom) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length, isMessagesLoading, isAtBottom]);

  // Play sound for new received messages
  useEffect(() => {
    if (messages.length > previousMessagesLength.current && previousMessagesLength.current > 0) {
      // Get the latest message (newest is at index 0 since we get newest first from backend)
      const latestMessage = messages[0];
      // Only play sound if it's from another user (not me)
      if (latestMessage && latestMessage.sender.id !== user?.id) {
        playReceivedSound();
      }
    }
    previousMessagesLength.current = messages.length;
  }, [messages.length, user?.id, playReceivedSound]);

  // Play typing sound when participant starts typing
  const wasTypingRef = useRef(false);
  useEffect(() => {
    if (isParticipantTyping && !wasTypingRef.current) {
      playTypingSound();
      wasTypingRef.current = true;
    } else if (!isParticipantTyping) {
      wasTypingRef.current = false;
    }
  }, [isParticipantTyping, playTypingSound]);

  // Handle scroll and track position
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    const isNearBottom = distanceFromBottom < 100;

    setIsAtBottom(isNearBottom);

    if (isNearBottom) {
      setShowScrollButton(false);
      setUnreadCountBelow(0);
    } else {
      setShowScrollButton(true);
      
      // Count unread messages below viewport
      const viewportTop = contentOffset.y;
      let count = 0;
      
      // Since list is inverted, messages below viewport are actually "newer" messages at the top
      // We need to count unread messages that are positioned above current scroll position
      reversedMessages.forEach((message, index) => {
        if (message.sender.id !== user?.id && !message.is_read) {
          // In inverted list, newer messages are at the top (lower indices)
          // Calculate approximate position - each message is ~80px
          const approximatePosition = index * 80;
          if (approximatePosition < viewportTop) {
            count++;
          }
        }
      });
      
      setUnreadCountBelow(count);
    }
  }, [reversedMessages, user?.id]);

  // Handle viewable items changed - mark as read
  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (!chatId || !user) return;

    // Find unread messages from other user
    const unreadMessages = messages.filter(
      msg => !msg.is_read && msg.sender.id !== user.id
    );

    if (unreadMessages.length === 0) return;

    // Get last (newest) unread message
    const lastUnreadMessage = unreadMessages[0]; // Newest first from backend

    // Check if this message is viewable
    const isLastUnreadVisible = viewableItems.some(
      item => item.item.id === lastUnreadMessage.id && item.isViewable
    );

    if (isLastUnreadVisible) {
      // Mark all messages as read
      markAsRead(chatId);
    }
  }, [messages, user, chatId, markAsRead]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10, // At least 10% visible
    minimumViewTime: 100,
  }).current;

  const handleSend = (text: string) => {
    if (chatId) {
      sendMessage(chatId, text);
      playSentSound();
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (chatId) {
      sendTyping(chatId, isTyping);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
    setUnreadCountBelow(0);
  };

  if (isChatLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#cb234a" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ChatHeader 
        avatarSrc={otherParticipant?.avatar}
        userName={otherParticipant?.full_name || otherParticipant?.username || "User"}
        isOnline={participantStatus?.is_online}
        lastSeen={participantStatus?.last_seen}
        isTyping={isParticipantTyping}
        onBackPress={() => router.back()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        className="flex-1"
        style={{ backgroundColor: '#F5F5F5' }}
      >
        <View className="flex-1 relative">
          <FlatList
            ref={flatListRef}
            inverted
            data={reversedMessages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <MessageBubble message={item} />}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ListFooterComponent={
              <>
                {hasNextPage && (
                  <View className="py-2">
                    <ActivityIndicator size="small" color="#aaa" />
                  </View>
                )}
                {isParticipantTyping && (
                  <TypingIndicator
                    avatarSrc={otherParticipant?.avatar}
                    userName={otherParticipant?.full_name || otherParticipant?.username || "User"}
                  />
                )}
              </>
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
          />

          {/* Scroll to Bottom Button - WhatsApp style */}
          {showScrollButton && (
            <View className="absolute bottom-4 right-4">
              <Pressable
                onPress={scrollToBottom}
                className="bg-primary rounded-full p-3 shadow-lg"
                style={({ pressed }) => [
                  {
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  },
                ]}
              >
                <Ionicons name="chevron-down" size={24} color="white" />
                {unreadCountBelow > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
                    <AppText className="text-white text-xs font-bold">
                      {unreadCountBelow > 99 ? '99+' : unreadCountBelow}
                    </AppText>
                  </View>
                )}
              </Pressable>
            </View>
          )}
        </View>

        <ChatInput 
          onSend={handleSend} 
          onTypingChange={handleTypingChange}
          disabled={!isConnected} 
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
