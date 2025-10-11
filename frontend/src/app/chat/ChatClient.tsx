"use client"

import React, { useState } from 'react'
import ConversationList from '@/components/chat/ConversationList'
import ChatArea from '@/components/chat/ChatArea'
import { mockConversations, mockMessages } from '@/data/mockChat'
import { useNavbarHeight } from '@/hooks/useNavbarHeight'

export default function ChatClient() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const navbarHeight = useNavbarHeight()

  const activeConversation = activeConversationId 
    ? mockConversations.find(c => c.id === activeConversationId) 
    : null

  const activeMessages = activeConversationId 
    ? mockMessages[activeConversationId] || []
    : []

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setShowMobileChat(true)
  }

  const handleSendMessage = (content: string, type: 'text' | 'image' = 'text') => {
    if (!activeConversationId) return

    // In a real app, this would send the message to the server
    console.log('Sending message:', { content, type, conversationId: activeConversationId })
    
    // For demo purposes, we'll just log the message
    // In a real app, you would update the messages state with the new message
  }

  const handleBack = () => {
    setShowMobileChat(false)
  }

  return (
    <div 
      className="bg-white sticky container px-0"
      style={{ 
        height: `calc(100vh - ${navbarHeight}px)`,
        top: `${navbarHeight}px`
      }}
    >
      <div className="h-full flex border-x border-gray-200">
        {/* Conversation List - Full screen on mobile when no chat selected */}
        <div className={`${showMobileChat ? 'hidden' : 'w-full'} md:flex md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col`}>
          <ConversationList
            conversations={mockConversations}
            activeConversationId={activeConversationId || undefined}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Chat Area - Full screen on mobile when chat selected */}
        <div className={`${showMobileChat ? 'w-full' : 'hidden'} md:flex md:flex-1 flex-col`}>
          <ChatArea
            conversation={activeConversation || null}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  )
}
