import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import type { ChatMessage, ChatSummary } from '@/api/types'
import { useChatWebSocketStore } from '@/store/chatWebSocketStore'

interface UseUnifiedChatWebSocketOptions {
  enabled?: boolean
  activeChatIds?: string[] // Chats to subscribe to
}

export const useUnifiedChatWebSocket = ({
  enabled = true,
  activeChatIds = [],
}: UseUnifiedChatWebSocketOptions) => {
  const { isAuthenticated, user } = useAuthStore()
  const store = useChatWebSocketStore()
  const queryClient = useQueryClient()

  // Handlers for WebSocket events
  const onChatMessage = useCallback((message: ChatMessage, chatId: string) => {
    console.log('📨 Hook: Received chat message:', message.id)

    // 1. Update messages list cache
    queryClient.setQueryData(['messages', chatId], (oldData: any) => {
      if (!oldData) return oldData
      const pages = [...oldData.pages]
      if (pages.length > 0) {
        // Add message to the first page (newest)
        const firstPage = { ...pages[0] }

        // Remove matching optimistic message OR same ID duplicate
        firstPage.results = firstPage.results.filter((m: any) => {
          // 1. Keep if not the same server ID (prevents server double-broadcast duplicates)
          if (String(m.id) === String(message.id)) return false;

          // 2. Client ID match (Rock-solid industry standard)
          if (message.client_id && String(m.client_id) === String(message.client_id)) {
            console.log('✅ Found matching optimistic message by client_id, removing:', m.id);
            return false;
          }

          // 3. Fallback: Fuzzy content match (for old messages or different clients)
          const isOptimisticFromMe = String(m.id).startsWith('temp-') && String(m.sender?.id) === String(message.sender?.id);
          if (isOptimisticFromMe && m.content === message.content && (m.message_type === message.message_type)) {
            return false;
          }

          return true;
        });

        firstPage.results = [message, ...firstPage.results]
        pages[0] = firstPage
      }
      return { ...oldData, pages }
    })

    // 2. Update chat summary in chats list
    queryClient.setQueryData(['chats'], (oldData: any) => {
      if (!oldData) return oldData
      const chats = Array.isArray(oldData) ? oldData : (oldData.results || [])

      const existingChatIndex = chats.findIndex((c: any) => String(c.id) === String(chatId))
      if (existingChatIndex !== -1) {
        const updatedChats = [...chats]
        const chat = { ...updatedChats[existingChatIndex] }
        chat.last_message = message
        chat.last_message_at = message.created_at
        // Only increment unread if NOT the sender
        // In a real app we'd also check if the user is currently looking at this chat
        // For now let's just update the list
        updatedChats[existingChatIndex] = chat

        // Move to top
        updatedChats.splice(existingChatIndex, 1)
        return [chat, ...updatedChats]
      }
      return oldData
    })
  }, [queryClient])

  const onChatListUpdate = useCallback((payload: any) => {
    const { chat, chat_id } = payload
    if (!chat) return

    queryClient.setQueryData(['chats'], (oldData: any) => {
      if (!oldData) return [chat]
      const chats = Array.isArray(oldData) ? oldData : (oldData.results || [])
      const existingIndex = chats.findIndex((c: any) => String(c.id) === String(chat_id))

      if (existingIndex !== -1) {
        const updated = [...chats]
        updated[existingIndex] = { ...updated[existingIndex], ...chat }
        return updated
      }
      return [chat, ...chats]
    })
  }, [queryClient])

  const onMessageStatusUpdate = useCallback((message: ChatMessage, chatId: string) => {
    // 1. Update message in messages list
    queryClient.setQueryData(['messages', chatId], (oldData: any) => {
      if (!oldData) return oldData
      const pages = oldData.pages.map((page: any) => ({
        ...page,
        results: page.results.map((m: any) =>
          String(m.id) === String(message.id) ? { ...m, ...message } : m
        )
      }))
      return { ...oldData, pages }
    })

    // 2. Update last_message status in chats list
    queryClient.setQueryData(['chats'], (oldData: any) => {
      if (!oldData) return oldData
      const chats = Array.isArray(oldData) ? oldData : (oldData.results || [])
      return chats.map((c: any) => {
        if (String(c.id) === String(chatId) && c.last_message && String(c.last_message.id) === String(message.id)) {
          return { ...c, last_message: { ...c.last_message, ...message } }
        }
        return c
      })
    })
  }, [queryClient])

  const markReceivedMessageRead = useCallback((message: any) => {
    if (!user?.id || !message?.sender || String(message.sender?.id) === String(user.id)) {
      return message
    }
    return { ...message, is_read: true }
  }, [user?.id])

  const onMarkedRead = useCallback((chatId: string) => {
    console.log(`[useUnifiedChatWebSocket] 📥 Received onMarkedRead for chat ${chatId}`);
    queryClient.setQueryData(['chats'], (oldData: any) => {
      if (!oldData) return oldData
      const chats = Array.isArray(oldData) ? oldData : (oldData.results || [])
      return chats.map((c: any) => {
        if (String(c.id) === String(chatId)) {
          const updatedChat = { ...c, unread_count: 0 }
          if (updatedChat.last_message) {
            updatedChat.last_message = markReceivedMessageRead(updatedChat.last_message)
          }
          return updatedChat
        }
        return c
      })
    })

    // Also update detail
    queryClient.setQueryData(['chats', chatId], (oldData: any) => {
      if (!oldData) return oldData
      const updatedChat = { ...oldData, unread_count: 0 }
      if (updatedChat.last_message) {
        updatedChat.last_message = markReceivedMessageRead(updatedChat.last_message)
      }
      return updatedChat
    })

    // Also update only received messages in this chat. Sender-side blue ticks
    // are driven by message_status_update from the backend.
    queryClient.setQueryData(['messages', chatId], (oldData: any) => {
      if (!oldData) return oldData
      const pages = oldData.pages.map((page: any) => ({
        ...page,
        results: page.results.map(markReceivedMessageRead)
      }))
      return { ...oldData, pages }
    })
  }, [markReceivedMessageRead, queryClient])

  const onUserStatus = useCallback((payload: { user_id: number; is_online: boolean; last_seen?: string }) => {
    queryClient.setQueryData(['chats', 'online-status'], (oldData: any) => {
      if (!oldData) return [{ user_id: payload.user_id, is_online: payload.is_online, last_seen: payload.last_seen }];

      // Handle both direct array and results object if applicable (though listOnlineStatuses returns array)
      const data = Array.isArray(oldData) ? oldData : (oldData.results || []);

      const existingIndex = data.findIndex((s: any) => String(s.user_id || s.user?.id) === String(payload.user_id));

      if (existingIndex !== -1) {
        const updated = [...data];
        updated[existingIndex] = {
          ...updated[existingIndex],
          is_online: payload.is_online,
          last_seen: payload.last_seen || updated[existingIndex].last_seen
        };
        return Array.isArray(oldData) ? updated : { ...oldData, results: updated };
      }

      const newItem = { user_id: payload.user_id, is_online: payload.is_online, last_seen: payload.last_seen };
      const finalized = [newItem, ...data];
      return Array.isArray(oldData) ? finalized : { ...oldData, results: finalized };
    });
  }, [queryClient]);

  // Set handlers in the store
  useEffect(() => {
    store.setHandlers({
      onChatMessage,
      onChatListUpdate,
      onMessageStatusUpdate,
      onMarkedRead,
      onUserStatus,
      // Typing is handled via store's onTyping as it's more ephemeral
    })
  }, [onChatMessage, onChatListUpdate, onMessageStatusUpdate, onMarkedRead, onUserStatus])

  // Connect/Disconnect based on auth and enabled state
  useEffect(() => {
    if (enabled && isAuthenticated) {
      store.connect()
    } else {
      store.disconnect()
    }
  }, [enabled, isAuthenticated]) // Removed store.connect/disconnect from deps to avoid re-runs

  // Subscribe/Unsubscribe to chats
  useEffect(() => {
    if (!store.isConnected) return

    activeChatIds.forEach(chatId => {
      if (!store.subscribedChats.has(chatId)) {
        store.subscribeToChat(chatId)
      }
    })
  }, [activeChatIds, store.isConnected, store.subscribedChats])

  return {
    isConnected: store.isConnected,
    sendMessage: store.sendMessage,
    sendTyping: store.sendTyping,
    markAsRead: store.markAsRead,
  }
}
