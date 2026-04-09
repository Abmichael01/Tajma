"use client"

import React from 'react'
import { 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Clock, 
  ChevronDown,
  Reply,
  Copy,
  CheckSquare,
  Trash2
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ChatMessage, User } from '@/api/types'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { getMediaUrl, copyToClipboard } from '@/lib/utils'
import AudioPlayer from './AudioPlayer'
import { toast } from 'sonner'
import Image from 'next/image'


interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  participant: User
  currentUserAvatar?: string | null
  currentUser?: User | null
  onRetry?: (message: ChatMessage) => void
  showTail?: boolean
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelection?: (id: string) => void
  onStartSelection?: (id: string) => void
  onReply?: (message: ChatMessage) => void
  onDelete?: (id: string) => void
}

// WhatsApp-style bubble tail as inline SVG with border support
const BubbleTail = ({ isOwn, color, borderColor }: { isOwn: boolean; color: string; borderColor: string }) => (
  <span
    className={`absolute top-0 ${isOwn ? '-right-[7px]' : '-left-[7px]'} block`}
    style={{ zIndex: 10, width: 11, height: 16 }}
  >
    <svg width="11" height="16" viewBox="0 0 11 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {isOwn ? (
        // Own (right side): stroke on top and outer curve
        <path 
          d="M0 0 L10 0 C10 0 10 3.5 10 3.5 C10 7.5 0 9 0 16" 
          fill={color}
        />
      ) : (
        // Other (left side): stroke on top and outer curve
        <path 
          d="M11 0 L1 0 C1 0 1 3.5 1 3.5 C1 7.5 11 9 11 16" 
          fill={color}
        />
      )}
      {/* Stroke layer - only outer edges */}
      {isOwn ? (
        <path 
          d="M0 0 L10 0 C10 0 10 3.5 10 3.5 C10 7.5 0 9" 
          stroke={borderColor} 
          strokeWidth="1"
          strokeLinecap="round"
        />
      ) : (
        <path 
          d="M11 0 L1 0 C1 0 1 3.5 1 3.5 C1 7.5 11 9" 
          stroke={borderColor} 
          strokeWidth="1"
          strokeLinecap="round"
        />
      )}
    </svg>
  </span>
)

function MessageBubble({ 
  message, 
  isOwn, 
  participant, 
  currentUserAvatar, 
  currentUser, 
  onRetry, 
  showTail = true,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  onStartSelection,
  onReply,
  onDelete
}: MessageBubbleProps) {
  const [imageError, setImageError] = React.useState(false)
  const [imageLoading, setImageLoading] = React.useState(true)

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })


  const getMessageStatus = (): 'sending' | 'sent' | 'delivered' | 'read' | 'failed' => {
    if (message.send_failed) return 'failed'
    const isOptimistic = typeof message.id === 'string' && message.id.startsWith('temp-')
    if (isOptimistic) return 'sending'
    if (message.is_read) return 'read'
    if (message.delivered_at) return 'delivered'
    return 'sent'
  }

  const renderStatus = () => {
    if (!isOwn) return null
    const s = getMessageStatus()
    const cls = 'w-3.5 h-3.5'
    if (s === 'sending') return <Clock className={`${cls} text-white/50 animate-pulse`} />
    if (s === 'sent') return <Check className={`${cls} text-white/50`} />
    if (s === 'delivered') return <CheckCheck className={`${cls} text-white/50`} />
    if (s === 'read') return <CheckCheck className={`${cls} text-sky-300`} />
    if (s === 'failed') return <AlertCircle className={`${cls} text-red-400`} />
    return null
  }

  const attachmentUrl = getMediaUrl(message.attachment ?? undefined) ?? ''

  // — Bubble colours — matching mobile: dark for own, white for other
  const bubbleBg = isOwn ? '#2D2D2D' : '#FFFFFF'
  const bubbleBorder = isOwn ? '' : 'border border-gray-100'

  const handleCopy = async () => {
    if (!message.content) return
    const success = await copyToClipboard(message.content)
    if (success) {
      toast.success('Copied to clipboard')
    } else {
      toast.error('Failed to copy text')
    }
  }

  return (
    <div
      className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} mb-0.5 relative transition-colors ${
        isSelectionMode ? 'cursor-pointer hover:bg-black/5' : ''
      } ${isSelected ? 'bg-primary/10' : ''}`}
      data-message-id={message.id}
      onClick={() => isSelectionMode && onToggleSelection?.(String(message.id))}
    >
      <div className={`flex items-end max-w-[85%] sm:max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} group/inner relative`}>
        {/* WhatsApp-style Context Menu Arrow */}
        {!isSelectionMode && (
          <div 
            className="absolute top-1 right-2 opacity-0 group-hover/inner:opacity-100 transition-opacity z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="p-1 rounded-full bg-black/10 hover:bg-black/20 text-white cursor-pointer transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-40 shadow-xl border border-gray-200">
                <DropdownMenuItem className="cursor-pointer" onClick={() => onReply?.(message)}>
                  <Reply className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Reply</span>
                </DropdownMenuItem>
                {message.content && !['📷 Photo', '📷 Image', '🎤 Voice Message', '🎤 Audio Message'].includes(message.content) && (
                  <DropdownMenuItem className="cursor-pointer" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Copy</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer" onClick={() => onStartSelection?.(String(message.id))}>
                  <CheckSquare className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Select</span>
                </DropdownMenuItem>
                {/* Delete Option - Only for own messages */}
                {isOwn && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    onClick={() => onDelete?.(String(message.id))}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-3' : 'left-3'}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
            }`}>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
          </div>
        )}


        <div className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Bubble */}
          <div className="relative">
            {showTail && (
              <BubbleTail 
                isOwn={isOwn} 
                color={bubbleBg} 
                borderColor={isOwn ? '#374151' : '#F3F4F6'} 
              />
            )}

            <div
              className={`relative rounded-[18px] overflow-hidden px-3 py-1.5 ${
                isOwn
                  ? 'border border-gray-700'
                  : 'border border-gray-100'
              } ${
                showTail 
                  ? (isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm') 
                  : ''
              }`}
              style={{ backgroundColor: bubbleBg, minWidth: 80 }}
            >
              {/* ── Reply quote block ─────────────────────────────────── */}
              {message.parent_message && (
                <div
                  className={`mb-1.5 px-2 py-1 rounded-lg border-l-4 ${
                    isOwn
                      ? 'bg-white/10 border-white/40'
                      : 'bg-gray-50 border-primary'
                  }`}
                >
                  <p className={`text-[11px] font-bold mb-0.5 leading-none ${isOwn ? 'text-white' : 'text-primary'}`}>
                    {message.parent_message.sender?.id === currentUser?.id
                      ? 'You'
                      : getUserFullName(participant)}
                  </p>
                  <p className={`text-[12px] leading-tight line-clamp-2 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                    {message.parent_message.message_type === 'image'
                      ? '📷 Photo'
                      : message.parent_message.message_type === 'audio'
                      ? '🎤 Voice Message'
                      : message.parent_message.content}
                  </p>
                </div>
              )}

              {/* ── Image ────────────────────────────────────────────── */}
              {message.message_type === 'image' && message.attachment && (
                <div className="relative rounded-xl overflow-hidden mb-1 max-w-[260px] bg-gray-100">
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {imageError ? (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 text-gray-400 aspect-video">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-[10px] text-center">Failed to load image</span>
                    </div>
                  ) : (
                    <Image
                      src={attachmentUrl}
                      alt="Shared image"
                      width={400}
                      height={300}
                      className={`block w-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${
                        imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                      }`}
                      style={{ maxHeight: 320 }}
                      onClick={() => window.open(attachmentUrl, '_blank')}
                      unoptimized
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageError(true)
                        setImageLoading(false)
                      }}
                    />
                  )}
                </div>
              )}


              {/* ── Audio ────────────────────────────────────────────── */}
              {message.message_type === 'audio' && message.attachment && (
                <AudioPlayer uri={attachmentUrl} isOwn={isOwn} id={String(message.id)} />
              )}


              {/* ── Text ─────────────────────────────────────────────── */}
              {(message.message_type === 'text' ||
                (message.content &&
                  !['📷 Image', '🎤 Audio Message'].includes(message.content))) && (
                <p
                  className={`text-[15px] leading-[22px] whitespace-pre-wrap ${
                    message.message_type !== 'text' ? 'mt-1 px-1' : ''
                  } ${isOwn ? 'text-white' : 'text-gray-900'}`}
                >
                  {message.content}
                  {/* Ghost spacer so timestamp never covers text */}
                  <span className="invisible ml-2 text-[11px]">{formatTime(message.created_at)} {isOwn ? '✓✓' : ''}</span>
                </p>
              )}

              {/* ── Timestamp + status ────────────────────────────────── */}
              <div className={`flex items-center gap-1 justify-end -mt-1.5 mb-1 ${
                message.message_type === 'audio' ? 'px-1' : ''
              }`}>
                <span className={`text-[10px] leading-none ${isOwn ? 'text-white/50' : 'text-gray-400'}`}>
                  {formatTime(message.created_at)}
                </span>

                {isOwn && renderStatus()}
              </div>
            </div>
          </div>

          {/* Retry */}
          {isOwn && getMessageStatus() === 'failed' && onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="text-[10px] text-red-500 hover:text-red-600 underline px-1"
            >
              Tap to retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(MessageBubble)
