"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatWebSocketStore } from '@/store/chatWebSocketStore'
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
  const { connect, disconnect, setHandlers, isConnected } = useChatWebSocketStore()

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
    
    // Also update messages cache for this chat
    queryClient.setQueryData(['messages', chatId], (oldData: any) => {
      if (!oldData) return oldData
      
      if (oldData.pages) {
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            results: page.results?.map((msg: ChatMessage) => {
              if (msg.id === message.id) {
                return { ...msg, ...message }
              }
              return msg
            }) || [],
          })),
        }
      }
      
      if (Array.isArray(oldData)) {
        return oldData.map((msg: ChatMessage) => {
          if (msg.id === message.id) {
            return { ...msg, ...message }
          }
          return msg
        })
      }
      
      return oldData
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
    
    // Invalidate messages query to refresh delivery status
    queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
  }

  // Set handlers in store
  useEffect(() => {
    setHandlers({
      onChatListUpdate: handleChatEvent,
      onMessageStatusUpdate: handleMessageStatusUpdate,
      onMarkedRead: handleMarkedRead,
    })
  }, [setHandlers])

  // Connect/disconnect based on authentication
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount - keep connection alive across page navigation
      // Only disconnect on logout
    }
  }, [isAuthenticated, connect, disconnect])

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const { ws } = useChatWebSocketStore.getState()
      if (document.visibilityState === 'visible' && ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'ping' }))
          useChatWebSocketStore.setState({ lastPongTime: Date.now() })
        } catch (error) {
          console.error('Failed to send ping on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null // This component doesn't render anything
}

