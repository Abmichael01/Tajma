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

export default function MessageBubble({ message, isOwn, participant, currentUserAvatar, currentUser, onRetry }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const getMessageStatus = (): 'sending' | 'sent' | 'delivered' | 'read' | 'failed' => {
    // WhatsApp flow: sending → sent → delivered → read → failed (if error)
    
    // Check if message failed to send
    if (message.send_failed) {
      return 'failed'
    }
    
    // State 1: Sending (optimistic, not yet saved to DB)
    const isOptimistic = typeof message.id === 'string' && message.id.startsWith('temp-')
    if (isOptimistic) return 'sending'
    
    // Once message has a real ID (not temp), it means it was created/sent
    // So we show "sent" immediately, regardless of delivered_at
    // State 2: Sent (message saved to DB) - this happens as soon as message is created
    
    // State 3: Delivered (when recipient receives it) - only update if delivered_at exists
    // State 4: Read (when recipient views it) - only update if is_read is true
    
    const isRead = Boolean(message.is_read)
    const isDelivered = Boolean(message.delivered_at)
    
    // Check read status first (highest priority)
    if (isRead) {
      return 'read' // State 4: Read (double blue checks)
    }
    
    // Then check delivered (only if not read yet)
    if (isDelivered) {
      return 'delivered' // State 3: Delivered (double gray checks)
    }
    
    // Otherwise, message is sent (has real ID, created on server)
    return 'sent' // State 2: Sent (single gray check - message created on server)
  }

  const renderStatusIcon = () => {
    if (!isOwn) return null
    const status = getMessageStatus()
    
    // WhatsApp Status Flow:
    // 1. Sending: Clock icon (pulsing) - message being sent (optimistic, not yet created on server)
    if (status === 'sending') {
      return (
        <span title="Sending...">
          <Clock 
            className="w-3 h-3 text-gray-400 animate-pulse" 
          />
        </span>
      )
    }
    
    // 2. Sent: Single gray check - message saved to server, not yet delivered
    if (status === 'sent') {
      return (
        <span title="Sent">
          <Check 
            className="w-3 h-3 text-gray-400" 
          />
        </span>
      )
    }
    
    // 3. Delivered: Double gray checks - message delivered to recipient's device
    if (status === 'delivered') {
      return (
        <span title="Delivered">
          <CheckCheck 
            className="w-3 h-3 text-gray-400" 
          />
        </span>
      )
    }
    
    // 4. Read: Double blue checks - message read by recipient
    if (status === 'read') {
      return (
        <span title="Read">
          <CheckCheck 
            className="w-3 h-3 text-blue-500" 
          />
        </span>
      )
    }
    
    // 5. Failed: Error icon - message failed to send
    if (status === 'failed') {
      return (
        <span title="Failed to send. Tap to retry">
          <AlertCircle 
            className="w-3 h-3 text-red-500" 
          />
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
            className={`message-bubble px-4 py-2 rounded-2xl shadow-sm ${
              isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
            }`}
          >
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isOwn ? 'text-white' : 'text-gray-900'}`}>
              {message.content}
            </p>
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
