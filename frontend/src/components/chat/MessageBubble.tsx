"use client"

import React from 'react'
import { Check, CheckCheck, AlertCircle, Clock } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { ChatMessage, User } from '@/api/types'
import { getUserFullName, getUserInitials } from '@/utils/user'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  participant: User
  currentUserAvatar?: string | null
  currentUser?: User | null
  onRetry?: (message: ChatMessage) => void
}

import AudioPlayer from './AudioPlayer'

// Helper function to normalize image URLs
const normalizeMediaUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`
}

function MessageBubble({ message, isOwn, participant, currentUserAvatar, currentUser, onRetry }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const getMessageStatus = (): 'sending' | 'sent' | 'delivered' | 'read' | 'failed' => {
    if (message.send_failed) return 'failed'
    const isOptimistic = typeof message.id === 'string' && message.id.startsWith('temp-')
    if (isOptimistic) return 'sending'
    const isRead = Boolean(message.is_read)
    const isDelivered = Boolean(message.delivered_at)
    if (isRead) return 'read'
    if (isDelivered) return 'delivered'
    return 'sent'
  }

  const renderStatusIcon = () => {
    if (!isOwn) return null
    const status = getMessageStatus()

    if (status === 'sending') {
      return (
        <span title="Sending...">
          <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
        </span>
      )
    }

    if (status === 'sent') {
      return (
        <span title="Sent">
          <Check className="w-3 h-3 text-gray-400" />
        </span>
      )
    }

    if (status === 'delivered') {
      return (
        <span title="Delivered">
          <CheckCheck className="w-3 h-3 text-gray-400" />
        </span>
      )
    }

    if (status === 'read') {
      return (
        <span title="Read">
          <CheckCheck className="w-3 h-3 text-blue-500" />
        </span>
      )
    }

    if (status === 'failed') {
      return (
        <span title="Failed to send. Tap to retry">
          <AlertCircle className="w-3 h-3 text-red-500" />
        </span>
      )
    }

    return null
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group message-enter`}
      data-message-id={message.id}
    >
      <div className={`flex gap-2 max-w-xs lg:max-w-md flex-row`}>
        {!isOwn && (
          <div className="flex-shrink-0">
            <Avatar className="w-8 h-8">
              <AvatarImage src={participant.avatar || undefined} alt={getUserFullName(participant)} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {getUserInitials(participant)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <div
            className={`message-bubble overflow-hidden rounded-2xl shadow-sm ${isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
              } ${message.message_type !== 'text' ? 'p-1' : 'px-4 py-2'}`}
          >
            {message.message_type === 'image' && message.attachment && (
              <div className="relative aspect-square w-full min-w-[240px] rounded-lg overflow-hidden bg-gray-100 mb-1">
                <img
                  src={normalizeMediaUrl(message.attachment)}
                  alt="Shared image"
                  className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(normalizeMediaUrl(message.attachment), '_blank')}
                />
              </div>
            )}

            {message.message_type === 'audio' && message.attachment && (
              <div className="p-1 min-w-[280px]">
                <AudioPlayer uri={normalizeMediaUrl(message.attachment)} isOwn={isOwn} />
              </div>
            )}

            {(message.message_type === 'text' || (message.content && !['📷 Image', '🎤 Audio Message'].includes(message.content))) && (
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${message.message_type !== 'text' ? 'px-3 py-1' : ''} ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                {message.content}
              </p>
            )}
          </div>

          <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>

            {isOwn && (
              <div className="flex items-center">
                {renderStatusIcon()}
              </div>
            )}
          </div>

          {/* Retry button for failed messages */}
          {isOwn && getMessageStatus() === 'failed' && onRetry && (
            <div className="flex justify-end mt-1 px-2">
              <button
                onClick={() => onRetry(message)}
                className="text-xs text-red-500 hover:text-red-600 underline"
              >
                Tap to retry
              </button>
            </div>
          )}
        </div>

        {isOwn && (
          <div className="flex-shrink-0">
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentUserAvatar || undefined} alt="You" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {currentUser ? getUserInitials(currentUser) : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(MessageBubble)
