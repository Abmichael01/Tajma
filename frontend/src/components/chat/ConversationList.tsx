"use client"

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Check,
  CheckCheck,
  Clock,
  Pin,
  PinOff,
  BellOff,
  Bell,
  MailOpen,
  Archive,
  ArchiveRestore,
  Eraser,
  Trash2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { chatApi } from '@/api/chat'
import type { ChatSummary, ChatMessage, User, UserOnlineStatus } from '@/api/types'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { getMediaUrl } from '@/lib/utils'



interface ConversationListProps {
  conversations?: ChatSummary[]
  activeConversationId?: string
  onSelectConversation: (conversationId: string) => void
  currentUserId?: number
  onlineStatuses?: Record<number, UserOnlineStatus | undefined>
  isLoading?: boolean
  typingByChatId?: Record<string, boolean>
  /** Optional header right-action (e.g. "View archived" button). */
  headerRight?: React.ReactNode
  /** Optional override for header title. Defaults to "Messages". */
  headerTitle?: string
  /** Optional override for header subtitle. Defaults to the description. */
  headerSubtitle?: string
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

  const isRead = Boolean(message.is_read)
  const isDelivered = Boolean(message.delivered_at)

  if (isRead) return 'read'
  if (isDelivered) return 'delivered'

  return 'sent'
}

type ConfirmKind = 'clear' | 'delete' | null

export default function ConversationList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  currentUserId,
  onlineStatuses,
  isLoading,
  typingByChatId = {},
  headerRight,
  headerTitle,
  headerSubtitle,
}: ConversationListProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpenForChat, setMenuOpenForChat] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; chat: ChatSummary | null }>({
    kind: null,
    chat: null,
  })

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations
    return conversations.filter((chat) => {
      const participant = getOtherParticipant(chat, currentUserId)
      const name = getUserFullName(participant).toLowerCase()
      return name.includes(searchTerm.toLowerCase())
    })
  }, [conversations, searchTerm, currentUserId])

  const invalidateChats = () => {
    queryClient.invalidateQueries({ queryKey: ['chats'] })
  }

  const runAction = async (fn: () => Promise<void>, successMsg?: string) => {
    try {
      await fn()
      invalidateChats()
      if (successMsg) toast.success(successMsg)
    } catch (err) {
      console.warn('[ConversationList] action failed:', err)
      toast.error('Something went wrong. Please try again.')
    }
  }

  const onPinToggle = (chat: ChatSummary) => {
    runAction(
      () => (chat.is_pinned ? chatApi.unpinChat(chat.id) : chatApi.pinChat(chat.id)),
      chat.is_pinned ? 'Chat unpinned' : 'Chat pinned',
    )
  }
  const onMuteToggle = (chat: ChatSummary) => {
    runAction(
      () => chatApi.muteChat(chat.id, !chat.is_muted),
      chat.is_muted ? 'Notifications unmuted' : 'Notifications muted',
    )
  }
  const onMarkUnread = (chat: ChatSummary) => {
    runAction(() => chatApi.markChatUnread(chat.id), 'Marked as unread')
  }
  const onArchiveToggle = (chat: ChatSummary) => {
    runAction(
      () => (chat.is_archived ? chatApi.unarchiveChat(chat.id) : chatApi.archiveChat(chat.id)),
      chat.is_archived ? 'Chat unarchived' : 'Chat archived',
    )
  }
  const onClearConfirm = (chat: ChatSummary) => {
    runAction(async () => {
      await chatApi.clearChat(chat.id)
      queryClient.removeQueries({ queryKey: ['messages', chat.id] })
      queryClient.removeQueries({ queryKey: ['chats', chat.id] })
    }, 'Chat cleared')
  }
  const onDeleteConfirm = (chat: ChatSummary) => {
    runAction(() => chatApi.hideChat(chat.id), 'Chat deleted')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{headerTitle ?? 'Messages'}</h1>
          <p className="text-sm text-gray-600">
            {headerSubtitle ?? 'Chat with sellers and buyers'}
          </p>
        </div>
        {headerRight}
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
              const isPinned = !!chat.is_pinned
              const isMuted = !!chat.is_muted

              return (
                <DropdownMenu
                  key={chat.id}
                  open={menuOpenForChat === chat.id}
                  onOpenChange={(open) => {
                    if (!open) setMenuOpenForChat(null)
                  }}
                  modal={false}
                >
                  <DropdownMenuTrigger asChild>
                    <div
                      onClick={() => onSelectConversation(chat.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setMenuOpenForChat(chat.id)
                      }}
                      className={`p-3 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-gray-100'
                          : isPinned
                            ? 'bg-amber-50/40 hover:bg-amber-50/70'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="relative flex-shrink-0 w-11 h-11">
                          {chat.ad_image ? (
                            <Image
                              src={getMediaUrl(chat.ad_image)}
                              alt={chat.ad_title || 'Ad image'}
                              width={44}
                              height={44}
                              className="w-11 h-11 object-cover rounded-lg"
                              unoptimized
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-gray-200 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}

                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-white z-10 font-medium">
                            <Avatar className="w-full h-full">
                              <AvatarImage
                                src={getMediaUrl(participant?.avatar)}
                                alt={participant ? getUserFullName(participant) : 'Participant'}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-bold">
                                {participant ? getUserInitials(participant) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {participantStatus?.is_online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full z-20" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3
                                className={`text-sm truncate ${
                                  chat.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                                }`}
                              >
                                {participant ? getUserFullName(participant) : 'Unknown user'}
                              </h3>
                              {isPinned && (
                                <Pin className="w-3 h-3 text-slate-500 shrink-0" />
                              )}
                              {isMuted && (
                                <BellOff className="w-3 h-3 text-slate-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[11px] text-gray-400 font-normal">
                                {formatTime(lastMessage?.created_at || chat.last_message_at)}
                              </span>
                              {chat.unread_count > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-medium shrink-0">
                                  {chat.unread_count > 9 ? '9+' : chat.unread_count}
                                </span>
                              )}
                            </div>
                          </div>

                          {chat.ad_title && (
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[13px] font-bold text-gray-800 truncate">{truncateText(chat.ad_title, 40)}</span>
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
                                {(() => {
                                  if (!lastMessage) return 'No messages yet'

                                  let content = lastMessage.content
                                  if (lastMessage.message_type === 'image') content = '📷 Photo'
                                  else if (lastMessage.message_type === 'audio') content = '🎤 Voice Message'
                                  else if (!content) content = 'Sent a message'

                                  return (
                                    <>
                                      {isOwnMessage && <span className="text-gray-400">You: </span>}
                                      {truncateText(content, isOwnMessage ? 55 : 60)}
                                    </>
                                  )
                                })()}
                              </span>
                            )}
                            {isOwnMessage && (
                              <div className="flex-shrink-0">
                                {(() => {
                                  const status = getMessageStatus(lastMessage)
                                  if (status === 'sending') return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
                                  if (status === 'sent') return <Check className="w-3 h-3 text-gray-400" />
                                  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-400" />
                                  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-500" />
                                  return null
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem onClick={() => onPinToggle(chat)}>
                      {isPinned ? (
                        <>
                          <PinOff className="w-4 h-4 mr-2" /> Unpin chat
                        </>
                      ) : (
                        <>
                          <Pin className="w-4 h-4 mr-2" /> Pin chat
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMuteToggle(chat)}>
                      {isMuted ? (
                        <>
                          <Bell className="w-4 h-4 mr-2" /> Unmute
                        </>
                      ) : (
                        <>
                          <BellOff className="w-4 h-4 mr-2" /> Mute notifications
                        </>
                      )}
                    </DropdownMenuItem>
                    {chat.unread_count === 0 && (
                      <DropdownMenuItem onClick={() => onMarkUnread(chat)}>
                        <MailOpen className="w-4 h-4 mr-2" /> Mark as unread
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onArchiveToggle(chat)}>
                      {chat.is_archived ? (
                        <>
                          <ArchiveRestore className="w-4 h-4 mr-2" /> Unarchive
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 mr-2" /> Archive
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirm({ kind: 'clear', chat })}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Eraser className="w-4 h-4 mr-2" /> Clear chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setConfirm({ kind: 'delete', chat })}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirm dialogs for destructive actions. */}
      <AlertDialog
        open={confirm.kind !== null}
        onOpenChange={(open) => !open && setConfirm({ kind: null, chat: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm.kind === 'clear' ? 'Clear chat' : 'Delete chat'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm.kind === 'clear'
                ? 'Hide all messages in this chat from your view. The other person will still see them.'
                : 'Hide this chat from your list. The other person can still message you — the chat will reappear if they do.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (!confirm.chat) return
                if (confirm.kind === 'clear') onClearConfirm(confirm.chat)
                else if (confirm.kind === 'delete') onDeleteConfirm(confirm.chat)
                setConfirm({ kind: null, chat: null })
              }}
            >
              {confirm.kind === 'clear' ? 'Clear' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
