import { useState, useRef, useCallback, useEffect, useMemo, useTransition } from 'react';
import { FlatList } from 'react-native';
import { useChatDetail, useChatMessages, useMarkChatAsRead } from '@/hooks/useChat';
import { useQueryClient } from '@tanstack/react-query';
import { useUnifiedChatWebSocket } from '@/hooks/useUnifiedChatWebSocket';
import { useOnlineStatuses } from '@/hooks/useChat';
import { useChatWebSocketStore } from '@/store/chatWebSocketStore';
import { useAuthStore } from '@/store/authStore';
import { chatApi } from '@/api/chat';
import * as DocumentPicker from 'expo-document-picker';
import { useIsFocused } from '@react-navigation/native';

export function useChatRoomLogic(chatId: string) {
    const isFocused = useIsFocused();
    const flatListRef = useRef<FlatList>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [unreadCountBelow, setUnreadCountBelow] = useState(0);
    const [replyTo, setReplyTo] = useState<any>(null);
    const lastMessageIdRef = useRef<string | null>(null);
    const isNewMessageAddition = useRef(false);
    const [isPending, startTransition] = useTransition();
    const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
    const isSelectionMode = selectedMessageIds.size > 0;

    const { data: chat, isLoading: isChatLoading } = useChatDetail(chatId);
    const {
        data: messagesData,
        isLoading: isMessagesLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useChatMessages(chatId);

    const markAsReadMutation = useMarkChatAsRead();

    const messages = useMemo(() => {
        const rawMessages = messagesData?.pages.flatMap(page => page.results) || [];
        if (rawMessages.length === 0) return [];

        // Sorting is important because pages might arrive out of order or WebSocket might bridge gaps
        const sortedMessages = [...rawMessages].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const items: any[] = [];
        let lastDate: string | null = null;

        for (let i = 0; i < sortedMessages.length; i++) {
            const msg = sortedMessages[i];
            const dateObj = new Date(msg.created_at);
            const dateStr = dateObj.toDateString();

            if (dateStr !== lastDate) {
                items.push({ type: 'date', date: dateStr, id: `date-${msg.id}` });
                lastDate = dateStr;
            }
            items.push(msg);
        }

        const newestMsg = sortedMessages[sortedMessages.length - 1];
        if (newestMsg) {
            isNewMessageAddition.current = newestMsg.id !== lastMessageIdRef.current;
            lastMessageIdRef.current = String(newestMsg.id);
        }

        return items;
    }, [messagesData]);

    useUnifiedChatWebSocket({ enabled: true, activeChatIds: [chatId] });

    const { sendMessage: wsSendMessage, sendTyping: wsSendTyping, isConnected, markAsRead: wsMarkAsRead } = useChatWebSocketStore();
    const { data: onlineStatuses, refetch: refetchOnlineStatuses } = useOnlineStatuses();
    const typingStatus = useChatWebSocketStore(state => state.typingStatus);
    const { user: currentUser } = useAuthStore();

    const otherParticipant = chat?.participant1?.id === currentUser?.id
        ? chat?.participant2
        : chat?.participant1;

    const isParticipantTyping = otherParticipant?.id && chatId
        ? !!typingStatus[chatId]?.[otherParticipant.id]
        : false;

    const participantStatus = onlineStatuses?.find((status: any) => {
        const userId = status.user_id || status.user?.id;
        return String(userId) === String(otherParticipant?.id);
    });

    useEffect(() => {
        if (chatId && isConnected && isFocused) refetchOnlineStatuses();
    }, [chatId, isConnected, isFocused]);

    const queryClient = useQueryClient();

    const handleSend = useCallback(
        async (text: string, image?: string, audio?: string, audioDuration?: number, document?: DocumentPicker.DocumentPickerAsset) => {
            const trimmedText = text.trim();
            if (!trimmedText && !image && !audio && !document) return;

            const type: 'text' | 'image' | 'audio' | 'document' = image ? 'image' : audio ? 'audio' : document ? 'document' : 'text';
            const uri = image || audio || document?.uri;
            const tempId = `temp-${Date.now()}`;
            const currentReplyToId = replyTo?.id;

            const optimisticMessage = {
                id: tempId,
                chat: chatId,
                sender: currentUser,
                content: trimmedText || (image ? '📷 Photo' : audio ? '🎤 Audio' : document ? '📄 Document' : ''),
                attachment: uri,
                message_type: type,
                is_read: false,
                client_id: tempId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setReplyTo(null);

            // startTransition only for cache updates — NOT for scroll
            startTransition(() => {
                queryClient.setQueryData(['messages', chatId], (oldData: any) => {
                    if (!oldData) return oldData;
                    const pages = [...oldData.pages];
                    if (pages.length > 0) {
                        pages[0] = { ...pages[0], results: [optimisticMessage, ...pages[0].results] };
                    }
                    return { ...oldData, pages };
                });

                queryClient.setQueryData(['chats'], (oldData: any) => {
                    if (!oldData) return oldData;
                    const isArray = Array.isArray(oldData);
                    const chats = isArray ? oldData : (oldData.results || []);
                    const chatIndex = chats.findIndex((c: any) => String(c.id) === String(chatId));
                    if (chatIndex !== -1) {
                        const updatedChats = [...chats];
                        const chat = { ...updatedChats[chatIndex] };
                        chat.last_message = optimisticMessage;
                        chat.last_message_at = optimisticMessage.created_at;
                        updatedChats.splice(chatIndex, 1);
                        const finalChats = [chat, ...updatedChats];
                        if (isArray) return finalChats;
                        return { ...oldData, results: finalChats };
                    }
                    return oldData;
                });
            });

            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 50);

            (async () => {
                try {
                    if (image || audio || document) {
                        let type: 'image' | 'audio' | 'document' = 'image';
                        let fileUri = image || '';
                        if (audio) { type = 'audio'; fileUri = audio; }
                        else if (document) { type = 'document'; fileUri = document.uri; }
                        await chatApi.sendWithAttachment(chatId, trimmedText, fileUri, type, currentReplyToId, tempId);
                    } else {
                        wsSendMessage(chatId, trimmedText, currentReplyToId, tempId);
                    }
                } catch (error) {
                    console.error("Failed to send message:", error);
                    queryClient.setQueryData(['messages', chatId], (oldData: any) => {
                        if (!oldData) return oldData;
                        const pages = oldData.pages.map((page: any) => ({
                            ...page,
                            results: page.results.map((m: any) =>
                                m.id === tempId ? { ...m, send_failed: true } : m
                            )
                        }));
                        return { ...oldData, pages };
                    });
                }
            })();
        },
        [chatId, wsSendMessage, replyTo, currentUser, queryClient]
    );

    const scrollOffsetRef = useRef(0);

    // In inverted FlatList: offset 0 = visual bottom (newest messages)
    const handleScroll = useCallback((event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        scrollOffsetRef.current = y;
        setShowScrollButton(y > 150);
    }, []);

    const scrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setShowScrollButton(false);
        setUnreadCountBelow(0);
    }, []);

    // Auto-scroll when new message arrives (if near bottom)
    const prevLengthRef = useRef(messages.length);
    useEffect(() => {
        const newLen = messages.length;
        const oldLen = prevLengthRef.current;
        prevLengthRef.current = newLen;
        if (newLen > oldLen && scrollOffsetRef.current < 150) {
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 50);
        }
    }, [messages.length]);

    // Auto-scroll when typing indicator appears
    const prevTypingRef = useRef(isParticipantTyping);
    useEffect(() => {
        const wasTyping = prevTypingRef.current;
        prevTypingRef.current = isParticipantTyping;
        if (isParticipantTyping && !wasTyping && scrollOffsetRef.current < 150) {
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
        }
    }, [isParticipantTyping]);

    const lastMarkReadTime = useRef(0);
    const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
        if (!chatId || !currentUser) return;
        const now = Date.now();
        if (now - lastMarkReadTime.current < 2000) return;
        const hasUnreadVisible = viewableItems.some(({ item }) =>
            item && !item.type && String(item.sender?.id) !== String(currentUser.id) && !item.is_read
        );
        if (hasUnreadVisible && isFocused) {
            lastMarkReadTime.current = now;
            wsMarkAsRead(chatId);
        }
    }, [chatId, currentUser, wsMarkAsRead, isFocused]);

    const handleImageSelect = useCallback((asset: any) => handleSend('', asset.uri || asset), [handleSend]);
    const handleAudioSelect = useCallback((audioUri: string, duration: number) => handleSend('', undefined, audioUri, duration), [handleSend]);
    const handleDocumentSelect = useCallback((result: DocumentPicker.DocumentPickerResult) => {
        if (!result.canceled && result.assets?.length > 0) handleSend('', undefined, undefined, undefined, result.assets[0]);
    }, [handleSend]);

    const lastTypingTime = useRef(0);
    const sendTyping = useCallback((isTyping: boolean) => {
        const now = Date.now();
        if (!isTyping || now - lastTypingTime.current > 1000) {
            wsSendTyping(chatId, isTyping);
            if (isTyping) lastTypingTime.current = now;
        }
    }, [chatId, wsSendTyping]);

    // ── INSTANT HEADER UPDATE ────────────────────────────────────────────────
    // Removed startTransition — selection state must be HIGH priority so the
    // header switches instantly when the first message is long-pressed.
    // startTransition was marking it as low-priority, causing the 2s delay.
    const toggleMessageSelection = useCallback((messageId: string) => {
        setSelectedMessageIds(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) next.delete(messageId);
            else next.add(messageId);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedMessageIds(new Set());
    }, []);

    return {
        chat,
        messages,
        isChatLoading: isChatLoading || isMessagesLoading,
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
        user: currentUser,
    };
}