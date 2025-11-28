"use client"

import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatWebSocketStore } from '@/store/chatWebSocketStore'
import { useQueryClient } from '@tanstack/react-query'
import type { ChatMessage, ChatSummary } from '@/api/types'

/**
 * Global chat connection component (WhatsApp/Telegram pattern)
 * 
 * Responsibilities:
 * - Maintains WebSocket connection when authenticated
 * - Handles connection lifecycle (connect/disconnect)
 * - Keeps connection alive across page navigation
 * - Sets up GLOBAL handlers to process messages even when not on chat page
 * - Plays sound notifications when messages arrive and user is not on chat page
 */
export default function GlobalChatConnection() {
  const { isAuthenticated, user } = useAuthStore()
  const { connect, disconnect, setHandlers } = useChatWebSocketStore()
  const queryClient = useQueryClient()

  // Global handler for chat list updates (works on all pages)
  const handleGlobalChatEvent = useCallback(
    (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => {
      const { chat_id, chat: updatedChat } = payload
      if (!updatedChat) return

      // Update chat list cache globally
      queryClient.setQueryData(['chats'], (oldData: ChatSummary[] | undefined) => {
        if (!oldData) return [updatedChat]
        
        const chats = [...oldData]
        const index = chats.findIndex((c) => c.id === updatedChat.id)
        
        if (index !== -1) {
          chats[index] = {
            ...chats[index],
            last_message: updatedChat.last_message ?? chats[index].last_message,
            last_message_at: updatedChat.last_message_at ?? chats[index].last_message_at,
            updated_at: updatedChat.updated_at ?? chats[index].updated_at,
            unread_count: updatedChat.unread_count ?? chats[index].unread_count,
            // Preserve ad fields
            ad: chats[index].ad,
            ad_title: chats[index].ad_title,
            ad_slug: chats[index].ad_slug,
            ad_image: chats[index].ad_image,
            ad_price: chats[index].ad_price,
            ad_currency: chats[index].ad_currency,
          }
        } else {
          chats.unshift(updatedChat)
        }
        
        // Sort by most recent activity
        return chats.sort((a, b) => {
          const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
          const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
          return timeB - timeA
        })
      })
    },
    [queryClient]
  )

  // Global handler for messages (stores messages globally even when not on chat page)
  const handleGlobalMessage = useCallback(
    (message: ChatMessage, chatId: string) => {
      const isOnChatPage = typeof window !== 'undefined' && window.location.pathname === '/chat'
      
      // Always store message in cache globally
      queryClient.setQueryData(['messages', chatId], (oldData: any) => {
        if (!oldData?.pages) {
          return {
            pages: [{ results: [message], count: 1, next: null, previous: null, page: 1 }],
            pageParams: [1],
          }
        }
        
        const updatedPages = oldData.pages.map((page: any) => {
          const messagesArray = page.results || []
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
          
          // Check for optimistic message
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
        
        // Add to last page if not found
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
      
      // Play sound notification if user is not on chat page and message is from another user
      if (!isOnChatPage && user && message.sender?.id !== user.id) {
        try {
          const audio = new Audio('/sounds/received.mp3')
          audio.volume = 0.5
          audio.play().catch(() => {
            // Silently fail if user hasn't interacted with page
          })
        } catch {
          // Silently fail
        }
      }
    },
    [queryClient, user]
  )

  // Set up global handlers when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setHandlers({
        onChatListUpdate: handleGlobalChatEvent,
        onChatMessage: handleGlobalMessage,
        // Other handlers will be set by useChatRealtime when on chat page
        // These global handlers ensure messages are stored even when not on chat page
      })
    }
  }, [isAuthenticated, setHandlers, handleGlobalChatEvent, handleGlobalMessage])

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
      // Only disconnect on logout (handled by isAuthenticated change)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]) // connect and disconnect are stable Zustand functions

  // Handle visibility change - send ping when tab becomes visible
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

