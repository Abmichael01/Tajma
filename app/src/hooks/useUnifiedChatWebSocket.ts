
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const { isAuthenticated } = useAuthStore()
  const store = useChatWebSocketStore()
  
  // Connect/Disconnect based on auth and enabled state
  useEffect(() => {
    if (enabled && isAuthenticated) {
      store.connect()
    } else {
      store.disconnect()
    }
  }, [enabled, isAuthenticated, store.connect, store.disconnect])
  
  // Subscribe/Unsubscribe to chats
  useEffect(() => {
    if (!store.isConnected) return
    
    // Subscribe to new active chats
    activeChatIds.forEach(chatId => {
      if (!store.subscribedChats.has(chatId)) {
        store.subscribeToChat(chatId)
      }
    })
    
    // Unsubscribe from inactive chats
    // (Optional: depending on how you want to manage bandwidth vs user experience)
    // store.subscribedChats.forEach(chatId => {
    //   if (!activeChatIds.includes(chatId)) {
    //     store.unsubscribeFromChat(chatId)
    //   }
    // })
    
  }, [activeChatIds, store.isConnected, store.subscribedChats, store.subscribeToChat, store.unsubscribeFromChat])

  return {
    isConnected: store.isConnected,
    sendMessage: store.sendMessage,
    sendTyping: store.sendTyping,
    markAsRead: store.markAsRead,
  }
}
