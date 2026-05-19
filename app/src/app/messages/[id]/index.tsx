import {
  View,
  Platform,
  Pressable,
  ImageBackground,
  TextInput,
  Animated,
  Keyboard,
  Clipboard,
  Alert,
  Dimensions,
} from "react-native";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
import { useInAppNotificationStore } from "@/store/inAppNotificationStore";

// Approximates the iOS keyboard's native bezier; works on Android too.
const KB_EASING = Easing.bezier(0.17, 0.59, 0.4, 0.77);
const KB_FALLBACK_DURATION = 220;

export default function ChatRoomScreen() {
  const { t } = useTranslation();
  const { id, search: searchParam } = useLocalSearchParams<{
    id: string;
    search?: string;
  }>();
  const insets = useSafeAreaInsets();

  // While this chat is open, suppress message-banner notifications for it —
  // the user is already watching messages arrive on screen, a banner would
  // just be noise. Cleanup clears it when navigating away.
  useEffect(() => {
    if (!id) return;
    useInAppNotificationStore.getState().setActiveChatId(id);
    return () => {
      useInAppNotificationStore.getState().setActiveChatId(null);
    };
  }, [id]);
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

  // ── Unified bottom panel (sticker | attachment | null) — reveal pattern ───
  // ALL panels are rendered absolutely at the screen bottom. Keyboard slides
  // OVER them; dismissing the keyboard REVEALS whichever panel is currently
  // active. Only one panel can be active at a time (mutual exclusion).
  //
  // The chat content has a marginBottom = bottomInset which stays at
  // keyboardHeight whenever any panel is active OR keyboard is up. That keeps
  // the input row at a constant Y across all transitions.
  type ActivePanel = "sticker" | "attachment" | null;
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(320);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const bottomInset = useSharedValue(0);
  const isOpeningPanelRef = useRef(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const h = e.endCoordinates?.height ?? 320;
      setKeyboardHeight(h);
      setIsKeyboardVisible(true);
      // Keyboard takes over from any open panel.
      setActivePanel(null);
      const dur =
        (e as { duration?: number }).duration &&
        (e as { duration?: number }).duration! > 0
          ? (e as { duration: number }).duration
          : KB_FALLBACK_DURATION;
      bottomInset.value = withTiming(h, {
        duration: dur,
        easing: KB_EASING,
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setIsKeyboardVisible(false);
      if (isOpeningPanelRef.current) {
        // Keyboard dismissing TO reveal a panel — keep inset, no animation.
        isOpeningPanelRef.current = false;
        return;
      }
      const dur =
        (e as { duration?: number } | undefined)?.duration &&
        (e as { duration?: number }).duration! > 0
          ? (e as { duration: number }).duration
          : KB_FALLBACK_DURATION;
      bottomInset.value = withTiming(0, {
        duration: dur,
        easing: KB_EASING,
      });
    });

    // iOS only: catch mid-session keyboard frame changes (text ↔ emoji mode,
    // language switch, hardware keyboard attach). Filtered to skip the
    // dismiss case — keyboardWillChangeFrame ALSO fires when the keyboard
    // moves off-screen, with endCoordinates.screenY === screen.height. We
    // only want to react when the keyboard will remain visible.
    const changeFrameSub =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillChangeFrame", (e) => {
            const newHeight = e.endCoordinates?.height;
            const screenY = e.endCoordinates?.screenY;
            const screenHeight = Dimensions.get("screen").height;
            // Skip dismiss-flavored frame changes (keyboard going off-screen).
            if (
              screenY !== undefined &&
              screenY >= screenHeight - 1
            ) {
              return;
            }
            if (!newHeight || newHeight <= 0) return;
            setKeyboardHeight(newHeight);
            const dur =
              (e as { duration?: number }).duration &&
              (e as { duration?: number }).duration! > 0
                ? (e as { duration: number }).duration
                : KB_FALLBACK_DURATION;
            bottomInset.value = withTiming(newHeight, {
              duration: dur,
              easing: KB_EASING,
            });
          })
        : null;

    return () => {
      showSub.remove();
      hideSub.remove();
      changeFrameSub?.remove();
    };
  }, [bottomInset]);

  // Invariant: bottomInset must be 0 whenever neither keyboard nor any panel
  // is active. Catches paths where setActivePanel(null) is called outside the
  // keyboard listener (e.g., after picking a camera/gallery/document).
  useEffect(() => {
    if (activePanel === null && !isKeyboardVisible && bottomInset.value > 0) {
      bottomInset.value = withTiming(0, {
        duration: KB_FALLBACK_DURATION,
        easing: KB_EASING,
      });
    }
  }, [activePanel, isKeyboardVisible, bottomInset]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    marginBottom: bottomInset.value,
  }));

  const openPanel = useCallback(
    (target: "sticker" | "attachment") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (activePanel === target) {
        // Tapping same icon again: close panel → focus input → keyboard rises.
        setShouldRefocusInput((n) => n + 1);
        return;
      }
      // Switching panels or opening from nothing.
      setActivePanel(target);
      if (isKeyboardVisible) {
        // Coming from keyboard: dismiss, keep bottomInset at kbHeight.
        isOpeningPanelRef.current = true;
        Keyboard.dismiss();
      } else if (bottomInset.value === 0) {
        // No keyboard, no other panel: animate bottomInset up.
        bottomInset.value = withTiming(keyboardHeight, {
          duration: KB_FALLBACK_DURATION,
          easing: KB_EASING,
        });
      }
      // else: switching from one panel to another — bottomInset already at kbHeight.
    },
    [activePanel, isKeyboardVisible, keyboardHeight, bottomInset],
  );

  const handleToggleSticker = useCallback(
    () => openPanel("sticker"),
    [openPanel],
  );
  const handleToggleAttachment = useCallback(
    () => openPanel("attachment"),
    [openPanel],
  );

  // Bumping this triggers ChatInput to focus its TextInput.
  const [shouldRefocusInput, setShouldRefocusInput] = useState(0);

  // ── Attachment pickers (lifted from ChatInput so they live alongside the panel) ─
  const handlePickCamera = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t("create_ad.images.permissionRequired"),
          t("chat.cameraPermission"),
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.length) {
        setActivePanel(null);
        onImageSelectRequest(result.assets[0]);
      }
    } catch (err) {
      console.warn("[ChatRoom] camera failed:", err);
      Alert.alert(t("common.error"), t("chat.cameraError"));
    }
  }, [t]);

  const handlePickGallery = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t("create_ad.images.permissionRequired"),
          t("chat.cameraRollPermission"),
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsMultipleSelection: false,
        selectionLimit: 1,
      });
      if (!result.canceled && result.assets?.length) {
        setActivePanel(null);
        onImageSelectRequest(result.assets[0]);
      }
    } catch (err) {
      console.warn("[ChatRoom] gallery failed:", err);
      Alert.alert(t("common.error"), t("chat.galleryError"));
    }
  }, [t]);

  const handlePickDocument = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setActivePanel(null);
        onDocumentSelectRequest(result);
      }
    } catch (err) {
      console.warn("[ChatRoom] document failed:", err);
      Alert.alert("Upload Error", "Could not open your files. Please try again.");
    }
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

      <Reanimated.View
        style={[
          { flex: 1, backgroundColor: "#ECE5DD" },
          animatedContentStyle,
        ]}
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
              onAudioSelect={handleAudioSelect}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              disabled={isChatLoading}
              isBottomAreaActive={isKeyboardVisible || activePanel !== null}
              activePanel={activePanel}
              onToggleSticker={handleToggleSticker}
              onToggleAttachment={handleToggleAttachment}
              onPickCamera={handlePickCamera}
              shouldFocusInputSignal={shouldRefocusInput}
            />
          </View>
        )}
      </Reanimated.View>

      {/* Unified bottom panel — absolutely positioned at screen bottom, behind
          the keyboard. On iOS this gives the perfect reveal; on Android the
          RN window resize means it sits just above the keyboard area while
          keyboard is up, but stays put when keyboard dismisses. */}
      {activePanel !== null && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: keyboardHeight,
            backgroundColor: "#F5F5F5",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
          }}
        >
          {activePanel === "sticker" ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* TODO: drop a sticker grid component here. */}
              <Ionicons name="happy-outline" size={32} color="#CBD5E1" />
              <AppText style={{ color: "#94A3B8", marginTop: 8, fontSize: 13 }}>
                Stickers coming soon
              </AppText>
            </View>
          ) : (
            // Attachment panel: 3 options centered in the same drawer height
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
                paddingHorizontal: 24,
              }}
            >
              <Pressable
                onPress={handlePickCamera}
                style={{ alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#FFF7ED",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#FFEDD5",
                  }}
                >
                  <Ionicons name="camera" size={26} color="#FF4F18" />
                </View>
                <AppText
                  style={{ fontSize: 13, color: "#475569" }}
                  weight="semibold"
                >
                  {t("chat.camera")}
                </AppText>
              </Pressable>
              <Pressable
                onPress={handlePickGallery}
                style={{ alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#FFF7ED",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#FFEDD5",
                  }}
                >
                  <Ionicons name="image" size={26} color="#FF4F18" />
                </View>
                <AppText
                  style={{ fontSize: 13, color: "#475569" }}
                  weight="semibold"
                >
                  {t("chat.gallery")}
                </AppText>
              </Pressable>
              <Pressable
                onPress={handlePickDocument}
                style={{ alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#FFF7ED",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#FFEDD5",
                  }}
                >
                  <Ionicons name="document-text" size={26} color="#FF4F18" />
                </View>
                <AppText
                  style={{ fontSize: 13, color: "#475569" }}
                  weight="semibold"
                >
                  {t("chat.document")}
                </AppText>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
