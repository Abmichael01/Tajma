"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUnifiedChatWebSocket } from '@/hooks/useUnifiedChatWebSocket'
import { useQueryClient } from '@tanstack/react-query'
import type { ChatMessage, ChatSummary } from '@/api/types'

/**
 * Global chat connection component that maintains WebSocket connection
 * when user is authenticated, regardless of current page.
 * This ensures real-time updates for chat list and unread counts.
 */
export default function GlobalChatConnection() {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  // Handler for chat list updates (new messages, read receipts, etc.)
  const handleChatEvent = (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => {
    const { chat: updatedChat } = payload

    if (!updatedChat) return

    // Update Chat List Cache
    queryClient.setQueryData(['chats'], (oldData: ChatSummary[] | undefined) => {
      if (!oldData) return [updatedChat]
      
      const chats = [...oldData]
      const index = chats.findIndex((c) => c.id === updatedChat.id)
      
      if (index !== -1) {
        chats[index] = { ...chats[index], ...updatedChat }
      } else {
        chats.unshift(updatedChat)
      }
      
      // Sort by most recent activity
      return chats.sort((a, b) => {
        const timeA = new Date(a.last_message_at || a.updated_at).getTime()
        const timeB = new Date(b.last_message_at || b.updated_at).getTime()
        return timeB - timeA
      })
    })

    // Update chat detail cache
    queryClient.setQueryData(['chats', payload.chat_id], (oldData: any) => {
      if (!oldData) return oldData
      return { ...oldData, ...updatedChat }
    })
  }

  // Handler for message status updates (read receipts)
  const handleMessageStatusUpdate = (message: ChatMessage, chatId: string) => {
    // Update chat list - update last_message status if it matches
    queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
      if (!oldChats) return oldChats
      return oldChats.map((chat) => {
        if (chat.id === chatId && chat.last_message && chat.last_message.id === message.id) {
          return {
            ...chat,
            last_message: {
              ...chat.last_message,
              ...message,
            },
          }
        }
        return chat
      })
    })
  }

  // Handler for marked read event
  const handleMarkedRead = (chatId: string, count: number) => {
    // Update chat list - set unread_count to 0 when messages are marked as read
    queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
      if (!oldChats) return oldChats
      return oldChats.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            unread_count: 0,
          }
        }
        return chat
      })
    })
  }

  // Connect to chat WebSocket globally (no active chat subscriptions)
  // This maintains connection for receiving chat list updates
  useUnifiedChatWebSocket({
    enabled: isAuthenticated,
    activeChatIds: [], // No active chats - just maintain connection for list updates
    onChatListUpdate: handleChatEvent,
    onMessageStatusUpdate: handleMessageStatusUpdate,
    onMarkedRead: handleMarkedRead,
  })

  return null // This component doesn't render anything
}

