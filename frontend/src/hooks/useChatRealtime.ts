"use client"

import { useCallback, useMemo, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useChatWebSocketStore } from '@/store/chatWebSocketStore'
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

  // --- Handler for Chat List Updates (Global Events - WhatsApp/Telegram Pattern) ---
  // This ALWAYS updates the chat list, regardless of which page you're on
  // This ensures unread counts and last messages are updated everywhere
  const handleChatEvent = useCallback(
    (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => {
      const { chat_id, chat: updatedChat } = payload

      if (!updatedChat) return

      // ALWAYS update Chat List Cache (global - like WhatsApp/Telegram)
      // This ensures chat list stays updated on all pages
      queryClient.setQueryData(['chats'], (oldData: ChatSummary[] | undefined) => {
        if (!oldData) return [updatedChat]
        
        const chats = [...oldData]
        const index = chats.findIndex((c) => c.id === updatedChat.id)
        
        if (index !== -1) {
          // Preserve ad-related fields that might not be in updatedChat
          // This prevents ad_image, ad_title, etc. from being lost
          const existingChat = chats[index]
          chats[index] = {
            ...existingChat,
            ...updatedChat,
            // Preserve ad fields if not in updatedChat
            ad: updatedChat.ad ?? existingChat.ad,
            ad_title: updatedChat.ad_title ?? existingChat.ad_title,
            ad_slug: updatedChat.ad_slug ?? existingChat.ad_slug,
            ad_image: updatedChat.ad_image ?? existingChat.ad_image,
            ad_price: updatedChat.ad_price ?? existingChat.ad_price,
            ad_currency: updatedChat.ad_currency ?? existingChat.ad_currency,
            // Preserve participant info
            participant1: updatedChat.participant1 ?? existingChat.participant1,
            participant2: updatedChat.participant2 ?? existingChat.participant2,
          }
        } else {
          chats.unshift(updatedChat)
        }
        
        // Sort by most recent activity (WhatsApp/Telegram pattern - most recent on top)
        return chats.sort((a, b) => {
          const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
          const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
          return timeB - timeA
        })
      })

      // Update chat detail cache for this specific chat (preserve ad fields)
      queryClient.setQueryData(['chats', chat_id], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          ...updatedChat,
          // Preserve ad fields if not in updatedChat
          ad: updatedChat.ad ?? oldData.ad,
          ad_title: updatedChat.ad_title ?? oldData.ad_title,
          ad_slug: updatedChat.ad_slug ?? oldData.ad_slug,
          ad_image: updatedChat.ad_image ?? oldData.ad_image,
          ad_price: updatedChat.ad_price ?? oldData.ad_price,
          ad_currency: updatedChat.ad_currency ?? oldData.ad_currency,
        }
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
            // Extended time window to handle subscription delays when coming back to page
            const messageTime = new Date(message.created_at).getTime()
            const optimisticIndex = messagesArray.findIndex((m: ChatMessage) => {
              const isTemp = String(m.id).startsWith('temp-')
              const isFailed = m.send_failed === true
              const sameContent = String(m.content).trim() === String(message.content).trim()
              const sameSender = m.sender?.id === message.sender?.id
              const optimisticTime = new Date(m.created_at).getTime()
              const withinTimeWindow = Math.abs(messageTime - optimisticTime) < 90000 // 90 seconds window to handle subscription delays
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
              // Check if we already have a message with same content from same sender within 90 seconds
              // Extended window to handle subscription delays
              const messageTime = new Date(message.created_at).getTime()
              const hasDuplicate = lastPage.results.some((m: ChatMessage) => {
                if (m.id === message.id) return true // Same ID
                const sameContent = String(m.content).trim() === String(message.content).trim()
                const sameSender = m.sender?.id === message.sender?.id
                const mTime = new Date(m.created_at).getTime()
                const withinTimeWindow = Math.abs(messageTime - mTime) < 90000 // 90 seconds to handle subscription delays
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

        // Also update chat list to move chat to top and update last message (WhatsApp/Telegram pattern)
        queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
          if (!oldChats) return oldChats
          return oldChats.map((chat) => {
            if (chat.id === activeConversationId) {
              return {
                ...chat,
                last_message: message,
                last_message_at: message.created_at,
                updated_at: message.created_at,
                // Preserve all ad-related fields
                ad: chat.ad,
                ad_title: chat.ad_title,
                ad_slug: chat.ad_slug,
                ad_image: chat.ad_image,
                ad_price: chat.ad_price,
                ad_currency: chat.ad_currency,
              }
            }
            return chat
          }).sort((a, b) => {
            // Sort by most recent activity (most recent on top)
            const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
            const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
            return timeB - timeA
          })
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
              // Preserve ad fields
              ad: oldData.ad,
              ad_title: oldData.ad_title,
              ad_slug: oldData.ad_slug,
              ad_image: oldData.ad_image,
              ad_price: oldData.ad_price,
              ad_currency: oldData.ad_currency,
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
              // Preserve ad fields
              ad: oldData.ad,
              ad_title: oldData.ad_title,
              ad_slug: oldData.ad_slug,
              ad_image: oldData.ad_image,
              ad_price: oldData.ad_price,
              ad_currency: oldData.ad_currency,
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
            // Preserve ad fields
            ad: oldData.ad,
            ad_title: oldData.ad_title,
            ad_slug: oldData.ad_slug,
            ad_image: oldData.ad_image,
            ad_price: oldData.ad_price,
            ad_currency: oldData.ad_currency,
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

  // --- Handler for Chat Messages (with chatId) - Context-Aware ---
  // WhatsApp/Telegram pattern: Process messages for active chat, update list for all chats
  const handleChatMessage = useCallback(
    (message: ChatMessage, chatId: string) => {
      // Always process messages for active chat (if this is the active chat)
      if (activeConversationId === chatId) {
        handleSocketMessage(message)
      }
      
      // Note: Chat list is already updated by handleChatEvent
      // This handler focuses on active chat message processing
    },
    [activeConversationId, handleSocketMessage]
  )

  // --- Handler for Message Status Updates (Global - WhatsApp/Telegram Pattern) ---
  // Status updates work globally - you see read receipts everywhere (like WhatsApp/Telegram)
  const handleMessageStatusUpdate = useCallback(
    (message: ChatMessage, chatId: string) => {
      // ALWAYS update chat list - update last_message status if it matches (global)
      queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
        if (!oldChats) return oldChats
        return oldChats.map((chat) => {
          // Update last_message status if this message is the last message
          if (chat.id === chatId && chat.last_message && chat.last_message.id === message.id) {
            return {
              ...chat,
              last_message: {
                ...chat.last_message,
                ...message, // Updates is_read, read_at, delivered_at, etc.
              },
            }
          }
          return chat
        })
      })
      
      // Update messages cache for this chat (if it exists - context-aware)
      // Only update if this is the active chat OR if cache exists (for background updates)
      queryClient.setQueryData(['messages', chatId], (oldData: any) => {
        if (!oldData) return oldData
        
        // Handle paginated data (Infinite Query)
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
        
        // Handle simple array
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
      
      // Also update active chat detail if this is the active chat
      if (chatId === activeConversationId) {
        handleMessageStatusUpdateInternal(message)
      }
    },
    [activeConversationId, handleMessageStatusUpdateInternal, queryClient]
  )

  // --- Handler for Marked Read Event (Global - WhatsApp/Telegram Pattern) ---
  // When messages are marked as read, update chat list globally
  const handleMarkedRead = useCallback(
    (chatId: string, count: number) => {
      // ALWAYS update chat list - set unread_count to 0 (global update)
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
      
      // Invalidate messages query to refresh delivery status (only if active chat)
      if (chatId === activeConversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      }
    },
    [activeConversationId, queryClient]
  )

  // Handler for all messages delivered is not needed separately
  // The backend broadcasts message_status_update events for each message
  // which will be handled by handleMessageStatusUpdate above

  // --- Use Global WebSocket Connection from Zustand Store ---
  const { 
    isConnected, 
    subscribeToChat: subscribeToChatStore, 
    unsubscribeFromChat: unsubscribeFromChatStore, 
    sendMessage: sendMessageRaw, 
    sendTyping: sendTypingRaw, 
    markAsRead: markAsReadRaw, 
    setHandlers: setHandlersStore 
  } = useChatWebSocketStore()

  // Store handlers in refs to prevent infinite loops
  const handlersRef = useRef({
    onChatMessage: handleChatMessage,
    onChatListUpdate: handleChatEvent,
    onTyping: handleSocketTyping,
    onMessageStatusUpdate: handleMessageStatusUpdate,
    onMarkedRead: handleMarkedRead,
  })

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      onChatMessage: handleChatMessage,
      onChatListUpdate: handleChatEvent,
      onTyping: handleSocketTyping,
      onMessageStatusUpdate: handleMessageStatusUpdate,
      onMarkedRead: handleMarkedRead,
    }
  }, [handleChatMessage, handleChatEvent, handleSocketTyping, handleMessageStatusUpdate, handleMarkedRead])

  // Register context-aware handlers with the global store (Single Source of Truth)
  // WhatsApp/Telegram pattern: Handlers are context-aware and handle all scenarios
  // - Chat list updates: Always processed (global - works on all pages)
  // - Messages: Only processed for active chat (context-aware)
  // - Status updates: Always processed (global - read receipts work everywhere)
  // - Typing: Context-aware (only shown for active chat)
  useEffect(() => {
    setHandlersStore({
      onChatMessage: (message, chatId) => handlersRef.current.onChatMessage(message, chatId),
      onChatListUpdate: (payload) => handlersRef.current.onChatListUpdate(payload),
      onTyping: (payload) => handlersRef.current.onTyping(payload),
      onMessageStatusUpdate: (message, chatId) => handlersRef.current.onMessageStatusUpdate(message, chatId),
      onMarkedRead: (chatId, count) => handlersRef.current.onMarkedRead(chatId, count),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHandlersStore]) // Only run once - handlers accessed via refs

  // Subscribe/unsubscribe to active chats when they change
  useEffect(() => {
    if (!isConnected) return

    // Subscribe to active chat
    activeChatIds.forEach((chatId) => {
      subscribeToChatStore(chatId)
    })

    // Cleanup: unsubscribe when component unmounts or chat changes
    return () => {
      activeChatIds.forEach((chatId) => {
        unsubscribeFromChatStore(chatId)
      })
    }
  }, [isConnected, activeChatIds, subscribeToChatStore, unsubscribeFromChatStore])

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

