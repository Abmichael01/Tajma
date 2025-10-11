"use client"

import React from 'react'
import Image from 'next/image'
import { Message, ChatUser } from '@/data/mockChat'
import { Check, CheckCheck } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  participant: ChatUser
  currentUserAvatar?: string
}

export default function MessageBubble({ message, isOwn, participant, currentUserAvatar }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            <Image
              src={message.imageUrl || message.content}
              alt="Shared image"
              width={200}
              height={200}
              className="rounded-lg object-cover max-w-xs"
            />
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              📷 Photo
            </div>
          </div>
        )
      case 'product':
        return (
          <div className="bg-white p-3 rounded-lg border border-gray-200 max-w-xs">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={message.imageUrl || '/default-product.png'}
                  alt="Product"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {message.content}
                </h4>
                <p className="text-xs text-gray-600 mt-1">View Product</p>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isOwn ? 'text-white' : 'text-gray-900'
          }`}>
            {message.content}
          </p>
        )
    }
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group message-enter`}>
      <div className={`flex gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar for other person's messages */}
        {!isOwn && (
          <div className="flex-shrink-0">
            <Image
              src={participant.avatar || '/default-avatar.png'}
              alt={participant.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        )}

        {/* Message Bubble */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <div
            className={`message-bubble px-4 py-2 rounded-2xl shadow-sm ${
              isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
            }`}
          >
            {renderMessageContent()}
          </div>

          {/* Message Meta */}
          <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-gray-400">
              {formatTime(message.timestamp)}
            </span>
            
            {/* Read status for own messages */}
            {isOwn && (
              <div className="flex items-center">
                {message.isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                  <Check className="w-3 h-3 text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Avatar for own messages */}
        {isOwn && (
          <div className="flex-shrink-0">
            <Image
              src={currentUserAvatar || '/default-avatar.png'}
              alt="You"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  )
}
