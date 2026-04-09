import { View, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ImageBackground, TextInput, Animated, Keyboard, StatusBar, Clipboard, Alert } from "react-native";
import * as Haptics from 'expo-haptics';
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
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ChatMessage } from "@/api/types";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function ChatRoomScreen() {
    const { id, search: searchParam } = useLocalSearchParams<{ id: string, search?: string }>();
    const insets = useSafeAreaInsets();
    const {
        chat,
        messages: allMessages,
        isChatLoading,
        otherParticipant,
        participantStatus,
        isParticipantTyping,
        flatListRef,
        showScrollButton,
        unreadCountBelow,
        isConnected,
        handleSend,
        handleScroll,
        handleViewableItemsChanged,
        handleImageSelect,
        handleAudioSelect,
        handleDocumentSelect,
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
        user: currentUser
    } = useChatRoomLogic(id!);

    const router = useRouter();
    const [viewerVisible, setViewerVisible] = useState(false);
    const [initialImageIndex, setInitialImageIndex] = useState(0);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{
        type: 'image' | 'document';
        asset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset;
    } | null>(null);

    const [isSearchVisible, setIsSearchVisible] = useState(searchParam === 'true');
    const [searchQuery, setSearchQuery] = useState("");
    const [totalMatches, setTotalMatches] = useState(0);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const searchBarHeight = useRef(new Animated.Value(searchParam === 'true' ? 60 : 0)).current;

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
    }, [isSearchVisible]);

    useEffect(() => {
        setCurrentMatchIndex(0);
    }, [searchQuery]);

    const chatImages = useMemo(() => {
        return allMessages
            .filter(msg => msg.message_type === 'image' && msg.attachment)
            .map(msg => msg.attachment!);
    }, [allMessages]);

    const handleOpenImage = useCallback((imageUrl: string) => {
        const index = chatImages.indexOf(imageUrl);
        if (index !== -1) {
            setInitialImageIndex(index);
            setViewerVisible(true);
        }
    }, [chatImages]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage && !searchQuery) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, searchQuery, fetchNextPage]);

    const { playSentSound, playReceivedSound } = useChatSounds();
    const lastPlayedSentId = useRef<string | null>(null);
    const lastPlayedReceivedId = useRef<string | null>(null);

    useEffect(() => {
        if (allMessages.length > 0) {
            const lastMessage = allMessages[0];
            const messageId = String(lastMessage.id);
            const isMe = String(lastMessage.sender?.id) === String(currentUser?.id);
            const msgTime = new Date(lastMessage.created_at).getTime();
            const isRecent = (Date.now() - msgTime) < 15000;

            if (isRecent) {
                if (isMe) {
                    if (!messageId.startsWith('temp-') && lastPlayedSentId.current !== messageId) {
                        playSentSound();
                        lastPlayedSentId.current = messageId;
                    }
                } else {
                    if (lastPlayedReceivedId.current !== messageId) {
                        playReceivedSound();
                        lastPlayedReceivedId.current = messageId;
                    }
                }
            } else {
                if (isMe) lastPlayedSentId.current = messageId;
                else lastPlayedReceivedId.current = messageId;
            }
        }
    }, [allMessages, currentUser?.id, playSentSound, playReceivedSound]);

    const handleSendWithSound = useCallback(async (...args: any[]) => {
        // @ts-ignore
        await handleSend(...args);
    }, [handleSend]);

    const handleMediaSend = async (caption: string) => {
        if (!selectedMedia) return;
        if (selectedMedia.type === 'image') {
            await handleSend(caption, selectedMedia.asset.uri);
        } else {
            await handleSend(caption, undefined, undefined, undefined, selectedMedia.asset as DocumentPicker.DocumentPickerAsset);
        }
        setPreviewVisible(false);
        setSelectedMedia(null);
    };

    const onImageSelectRequest = (asset: ImagePicker.ImagePickerAsset) => {
        setSelectedMedia({ type: 'image', asset });
        setPreviewVisible(true);
    };

    const onDocumentSelectRequest = (result: DocumentPicker.DocumentPickerResult) => {
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelectedMedia({ type: 'document', asset: result.assets[0] });
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
                'Delete Message',
                'Are you sure you want to delete this message?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Delete', 
                        style: 'destructive', 
                        onPress: () => {
                            toggleMessageSelection(String(menuMessage.id));
                            handleDeleteSelected();
                        }
                    }
                ]
            );
        }
        menuBottomSheetRef.current?.dismiss();
    };

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {isSelectionMode ? (
                <View style={{ paddingTop: insets.top }} className="bg-primary flex-row items-center px-4 h-[100px]">
                    <Pressable onPress={clearSelection} className="mr-4">
                        <Ionicons name="close" size={28} color="white" />
                    </Pressable>
                    <AppText weight="bold" className="text-white text-lg flex-1">
                        {selectedMessageIds.size}
                    </AppText>
                    <View className="flex-row items-center gap-4">
                        {selectedMessageIds.size === 1 && (
                            <Pressable onPress={() => {
                                const msgId = Array.from(selectedMessageIds)[0];
                                const msg = allMessages.find(m => String(m.id) === msgId);
                                if (msg) setReplyTo(msg);
                                clearSelection();
                            }}>
                                <Ionicons name="arrow-undo" size={24} color="white" />
                            </Pressable>
                        )}
                        <Pressable onPress={() => {
                            const texts = Array.from(selectedMessageIds)
                                .map(id => allMessages.find(m => String(m.id) === id)?.content)
                                .filter(Boolean)
                                .join('\n');
                            if (texts) {
                                Clipboard.setString(texts);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                            clearSelection();
                        }}>
                            <Ionicons name="copy-outline" size={24} color="white" />
                        </Pressable>
                        <Pressable onPress={() => {
                            const count = selectedMessageIds.size;
                            Alert.alert(
                                'Delete Messages',
                                `Delete ${count} message${count > 1 ? 's' : ''}? This cannot be undone.`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Delete', style: 'destructive',
                                        onPress: () => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            handleDeleteSelected();
                                        },
                                    },
                                ]
                            );
                        }}>
                            <Ionicons name="trash-outline" size={24} color="white" />
                        </Pressable>
                    </View>
                </View>
            ) : (
                <ChatHeader
                    avatarSrc={otherParticipant?.avatar}
                    userName={otherParticipant?.full_name || otherParticipant?.username || (isChatLoading ? "Loading..." : "User")}
                    isOnline={participantStatus?.is_online}
                    lastSeen={participantStatus?.last_seen}
                    isTyping={isParticipantTyping}
                    onBackPress={() => router.back()}
                    onAvatarPress={() => router.push(`/messages/${id}/info`)}
                    onMenuPress={() => setIsSearchVisible(!isSearchVisible)}
                />
            )}

            <Animated.View style={{ height: searchBarHeight, overflow: 'hidden' }} className="bg-white border-b border-gray-100">
                <View className="flex-row items-center px-4 py-2 bg-gray-50 m-2 rounded-xl">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-gray-900 h-10"
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={isSearchVisible}
                        style={{ paddingVertical: 0 }}
                        multiline={false}
                    />
                    {searchQuery.length > 0 && totalMatches > 0 && (
                        <View className="flex-row items-center">
                            <AppText className="text-xs text-gray-500 mr-2">
                                {currentMatchIndex + 1} of {totalMatches}
                            </AppText>
                            <Pressable onPress={() => setCurrentMatchIndex((prev) => (prev + 1) % totalMatches)} className="p-1">
                                <Ionicons name="chevron-up" size={20} color="#666" />
                            </Pressable>
                            <Pressable onPress={() => setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches)} className="p-1">
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </Pressable>
                        </View>
                    )}
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")} className="ml-2">
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </Pressable>
                    )}
                </View>
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                className="flex-1"
                style={{ backgroundColor: '#F2F2F2' }}
            >
                <View className="flex-1 relative">
                    <ImageBackground
                        source={require("@/assets/images/chat_bg.png")}
                        style={{ flex: 1 }}
                        resizeMode="repeat"
                        imageStyle={{ opacity: 0.12 }}
                    >
                        {isChatLoading || !isReady ? (
                            <MessageSkeleton />
                        ) : (
                            <View style={{ flex: 1 }}>
                                <MessageList
                                    messages={[...allMessages].reverse()}
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
                            snapPoints={['35%']}
                            onClose={() => setMenuMessage(null)}
                        >
                            <View className="px-6 py-4 space-y-2">
                                <TouchableOpacity 
                                    onPress={handleMenuReply}
                                    className="flex-row items-center p-4 bg-gray-50 rounded-[20px]"
                                >
                                    <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-4">
                                        <Ionicons name="arrow-undo-outline" size={20} color="#FF4F18" />
                                    </View>
                                    <AppText weight="bold" className="text-gray-900 text-base">Reply</AppText>
                                </TouchableOpacity>

                                {menuMessage?.content && !['📷 Photo', '🎤 Voice Message', '📄 Document'].includes(menuMessage.content) && (
                                    <TouchableOpacity 
                                        onPress={handleMenuCopy}
                                        className="flex-row items-center p-4 bg-gray-50 rounded-[20px]"
                                    >
                                        <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-4">
                                            <Ionicons name="copy-outline" size={20} color="#4b5563" />
                                        </View>
                                        <AppText weight="bold" className="text-gray-900 text-base">Copy Text</AppText>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity 
                                    onPress={handleMenuSelect}
                                    className="flex-row items-center p-4 bg-gray-50 rounded-[20px]"
                                >
                                    <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-4">
                                        <Ionicons name="checkbox-outline" size={20} color="#4b5563" />
                                    </View>
                                    <AppText weight="bold" className="text-gray-900 text-base">Select Multiple</AppText>
                                </TouchableOpacity>

                                {String(menuMessage?.sender?.id || menuMessage?.sender) === String(currentUser?.id) && (
                                    <TouchableOpacity 
                                        onPress={handleMenuDelete}
                                        className="flex-row items-center p-4 bg-red-50 rounded-[20px]"
                                    >
                                        <View className="w-10 h-10 rounded-full bg-red-200 items-center justify-center mr-4">
                                            <Ionicons name="trash-outline" size={20} color="#dc2626" />
                                        </View>
                                        <AppText weight="bold" className="text-red-600 text-base">Delete Message</AppText>
                                    </TouchableOpacity>
                                )}
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
                                    style={({ pressed }) => [{
                                        transform: [{ scale: pressed ? 0.9 : 1 }],
                                        elevation: 4,
                                    }]}
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
                    </ImageBackground>
                </View>

                {!isSearchVisible && isReady && (
                    <View style={{ paddingBottom: insets.bottom, backgroundColor: 'white' }}>
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