

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

  const isValidAdField = useCallback((value: any): boolean => {
    return value !== undefined && value !== null && value !== ''
  }, [])

  const handleChatEvent = useCallback(
    (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => {
      const { chat_id, chat: updatedChat } = payload

      if (!updatedChat) return

      console.log('🔔 [ChatEvent] Received chat_event:', { chat_id })

      queryClient.setQueryData(['chats'], (oldData: ChatSummary[] | undefined) => {
        if (!oldData) return [updatedChat]
        
        const chats = [...oldData]
        const index = chats.findIndex((c) => c.id === updatedChat.id)
        
        if (index !== -1) {
          const existingChat = chats[index]
          
          const finalAd = isValidAdField(updatedChat.ad) ? updatedChat.ad : existingChat.ad
          const finalAdTitle = isValidAdField(updatedChat.ad_title) ? updatedChat.ad_title : existingChat.ad_title
          const finalAdSlug = isValidAdField(updatedChat.ad_slug) ? updatedChat.ad_slug : existingChat.ad_slug
          const finalAdImage = isValidAdField(updatedChat.ad_image) ? updatedChat.ad_image : existingChat.ad_image
          const finalAdPrice = isValidAdField(updatedChat.ad_price) ? updatedChat.ad_price : existingChat.ad_price
          const finalAdCurrency = isValidAdField(updatedChat.ad_currency) ? updatedChat.ad_currency : existingChat.ad_currency
          
          const mergedChat = {
            ...existingChat,
            last_message: updatedChat.last_message ?? existingChat.last_message,
            last_message_at: updatedChat.last_message_at ?? existingChat.last_message_at,
            updated_at: updatedChat.updated_at ?? existingChat.updated_at,
            unread_count: updatedChat.unread_count ?? existingChat.unread_count,
            participant1: updatedChat.participant1 ?? existingChat.participant1,
            participant2: updatedChat.participant2 ?? existingChat.participant2,
            ad: finalAd,
            ad_title: finalAdTitle,
            ad_slug: finalAdSlug,
            ad_image: finalAdImage,
            ad_price: finalAdPrice,
            ad_currency: finalAdCurrency,
          }
          
          chats[index] = mergedChat
        } else {
          chats.unshift(updatedChat)
        }
        
        const sorted = chats.sort((a, b) => {
          const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
          const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
          return timeB - timeA
        })
        
        return sorted
      })

      queryClient.setQueryData(['chats', chat_id], (oldData: any) => {
        if (!oldData) return oldData
        
        const finalAd = isValidAdField(updatedChat.ad) ? updatedChat.ad : oldData.ad
        const finalAdTitle = isValidAdField(updatedChat.ad_title) ? updatedChat.ad_title : oldData.ad_title
        const finalAdSlug = isValidAdField(updatedChat.ad_slug) ? updatedChat.ad_slug : oldData.ad_slug
        const finalAdImage = isValidAdField(updatedChat.ad_image) ? updatedChat.ad_image : oldData.ad_image
        const finalAdPrice = isValidAdField(updatedChat.ad_price) ? updatedChat.ad_price : oldData.ad_price
        const finalAdCurrency = isValidAdField(updatedChat.ad_currency) ? updatedChat.ad_currency : oldData.ad_currency
        
        const merged = {
          ...oldData,
          last_message: updatedChat.last_message ?? oldData.last_message,
          last_message_at: updatedChat.last_message_at ?? oldData.last_message_at,
          updated_at: updatedChat.updated_at ?? oldData.updated_at,
          unread_count: updatedChat.unread_count ?? oldData.unread_count,
          participant1: updatedChat.participant1 ?? oldData.participant1,
          participant2: updatedChat.participant2 ?? oldData.participant2,
          ad: finalAd,
          ad_title: finalAdTitle,
          ad_slug: finalAdSlug,
          ad_image: finalAdImage,
          ad_price: finalAdPrice,
          ad_currency: finalAdCurrency,
        }
        
        return merged
      })
    },
    [queryClient, isValidAdField]
  )

  const updateMessagesCacheForChat = useCallback(
    (message: ChatMessage, chatId: string) => {
      
      queryClient.setQueryData(['messages', chatId], (oldData: any) => {
          if (!oldData?.pages) {
            return {
              pages: [{ results: [message], count: 1, next: null, previous: null, page: 1 }],
              pageParams: [1],
            }
          }
          
          let messageFound = false
          
          const updatedPages = oldData.pages.map((page: any) => {
            const messagesArray = page.results || []
            
            const existingIndex = messagesArray.findIndex((m: ChatMessage) => m.id === message.id)
            if (existingIndex !== -1) {
              messageFound = true
              const updated = [...messagesArray]
              updated[existingIndex] = { ...updated[existingIndex], ...message }
              return {
                ...page,
                results: updated.sort((a: ChatMessage, b: ChatMessage) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ),
              }
            }
            
            const messageTime = new Date(message.created_at).getTime()
            const optimisticIndex = messagesArray.findIndex((m: ChatMessage) => {
              const isTemp = String(m.id).startsWith('temp-')
              if (!isTemp) return false 
              const sameContent = String(m.content).trim() === String(message.content).trim()
              const sameSender = m.sender?.id === message.sender?.id
              const optimisticTime = new Date(m.created_at).getTime()
              const withinTimeWindow = Math.abs(messageTime - optimisticTime) < 90000 
              return sameContent && sameSender && withinTimeWindow
            })
            
            if (optimisticIndex !== -1) {
              messageFound = true
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
          
          if (!messageFound && updatedPages.length > 0) {
            const lastPage = updatedPages[updatedPages.length - 1]
            if (lastPage && lastPage.results) {
              const hasExactDuplicate = lastPage.results.some((m: ChatMessage) => m.id === message.id)
              
              if (!hasExactDuplicate) {
                const lastPageUpdated = {
                  ...lastPage,
                  results: [...(lastPage.results || []), message].sort((a: ChatMessage, b: ChatMessage) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  ),
                }
                updatedPages[updatedPages.length - 1] = lastPageUpdated
              }
            }
          } else if (!messageFound && updatedPages.length === 0) {
            updatedPages.push({
              results: [message],
              count: 1,
              next: null,
              previous: null,
              page: 1
            })
          }
          
          const result = {
            ...oldData,
            pages: updatedPages,
          }
          return result
        })
    },
    [queryClient, activeConversationId]
  )

  const handleSocketMessage = useCallback(
    (message: ChatMessage) => {
      onMessageReceived?.(message)

      if (activeConversationId) {
        updateMessagesCacheForChat(message, activeConversationId)

        queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
          if (!oldChats) return oldChats
          
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
              return updatedChat
            }
            return chat
          })
          
          const sorted = updated.sort((a, b) => {
            const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
            const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
            return timeB - timeA
          })
          
          return sorted
        })

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
              ad: oldData.ad,
              ad_title: oldData.ad_title,
              ad_slug: oldData.ad_slug,
              ad_image: oldData.ad_image,
              ad_price: oldData.ad_price,
              ad_currency: oldData.ad_currency,
            }
          }
          
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
    [activeConversationId, queryClient, onMessageReceived, updateMessagesCacheForChat]
  )

  const handleMessageStatusUpdateInternal = useCallback(
    (message: ChatMessage) => {
      if (activeConversationId) {
        queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
          if (!oldData?.pages) return oldData
          
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

        queryClient.setQueryData(['chats', activeConversationId], (oldData: any) => {
          if (!oldData) return oldData
          const existingMessages = oldData.messages || []
          const messageIndex = existingMessages.findIndex((m: ChatMessage) => m.id === message.id)
          if (messageIndex !== -1) {
            const updated = [...existingMessages]
            updated[messageIndex] = { ...updated[messageIndex], ...message }
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

  const handleSocketTyping = useCallback(
    ({ userId, typing, chatId }: { userId: number; typing: boolean; chatId: string }) => {
      onTypingChange?.(typing, userId, chatId)
    },
    [onTypingChange]
  )

  const handleChatMessage = useCallback(
    (message: ChatMessage, chatId: string) => {
      updateMessagesCacheForChat(message, chatId)
      
      queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
        if (!oldChats) return oldChats
        
        const updated = oldChats.map((chat) => {
          if (chat.id === chatId) {
            const updatedChat = {
              ...chat,
              last_message: message,
              last_message_at: message.created_at,
              updated_at: message.created_at,
              ad: chat.ad,
              ad_title: chat.ad_title,
              ad_slug: chat.ad_slug,
              ad_image: chat.ad_image,
              ad_price: chat.ad_price,
              ad_currency: chat.ad_currency,
            }
            return updatedChat
          }
          return chat
        })
        
        const sorted = updated.sort((a, b) => {
          const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
          const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
          return timeB - timeA
        })
        
        return sorted
      })
      
      if (activeConversationId === chatId) {
        onMessageReceived?.(message)
        
        queryClient.setQueryData(['chats', chatId], (oldData: any) => {
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
              ad: oldData.ad,
              ad_title: oldData.ad_title,
              ad_slug: oldData.ad_slug,
              ad_image: oldData.ad_image,
              ad_price: oldData.ad_price,
              ad_currency: oldData.ad_currency,
            }
          }
          
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
    [activeConversationId, queryClient, onMessageReceived, updateMessagesCacheForChat]
  )

  const handleMessageStatusUpdate = useCallback(
    (message: ChatMessage, chatId: string) => {
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
      
      if (chatId === activeConversationId) {
        handleMessageStatusUpdateInternal(message)
      }
    },
    [activeConversationId, handleMessageStatusUpdateInternal, queryClient]
  )

  const handleMarkedRead = useCallback(
    (chatId: string, count: number) => {
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
      
      if (chatId === activeConversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      }
    },
    [activeConversationId, queryClient]
  )
  
  // Store handlers in ref to avoid infinite loop
  // The handlers need to be updated without triggering re-renders
  const handlersRef = useRef({
    handleChatMessage,
    handleChatEvent,
    handleSocketTyping,
    handleMessageStatusUpdate,
    handleMarkedRead,
  })

  // Update ref whenever handlers change
  useEffect(() => {
    handlersRef.current = {
      handleChatMessage,
      handleChatEvent,
      handleSocketTyping,
      handleMessageStatusUpdate,
      handleMarkedRead,
    }
  }, [handleChatMessage, handleChatEvent, handleSocketTyping, handleMessageStatusUpdate, handleMarkedRead])

  // Register handlers once on mount, using ref to get latest versions
  const { setHandlers } = useChatWebSocketStore()
  
  useEffect(() => {
    // Create wrapper functions that always use the latest handlers from ref
    const wrappedHandlers = {
      onChatMessage: (message: ChatMessage, chatId: string) => {
        handlersRef.current.handleChatMessage(message, chatId)
      },
      onChatListUpdate: (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => {
        handlersRef.current.handleChatEvent(payload)
      },
      onTyping: (payload: { userId: number; typing: boolean; chatId: string }) => {
        handlersRef.current.handleSocketTyping(payload)
      },
      onMessageStatusUpdate: (message: ChatMessage, chatId: string) => {
        handlersRef.current.handleMessageStatusUpdate(message, chatId)
      },
      onMarkedRead: (chatId: string, count: number) => {
        handlersRef.current.handleMarkedRead(chatId, count)
      },
    }
    
    setHandlers(wrappedHandlers)
  }, [setHandlers]) // Only depend on setHandlers, which is stable

}
