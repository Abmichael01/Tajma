"use client"

import React from 'react'
import type { ChatMessage, ChatSummary, User } from '@/api/types'
import MessageBubble from '../MessageBubble'
import DateBubble from '../DateBubble'

interface MessageListProps {
  messages: any[] // ChatListItem[]
  user: User | null
  participant: User
  isSelectionMode: boolean
  selectedMessageIds: Set<string>
  onToggleSelection: (id: string) => void
  onStartSelection: (id: string) => void
  handleReply: (message: ChatMessage) => void
  onDeleteMessages?: (messageIds: string[]) => void
  onRetryMessage?: (message: ChatMessage) => void
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isParticipantTyping: boolean
  isLoadingMessages: boolean
}

export default function MessageList({
  messages,
  user,
  participant,
  isSelectionMode,
  selectedMessageIds,
  onToggleSelection,
  onStartSelection,
  handleReply,
  onDeleteMessages,
  onRetryMessage,
  messagesContainerRef,
  messagesEndRef,
  isParticipantTyping,
  isLoadingMessages,
}: MessageListProps) {
  return (
    <div className="flex-1 relative overflow-hidden bg-[#F2F2F2]">
      {/* Repeating Background Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.10]"
        style={{ 
          backgroundImage: 'url("/chat_bg.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: '400px',
        }}
      />

      <div 
        ref={messagesContainerRef}
        className="h-full overflow-y-auto overflow-x-hidden scroll-smooth relative z-10 scrollbar-hide px-2 sm:px-4 py-4"
      >
        {isLoadingMessages && !messages.length ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-1 min-h-full justify-end">
            {(() => {
              const groups: { date: string; items: ChatMessage[] }[] = []
              let currentGroup: { date: string; items: ChatMessage[] } | null = null

              messages.forEach((item) => {
                if ('type' in item && item.type === 'date') {
                  currentGroup = { date: item.date, items: [] }
                  groups.push(currentGroup)
                } else if (currentGroup) {
                  currentGroup.items.push(item as ChatMessage)
                }
              })

              return groups.map((group) => (
                <div key={group.date} className="relative">
                  <DateBubble date={group.date} />
                  <div className="flex flex-col gap-1">
                    {group.items.map((msg, index) => {
                      const isOwn = String(msg.sender?.id) === String(user?.id)
                      
                      const prevMsg = index > 0 ? group.items[index - 1] : null
                      const showTail = !prevMsg || String(prevMsg.sender?.id) !== String(msg.sender?.id)

                      return (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isOwn={isOwn}
                          participant={participant}
                          currentUser={user}
                          showTail={showTail}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedMessageIds.has(String(msg.id))}
                          onToggleSelection={onToggleSelection}
                          onStartSelection={onStartSelection}
                          onReply={handleReply}
                          onDelete={(id) => onDeleteMessages?.([id])}
                          onRetry={onRetryMessage}
                        />
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {isParticipantTyping && (
        <div className="flex items-center gap-2 py-2 animate-fade-in pl-1">
          <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm">
            <p className="text-gray-500 text-[14px] italic leading-none">typing...</p>
          </div>
        </div>
      )}
    </div>
  )
}
