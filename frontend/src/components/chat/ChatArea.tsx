"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { 
  ChevronDown
} from 'lucide-react'
import type { ChatSummary, ChatMessage, User, UserOnlineStatus } from '@/api/types'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { useAuthStore } from '@/store/authStore'
import MediaPreview from './MediaPreview'
import { useChatSounds } from '@/hooks/useChatSounds'
import { getMediaUrl } from '@/lib/utils'
import { toast } from 'sonner'

// Sub-components
import ChatHeader from './Area/ChatHeader'
import AdBanner from './Area/AdBanner'
import MessageList from './Area/MessageList'
import ChatInput from './Area/ChatInput'
import SelectionBar from './Area/SelectionBar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { copyToClipboard } from '@/lib/utils'

type DateSeparator = {
  type: 'date'
  date: string
  id: string
}

type ChatListItem = ChatMessage | DateSeparator


const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB


interface ChatAreaProps {
  chat: ChatSummary | null
  participant: User
  participantStatus?: UserOnlineStatus
  messages: ChatListItem[]
  isParticipantTyping: boolean
  isConnected?: boolean
  isLoadingMessages?: boolean
  hasMoreMessages?: boolean
  onSendMessage: (content: string, parentMessageId?: string) => Promise<void> | void
  onSendMedia: (formData: FormData) => Promise<void> | void
  onTypingChange?: (typing: boolean) => void
  onLoadMore?: () => void
  onBack?: () => void
  onRetryMessage?: (message: ChatMessage) => void
  onMarkAsRead?: () => void
  onScrollStateChange?: (isAtBottom: boolean) => void // Callback to notify parent of scroll position
  onGetScrollState?: (getState: () => boolean) => void // Callback to expose scroll check function to parent
  onDeleteMessages?: (messageIds: string[]) => void // New prop
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
  onDeleteMessages,
  chatId,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [unreadCountBelow, setUnreadCountBelow] = useState(0)
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [idsToDelete, setIdsToDelete] = useState<string[]>([])

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message)
    // Focus the input
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyTo(null)
  }, [])

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleStartSelection = (messageId: string) => {
    setIsSelectionMode(true)
    setSelectedMessageIds(new Set([messageId]))
  }
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

      if (message && !('type' in message) && (message as ChatMessage).sender?.id !== user.id && !(message as ChatMessage).is_read) {
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

                if (message && !('type' in message) && message.sender?.id !== user?.id && !message.is_read) {
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
      (m): m is ChatMessage =>
        !('type' in m) &&
        m.sender?.id !== user?.id &&
        !m.is_read
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

  const handleToggleSelection = (id: string) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopySelected = async () => {
    if (selectedMessageIds.size === 0) return
    
    // Filter out date separators and find selected messages
    const selectedMsgs = messages.filter(m => 
      !('type' in m) && selectedMessageIds.has(String(m.id))
    ) as ChatMessage[]
    
    if (selectedMsgs.length === 0) return

    // Sort by creation time to maintain conversation flow in clipboard
    const sortedMsgs = [...selectedMsgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const textToCopy = sortedMsgs.map(m => {
      const senderName = m.sender?.id === user?.id ? 'You' : (participant ? getUserFullName(participant) : 'Other')
      const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `[${time}] ${senderName}: ${m.content || '[Media]'}`
    }).join('\n')

    const success = await copyToClipboard(textToCopy)
    if (success) {
      toast.success(`${selectedMessageIds.size} messages copied to clipboard`)
      setIsSelectionMode(false)
      setSelectedMessageIds(new Set())
    } else {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDeleteAction = (ids: string[]) => {
    setIdsToDelete(ids)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (idsToDelete.length === 0) return
    try {
      // Only delete messages where the current user is the sender
      const ownMessageIds = idsToDelete.filter(id => {
        const msg = messages.find(m => !('type' in m) && String(m.id) === String(id)) as ChatMessage | undefined
        return msg && String(msg.sender?.id) === String(user?.id)
      })

      if (ownMessageIds.length === 0) {
        toast.error("You can only delete your own messages")
        setIsSelectionMode(false)
        setSelectedMessageIds(new Set())
        return
      }

      await onDeleteMessages?.(ownMessageIds)
      
      if (ownMessageIds.length < idsToDelete.length) {
        toast.info(`Deleted ${ownMessageIds.length} of your messages. Others were skipped.`)
      }
      
      setIsSelectionMode(false)
      setSelectedMessageIds(new Set())
    } catch (error) {
      console.error('Failed to delete messages', error)
      toast.error('Failed to delete messages')
    } finally {
      setDeleteConfirmOpen(false)
      setIdsToDelete([])
    }
  }

  const handleDeleteSelected = () => {
    if (selectedMessageIds.size === 0) return
    handleDeleteAction(Array.from(selectedMessageIds))
  }

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    try {
      await onSendMessage(trimmed, replyTo?.id)
      setInputValue('')
      setReplyTo(null)
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
      toast.error('File too large')
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
    formData.append('message_type', 'text') // Since it's definitely not an image here
    formData.append('content', `📎 ${file.name}`)
    formData.append('attachment', file)
    if (replyTo) {
      formData.append('parent_message_id', replyTo.id)
    }

    try {
      await onSendMedia(formData)
      setReplyTo(null)
      // Reset input
      event.target.value = ''
    } catch (error) {
      console.error('Failed to send media', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Determine best supported MIME type
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/aac', 'audio/wav']
      const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || ''
      
      const mediaRecorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedType || 'audio/webm' })
        const extension = supportedType.includes('mp4') ? 'm4a' : supportedType.includes('webm') ? 'webm' : 'wav'

        if (audioBlob.size > MAX_FILE_SIZE) {
          toast.error('Recording too large')
          stream.getTracks().forEach(track => track.stop())
          return
        }

        if (audioBlob.size > 1000) { // Only send if significant audio
          const formData = new FormData()
          formData.append('chat', chat!.id)
          formData.append('message_type', 'audio')
          formData.append('content', '🎤 Audio Message')
          formData.append('attachment', audioBlob, `recording.${extension}`)
          if (replyTo) {
            formData.append('parent_message_id', replyTo.id)
          }
          
          try {
            await onSendMedia(formData)
            setReplyTo(null)
          } catch (error) {
            console.error('Failed to send audio recording', error)
            toast.error('Failed to send voice message')
          }
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
      toast.error('Could not access microphone')
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
    if (replyTo) {
      formData.append('parent_message_id', replyTo.id)
    }

    try {
      await onSendMedia(formData)
      setSelectedMedia(null)
      setReplyTo(null)
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
      <ChatHeader
        participant={participant}
        participantStatus={participantStatus}
        isParticipantTyping={isParticipantTyping}
        isConnected={isConnected}
        isSelectionMode={isSelectionMode}
        selectedCount={selectedMessageIds.size}
        onBack={onBack}
        onToggleSelectionMode={setIsSelectionMode}
        onCancelSelection={() => {
          setIsSelectionMode(false)
          setSelectedMessageIds(new Set())
        }}
        participantStatusText={participantStatusText}
      />

      <AdBanner chat={chat} />

      <MessageList
        messages={messages}
        user={user}
        participant={participant}
        isSelectionMode={isSelectionMode}
        selectedMessageIds={selectedMessageIds}
        onToggleSelection={handleToggleSelection}
        onStartSelection={handleStartSelection}
        handleReply={handleReply}
        onDeleteMessages={handleDeleteAction}
        onRetryMessage={onRetryMessage}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        isParticipantTyping={isParticipantTyping}
        isLoadingMessages={isLoadingMessages}
      />

      {/* Scroll Bottom Button */}
      {showScrollToBottom && (
        <div className="absolute bottom-16 right-6 z-20">
          <button
            onClick={() => scrollToBottom(true)}
            className="bg-white text-gray-600 rounded-full w-10 h-10 shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all group scale-in"
          >
            <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            {unreadCountBelow > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white shadow-sm">
                {unreadCountBelow}
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

      {isSelectionMode ? (
        <SelectionBar
          selectedCount={selectedMessageIds.size}
          canDelete={Array.from(selectedMessageIds).every(id => {
            const msg = messages.find(m => !('type' in m) && String(m.id) === String(id)) as ChatMessage | undefined
            return msg && String(msg.sender?.id) === String(user?.id)
          })}
          onCancel={() => {
            setIsSelectionMode(false)
            setSelectedMessageIds(new Set())
          }}
          onCopy={handleCopySelected}
          onDelete={handleDeleteSelected}
        />
      ) : (
        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          onSendMessage={handleSendMessage}
          onTypingChange={handleTypingChange}
          fileInputRef={fileInputRef}
          imageInputRef={imageInputRef}
          textareaRef={textareaRef}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          startRecording={startRecording}
          stopRecording={stopRecording}
          formatDuration={formatDuration}
          user={user!}
          onAttachmentChange={handleAttachmentChange}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border-gray-100 max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Delete {idsToDelete.length === 1 ? 'message' : `${idsToDelete.length} messages`}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[15px] text-gray-500">
              This action cannot be undone. This will permanently delete your messages from this chat. Only messages sent by you will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-2">
            <AlertDialogCancel className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 h-9 px-4 text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="rounded-full bg-red-500 hover:bg-red-600 text-white h-9 px-4 text-xs font-semibold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

