"use client"

import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useUnifiedChatWebSocket } from './useUnifiedChatWebSocket'
import type { ChatMessage, ChatSummary } from '@/api/types'

interface UseChatRealtimeOptions {
  activeConversationId: string | null
  onMessageReceived?: (message: ChatMessage) => void
  onTypingChange?: (isTyping: boolean, userId: number, chatId: string) => void
}

export const useChatRealtime = ({ activeConversationId, onMessageReceived, onTypingChange }: UseChatRealtimeOptions) => {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  
  // Prepare active chat IDs array for unified connection
  const activeChatIds = useMemo(() => {
    return activeConversationId ? [activeConversationId] : []
  }, [activeConversationId])

  // --- Handler for Chat List Updates (Global Events) ---
  const handleChatEvent = useCallback(
    (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => {
      const { chat_id, chat: updatedChat, message } = payload

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

      // If this isn't the active chat, we might want to update its message cache too
      // But usually, we only care about message cache for the *active* chat.
      // We DO update the chat detail cache for this specific chat though.
      queryClient.setQueryData(['chats', chat_id], (oldData: any) => {
        if (!oldData) return oldData
        return { ...oldData, ...updatedChat }
      })
    },
    [queryClient]
  )

  // --- Handler for Active Chat Messages ---
  const handleSocketMessage = useCallback(
    (message: ChatMessage) => {
      // 1. Call external handler (e.g. for scroll to bottom)
      onMessageReceived?.(message)

      // 2. Update Messages Cache for Active Chat (Infinite Query)
      if (activeConversationId) {
        queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
          if (!oldData?.pages) {
            // Initialize with first page if no data exists
            return {
              pages: [{ results: [message], count: 1, next: null, previous: null, page: 1 }],
              pageParams: [1],
            }
          }
          
          // Update all pages to check for the message
          const updatedPages = oldData.pages.map((page: any) => {
            const messagesArray = page.results || []
            
            // Check if message already exists (update it)
            const existingIndex = messagesArray.findIndex((m: ChatMessage) => m.id === message.id)
            if (existingIndex !== -1) {
              const updated = [...messagesArray]
              updated[existingIndex] = { ...updated[existingIndex], ...message }
              return {
                ...page,
                results: updated.sort((a: ChatMessage, b: ChatMessage) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ),
              }
            }
            
            // Check for optimistic message to replace
            // Also check for failed messages with same content (for retry case)
            const messageTime = new Date(message.created_at).getTime()
            const optimisticIndex = messagesArray.findIndex((m: ChatMessage) => {
              const isTemp = String(m.id).startsWith('temp-')
              const isFailed = m.send_failed === true
              const sameContent = String(m.content).trim() === String(message.content).trim()
              const sameSender = m.sender?.id === message.sender?.id
              const optimisticTime = new Date(m.created_at).getTime()
              const withinTimeWindow = Math.abs(messageTime - optimisticTime) < 30000 // 30 seconds window for retries
              return (isTemp || isFailed) && sameContent && sameSender && withinTimeWindow
            })
            
            if (optimisticIndex !== -1) {
              // Replace optimistic or failed message
              const updated = [...messagesArray]
              updated[optimisticIndex] = message
              return {
                ...page,
                results: updated.sort((a: ChatMessage, b: ChatMessage) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ),
              }
            }
            
            return page
          })
          
          // If message not found in any page, check for duplicates by content before adding
          // This prevents duplicate messages from appearing (e.g., if old failed message was actually sent)
          if (updatedPages.length > 0) {
            const lastPage = updatedPages[updatedPages.length - 1]
            if (lastPage && lastPage.results) {
              // Check if we already have a message with same content from same sender within 30 seconds
              const messageTime = new Date(message.created_at).getTime()
              const hasDuplicate = lastPage.results.some((m: ChatMessage) => {
                if (m.id === message.id) return true // Same ID
                const sameContent = String(m.content).trim() === String(message.content).trim()
                const sameSender = m.sender?.id === message.sender?.id
                const mTime = new Date(m.created_at).getTime()
                const withinTimeWindow = Math.abs(messageTime - mTime) < 30000 // 30 seconds
                return sameContent && sameSender && withinTimeWindow
              })
              
              if (!hasDuplicate) {
                const lastPageUpdated = {
                  ...lastPage,
                  results: [...(lastPage.results || []), message].sort((a: ChatMessage, b: ChatMessage) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  ),
                }
                updatedPages[updatedPages.length - 1] = lastPageUpdated
              }
            }
          }
          
          return {
            ...oldData,
            pages: updatedPages,
          }
        })

        // Also update chat detail cache
        queryClient.setQueryData(['chats', activeConversationId], (oldData: any) => {
          if (!oldData) return oldData
          const existingMessages = oldData.messages || []
          const existingIndex = existingMessages.findIndex((m: ChatMessage) => m.id === message.id)
          
          if (existingIndex !== -1) {
            const updated = [...existingMessages]
            updated[existingIndex] = message
            return {
              ...oldData,
              messages: updated.sort(
                (a: ChatMessage, b: ChatMessage) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              ),
              last_message: message,
              last_message_at: message.created_at,
            }
          }
          
          // Check for optimistic message
          const optimisticIndex = existingMessages.findIndex((m: ChatMessage) => {
            const isTemp = String(m.id).startsWith('temp-')
            const sameContent = String(m.content).trim() === String(message.content).trim()
            const sameSender = m.sender?.id === message.sender?.id
            return isTemp && sameContent && sameSender
          })
          
          if (optimisticIndex !== -1) {
            const updated = [...existingMessages]
            updated[optimisticIndex] = message
            return {
              ...oldData,
              messages: updated.sort(
                (a: ChatMessage, b: ChatMessage) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              ),
              last_message: message,
              last_message_at: message.created_at,
            }
          }
          
          return {
            ...oldData,
            messages: [...existingMessages, message].sort(
              (a: ChatMessage, b: ChatMessage) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ),
            last_message: message,
            last_message_at: message.created_at,
          }
        })
      }
    },
    [activeConversationId, queryClient, onMessageReceived]
  )

  // --- Handler for Message Status Updates (Read Receipts) ---
  const handleMessageStatusUpdateInternal = useCallback(
    (message: ChatMessage) => {
      console.log('📬 Received read receipt update:', message.id, 'is_read:', message.is_read)
      
      // Update message read status in cache for active chat (Infinite Query)
      if (activeConversationId) {
        queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
          if (!oldData?.pages) return oldData
          
          // Update message in all pages
          const updatedPages = oldData.pages.map((page: any) => {
            const messagesArray = page.results || []
            const existingIndex = messagesArray.findIndex((m: ChatMessage) => m.id === message.id)
            
            if (existingIndex !== -1) {
              const updated = [...messagesArray]
              updated[existingIndex] = { ...updated[existingIndex], ...message }
              return {
                ...page,
                results: updated,
              }
            }
            
            return page
          })
          
          return {
            ...oldData,
            pages: updatedPages,
          }
        })

        // Update in chat detail cache
        queryClient.setQueryData(['chats', activeConversationId], (oldData: any) => {
          if (!oldData) return oldData
          const existingMessages = oldData.messages || []
          const messageIndex = existingMessages.findIndex((m: ChatMessage) => m.id === message.id)
          if (messageIndex !== -1) {
            const updated = [...existingMessages]
            updated[messageIndex] = { ...updated[messageIndex], ...message }
            // Update last_message if this is the last message
            const isLastMessage = messageIndex === existingMessages.length - 1
            return {
              ...oldData,
              messages: updated,
              last_message: isLastMessage ? message : oldData.last_message,
            }
          }
          return oldData
        })
      }
    },
    [activeConversationId, queryClient]
  )

  // --- Handler for Typing Indicators ---
  const handleSocketTyping = useCallback(
    ({ userId, typing, chatId }: { userId: number; typing: boolean; chatId: string }) => {
      // Always notify typing changes (for chat list), but only show in active chat
      onTypingChange?.(typing, userId, chatId)
    },
    [onTypingChange]
  )

  // --- Handler for Chat Messages (with chatId) ---
  const handleChatMessage = useCallback(
    (message: ChatMessage, chatId: string) => {
      // Only process messages for active chat
      if (chatId === activeConversationId) {
        handleSocketMessage(message)
      }
    },
    [activeConversationId]
  )

  // --- Handler for Message Status Updates (with chatId) ---
  const handleMessageStatusUpdate = useCallback(
    (message: ChatMessage, chatId: string) => {
      // Process status updates for all chats (like WhatsApp/Telegram)
      // This ensures sender sees read status even if they're not viewing that chat
      
      console.log(`[Status Update] Received status update for message ${message.id} in chat ${chatId} - is_read: ${message.is_read}, delivered_at: ${message.delivered_at}`)
      
      // Update messages cache for this chat (if it exists)
      queryClient.setQueryData(['messages', chatId], (oldData: any) => {
        if (!oldData) {
          console.log(`[Status Update] No cache data for chat ${chatId}`)
          return oldData
        }
        
        // Handle paginated data
        if (oldData.pages) {
          const updated = {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              results: page.results?.map((msg: ChatMessage) => {
                if (msg.id === message.id) {
                  console.log(`[Status Update] Updating message ${msg.id} in cache - old is_read: ${msg.is_read}, new is_read: ${message.is_read}`)
                  return { ...msg, ...message }
                }
                return msg
              }) || [],
            })),
          }
          console.log(`[Status Update] Updated paginated cache for chat ${chatId}`)
          return updated
        }
        
        // Handle simple array
        if (Array.isArray(oldData)) {
          const updated = oldData.map((msg: ChatMessage) => {
            if (msg.id === message.id) {
              console.log(`[Status Update] Updating message ${msg.id} in array cache - old is_read: ${msg.is_read}, new is_read: ${message.is_read}`)
              return { ...msg, ...message }
            }
            return msg
          })
          console.log(`[Status Update] Updated array cache for chat ${chatId}`)
          return updated
        }
        
        return oldData
      })
      
      // Update chat list - update last_message status if it matches
      queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
        if (!oldChats) return oldChats
        return oldChats.map((chat) => {
          // Check if this message belongs to this chat and is the last message
          if (chat.id === chatId && chat.last_message && chat.last_message.id === message.id) {
            console.log(`[Status Update] Updating last_message in chat list for chat ${chatId}`)
            return {
              ...chat,
              last_message: {
                ...chat.last_message,
                ...message, // This will update is_read, read_at, delivered_at, etc.
              },
            }
          }
          return chat
        })
      })
      
      // Also update active chat detail if this is the active chat
      if (chatId === activeConversationId) {
        console.log(`[Status Update] This is the active chat, calling handleMessageStatusUpdateInternal`)
        handleMessageStatusUpdateInternal(message)
      }
    },
    [activeConversationId, handleMessageStatusUpdateInternal, queryClient]
  )

  // --- Handler for Marked Read Event ---
  const handleMarkedRead = useCallback(
    (chatId: string, count: number) => {
      // Update chat list - set unread_count to 0 when messages are marked as read
      queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
        if (!oldChats) return oldChats
        return oldChats.map((chat) => {
          if (chat.id === chatId) {
            return {
              ...chat,
              unread_count: 0, // All messages are now read
            }
          }
          return chat
        })
      })
    },
    [queryClient]
  )

  // --- Unified WebSocket Connection (Single Connection) ---
  const { isConnected, sendMessage: sendMessageRaw, sendTyping: sendTypingRaw, markAsRead: markAsReadRaw } = useUnifiedChatWebSocket({
    enabled: isAuthenticated,
    activeChatIds,
    onChatMessage: handleChatMessage,
    onChatListUpdate: handleChatEvent,
    onTyping: handleSocketTyping,
    onMessageStatusUpdate: handleMessageStatusUpdate,
    onMarkedRead: handleMarkedRead,
  })

  // Wrapper functions to match the expected API
  const sendMessage = useCallback(
    (content: string): boolean => {
      if (activeConversationId) {
        return sendMessageRaw(activeConversationId, content)
      }
      return false
    },
    [activeConversationId, sendMessageRaw]
  )

  const sendTyping = useCallback(
    (typing: boolean) => {
      if (activeConversationId) {
        sendTypingRaw(activeConversationId, typing)
      }
    },
    [activeConversationId, sendTypingRaw]
  )

  const markAsRead = useCallback(() => {
    if (activeConversationId) {
      markAsReadRaw(activeConversationId)
    }
  }, [activeConversationId, markAsReadRaw])

  return {
    isConnected,
    sendMessage,
    sendTyping,
    markAsRead,
  }
}

