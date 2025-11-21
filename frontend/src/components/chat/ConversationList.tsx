"use client"

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, CheckCheck, Clock } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { ChatSummary, ChatMessage, User, UserOnlineStatus } from '@/api/types'
import { getUserFullName, getUserInitials } from '@/utils/user'

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

interface ConversationListProps {
  conversations?: ChatSummary[]
  activeConversationId?: string
  onSelectConversation: (conversationId: string) => void
  currentUserId?: number
  onlineStatuses?: Record<number, UserOnlineStatus | undefined>
  isLoading?: boolean
  typingByChatId?: Record<string, boolean>
}

const formatTime = (timestamp?: string | null) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  if (diffInHours < 168) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const truncateText = (text: string, maxLength: number = 50) => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

const getOtherParticipant = (chat: ChatSummary, currentUserId?: number): User => {
  if (chat.participant1.id === currentUserId) {
    return chat.participant2
  }
  return chat.participant1
}

const getMessageStatus = (message?: ChatMessage | null): 'none' | 'sending' | 'sent' | 'delivered' | 'read' => {
  if (!message) return 'none'
  
  // Check if message failed to send
  if (message.send_failed) return 'none'
  
  // Check if message is optimistic (temp ID)
  const isOptimistic = typeof message.id === 'string' && message.id.startsWith('temp-')
  if (isOptimistic) return 'sending'
  
  // Once message has a real ID (not temp), it means it was created/sent
  // So we show "sent" immediately, regardless of delivered_at
  // Delivered/read status are additional updates that happen later
  
  const isRead = Boolean(message.is_read)
  const isDelivered = Boolean(message.delivered_at)
  
  // Check read status first (highest priority)
  if (isRead) return 'read'
  
  // Then check delivered (only if not read yet)
  if (isDelivered) return 'delivered'
  
  // Otherwise, message is sent (has real ID, created on server)
  return 'sent' // Message created on server
}

export default function ConversationList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  currentUserId,
  onlineStatuses,
  isLoading,
  typingByChatId = {},
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations
    return conversations.filter((chat) => {
      const participant = getOtherParticipant(chat, currentUserId)
      const name = getUserFullName(participant).toLowerCase()
      return name.includes(searchTerm.toLowerCase())
    })
  }, [conversations, searchTerm, currentUserId])

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-600">Chat with sellers and buyers</p>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-sm">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 animate-fade-in">
            <div className="text-4xl mb-3 animate-bounce">💬</div>
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1">Start chatting with sellers or buyers</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((chat) => {
              const participant = getOtherParticipant(chat, currentUserId)
              const participantStatus = participant ? onlineStatuses?.[participant.id] : undefined
              const isActive = chat.id === activeConversationId
              const lastMessage = chat.last_message
              const isOwnMessage = lastMessage?.sender?.id === currentUserId
              const isTyping = typingByChatId[chat.id] || false

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectConversation(chat.id)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isActive ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0 w-12 h-12">
                      {/* Ad image as main square image */}
                      {chat.ad_image ? (
                        <Image
                          src={normalizeImageUrl(chat.ad_image)}
                          alt={chat.ad_title || 'Ad image'}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* User avatar positioned on ad image at bottom-right corner (like badge/sub on image) */}
                      <div className="absolute bottom-4 left-[60%] w-6 h-6 rounded-full border-2 border-white bg-white relative z-10 transform">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={participant?.avatar || undefined} alt={participant ? getUserFullName(participant) : 'Participant'} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                            {participant ? getUserInitials(participant) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online status indicator at bottom-right corner of user avatar (same pattern: -bottom-1 -right-1) */}
                        {participantStatus?.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-20" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-sm truncate ${
                            chat.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {participant ? getUserFullName(participant) : 'Unknown user'}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm text-gray-400">
                            {formatTime(lastMessage?.created_at || chat.last_message_at)}
                          </span>
                          {chat.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full min-w-[20px] text-center">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {chat.ad_title && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-900 truncate">{truncateText(chat.ad_title, 40)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {isTyping ? (
                          <span className="text-sm text-gray-500 italic flex items-center gap-1">
                            <span className="inline-flex gap-0.5">
                              <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                              <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                              <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot" />
                            </span>
                            typing...
                          </span>
                        ) : (
                          <span
                            className={`text-sm truncate ${
                              chat.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                            }`}
                          >
                            {lastMessage?.content ? (
                              <>
                                {isOwnMessage && <span className="text-gray-400">You: </span>}
                                {truncateText(lastMessage.content, isOwnMessage ? 55 : 60)}
                              </>
                            ) : (
                              'No messages yet'
                            )}
                          </span>
                        )}
                        {isOwnMessage && (
                          <div className="flex-shrink-0">
                            {(() => {
                              const status = getMessageStatus(lastMessage)
                              // WhatsApp status icons
                              if (status === 'sending') {
                                return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
                              }
                              if (status === 'sent') {
                                return <Check className="w-3 h-3 text-gray-400" />
                              }
                              if (status === 'delivered') {
                                return <CheckCheck className="w-3 h-3 text-gray-400" />
                              }
                              if (status === 'read') {
                                return <CheckCheck className="w-3 h-3 text-blue-500" />
                              }
                              return null
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
