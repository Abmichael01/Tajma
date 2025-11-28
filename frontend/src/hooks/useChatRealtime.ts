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

  // Helper function to check if an ad field value is valid (not undefined, null, or empty string)
  // This ensures we preserve existing values when backend sends invalid/null data
  const isValidAdField = useCallback((value: any): boolean => {
    return value !== undefined && value !== null && value !== ''
  }, [])

  // --- Handler for Chat List Updates (Global Events - WhatsApp/Telegram Pattern) ---
  // This ALWAYS updates the chat list, regardless of which page you're on
  // This ensures unread counts and last messages are updated everywhere
  const handleChatEvent = useCallback(
    (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => {
      const { chat_id, chat: updatedChat } = payload

      if (!updatedChat) return

      // Debug logging for production issue
      console.log('🔔 [ChatEvent] Received chat_event:', {
        chat_id,
        updatedChat: {
          id: updatedChat.id,
          ad: updatedChat.ad,
          ad_title: updatedChat.ad_title,
          ad_image: updatedChat.ad_image,
          ad_slug: updatedChat.ad_slug,
          ad_price: updatedChat.ad_price,
          ad_currency: updatedChat.ad_currency,
          last_message_at: updatedChat.last_message_at,
        }
      })

      // ALWAYS update Chat List Cache (global - like WhatsApp/Telegram)
      // This ensures chat list stays updated on all pages
      queryClient.setQueryData(['chats'], (oldData: ChatSummary[] | undefined) => {
        if (!oldData) return [updatedChat]
        
        const chats = [...oldData]
        const index = chats.findIndex((c) => c.id === updatedChat.id)
        
        if (index !== -1) {
          // Defensive merge: Preserve ad fields from existing chat
          // Production backend may send null for ad fields, so we always preserve existing values
          const existingChat = chats[index]
          
          // Debug logging before merge
          console.log('🔍 [ChatEvent] Before merge:', {
            chat_id: existingChat.id,
            existing: {
              ad: existingChat.ad,
              ad_title: existingChat.ad_title,
              ad_image: existingChat.ad_image,
              ad_slug: existingChat.ad_slug,
              ad_price: existingChat.ad_price,
              ad_currency: existingChat.ad_currency,
            },
            incoming: {
              ad: updatedChat.ad,
              ad_title: updatedChat.ad_title,
              ad_image: updatedChat.ad_image,
              ad_slug: updatedChat.ad_slug,
              ad_price: updatedChat.ad_price,
              ad_currency: updatedChat.ad_currency,
            }
          })
          
          // Determine which ad fields to use - use helper to check for valid values (not undefined, null, or empty string)
          // This ensures we preserve existing values when backend sends invalid/null/empty data
          const finalAd = isValidAdField(updatedChat.ad) ? updatedChat.ad : existingChat.ad
          const finalAdTitle = isValidAdField(updatedChat.ad_title) ? updatedChat.ad_title : existingChat.ad_title
          const finalAdSlug = isValidAdField(updatedChat.ad_slug) ? updatedChat.ad_slug : existingChat.ad_slug
          const finalAdImage = isValidAdField(updatedChat.ad_image) ? updatedChat.ad_image : existingChat.ad_image
          const finalAdPrice = isValidAdField(updatedChat.ad_price) ? updatedChat.ad_price : existingChat.ad_price
          const finalAdCurrency = isValidAdField(updatedChat.ad_currency) ? updatedChat.ad_currency : existingChat.ad_currency
          
          // Warn if we're preserving existing values due to invalid incoming data
          if (!isValidAdField(updatedChat.ad_image) && existingChat.ad_image) {
            console.warn(`⚠️ [ChatEvent] Preserving existing ad_image for chat ${chat_id} because incoming value is invalid:`, {
              incoming: updatedChat.ad_image,
              preserved: existingChat.ad_image
            })
          }
          
          const mergedChat = {
            ...existingChat,
            // Update message-related fields
            last_message: updatedChat.last_message ?? existingChat.last_message,
            last_message_at: updatedChat.last_message_at ?? existingChat.last_message_at,
            updated_at: updatedChat.updated_at ?? existingChat.updated_at,
            unread_count: updatedChat.unread_count ?? existingChat.unread_count,
            participant1: updatedChat.participant1 ?? existingChat.participant1,
            participant2: updatedChat.participant2 ?? existingChat.participant2,
            // CRITICAL: Always preserve ad fields from existing chat
            ad: finalAd,
            ad_title: finalAdTitle,
            ad_slug: finalAdSlug,
            ad_image: finalAdImage,
            ad_price: finalAdPrice,
            ad_currency: finalAdCurrency,
          }
          
          // Debug logging after merge
          console.log('✅ [ChatEvent] After merge:', {
            chat_id: mergedChat.id,
            final: {
              ad: mergedChat.ad,
              ad_title: mergedChat.ad_title,
              ad_image: mergedChat.ad_image,
              ad_slug: mergedChat.ad_slug,
              ad_price: mergedChat.ad_price,
              ad_currency: mergedChat.ad_currency,
            },
            adImagePreserved: mergedChat.ad_image === existingChat.ad_image,
            adImageChanged: mergedChat.ad_image !== existingChat.ad_image,
          })
          
          chats[index] = mergedChat
        } else {
          console.log('➕ [ChatEvent] New chat added:', {
            chat_id: updatedChat.id,
            ad_image: updatedChat.ad_image,
          })
          chats.unshift(updatedChat)
        }
        
        // Sort by most recent activity (WhatsApp/Telegram pattern - most recent on top)
        const sorted = chats.sort((a, b) => {
          const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
          const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
          return timeB - timeA
        })
        
        console.log('📋 [ChatEvent] Chat list sorted. Top chat:', {
          id: sorted[0]?.id,
          ad_image: sorted[0]?.ad_image,
          last_message_at: sorted[0]?.last_message_at,
        })
        
        return sorted
      })

      // Update chat detail cache for this specific chat (preserve ad fields)
      queryClient.setQueryData(['chats', chat_id], (oldData: any) => {
        if (!oldData) return oldData
        
        // Debug logging before chat detail update
        console.log('🔍 [ChatEvent] Updating chat detail cache:', {
          chat_id,
          existing_ad_image: oldData.ad_image,
          incoming_ad_image: updatedChat.ad_image,
          incoming_ad_image_type: typeof updatedChat.ad_image,
          incoming_ad_image_is_null: updatedChat.ad_image === null,
          incoming_ad_image_is_undefined: updatedChat.ad_image === undefined,
        })
        
        // Defensive merge: Always preserve ad fields from existing data
        // Production backend may send null/empty for ad fields, so we always preserve existing values
        // Use helper function to check for valid values (not undefined, null, or empty string)
        const finalAd = isValidAdField(updatedChat.ad) ? updatedChat.ad : oldData.ad
        const finalAdTitle = isValidAdField(updatedChat.ad_title) ? updatedChat.ad_title : oldData.ad_title
        const finalAdSlug = isValidAdField(updatedChat.ad_slug) ? updatedChat.ad_slug : oldData.ad_slug
        const finalAdImage = isValidAdField(updatedChat.ad_image) ? updatedChat.ad_image : oldData.ad_image
        const finalAdPrice = isValidAdField(updatedChat.ad_price) ? updatedChat.ad_price : oldData.ad_price
        const finalAdCurrency = isValidAdField(updatedChat.ad_currency) ? updatedChat.ad_currency : oldData.ad_currency
        
        // Warn if we're preserving existing values due to invalid incoming data
        if (!isValidAdField(updatedChat.ad_image) && oldData.ad_image) {
          console.warn(`⚠️ [ChatEvent] Preserving existing ad_image in chat detail cache for chat ${chat_id} because incoming value is invalid:`, {
            incoming: updatedChat.ad_image,
            preserved: oldData.ad_image
          })
        }
        
        const merged = {
          ...oldData,
          // Update message-related fields
          last_message: updatedChat.last_message ?? oldData.last_message,
          last_message_at: updatedChat.last_message_at ?? oldData.last_message_at,
          updated_at: updatedChat.updated_at ?? oldData.updated_at,
          unread_count: updatedChat.unread_count ?? oldData.unread_count,
          participant1: updatedChat.participant1 ?? oldData.participant1,
          participant2: updatedChat.participant2 ?? oldData.participant2,
          // CRITICAL: Always preserve ad fields from oldData
          // Only update if new value is explicitly provided AND valid (not null/undefined/empty)
          ad: finalAd,
          ad_title: finalAdTitle,
          ad_slug: finalAdSlug,
          ad_image: finalAdImage,
          ad_price: finalAdPrice,
          ad_currency: finalAdCurrency,
        }
        
        console.log('✅ [ChatEvent] Chat detail cache updated:', {
          chat_id: merged.id,
          final_ad_image: merged.ad_image,
          ad_image_preserved: merged.ad_image === oldData.ad_image,
          ad_image_changed: merged.ad_image !== oldData.ad_image,
          decision: isValidAdField(updatedChat.ad_image) ? 'USED_INCOMING' : 'PRESERVED_EXISTING',
        })
        
        return merged
      })
    },
    [queryClient, isValidAdField]
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
          
          // Debug logging before update
          const existingChat = oldChats.find((c) => c.id === activeConversationId)
          if (existingChat) {
            console.log('💬 [SocketMessage] Updating chat list for message:', {
              chat_id: activeConversationId,
              existing_ad_image: existingChat.ad_image,
              message_id: message.id,
              message_created_at: message.created_at,
            })
          }
          
          const updated = oldChats.map((chat) => {
            if (chat.id === activeConversationId) {
              const updatedChat = {
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
              
              console.log('✅ [SocketMessage] Chat list updated:', {
                chat_id: updatedChat.id,
                ad_image: updatedChat.ad_image,
                ad_image_preserved: updatedChat.ad_image === chat.ad_image,
                last_message_at: updatedChat.last_message_at,
              })
              
              return updatedChat
            }
            return chat
          })
          
          const sorted = updated.sort((a, b) => {
            // Sort by most recent activity (most recent on top)
            const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
            const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
            return timeB - timeA
          })
          
          console.log('📋 [SocketMessage] Chat list sorted. Top chat:', {
            id: sorted[0]?.id,
            ad_image: sorted[0]?.ad_image,
            last_message_at: sorted[0]?.last_message_at,
          })
          
          return sorted
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
  // IMPORTANT: Store messages globally so they're available when user opens chat later
  const handleChatMessage = useCallback(
    (message: ChatMessage, chatId: string) => {
      // Check if user is on chat page and this is the active chat
      const isActiveChat = activeConversationId === chatId
      const isOnChatPage = typeof window !== 'undefined' && window.location.pathname === '/chat'
      
      // Always store message in cache globally (even if not on chat page)
      // This ensures messages are available when user opens the chat later
      queryClient.setQueryData(['messages', chatId], (oldData: any) => {
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
          const messageTime = new Date(message.created_at).getTime()
          const optimisticIndex = messagesArray.findIndex((m: ChatMessage) => {
            const isTemp = String(m.id).startsWith('temp-')
            const isFailed = m.send_failed === true
            const sameContent = String(m.content).trim() === String(message.content).trim()
            const sameSender = m.sender?.id === message.sender?.id
            const optimisticTime = new Date(m.created_at).getTime()
            const withinTimeWindow = Math.abs(messageTime - optimisticTime) < 90000
            return (isTemp || isFailed) && sameContent && sameSender && withinTimeWindow
          })
          
          if (optimisticIndex !== -1) {
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
        
        // If message not found in any page, add it to the last page
        if (updatedPages.length > 0) {
          const lastPage = updatedPages[updatedPages.length - 1]
          if (lastPage && lastPage.results) {
            const messageTime = new Date(message.created_at).getTime()
            const hasDuplicate = lastPage.results.some((m: ChatMessage) => {
              if (m.id === message.id) return true
              const sameContent = String(m.content).trim() === String(message.content).trim()
              const sameSender = m.sender?.id === message.sender?.id
              const mTime = new Date(m.created_at).getTime()
              const withinTimeWindow = Math.abs(messageTime - mTime) < 90000
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
      
      // Process message for active chat (if this is the active chat)
      if (isActiveChat) {
        handleSocketMessage(message)
      } else {
        // Message received for a chat that's not currently active
        // Play sound notification if user is not on chat page
        if (!isOnChatPage) {
          // Check if message is from another user (not from current user)
          const { useAuthStore } = require('@/store/authStore')
          const currentUser = useAuthStore.getState().user
          if (currentUser && message.sender?.id !== currentUser.id) {
            // Play sound notification
            import('@/hooks/useChatSounds').then(({ useChatSounds }) => {
              // Create a temporary instance to play sound
              // Note: This is a workaround since hooks can't be called conditionally
              // In production, you might want to create a global sound player
              const audio = new Audio('/sounds/received.mp3')
              audio.volume = 0.5
              audio.play().catch(() => {
                // Silently fail if user hasn't interacted with page
              })
            }).catch(() => {
              // Fallback: try to play sound directly
              try {
                const audio = new Audio('/sounds/received.mp3')
                audio.volume = 0.5
                audio.play().catch(() => {})
              } catch {}
            })
          }
        }
      }
      
      // Note: Chat list is already updated by handleChatEvent
    },
    [activeConversationId, handleSocketMessage, queryClient]
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
  // - Messages: Always stored globally, processed for active chat (context-aware)
  // - Status updates: Always processed (global - read receipts work everywhere)
  // - Typing: Context-aware (only shown for active chat)
  // NOTE: Global handlers from GlobalChatConnection ensure messages are stored even when not on chat page
  // These handlers add context-aware processing on top of global handlers
  useEffect(() => {
    setHandlersStore({
      onChatMessage: (message, chatId) => {
        // First call global handler (if exists) to ensure message is stored
        // Then call context-aware handler for active chat processing
        handlersRef.current.onChatMessage(message, chatId)
      },
      onChatListUpdate: (payload) => {
        // Call context-aware handler (which also updates globally)
        handlersRef.current.onChatListUpdate(payload)
      },
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

