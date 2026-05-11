import {
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ImageBackground,
  TextInput,
  Animated,
  Keyboard,
  Clipboard,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppText from "@/components/ui/AppText";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatInput from "@/components/chat/ChatInput";
import BottomSheet, { BottomSheetRef } from "@/components/ui/BottomSheet";
import { useChatRoomLogic } from "@/hooks/chat/useChatRoomLogic";
import { useChatSounds } from "@/hooks/useChatSounds";
import MessageList from "./components/MessageList";
import MessageSkeleton from "@/components/chat/MessageSkeleton";
import ImageViewer from "@/components/ui/ImageViewer";
import MediaPreviewModal from "@/components/chat/MediaPreviewModal";
import { resolveImageUrl } from "@/utils/imageUtils";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ChatMessage } from "@/api/types";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function ChatRoomScreen() {
  const { id, search: searchParam } = useLocalSearchParams<{
    id: string;
    search?: string;
  }>();
  const insets = useSafeAreaInsets();
  const {
    messages: allMessages,
    isChatLoading,
    otherParticipant,
    participantStatus,
    isParticipantTyping,
    flatListRef,
    showScrollButton,
    unreadCountBelow,
    handleSend,
    handleScroll,
    handleViewableItemsChanged,
    handleAudioSelect,
    sendTyping,
    scrollToBottom,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    replyTo,
    setReplyTo,
    isSelectionMode,
    selectedMessageIds,
    toggleMessageSelection,
    clearSelection,
    handleDeleteSelected,
    deleteMessagesByIds,
    user: currentUser,
  } = useChatRoomLogic(id!);

  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "document";
    asset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset;
  } | null>(null);

  const [isSearchVisible, setIsSearchVisible] = useState(
    searchParam === "true",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchBarHeight = useRef(
    new Animated.Value(searchParam === "true" ? 60 : 0),
  ).current;

  // Use a "ready" state to defer heavy rendering until after navigation finishes
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50); // Minimal delay to allow transition to start
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    Animated.timing(searchBarHeight, {
      toValue: isSearchVisible ? 60 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (!isSearchVisible) {
      setSearchQuery("");
      Keyboard.dismiss();
    }
  }, [isSearchVisible, searchBarHeight]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  const chatMessages = useMemo(() => {
    return allMessages.filter(
      (msg: any): msg is ChatMessage => !msg.type && !!msg.sender,
    );
  }, [allMessages]);

  const displayMessages = useMemo(() => {
    return [...allMessages].reverse();
  }, [allMessages]);

  const newestMessage = useMemo(() => {
    return chatMessages.length ? chatMessages[chatMessages.length - 1] : null;
  }, [chatMessages]);

  const chatImages = useMemo(() => {
    return chatMessages
      .filter((msg) => msg.message_type === "image" && msg.attachment)
      .map((msg) => msg.attachment!);
  }, [chatMessages]);

  const handleOpenImage = useCallback(
    (imageUrl: string) => {
      const index = chatImages.findIndex((img) => resolveImageUrl(img) === imageUrl);
      if (index !== -1) {
        setInitialImageIndex(index);
        setViewerVisible(true);
      }
    },
    [chatImages],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !searchQuery) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, searchQuery, fetchNextPage]);

  const { playSentSound, playReceivedSound } = useChatSounds();
  const lastPlayedSentId = useRef<string | null>(null);
  const lastPlayedReceivedId = useRef<string | null>(null);

  useEffect(() => {
    if (!newestMessage) return;

    const messageId = String(newestMessage.id);
    const isMe = String(newestMessage.sender?.id) === String(currentUser?.id);
    const msgTime = new Date(newestMessage.created_at).getTime();
    const isRecent = Number.isFinite(msgTime) && Date.now() - msgTime < 15000;

    if (isRecent) {
      if (isMe) {
        if (
          !messageId.startsWith("temp-") &&
          lastPlayedSentId.current !== messageId
        ) {
          playSentSound();
          lastPlayedSentId.current = messageId;
        }
      } else if (lastPlayedReceivedId.current !== messageId) {
        playReceivedSound();
        lastPlayedReceivedId.current = messageId;
      }
    } else if (isMe) {
      lastPlayedSentId.current = messageId;
    } else {
      lastPlayedReceivedId.current = messageId;
    }
  }, [newestMessage, currentUser?.id, playSentSound, playReceivedSound]);

  const handleSendWithSound = useCallback(
    async (...args: any[]) => {
      // @ts-ignore
      await handleSend(...args);
    },
    [handleSend],
  );

  const handleMediaSend = async (
    caption: string,
    editedMedia?:
      | ImagePicker.ImagePickerAsset
      | DocumentPicker.DocumentPickerAsset,
  ) => {
    if (!selectedMedia) return;
    const mediaToSend = editedMedia ?? selectedMedia.asset;
    if (selectedMedia.type === "image") {
      await handleSend(caption, mediaToSend.uri);
    } else {
      await handleSend(
        caption,
        undefined,
        undefined,
        undefined,
        mediaToSend as DocumentPicker.DocumentPickerAsset,
      );
    }
    setPreviewVisible(false);
    setSelectedMedia(null);
  };

  const onImageSelectRequest = (asset: ImagePicker.ImagePickerAsset) => {
    setSelectedMedia({ type: "image", asset });
    setPreviewVisible(true);
  };

  const onDocumentSelectRequest = (
    result: DocumentPicker.DocumentPickerResult,
  ) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedMedia({ type: "document", asset: result.assets[0] });
      setPreviewVisible(true);
    }
  };

  const menuBottomSheetRef = useRef<BottomSheetRef>(null);
  const [menuMessage, setMenuMessage] = useState<ChatMessage | null>(null);

  const handleMessageLongPress = useCallback((message: ChatMessage) => {
    setMenuMessage(message);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    menuBottomSheetRef.current?.present();
  }, []);

  const handleMenuReply = () => {
    if (menuMessage) setReplyTo(menuMessage);
    menuBottomSheetRef.current?.dismiss();
  };

  const handleMenuCopy = () => {
    if (menuMessage?.content) {
      Clipboard.setString(menuMessage.content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    menuBottomSheetRef.current?.dismiss();
  };

  const handleMenuSelect = () => {
    if (menuMessage) {
      toggleMessageSelection(String(menuMessage.id));
    }
    menuBottomSheetRef.current?.dismiss();
  };

  const handleMenuDelete = () => {
    if (menuMessage) {
      Alert.alert(
        "Delete Message",
        "Are you sure you want to delete this message?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteMessagesByIds([String(menuMessage.id)]);
              menuBottomSheetRef.current?.dismiss();
            },
          },
        ],
      );
    }
    menuBottomSheetRef.current?.dismiss();
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      {isSelectionMode ? (
        <View
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={{ paddingTop: insets.top }}
          className="bg-primary flex-row items-center px-4 h-[100px]"
        >
          <Pressable onPress={clearSelection} className="mr-4">
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <AppText weight="bold" className="text-white text-lg flex-1">
            {selectedMessageIds.size}
          </AppText>
          <View className="flex-row items-center gap-4">
            {selectedMessageIds.size === 1 && (
              <Pressable
                onPress={() => {
                  const msgId = Array.from(selectedMessageIds)[0];
                  const msg = allMessages.find((m) => String(m.id) === msgId);
                  if (msg) setReplyTo(msg);
                  clearSelection();
                }}
              >
                <Ionicons name="arrow-undo" size={24} color="white" />
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                const texts = Array.from(selectedMessageIds)
                  .map(
                    (id) =>
                      allMessages.find((m) => String(m.id) === id)?.content,
                  )
                  .filter(Boolean)
                  .join("\n");
                if (texts) {
                  Clipboard.setString(texts);
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                }
                clearSelection();
              }}
            >
              <Ionicons name="copy-outline" size={24} color="white" />
            </Pressable>
            <Pressable
              onPress={() => {
                const count = selectedMessageIds.size;
                Alert.alert(
                  "Delete Messages",
                  `Delete ${count} message${count > 1 ? "s" : ""}? This cannot be undone.`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleDeleteSelected();
                      },
                    },
                  ],
                );
              }}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
          <ChatHeader
            avatarSrc={otherParticipant?.avatar}
            userName={
              otherParticipant?.full_name ||
              otherParticipant?.username ||
              (isChatLoading ? "Loading..." : "User")
            }
            isOnline={participantStatus?.is_online}
            lastSeen={participantStatus?.last_seen}
            isTyping={isParticipantTyping}
            onBackPress={() => router.back()}
            onAvatarPress={() => router.push(`/messages/${id}/info`)}
            onMenuPress={() => setIsSearchVisible(!isSearchVisible)}
          />
        </View>
      )}

      <Animated.View
        style={{ height: searchBarHeight, overflow: "hidden" }}
        className="bg-white border-b border-gray-100"
      >
        <View className="flex-row items-center m-2 gap-2">
          <View className="flex-1 flex-row items-center px-3 py-1.5 bg-gray-100/80 rounded-2xl border border-gray-100">
            <Ionicons name="search-outline" size={18} color="#64748B" />
            <TextInput
              className="flex-1 ml-2 text-[15px] text-gray-900 h-9"
              placeholder="Search messages..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={isSearchVisible}
              style={{ paddingVertical: 0 }}
              multiline={false}
            />
            {searchQuery.length > 0 && totalMatches > 0 && (
              <View className="flex-row items-center bg-white/50 px-2 py-0.5 rounded-lg border border-gray-200/50">
                <AppText className="text-[11px] text-slate-500 font-bold mr-2">
                  {currentMatchIndex + 1} / {totalMatches}
                </AppText>
                <View className="flex-row items-center border-l border-gray-200 pl-1 ml-1 gap-1">
                  <Pressable
                    onPress={() =>
                      setCurrentMatchIndex((prev) => (prev + 1) % totalMatches)
                    }
                    className="p-1"
                    hitSlop={8}
                  >
                    <Ionicons name="chevron-up" size={18} color="#475569" />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setCurrentMatchIndex(
                        (prev) => (prev - 1 + totalMatches) % totalMatches,
                      )
                    }
                    className="p-1"
                    hitSlop={8}
                  >
                    <Ionicons name="chevron-down" size={18} color="#475569" />
                  </Pressable>
                </View>
              </View>
            )}
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                className="ml-2"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>
          {/* Cancel button — closes the search bar entirely */}
          <Pressable
            onPress={() => setIsSearchVisible(false)}
            hitSlop={10}
            className="px-2"
          >
            <AppText weight="bold" className="text-primary text-sm">
              Cancel
            </AppText>
          </Pressable>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight + (isSearchVisible ? 60 : 0) : 0}
        style={{ flex: 1, backgroundColor: "#ECE5DD" }}
      >
        <View className="flex-1 relative">
          <ImageBackground
            source={require("@/assets/images/chat_bg.jpg")}
            style={{ flex: 1 }}
            resizeMode="repeat"
            imageStyle={{ opacity: 0.12 }}
          >
            {isChatLoading || !isReady ? (
              <MessageSkeleton />
            ) : (
              <View style={{ flex: 1 }}>
                <MessageList
                  messages={displayMessages}
                  isParticipantTyping={isParticipantTyping}
                  otherParticipant={otherParticipant}
                  hasNextPage={hasNextPage && !searchQuery}
                  isFetchingNextPage={isFetchingNextPage}
                  flatListRef={flatListRef}
                  onScroll={handleScroll}
                  onEndReached={handleEndReached}
                  onViewableItemsChanged={handleViewableItemsChanged}
                  onImagePress={handleOpenImage}
                  onReply={setReplyTo}
                  searchQuery={searchQuery}
                  currentMatchIndex={currentMatchIndex}
                  onMatchesFound={setTotalMatches}
                  isSelectionMode={isSelectionMode}
                  selectedMessageIds={selectedMessageIds}
                  onSelectionChange={toggleMessageSelection}
                  onLongPress={handleMessageLongPress}
                />
              </View>
            )}

            <BottomSheet
              ref={menuBottomSheetRef}
              title="Message Options"
              snapPoints={["38%"]}
              onClose={() => setMenuMessage(null)}
            >
              <View className="px-6 py-2">
                <View className="flex-row items-center gap-3 mb-6">
                  <TouchableOpacity
                    onPress={handleMenuReply}
                    className="flex-1 items-center justify-center p-4 bg-white rounded-full border border-gray-100 shadow-sm"
                  >
                    <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-2">
                      <Ionicons
                        name="arrow-undo-outline"
                        size={20}
                        color="#FF4F18"
                      />
                    </View>
                    <AppText
                      weight="bold"
                      className="text-gray-900 text-[11px] uppercase tracking-wider"
                    >
                      Reply
                    </AppText>
                  </TouchableOpacity>

                  {menuMessage?.content &&
                    !["📷 Photo", "🎤 Voice Message", "📄 Document"].includes(
                      menuMessage.content,
                    ) && (
                      <TouchableOpacity
                        onPress={handleMenuCopy}
                        className="flex-1 items-center justify-center p-4 bg-white rounded-full border border-gray-100 shadow-sm"
                      >
                        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mb-2">
                          <Ionicons
                            name="copy-outline"
                            size={20}
                            color="#4b5563"
                          />
                        </View>
                        <AppText
                          weight="bold"
                          className="text-gray-900 text-[11px] uppercase tracking-wider"
                        >
                          Copy
                        </AppText>
                      </TouchableOpacity>
                    )}

                  <TouchableOpacity
                    onPress={handleMenuSelect}
                    className="flex-1 items-center justify-center p-4 bg-white rounded-full border border-gray-100 shadow-sm"
                  >
                    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mb-2">
                      <Ionicons
                        name="checkbox-outline"
                        size={20}
                        color="#4b5563"
                      />
                    </View>
                    <AppText
                      weight="bold"
                      className="text-gray-900 text-[11px] uppercase tracking-wider"
                    >
                      Select
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* List Actions */}
                <View className="space-y-3">
                  {String(menuMessage?.sender?.id || menuMessage?.sender) ===
                    String(currentUser?.id) && (
                    <TouchableOpacity
                      onPress={handleMenuDelete}
                      className="flex-row items-center p-4 bg-red-50 rounded-full border border-red-100"
                    >
                      <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-4">
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#dc2626"
                        />
                      </View>
                      <AppText weight="bold" className="text-red-600 text-base">
                        Delete for everyone
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </BottomSheet>

            <ImageViewer
              images={chatImages}
              visible={viewerVisible}
              initialIndex={initialImageIndex}
              onClose={() => setViewerVisible(false)}
              title="Media"
            />

            <MediaPreviewModal
              visible={previewVisible}
              media={selectedMedia}
              onClose={() => {
                setPreviewVisible(false);
                setSelectedMedia(null);
              }}
              onSend={handleMediaSend}
            />

            {!isChatLoading && showScrollButton && (
              <View className="absolute bottom-4 right-4">
                <Pressable
                  onPress={scrollToBottom}
                  className="bg-primary rounded-full p-3 shadow-lg"
                  style={({ pressed }) => [
                    {
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                      elevation: 4,
                    },
                  ]}
                >
                  <Ionicons name="chevron-down" size={24} color="white" />
                  {unreadCountBelow > 0 && (
                    <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
                      <AppText className="text-white text-xs font-bold">
                        {unreadCountBelow > 99 ? "99+" : unreadCountBelow}
                      </AppText>
                    </View>
                  )}
                </Pressable>
              </View>
            )}
          </ImageBackground>
        </View>

        {!isSearchVisible && isReady && (
          <View
            style={{
              backgroundColor: "#F0F2F5",
            }}
          >
            <ChatInput
              onSend={handleSendWithSound}
              onTypingChange={sendTyping}
              onImageSelect={onImageSelectRequest}
              onAudioSelect={handleAudioSelect}
              onDocumentSelect={onDocumentSelectRequest}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              disabled={isChatLoading}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
