"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Conversation, Message } from '@/data/mockChat'
import MessageBubble from './MessageBubble'
import { useAuthStore } from '@/store/authStore'
import { Send, Image as ImageIcon, Smile, MoreVertical, Phone, Video } from 'lucide-react'

interface ChatAreaProps {
  conversation: Conversation | null
  messages: Message[]
  onSendMessage: (content: string, type?: 'text' | 'image') => void
  onBack?: () => void
}

export default function ChatArea({ 
  conversation, 
  messages, 
  onSendMessage, 
  onBack 
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload the image and get a URL
      // For now, we'll just simulate sending an image
      onSendMessage('', 'image')
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
          <p className="text-gray-600 mb-4">
            Your messages will appear here. Start chatting with sellers or buyers about products.
          </p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  const participant = conversation.participants[0]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back button for mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 hover:bg-gray-100 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
                    
          {/* User Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <Image
                src={participant.avatar || '/default-avatar.png'}
                alt={participant.name}
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover"
              />
              {participant.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white"></div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 text-sm truncate">{participant.name}</h2>
              <p className="text-xs text-gray-500 truncate">
                {participant.isOnline ? 'Online' : participant.lastSeen || 'Offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button className="p-2 hover:bg-gray-100 hidden sm:block">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 hidden sm:block">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100">
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Product Info Bar */}
      {conversation.productTitle && (
        <div className="p-2 sm:p-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 overflow-hidden flex-shrink-0">
              <Image
                src={conversation.productImage || '/default-product.png'}
                alt={conversation.productTitle}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                {conversation.productTitle}
              </h3>
              <p className="text-sm sm:text-lg font-bold text-primary">{conversation.productPrice}</p>
            </div>
            <button className="text-xs text-secondary hover:text-secondary/80 font-medium flex-shrink-0">
              View
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 custom-scrollbar">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === 'current'}
            participant={participant}
            currentUserAvatar={user?.avatar}
          />
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <Image
              src={participant.avatar || '/default-avatar.png'}
              alt={participant.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-2 sm:p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-3">
          {/* Attachment Button - Hidden on small mobile */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 transition-colors hidden xs:block"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          
          {/* Emoji Button - Hidden on small mobile */}
          <button
            type="button"
            className="p-2 hover:bg-gray-100 transition-colors hidden xs:block"
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="w-full resize-none border border-gray-200 px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 sm:p-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
