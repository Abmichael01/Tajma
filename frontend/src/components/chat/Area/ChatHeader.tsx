"use client"

import React from 'react'
import { MoreVertical, X } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { getMediaUrl } from '@/lib/utils'
import type { User, UserOnlineStatus } from '@/api/types'


interface ChatHeaderProps {
  participant: User
  participantStatus?: UserOnlineStatus
  isParticipantTyping: boolean
  isConnected?: boolean
  isSelectionMode: boolean
  selectedCount: number
  onBack?: () => void
  onToggleSelectionMode: (enabled: boolean) => void
  onCancelSelection: () => void
  participantStatusText: string
}

export default function ChatHeader({
  participant,
  participantStatus,
  isParticipantTyping,
  isConnected,
  isSelectionMode,
  selectedCount,
  onBack,
  onToggleSelectionMode,
  onCancelSelection,
  participantStatusText,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white z-20">
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
              <AvatarImage src={getMediaUrl(participant.avatar)} alt={getUserFullName(participant)} />
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
                    <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot animate-bounce" />
                    <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-gray-500 rounded-full typing-dot animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span className="italic">typing...</span>
                </span>
              ) : (
                participantStatusText
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {isSelectionMode ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{selectedCount} selected</span>
            <button 
              onClick={onCancelSelection}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
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
            <div className="relative group">
              <button 
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                onClick={() => onToggleSelectionMode(true)}
                title="Select Messages"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
