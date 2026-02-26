"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ConversationList from '@/components/chat/ConversationList'
import ChatArea from '@/components/chat/ChatArea'
import { useNavbarHeight } from '@/hooks/useNavbarHeight'
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight'
import { useAuthStore } from '@/store/authStore'
import { useChats, useChatDetail, useChatMessages, useMarkChatAsRead, useOnlineStatuses } from '@/hooks/useChat'
import { useChatRealtime } from '@/hooks/useChatRealtime'
import { chatApi } from '@/api/chat'
import type { ChatMessage, ChatSummary, User, UserOnlineStatus } from '@/api/types'
import { useQueryClient } from '@tanstack/react-query'
import { useChatSounds } from '@/hooks/useChatSounds'

function ChatClientContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const navbarHeight = useNavbarHeight()
  const bottomNavHeight = useBottomNavHeight()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    searchParams.get('id') || null
  )
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [isParticipantTyping, setIsParticipantTyping] = useState(false)
  const [typingByChatId, setTypingByChatId] = useState<Record<string, boolean>>({}) // Track typing per chat
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map()) // Track timeouts for each optimistic message
  const [isUserAtBottom, setIsUserAtBottom] = useState(true) // Track if user is at bottom of chat
  const checkScrollPositionRef = useRef<(() => boolean) | null>(null) // Ref to store scroll check function from ChatArea
  const { playSentSound, playReceivedSound } = useChatSounds()

  // Fetch chats list
  const { data: chats = [], isLoading: chatsLoading } = useChats()

  // Fetch active chat details
  const { data: activeChatDetail } = useChatDetail(activeConversationId)

  // Fetch messages for active chat with infinite scroll
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages(activeConversationId)

  // Flatten all pages into a single array
  const messages: ChatMessage[] = useMemo(() => {
    if (!messagesData?.pages || !Array.isArray(messagesData.pages)) return []

    // Combine all pages and sort by created_at (oldest first)
    const allMessages = messagesData.pages
      .filter((page) => page && page.results && Array.isArray(page.results))
      .flatMap((page) => page.results || [])

    if (!Array.isArray(allMessages) || allMessages.length === 0) return []

    return allMessages.sort((a, b) => {
      if (!a?.created_at || !b?.created_at) return 0
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }, [messagesData])

  // Note: No refetch needed - WebSocket updates messages cache for ALL chats (WhatsApp pattern)
  // Messages are always cached when received, so opening a chat shows cached data instantly

  // Fetch online statuses
  const { data: onlineStatusesData = [] } = useOnlineStatuses()

  // Mark chat as read mutation (REST API - kept as fallback)
  const markChatAsRead = useMarkChatAsRead()

  // Prefer WebSocket for marking as read (like WhatsApp/Telegram)
  // Falls back to REST API if WebSocket not available

  // Convert online statuses array to record for easier lookup
  const onlineStatuses: Record<number, UserOnlineStatus> = useMemo(() => {
    const statusMap: Record<number, UserOnlineStatus> = {}
    onlineStatusesData.forEach((status) => {
      if (status.user?.id) {
        statusMap[status.user.id] = status
      }
    })
    return statusMap
  }, [onlineStatusesData])

  // Get active chat from chats list
  const activeChat = activeChatDetail || chats.find((chat) => chat.id === activeConversationId) || null

  // Get active participant (the other user in the chat)
  const activeParticipant: User | null = useMemo(() => {
    if (!activeChat || !user) return null
    return activeChat.participant1.id === user.id ? activeChat.participant2 : activeChat.participant1
  }, [activeChat, user])

  // Get participant status
  const participantStatus = activeParticipant ? onlineStatuses[activeParticipant.id] : undefined

  // Handle new message received - DON'T auto-scroll (WhatsApp style)
  // User will see scroll-to-bottom button with unread count instead
  const handleMessageReceived = useCallback((message: ChatMessage) => {
    // Play received sound only when:
    // 1. Message is from other user (not our own)
    // 2. User is in active chat
    // 3. User is NOT at bottom (check directly using scroll check function for accurate timing)
    if (
      message.sender?.id !== user?.id &&
      activeConversationId === String(message.chat)
    ) {
      // Check scroll position directly using the function from ChatArea
      // This ensures we get the current scroll state, not stale state
      const isAtBottom = checkScrollPositionRef.current?.() ?? true
      if (!isAtBottom) {
        playReceivedSound()
      }
    }

    // Clear timeout for optimistic messages that match this received message
    // This prevents false "failed" status when message is successfully received
    // Check even if chat context changed (handles case when coming back to page)
    if (message.sender?.id === user?.id) {
      const messageContent = String(message.content).trim()
      const messageTime = new Date(message.created_at).getTime()
      const messageChatId = String(message.chat)

      // Check all stored timeouts for messages with matching content
      messageTimeoutsRef.current.forEach((timeout, tempId) => {
        // Try to find optimistic message in the message's chat cache
        const cacheData = queryClient.getQueryData(['messages', messageChatId]) as any
        if (cacheData?.pages) {
          for (const page of cacheData.pages) {
            const optimisticMsg = page.results?.find((m: ChatMessage) => m.id === tempId)
            if (optimisticMsg) {
              const sameContent = String(optimisticMsg.content).trim() === messageContent
              const sameSender = optimisticMsg.sender?.id === message.sender?.id
              const optimisticTime = new Date(optimisticMsg.created_at).getTime()
              const withinTimeWindow = Math.abs(messageTime - optimisticTime) < 90000 // 90 seconds window

              if (sameContent && sameSender && withinTimeWindow) {
                // Clear the timeout for this optimistic message
                clearTimeout(timeout)
                messageTimeoutsRef.current.delete(tempId)
                // The message will be replaced by handleSocketMessage in useChatRealtime
                break
              }
            }
          }
        }
      })
    }

    // Don't auto-scroll - let user decide when to scroll
    // ChatArea component will show scroll-to-bottom button with badge
  }, [queryClient, user?.id, activeConversationId, playReceivedSound])

  // Real-time WebSocket integration
  const { isConnected, sendMessage: sendWebSocketMessage, sendTyping, markAsRead: markAsReadWebSocket } = useChatRealtime({
    activeConversationId,
    onMessageReceived: handleMessageReceived,
    onTypingChange: (isTyping, userId, chatId) => {
      // Only track typing if it's from the OTHER user (not current user)
      if (chatId && userId !== user?.id) {
        setTypingByChatId((prev) => ({
          ...prev,
          [chatId]: isTyping,
        }))
      } else if (chatId && userId === user?.id) {
        // Clear typing indicator for current user's typing
        setTypingByChatId((prev) => {
          const updated = { ...prev }
          delete updated[chatId]
          return updated
        })
      }

      // Only show typing indicator if it's from the participant (not current user)
      if (activeParticipant && userId === activeParticipant.id && chatId === activeConversationId) {
        setIsParticipantTyping(isTyping)
      }
    },
  })

  // WhatsApp-style: Mark as read when last unread message is visible
  // This is handled by ChatArea component using Intersection Observer
  const handleMarkAsRead = useCallback(() => {
    if (!activeConversationId || !isConnected) return

    console.log(`[Mark Read] Last unread message is visible, marking as read for chat: ${activeConversationId}`)

    // Prefer WebSocket for marking as read (like WhatsApp/Telegram)
    if (isConnected) {
      markAsReadWebSocket()
    } else {
      // Fallback to REST API if WebSocket not connected
      markChatAsRead.mutate(activeConversationId, {
        onSuccess: () => {
          console.log('✅ Messages marked as read via REST API for chat:', activeConversationId)
        },
        onError: (error) => {
          console.error('❌ Failed to mark messages as read:', error)
        }
      })
    }
  }, [activeConversationId, isConnected, markAsReadWebSocket, markChatAsRead])

  // Handle typing indicator from WebSocket
  useEffect(() => {
    // This will be handled by the typing indicator logic in ChatArea
    // For now, we'll manage it locally
  }, [])

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setShowMobileChat(true)
    router.push(`/chat?id=${conversationId}`, { scroll: false })
  }

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeConversationId || !content.trim() || !isConnected) {
      if (!isConnected) {
        console.warn('Cannot send message: WebSocket not connected')
        // Could show a toast notification here
      }
      return
    }

    // Create optimistic message with "sending" status
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const messageContent = content.trim()

    // Check if recipient is online - if so, mark as delivered immediately (WhatsApp pattern)
    const isRecipientOnline = activeParticipant && participantStatus?.is_online
    const deliveredAt = isRecipientOnline ? new Date().toISOString() : undefined

    const optimisticMessage: ChatMessage = {
      id: tempId,
      chat: activeConversationId,
      sender: user!,
      content: messageContent,
      message_type: 'text',
      is_read: false,
      delivered_at: deliveredAt, // Mark as delivered if recipient is online
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      send_failed: false,
    }

    if (isRecipientOnline) {
      console.log('✅ [Send] Recipient is online, marking message as delivered immediately:', tempId)
    }

    // Optimistically add to messages cache (Infinite Query)
    queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
      if (!oldData?.pages || oldData.pages.length === 0) {
        // Initialize with first page
        return {
          pages: [{ results: [optimisticMessage], count: 1, next: null, previous: null, page: 1 }],
          pageParams: [1],
        }
      }

      // Add to the last page (newest messages)
      const lastPageIndex = oldData.pages.length - 1
      const lastPage = oldData.pages[lastPageIndex]
      const updatedPages = [...oldData.pages]

      updatedPages[lastPageIndex] = {
        ...lastPage,
        results: [...lastPage.results, optimisticMessage].sort(
          (a: ChatMessage, b: ChatMessage) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }

      return {
        ...oldData,
        pages: updatedPages,
      }
    })

    // Also update chat list optimistically (preserve ad fields and reorder)
    queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
      if (!oldChats) return []

      // Debug logging before optimistic update
      const existingChat = oldChats.find((c) => c.id === activeConversationId)
      if (existingChat) {
        console.log('📤 [Optimistic] Before optimistic chat list update:', {
          chat_id: activeConversationId,
          existing_ad_image: existingChat.ad_image,
          temp_message_id: optimisticMessage.id,
        })
      }

      const updated = oldChats.map((chat) => {
        if (chat.id === activeConversationId) {
          const updatedChat = {
            ...chat,
            last_message: optimisticMessage,
            last_message_at: optimisticMessage.created_at,
            updated_at: optimisticMessage.created_at,
            // Preserve all ad-related fields
            ad: chat.ad,
            ad_title: chat.ad_title,
            ad_slug: chat.ad_slug,
            ad_image: chat.ad_image,
            ad_price: chat.ad_price,
            ad_currency: chat.ad_currency,
          }

          console.log('✅ [Optimistic] After optimistic chat list update:', {
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
        // Sort by most recent activity (WhatsApp/Telegram pattern)
        const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
        const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
        return timeB - timeA
      })

      console.log('📋 [Optimistic] Chat list sorted. Top chat:', {
        id: sorted[0]?.id,
        ad_image: sorted[0]?.ad_image,
        last_message_at: sorted[0]?.last_message_at,
      })

      return sorted
    })

    // Send via WebSocket
    try {
      if (!isConnected) {
        throw new Error('WebSocket not connected')
      }

      const sent = sendWebSocketMessage(messageContent)
      if (sent === false) {
        throw new Error('Failed to send message via WebSocket')
      }

      // Play sent sound when message is successfully sent
      playSentSound()

      // Set timeout to mark message as failed if not confirmed within 15 seconds
      // Increased timeout to account for subscription delay when coming back to page
      // Store timeout reference so we can clear it if message is successfully received
      const timeoutId = setTimeout(() => {
        // Only mark as failed if the optimistic message still exists and no real message replaced it
        queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
          if (!oldData?.pages) {
            messageTimeoutsRef.current.delete(tempId)
            return oldData
          }

          let messageStillExists = false
          let hasMatchingRealMessage = false

          // First check if a real message with same content exists
          const allMessages = oldData.pages.flatMap((page: any) => page.results || [])
          const matchingRealMessage = allMessages.find((m: ChatMessage) => {
            if (m.id === tempId) return false
            const sameContent = String(m.content).trim() === messageContent
            const sameSender = m.sender?.id === user?.id
            const messageTime = new Date(m.created_at).getTime()
            const optimisticTime = new Date(optimisticMessage.created_at).getTime()
            const withinTimeWindow = Math.abs(messageTime - optimisticTime) < 60000 // 60 seconds
            return sameContent && sameSender && withinTimeWindow && !String(m.id).startsWith('temp-')
          })

          if (matchingRealMessage) {
            hasMatchingRealMessage = true
            // Remove the optimistic message since real message exists
            const updatedPages = oldData.pages.map((page: any) => ({
              ...page,
              results: page.results.filter((m: ChatMessage) => m.id !== tempId)
            }))
            messageTimeoutsRef.current.delete(tempId)
            return { ...oldData, pages: updatedPages }
          }

          // If no matching real message, check if optimistic message still exists
          const updatedPages = oldData.pages.map((page: any) => {
            const messagesArray = page.results || []
            const messageIndex = messagesArray.findIndex((m: ChatMessage) => m.id === tempId)

            if (messageIndex !== -1) {
              messageStillExists = true
              const message = messagesArray[messageIndex]
              // Only mark as failed if still optimistic and not already failed
              if (String(message.id).startsWith('temp-') && !message.send_failed) {
                const updated = [...messagesArray]
                updated[messageIndex] = {
                  ...message,
                  send_failed: true,
                }
                return {
                  ...page,
                  results: updated,
                }
              }
            }
            return page
          })

          // Remove timeout from map after it fires
          messageTimeoutsRef.current.delete(tempId)

          // Only return updated pages if message still exists and was marked as failed
          if (messageStillExists && !hasMatchingRealMessage) {
            return {
              ...oldData,
              pages: updatedPages,
            }
          }

          return oldData
        })
      }, 15000) // 15 seconds timeout - increased to account for subscription delays

      // Store timeout reference
      messageTimeoutsRef.current.set(tempId, timeoutId)

      // The WebSocket handler will replace the optimistic message with the real one
      // when the server confirms the message was saved
    } catch (error) {
      console.error('Failed to send message:', error)
      // Mark message as failed immediately
      queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
        if (!oldData?.pages) return oldData

        const updatedPages = oldData.pages.map((page: any) => {
          const messagesArray = page.results || []
          const messageIndex = messagesArray.findIndex((m: ChatMessage) => m.id === tempId)

          if (messageIndex !== -1) {
            const updated = [...messagesArray]
            updated[messageIndex] = {
              ...updated[messageIndex],
              send_failed: true,
            }
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

      // Revert chat list update
      queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
        if (!oldChats) return []
        return oldChats.map((chat) => {
          if (chat.id === activeConversationId && chat.last_message?.id === optimisticMessage.id) {
            // Restore previous last message or remove if none
            // Handle infinite query structure
            const messagesData = queryClient.getQueryData<any>(['messages', activeConversationId])
            let messages: ChatMessage[] = []

            if (messagesData?.pages) {
              // Infinite query structure
              messages = messagesData.pages.flatMap((page: any) => page.results || [])
            } else if (Array.isArray(messagesData)) {
              // Fallback for array structure
              messages = messagesData
            }

            const previousLastMessage = messages.length > 1 ? messages[messages.length - 2] : null
            return {
              ...chat,
              last_message: previousLastMessage || chat.last_message,
              last_message_at: previousLastMessage?.created_at || chat.last_message_at,
            }
          }
          return chat
        })
      })
    }
  }, [activeConversationId, user, sendWebSocketMessage, queryClient, isConnected, playSentSound])

  // Retry failed message
  const handleRetryMessage = useCallback((message: ChatMessage) => {
    if (!activeConversationId || !message.content || !isConnected) return

    const oldMessageId = message.id

    // Remove the old failed message and create a new optimistic one
    queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
      if (!oldData?.pages) return oldData

      const updatedPages = oldData.pages.map((page: any) => {
        const messagesArray = page.results || []
        // Remove the old failed message
        const filtered = messagesArray.filter((m: ChatMessage) => m.id !== oldMessageId)
        return {
          ...page,
          results: filtered,
        }
      })

      return {
        ...oldData,
        pages: updatedPages,
      }
    })

    // Also remove from chat list if it was the last message
    queryClient.setQueryData(['chats'], (oldChats: ChatSummary[] | undefined) => {
      if (!oldChats) return []
      return oldChats.map((chat) => {
        if (chat.id === activeConversationId && chat.last_message?.id === oldMessageId) {
          // Get previous last message from cache
          const messagesData = queryClient.getQueryData<any>(['messages', activeConversationId])
          let messages: ChatMessage[] = []

          if (messagesData?.pages) {
            messages = messagesData.pages.flatMap((page: any) => page.results || [])
          }

          const previousLastMessage = messages.length > 0 ? messages[messages.length - 1] : null
          return {
            ...chat,
            last_message: previousLastMessage || null,
            last_message_at: previousLastMessage?.created_at || chat.last_message_at,
          }
        }
        return chat
      })
    })

    // Resend the message (this will create a new optimistic message)
    handleSendMessage(message.content)
  }, [activeConversationId, handleSendMessage, queryClient, isConnected])

  const handleTypingChange = useCallback((typing: boolean) => {
    // Clear existing timeout first
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    // Send typing indicator via WebSocket
    if (typing && activeConversationId && isConnected) {
      sendTyping(true)
      setIsParticipantTyping(false) // Reset local state, will be set by WebSocket if participant is typing

      // Auto-stop typing after 2 seconds of inactivity
      // Matches WhatsApp behavior: typing indicator disappears after inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false)
        typingTimeoutRef.current = null
      }, 2000)
    } else {
      sendTyping(false)
      // Don't reset setIsParticipantTyping here - that's handled by WebSocket callback
    }
  }, [activeConversationId, sendTyping, isConnected])

  const handleBack = () => {
    setShowMobileChat(false)
    router.push('/chat', { scroll: false })
  }

  // Update URL when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      router.replace(`/chat?id=${activeConversationId}`, { scroll: false })
    }
  }, [activeConversationId, router])

  // Cleanup typing timeout and message timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Clear all message timeouts
      messageTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout)
      })
      messageTimeoutsRef.current.clear()
    }
  }, [])

  // Calculate available height: viewport - navbar - bottom nav
  // bottomNavHeight will be 0 on desktop (since bottom nav is hidden with md:hidden)
  const availableHeight = `calc(100vh - ${navbarHeight}px - ${bottomNavHeight}px)`

  return (
    <div
      className="bg-white fixed inset-x-0 container px-0 md:px-0 overflow-hidden"
      style={{
        top: `${navbarHeight}px`,
        bottom: `${bottomNavHeight}px`,
        maxHeight: availableHeight,
      }}
    >
      <div className="h-full flex border-x border-gray-200 md:border-x overflow-hidden">
        {/* Chat List */}
        <div
          className={`${showMobileChat ? 'hidden' : 'w-full'} md:flex md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col h-full overflow-hidden`}
        >
          <ConversationList
            conversations={chats}
            activeConversationId={activeConversationId || undefined}
            onSelectConversation={handleSelectConversation}
            currentUserId={user?.id}
            onlineStatuses={onlineStatuses}
            isLoading={chatsLoading}
            typingByChatId={typingByChatId}
          />
        </div>

        {/* Chat Area */}
        <div className={`${showMobileChat ? 'w-full' : 'hidden'} md:flex md:flex-1 flex-col h-full overflow-hidden`}>
          <ChatArea
            chat={activeChat}
            participant={activeParticipant}
            participantStatus={participantStatus}
            messages={messages}
            isParticipantTyping={isParticipantTyping}
            isConnected={isConnected}
            isLoadingMessages={messagesLoading || isFetchingNextPage}
            hasMoreMessages={hasNextPage || false}
            onSendMessage={handleSendMessage}
            onSendMedia={async (formData) => {
              if (!activeConversationId || !isConnected) return

              const messageType = formData.get('message_type') as 'image' | 'audio' | 'text'
              const content = formData.get('content') as string
              const attachmentFile = formData.get('attachment') as File

              // Create optimistic media message
              const tempId = `temp-media-${Date.now()}`
              const optimisticMessage: ChatMessage = {
                id: tempId,
                chat: activeConversationId,
                sender: user!,
                content: content,
                message_type: messageType,
                attachment: URL.createObjectURL(attachmentFile), // Temporary local URL
                is_read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                send_failed: false,
              }

              // Add to cache
              queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
                if (!oldData?.pages) return oldData
                const updatedPages = [...oldData.pages]
                const lastPageIndex = updatedPages.length - 1
                updatedPages[lastPageIndex] = {
                  ...updatedPages[lastPageIndex],
                  results: [...updatedPages[lastPageIndex].results, optimisticMessage]
                }
                return { ...oldData, pages: updatedPages }
              })

              try {
                const response = await chatApi.sendMediaMessage(formData)
                // Replace optimistic message with real one
                queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
                  if (!oldData?.pages) return oldData
                  const updatedPages = oldData.pages.map((page: any) => ({
                    ...page,
                    results: page.results.map((m: ChatMessage) => m.id === tempId ? response : m)
                  }))
                  return { ...oldData, pages: updatedPages }
                })
                playSentSound()
              } catch (error) {
                console.error('Failed to send media:', error)
                queryClient.setQueryData(['messages', activeConversationId], (oldData: any) => {
                  if (!oldData?.pages) return oldData
                  const updatedPages = oldData.pages.map((page: any) => ({
                    ...page,
                    results: page.results.map((m: ChatMessage) => m.id === tempId ? { ...m, send_failed: true } : m)
                  }))
                  return { ...oldData, pages: updatedPages }
                })
              }
            }}
            onTypingChange={handleTypingChange}
            onLoadMore={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
              }
            }}
            onBack={handleBack}
            onRetryMessage={handleRetryMessage}
            onMarkAsRead={handleMarkAsRead}
            onScrollStateChange={setIsUserAtBottom}
            onGetScrollState={(getState) => {
              checkScrollPositionRef.current = getState
            }}
            chatId={activeConversationId}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}

export default function ChatClient() {
  return <ChatClientContent />
}
