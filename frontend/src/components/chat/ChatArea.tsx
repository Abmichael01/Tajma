"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Send, Image as ImageIcon, Paperclip, ChevronDown } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { ChatSummary, ChatMessage, User, UserOnlineStatus } from '@/api/types'
import { useAuthStore } from '@/store/authStore'
import MessageBubble from './MessageBubble'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { useChatSounds } from '@/hooks/useChatSounds'
import { toast } from 'sonner'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

// Helper function to normalize image URLs
const normalizeImageUrl = (url: string | null | undefined): string => {
  if (!url) return '/default-product.png'

  // If already an absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If starts with /, it's already a valid relative path
  if (url.startsWith('/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return `${apiUrl}${url}`
  }

  // Otherwise, prepend API URL and add leading slash
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${apiUrl}/${url}`
}

interface ChatAreaProps {
  chat: ChatSummary | null
  participant: User | null
  participantStatus?: UserOnlineStatus
  messages: ChatMessage[]
  isParticipantTyping?: boolean
  isConnected?: boolean
  isLoadingMessages?: boolean
  hasMoreMessages?: boolean
  onSendMessage: (content: string) => Promise<void> | void
  onSendMedia: (formData: FormData) => Promise<void> | void
  onTypingChange?: (typing: boolean) => void
  onLoadMore?: () => void
  onBack?: () => void
  onRetryMessage?: (message: ChatMessage) => void
  onMarkAsRead?: () => void
  onScrollStateChange?: (isAtBottom: boolean) => void // Callback to notify parent of scroll position
  onGetScrollState?: (getState: () => boolean) => void // Callback to expose scroll check function to parent
  chatId?: string | null // Chat ID to detect when chat changes
}

export default function ChatArea({
  chat,
  participant,
  participantStatus,
  messages,
  isParticipantTyping,
  isConnected,
  isLoadingMessages = false,
  hasMoreMessages = false,
  onSendMessage,
  onSendMedia,
  onTypingChange,
  onLoadMore,
  onBack,
  onRetryMessage,
  onMarkAsRead,
  onScrollStateChange,
  onGetScrollState,
  chatId,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState('')
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [unreadCountBelow, setUnreadCountBelow] = useState(0)
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastUnreadMessageRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingMoreRef = useRef(false)
  const lastMessageCountRef = useRef<number>(0)
  const lastMessageIdRef = useRef<string | number | null>(null)
  const wasAtBottomRef = useRef<boolean>(true) // Track if user was at bottom before new message
  const { user } = useAuthStore()
  const { playTypingSound } = useChatSounds()

  // Function to check if user is currently at bottom
  const checkIsAtBottom = useCallback((): boolean => {
    const container = messagesContainerRef.current
    if (!container) return true // Default to true if container not available

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom < 100 // Within 100px of bottom
  }, [])

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
      // Reset unread count after scrolling
      setUnreadCountBelow(0)
      // Update scroll state after a brief delay to ensure scroll position is updated
      setTimeout(() => {
        updateScrollState()
      }, smooth ? 500 : 100)
    }
  }

  // Expose scroll check function to parent via callback
  useEffect(() => {
    if (onGetScrollState) {
      onGetScrollState(checkIsAtBottom)
    }
  }, [onGetScrollState, checkIsAtBottom])

  // Track scroll position and count unread messages below current view
  const updateScrollState = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container || !messages || !user) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const isNearBottom = distanceFromBottom < 100 // Within 100px of bottom

    // Notify parent component of scroll state
    onScrollStateChange?.(isNearBottom)

    // Only show button if user has scrolled up (not at bottom)
    if (isNearBottom) {
      // User is at bottom - hide button
      setShowScrollToBottom(false)
      setUnreadCountBelow(0)
      return
    }

    // User has scrolled up - show button
    setShowScrollToBottom(true)

    // Count unread messages that are below current scroll position
    let count = 0
    const viewportBottom = scrollTop + clientHeight

    // Get all message elements
    const messageElements = Array.from(container.querySelectorAll('[data-message-id]')) as HTMLElement[]

    messageElements.forEach((element) => {
      const messageId = element.getAttribute('data-message-id')
      const message = messages.find(m => String(m.id) === messageId)

      if (message && message.sender?.id !== user.id && !message.is_read) {
        const elementTop = element.offsetTop
        const elementBottom = elementTop + element.offsetHeight

        // Check if message is below current viewport
        if (elementTop > viewportBottom) {
          count++
        }
      }
    })

    // Set unread count (will show badge if count > 0)
    setUnreadCountBelow(count)
  }, [messages, user, onScrollStateChange])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      // Update whether user is at bottom before checking scroll state
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      wasAtBottomRef.current = distanceFromBottom < 100 // Within 100px of bottom

      updateScrollState()
    }

    container.addEventListener('scroll', handleScroll)
    // Check initial position
    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    wasAtBottomRef.current = distanceFromBottom < 100
    updateScrollState()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [updateScrollState])

  // Check for new messages and show scroll button if user is not at bottom
  useEffect(() => {
    if (!messages || messages.length === 0) {
      lastMessageCountRef.current = 0
      lastMessageIdRef.current = null
      return
    }

    // Get the last message
    const lastMessage = messages[messages.length - 1]
    const currentMessageCount = messages.length
    const currentLastMessageId = lastMessage?.id

    // Check if a new message actually arrived (not just status update or array reference change)
    // Only treat as new message if:
    // 1. Message count increased, OR
    // 2. Last message ID changed (new message added)
    // Do NOT treat status updates (delivered_at, read_at changes) as new messages
    const isNewMessage =
      currentMessageCount > lastMessageCountRef.current ||
      (currentLastMessageId && currentLastMessageId !== lastMessageIdRef.current)

    // If this is just a status update (same message count, same last message ID),
    // don't trigger scroll logic - just return early
    if (!isNewMessage) {
      return
    }

    // Store if user was at bottom before new message
    const wasAtBottom = wasAtBottomRef.current

    // Update refs only if it's actually a new message
    lastMessageCountRef.current = currentMessageCount
    lastMessageIdRef.current = currentLastMessageId

    // Only check scroll position if a new message arrived (already checked above)
    // Use multiple requestAnimationFrame calls to ensure DOM is fully updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const container = messagesContainerRef.current
          if (!container) return

          // CRITICAL: Verify actual scroll position RIGHT BEFORE deciding to scroll
          // Don't rely solely on wasAtBottomRef - check the actual DOM position
          const { scrollTop, scrollHeight, clientHeight } = container
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight
          const isActuallyAtBottom = distanceFromBottom < 100 // Within 100px of bottom

          // Only auto-scroll if user was at bottom BEFORE message AND is still at bottom NOW
          // This prevents scrolling when user scrolled up during message processing
          if (wasAtBottom && isActuallyAtBottom) {
            scrollToBottom(false) // Instant scroll
            setShowScrollToBottom(false)
            setUnreadCountBelow(0)
            // Update wasAtBottomRef after scrolling
            wasAtBottomRef.current = true
          } else {
            // User was not at bottom or scrolled up - check current position and show button if needed
            const isNearBottom = distanceFromBottom < 100 // Within 100px of bottom

            // If user is not at bottom, show scroll button
            if (!isNearBottom) {
              setShowScrollToBottom(true)

              // Count unread messages from other user that are below viewport
              let count = 0
              const viewportBottom = scrollTop + clientHeight

              // Get all message elements
              const messageElements = Array.from(container.querySelectorAll('[data-message-id]')) as HTMLElement[]

              messageElements.forEach((element) => {
                const messageId = element.getAttribute('data-message-id')
                const message = messages.find(m => String(m.id) === messageId)

                if (message && message.sender?.id !== user?.id && !message.is_read) {
                  const elementTop = element.offsetTop

                  // Check if message is below current viewport
                  if (elementTop > viewportBottom) {
                    count++
                  }
                }
              })

              setUnreadCountBelow(count)
            } else {
              // User is at bottom - hide button
              setShowScrollToBottom(false)
              setUnreadCountBelow(0)
              wasAtBottomRef.current = true
            }
          }
        }, 300) // Delay to ensure messages are rendered
      })
    })
  }, [messages, user])

  // Track which chat we've scrolled for to prevent duplicate scrolls
  const scrolledForChatRef = useRef<string | null>(null)
  const lastMessageCountForChatRef = useRef<Record<string, number>>({})

  // Scroll to bottom when chat is opened (chatId changes)
  // This effect only handles chatId changes, not message updates
  useEffect(() => {
    if (!chatId) {
      scrolledForChatRef.current = null
      return
    }

    // Reset scroll state when chat changes
    setShowScrollToBottom(false)
    setUnreadCountBelow(0)
    wasAtBottomRef.current = true

    // Reset scroll tracking for new chat (allow scroll when messages load)
    if (scrolledForChatRef.current !== chatId) {
      scrolledForChatRef.current = null
    }
  }, [chatId])

  // Scroll to bottom when messages first load for a new chat
  // This ensures we scroll after messages are actually loaded, not just when chatId changes
  // Only scrolls when: chatId changed AND messages exist AND we haven't scrolled for this chat yet
  useEffect(() => {
    if (!chatId || !messagesContainerRef.current) return
    if (!messages || messages.length === 0) return // Wait for messages to load
    if (scrolledForChatRef.current === chatId) return // Already scrolled for this chat

    // Check if message count changed from 0 (new chat) or if this is first time seeing messages for this chat
    const previousCount = lastMessageCountForChatRef.current[chatId] || 0
    const currentCount = messages.length

    // Only scroll if:
    // 1. This is a new chat (previousCount was 0 and now we have messages), OR
    // 2. We haven't scrolled for this chat yet and messages exist
    if (previousCount === 0 && currentCount > 0) {
      // Mark that we've scrolled for this chat
      scrolledForChatRef.current = chatId
      lastMessageCountForChatRef.current[chatId] = currentCount

      // Scroll to bottom instantly when messages load for new chat
      const scrollToBottomNow = () => {
        const container = messagesContainerRef.current
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }

      // Try multiple times to ensure it works (messages might still be rendering)
      requestAnimationFrame(() => {
        scrollToBottomNow()
        setTimeout(() => {
          scrollToBottomNow()
          setTimeout(() => {
            scrollToBottomNow()
          }, 100)
        }, 100)
      })
    } else if (currentCount > 0) {
      // Update message count tracking (but don't scroll if we already scrolled)
      lastMessageCountForChatRef.current[chatId] = currentCount
    }
  }, [chatId, messages?.length]) // Only depend on chatId and message count, not message content

  // Play typing sound and scroll to show typing indicator if user is at bottom
  useEffect(() => {
    if (!isParticipantTyping) return

    // Play typing sound when participant starts typing
    playTypingSound()

    const container = messagesContainerRef.current
    if (!container) return

    // Only scroll if user is at bottom - this shows the typing indicator
    // If user is not at bottom, just show the indicator without scrolling
    if (wasAtBottomRef.current) {
      // User is at bottom - scroll to show typing indicator
      requestAnimationFrame(() => {
        scrollToBottom(false) // Instant scroll
      })
    }
    // If user is not at bottom, don't scroll - just show the typing indicator
  }, [isParticipantTyping, playTypingSound])

  // WhatsApp-style: Mark as read when last unread message is visible
  // Only marks as read if:
  // 1. Message is visible (Intersection Observer)
  // 2. Window has focus (don't mark as read in background tabs)
  useEffect(() => {
    if (!onMarkAsRead || !messages || !user || !messagesContainerRef.current) return

    // Find last unread message (from other user)
    const unreadMessages = messages.filter(
      (msg) => !msg.is_read && msg.sender?.id !== user.id
    )

    if (unreadMessages.length === 0) return

    const lastUnreadMessage = unreadMessages[unreadMessages.length - 1]
    let observer: IntersectionObserver | null = null

    const checkAndMarkRead = () => {
      // Only mark as read if document has focus (WhatsApp style)
      if (document.hasFocus()) {
        console.log('[Mark Read] ✅ Environment and focus confirmed, marking as read')
        onMarkAsRead()
        return true
      }
      console.log('[Mark Read] ⏳ Last message visible but window blurred. Waiting for focus...')
      return false
    }

    // Wait for DOM to update, then find the element
    const timeoutId = setTimeout(() => {
      const lastUnreadElement = document.querySelector(`[data-message-id="${lastUnreadMessage.id}"]`) as HTMLElement

      if (!lastUnreadElement) {
        console.log(`[Mark Read] Could not find element for message ${lastUnreadMessage.id}`)
        return
      }

      // Use Intersection Observer to detect when last unread message is visible
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Last unread message is visible - check focus
              const marked = checkAndMarkRead()
              if (marked) {
                observer?.disconnect()
                observer = null
              } else {
                // If not marked due to focus, we'll wait for the focus event
                // The visibility state is now "cached" by the fact that the observer is still observing
              }
            }
          })
        },
        {
          root: messagesContainerRef.current,
          rootMargin: '0px',
          threshold: 0.1, // At least 10% visible
        }
      )

      observer.observe(lastUnreadElement)
      console.log(`[Mark Read] Observing last unread message ${lastUnreadMessage.id}`)
    }, 100)

    // Listener for window focus to mark as read if message was already visible
    const handleFocus = () => {
      // If we are observing and message is visible, check visibility again
      const lastUnreadElement = document.querySelector(`[data-message-id="${lastUnreadMessage.id}"]`) as HTMLElement
      if (lastUnreadElement && observer) {
        // We can't easily check 'isIntersecting' outside the callback without a ref or extra state
        // But we can check if it's currently in the viewport
        const rect = lastUnreadElement.getBoundingClientRect()
        const containerRect = messagesContainerRef.current?.getBoundingClientRect()

        if (containerRect) {
          const isVisible = (
            rect.top >= containerRect.top &&
            rect.bottom <= containerRect.bottom
          )

          if (isVisible && checkAndMarkRead()) {
            observer.disconnect()
            observer = null
          }
        }
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('focus', handleFocus)
      if (observer) {
        observer.disconnect()
      }
    }
  }, [messages, user, onMarkAsRead])

  // Infinite scroll: Load more messages when scrolling to top
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !hasMoreMessages || isLoadingMessages) return

    const handleScroll = () => {
      // Load more when scrolled to top (within 100px)
      if (container.scrollTop < 100 && !isLoadingMoreRef.current && hasMoreMessages) {
        isLoadingMoreRef.current = true
        const previousScrollHeight = container.scrollHeight
        onLoadMore?.()

        // Restore scroll position after loading
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - previousScrollHeight
            isLoadingMoreRef.current = false
          }
        }, 100)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, isLoadingMessages, onLoadMore])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    try {
      await onSendMessage(trimmed)
      setInputValue('')
      onTypingChange?.(false)
      // Auto-scroll to bottom when user sends their own message
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom(false) // Use instant scroll for better UX
          // Update scroll state after scrolling
          setTimeout(() => {
            updateScrollState()
          }, 50)
        }, 50)
      })
    } catch (error) {
      console.error('Failed to send chat message', error)
    }
  }

  const handleTypingChange = (value: string) => {
    setInputValue(value)

    // Only send typing indicator if there's actual content
    if (value.trim().length > 0) {
      onTypingChange?.(true)
    } else {
      onTypingChange?.(false)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    // Auto-stop typing after 2 seconds of inactivity
    // Note: WhatsApp uses 300-500ms debounce before sending, but we use 2s timeout for stopping
    // This prevents flickering while still being responsive
    if (value.trim().length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange?.(false)
        typingTimeoutRef.current = null
      }, 2000)
    }
  }

  const handleAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = event.target.files?.[0]
    if (!file || !chat) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', {
        description: 'Please select a file smaller than 20MB.'
      })
      event.target.value = ''
      return
    }

    if (type === 'image') {
      setSelectedMedia(file)
      event.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('chat', chat.id)
    formData.append('message_type', type === 'image' ? 'image' : 'text')
    formData.append('content', type === 'image' ? '📷 Image' : `📎 ${file.name}`)
    formData.append('attachment', file)

    try {
      await onSendMedia(formData)
      // Reset input
      event.target.value = ''
    } catch (error) {
      console.error('Failed to send media', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        if (audioBlob.size > MAX_FILE_SIZE) {
          toast.error('Recording too large', {
            description: 'Audio message exceeds 20MB limit.'
          })
          stream.getTracks().forEach(track => track.stop())
          return
        }

        if (audioBlob.size > 1000) { // Only send if more than 1s of audio approximately
          const formData = new FormData()
          formData.append('chat', chat!.id)
          formData.append('message_type', 'audio')
          formData.append('content', '🎤 Audio Message')
          formData.append('attachment', audioBlob, 'recording.webm')
          await onSendMedia(formData)
        }
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording', err)
      alert('Could not access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendPreview = async (caption: string) => {
    if (!selectedMedia || !chat) return

    const formData = new FormData()
    formData.append('chat', chat.id)
    formData.append('message_type', 'image')
    formData.append('content', caption.trim() || '📷 Image')
    formData.append('attachment', selectedMedia)

    try {
      await onSendMedia(formData)
      setSelectedMedia(null)
    } catch (error) {
      console.error('Failed to send media via preview', error)
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = Date.now()
    const date = new Date(timestamp).getTime()
    const diffSeconds = Math.max(0, Math.floor((now - date) / 1000))
    if (diffSeconds < 60) return `${diffSeconds || 1}s ago`
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    const diffWeeks = Math.floor(diffDays / 7)
    if (diffWeeks < 4) return `${diffWeeks}w ago`
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths}mo ago`
    const diffYears = Math.floor(diffDays / 365)
    return `${diffYears}y ago`
  }

  const participantStatusText = useMemo(() => {
    if (participantStatus?.is_online) return 'Online'
    if (participantStatus?.last_seen) {
      return `Last seen ${formatRelativeTime(participantStatus.last_seen)}`
    }
    return 'Offline'
  }, [participantStatus])

  if (!chat || !participant) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 md:bg-white">
        <div className="text-center text-gray-500 max-w-md mx-auto p-6 animate-fade-in">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
          <p className="text-gray-600 mb-4 text-sm md:text-base">
            Your messages will appear here. Pick a chat from the conversation list or open an ad to begin chatting.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarImage src={participant.avatar || undefined} alt={getUserFullName(participant)} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                  {getUserInitials(participant)}
                </AvatarFallback>
              </Avatar>
              {participantStatus?.is_online && (
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 text-sm truncate">{getUserFullName(participant)}</h2>
              <p className="text-xs text-gray-500 truncate">
                {isParticipantTyping ? (
                  <span className="flex items-center gap-1">
                    <span className="inline-flex gap-0.5">
                      <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                      <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                      <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                    </span>
                    is typing...
                  </span>
                ) : (
                  participantStatusText
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {isConnected ? (
            <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-1 hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Reconnecting…
            </span>
          )}
        </div>
      </div>

      {chat.ad_title && (
        <div className="p-2 sm:p-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 sm:gap-3">
            {chat.ad_image && (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 overflow-hidden flex-shrink-0 rounded">
                <Image
                  src={normalizeImageUrl(chat.ad_image)}
                  alt={chat.ad_title || 'Ad image'}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{chat.ad_title}</h3>
              {chat.ad_price && (
                <p className="text-sm sm:text-lg font-bold text-primary">
                  {chat.ad_currency || 'Fr'} {parseFloat(chat.ad_price).toLocaleString()}
                </p>
              )}
            </div>
            {chat.ad_slug && (
              <Link href={`/ads/${chat.ad_slug}`} className="text-xs text-secondary hover:text-secondary/80 font-medium flex-shrink-0">
                View
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="h-full overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 custom-scrollbar"
        >
          {/* Loading indicator for older messages */}
          {isLoadingMessages && messages && Array.isArray(messages) && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Load older messages button - at top before messages */}
          {hasMoreMessages && !isLoadingMessages && (
            <div className="flex justify-center py-2">
              <button
                onClick={() => onLoadMore?.()}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-full border border-gray-200 hover:border-gray-300"
              >
                Load older messages
              </button>
            </div>
          )}

          {messages && Array.isArray(messages) && messages.length > 0 ? (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender?.id === user?.id}
                  participant={participant}
                  currentUserAvatar={user?.avatar ?? null}
                  currentUser={user}
                  onRetry={onRetryMessage}
                />
              ))}
            </>
          ) : !isLoadingMessages ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-sm">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {isParticipantTyping && (
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={participant.avatar || undefined} alt={getUserFullName(participant)} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {getUserInitials(participant)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                  <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                  <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scroll to bottom button (WhatsApp style) - fixed position, only shows when user scrolls up */}
        {showScrollToBottom && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={() => scrollToBottom(true)}
              className="bg-primary text-primary-foreground rounded-full p-2.5 shadow-lg hover:bg-primary/90 transition-all animate-fade-in flex items-center justify-center relative"
              title={unreadCountBelow > 0 ? `${unreadCountBelow} new message${unreadCountBelow > 1 ? 's' : ''}` : "Scroll to bottom"}
            >
              <ChevronDown className="w-5 h-5" />
              {unreadCountBelow > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-normal rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unreadCountBelow > 99 ? '99+' : unreadCountBelow}
                </span>
              )}
            </button>
          </div>
        )}

        {selectedMedia && (
          <MediaPreview
            file={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            onSend={handleSendPreview}
          />
        )}
      </div>

      <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-4 max-w-5xl mx-auto">
          {/* Main Input Pill */}
          <div className="flex-1 flex items-center gap-1 sm:gap-2 bg-white rounded-3xl border border-gray-200 px-2 sm:px-3 py-1.5 min-h-[50px] shadow-sm hover:border-gray-300 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/5">

            {/* Action Buttons Group */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center flex-shrink-0"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5 text-gray-500" />
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center flex-shrink-0"
                title="Attach image"
              >
                <ImageIcon className="w-5 h-5 text-gray-500" />
              </button>

              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setInputValue((prev) => prev + emoji)
                  const textarea = document.querySelector('textarea[placeholder="Type a message..."]') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.focus()
                    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
                  }
                }}
              />
            </div>

            {/* Textarea Area */}
            <div className="flex-1 relative min-w-0">
              {isRecording ? (
                <div className="flex-1 h-[40px] flex items-center justify-between px-3 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                    <span className="text-sm font-semibold text-red-600">Recording {formatDuration(recordingDuration)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (mediaRecorderRef.current) {
                        mediaRecorderRef.current.onstop = () => {
                          mediaRecorderRef.current = null
                          setIsRecording(false)
                          if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
                        }
                        mediaRecorderRef.current.stop()
                      }
                    }}
                    className="text-[10px] text-red-400 font-bold uppercase hover:text-red-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <textarea
                  ref={(textarea) => {
                    if (textarea) {
                      textarea.style.height = 'auto'
                      const newHeight = Math.min(textarea.scrollHeight, 150)
                      textarea.style.height = `${newHeight}px`
                      if (textarea.scrollHeight > 150) {
                        textarea.classList.add('has-overflow')
                      } else {
                        textarea.classList.remove('has-overflow')
                      }
                    }
                  }}
                  value={inputValue}
                  onChange={(event) => {
                    handleTypingChange(event.target.value)
                    const textarea = event.target as HTMLTextAreaElement
                    textarea.style.height = 'auto'
                    const newHeight = Math.min(textarea.scrollHeight, 150)
                    textarea.style.height = `${newHeight}px`
                    if (textarea.scrollHeight > 150) {
                      textarea.classList.add('has-overflow')
                    } else {
                      textarea.classList.remove('has-overflow')
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 text-gray-900 text-[15px] py-2 px-1 max-h-[150px] custom-scrollbar placeholder-gray-400"
                  rows={1}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      handleSendMessage(event)
                    }
                  }}
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                />
              )}
            </div>
          </div>

          {/* Send / Mic Button */}
          {!inputValue.trim() && !isRecording ? (
            <button
              type="button"
              onMouseDown={startRecording}
              className="w-[50px] h-[50px] bg-primary text-white rounded-full flex items-center justify-center shadow hover:bg-primary/95 transition-all active:scale-95 flex-shrink-0"
              title="Record audio"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          ) : (
            <button
              type={isRecording ? "button" : "submit"}
              onClick={isRecording ? stopRecording : undefined}
              disabled={!isRecording && !inputValue.trim()}
              className={`w-[50px] h-[50px] ${isRecording ? 'bg-red-500' : 'bg-primary'} text-white rounded-full flex items-center justify-center shadow hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all active:scale-95 flex-shrink-0`}
              title={isRecording ? "Stop and Send" : "Send message"}
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          )}
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.zip"
          onChange={(e) => handleAttachmentChange(e, 'file')}
          className="hidden"
        />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleAttachmentChange(e, 'image')}
          className="hidden"
        />
      </div>
    </div>
  )
}

