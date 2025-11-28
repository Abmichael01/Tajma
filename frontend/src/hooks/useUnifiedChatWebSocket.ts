"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { ChatMessage, ChatSummary } from '@/api/types'

const DEFAULT_API_URL = 'http://localhost:8000'

interface ChatEventPayload {
  type: 'chat_event'
  chat_id: string
  chat?: ChatSummary
  message?: ChatMessage
}

interface UseUnifiedChatWebSocketOptions {
  enabled?: boolean
  activeChatIds?: string[] // Chats to subscribe to
  onChatMessage?: (message: ChatMessage, chatId: string) => void
  onChatListUpdate?: (payload: ChatEventPayload) => void
  onTyping?: (payload: { userId: number; typing: boolean; chatId: string }) => void
  onMessageStatusUpdate?: (message: ChatMessage, chatId: string) => void
  onMarkedRead?: (chatId: string, count: number) => void
}

interface UseUnifiedChatWebSocketResult {
  isConnected: boolean
  subscribedChats: Set<string>
  sendMessage: (chatId: string, content: string) => boolean // Returns true if sent, false if failed
  sendTyping: (chatId: string, typing: boolean) => void
  markAsRead: (chatId: string) => void
  subscribeToChat: (chatId: string) => void
  unsubscribeFromChat: (chatId: string) => void
}

export const useUnifiedChatWebSocket = ({
  enabled = true,
  activeChatIds = [],
    onChatMessage,
    onChatListUpdate,
    onTyping,
    onMessageStatusUpdate,
    onMarkedRead,
}: UseUnifiedChatWebSocketOptions): UseUnifiedChatWebSocketResult => {
  const { isAuthenticated } = useAuthStore()
  const wsRef = useRef<WebSocket | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPongRef = useRef<number>(Date.now())
  const connectionHealthCheckRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  // No max reconnect attempts - keep trying indefinitely (like WhatsApp)
  const [isConnected, setIsConnected] = useState(false)
  const subscribedChatsRef = useRef<Set<string>>(new Set())
  const pendingSubscriptionsRef = useRef<Set<string>>(new Set()) // Track pending subscriptions
  const pendingMessagesRef = useRef<Map<string, string[]>>(new Map()) // Queue messages for pending subscriptions

  const shouldConnect = useMemo(() => enabled && isAuthenticated, [enabled, isAuthenticated])

  // Build WebSocket URL
  const buildUrl = useCallback(() => {
    const base =
      process.env.NEXT_PUBLIC_WS_URL ||
      (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/^https?/, (match) => match === 'https' ? 'wss' : 'ws')
    return `${base.replace(/\/$/, '')}/ws/chat/`
  }, [])

  // Subscribe to a chat
  const subscribeToChat = useCallback((chatId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot subscribe to chat:', chatId)
      return
    }

    if (subscribedChatsRef.current.has(chatId)) {
      return // Already subscribed
    }

    // Don't subscribe again if already pending
    if (pendingSubscriptionsRef.current.has(chatId)) {
      return
    }

    try {
      pendingSubscriptionsRef.current.add(chatId)
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          chat_id: chatId,
        })
      )
      console.log('Subscribing to chat:', chatId)
    } catch (error) {
      console.error('Failed to subscribe to chat:', error)
      pendingSubscriptionsRef.current.delete(chatId)
    }
  }, [])

  // Unsubscribe from a chat
  const unsubscribeFromChat = useCallback((chatId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    if (!subscribedChatsRef.current.has(chatId)) {
      return // Not subscribed
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          type: 'unsubscribe',
          chat_id: chatId,
        })
      )
      subscribedChatsRef.current.delete(chatId)
      console.log('Unsubscribed from chat:', chatId)
    } catch (error) {
      console.error('Failed to unsubscribe from chat:', error)
    }
  }, [])

  // Send message
  const sendMessage = useCallback(
    (chatId: string, content: string): boolean => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, cannot send message')
        return false
      }

      // If not subscribed, subscribe first and queue the message
      if (!subscribedChatsRef.current.has(chatId) && !pendingSubscriptionsRef.current.has(chatId)) {
        console.log('Not subscribed to chat, subscribing first:', chatId)
        subscribeToChat(chatId)
        
        // Queue the message to send after subscription
        if (!pendingMessagesRef.current.has(chatId)) {
          pendingMessagesRef.current.set(chatId, [])
        }
        pendingMessagesRef.current.get(chatId)!.push(content)
        return true // Return true as message is queued
      }

      // If subscription is pending, queue the message
      if (pendingSubscriptionsRef.current.has(chatId)) {
        console.log('Subscription pending for chat, queuing message:', chatId)
        if (!pendingMessagesRef.current.has(chatId)) {
          pendingMessagesRef.current.set(chatId, [])
        }
        pendingMessagesRef.current.get(chatId)!.push(content)
        return true // Return true as message is queued
      }

      // Send message immediately if subscribed
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'message',
            chat_id: chatId,
            content,
          })
        )
        return true
      } catch (error) {
        console.error('Failed to send message:', error)
        return false
      }
    },
    [subscribeToChat]
  )
  
  // Send queued messages after subscription (directly, without re-queuing)
  const sendQueuedMessages = useCallback((chatId: string) => {
    const queuedMessages = pendingMessagesRef.current.get(chatId)
    if (queuedMessages && queuedMessages.length > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`Sending ${queuedMessages.length} queued messages for chat ${chatId}`)
      queuedMessages.forEach((content) => {
        try {
          wsRef.current!.send(
            JSON.stringify({
              type: 'message',
              chat_id: chatId,
              content,
            })
          )
        } catch (error) {
          console.error('Failed to send queued message:', error)
        }
      })
      pendingMessagesRef.current.delete(chatId)
    }
  }, [])

  // Send typing indicator
  const sendTyping = useCallback(
    (chatId: string, typing: boolean) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return
      }

      if (!subscribedChatsRef.current.has(chatId)) {
        return // Must be subscribed first
      }

      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'typing',
            chat_id: chatId,
            typing,
          })
        )
      } catch (error) {
        console.error('Failed to send typing indicator:', error)
      }
    },
    []
  )

  // Mark chat as read (via WebSocket - like WhatsApp/Telegram)
  const markAsRead = useCallback(
    (chatId: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, cannot mark as read')
        return
      }

      if (!subscribedChatsRef.current.has(chatId)) {
        console.warn('Not subscribed to chat, subscribing first:', chatId)
        subscribeToChat(chatId)
        // Queue the mark_read request
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && subscribedChatsRef.current.has(chatId)) {
            try {
              wsRef.current.send(
                JSON.stringify({
                  type: 'mark_read',
                  chat_id: chatId,
                })
              )
            } catch (error) {
              console.error('Failed to mark as read:', error)
            }
          }
        }, 200)
        return
      }

      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'mark_read',
            chat_id: chatId,
          })
        )
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    },
    [subscribeToChat]
  )

  // Handle WebSocket connection
  useEffect(() => {
    if (!shouldConnect) {
      return
    }

    const connect = () => {
      const socket = new WebSocket(buildUrl())
      wsRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0

        // Mark all unread messages as delivered when user comes online
        // This simulates WhatsApp behavior where messages are delivered when user is online
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            console.log('📤 User came online, marking all messages as delivered')
            wsRef.current.send(JSON.stringify({ 
              type: 'mark_all_delivered'
            }))
          } catch (error) {
            console.error('Failed to mark all messages as delivered:', error)
          }
        }

        // Heartbeat mechanism (like WhatsApp/Telegram)
        // Send ping every 20 seconds to keep connection alive
        // This prevents timeouts from proxies, firewalls, and idle connections
        lastPongRef.current = Date.now()
        
        const sendPing = () => {
          // Only send ping if tab is visible (save resources when hidden)
          if (document.visibilityState === 'hidden') {
            console.log('⏸️ Tab hidden, skipping client ping')
            return
          }
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
              console.log('📤 Sending client ping')
              wsRef.current.send(JSON.stringify({ type: 'ping' }))
              // Update last pong time when we send ping (server will respond)
              // This helps track connection health
            } catch (error) {
              console.error('Failed to send ping:', error)
              // If ping fails, connection might be dead, trigger reconnection
              if (wsRef.current) {
                wsRef.current.close()
              }
            }
          } else {
            // Connection not open, clear interval
            console.warn('⚠️ WebSocket not open, clearing ping interval')
            if (pingIntervalRef.current) {
              clearInterval(pingIntervalRef.current)
              pingIntervalRef.current = null
            }
          }
        }
        
        pingIntervalRef.current = setInterval(sendPing, 20_000) // 20 seconds - matches WhatsApp/Telegram frequency
        
        // Connection health check - only reconnect if connection is actually dead
        // Don't close on ping failures - user might have tab in background
        // WhatsApp keeps connections alive indefinitely - only reconnect on actual errors
        connectionHealthCheckRef.current = setInterval(() => {
          // Only check if connection is still open
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const timeSinceLastPong = Date.now() - lastPongRef.current
            // Only reconnect if no pong received in 5 minutes (connection is actually dead)
            // This accounts for browser throttling, tab switching, etc.
            if (timeSinceLastPong > 300_000) { // 5 minutes
              console.warn('No pong received in 5 minutes, connection may be dead - reconnecting...')
              wsRef.current.close() // This will trigger automatic reconnection
            }
          }
        }, 60_000) // Check every 60 seconds

        // Subscribe to active chats after connection
        activeChatIds.forEach((chatId) => {
          subscribeToChat(chatId)
        })
      }

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)

          switch (payload.type) {
            case 'connection':
              console.log('Unified chat WebSocket connected')
              break

            case 'pong':
              // Heartbeat response - connection is alive
              // Update last pong timestamp to track connection health
              console.log('✅ Received pong from server')
              lastPongRef.current = Date.now()
              break

            case 'ping':
              // Server ping - respond with pong immediately
              console.log('🏓 Received server ping, responding with pong')
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                try {
                  wsRef.current.send(JSON.stringify({ type: 'pong' }))
                  lastPongRef.current = Date.now()
                  console.log('✅ Sent pong response to server')
                } catch (error) {
                  console.error('Failed to respond to server ping:', error)
                }
              } else {
                console.warn('⚠️ WebSocket not open, cannot respond to server ping')
              }
              break

            case 'subscribed':
              const subscribedChatId = payload.chat_id
              subscribedChatsRef.current.add(subscribedChatId)
              pendingSubscriptionsRef.current.delete(subscribedChatId)
              console.log('Successfully subscribed to chat:', subscribedChatId)
              // Send any queued messages for this chat
              sendQueuedMessages(subscribedChatId)
              break

            case 'unsubscribed':
              subscribedChatsRef.current.delete(payload.chat_id)
              console.log('Successfully unsubscribed from chat:', payload.chat_id)
              break

            case 'message':
              if (payload.message && payload.chat_id) {
                onChatMessage?.(payload.message, payload.chat_id)
              }
              break

            case 'chat_event':
              if (payload.type === 'chat_event') {
                onChatListUpdate?.(payload)
              }
              break

            case 'typing':
              if (payload.user_id !== undefined && payload.chat_id) {
                onTyping?.({
                  userId: payload.user_id,
                  typing: payload.typing,
                  chatId: payload.chat_id,
                })
              }
              break

            case 'message_status_update':
              if (payload.message && payload.chat_id) {
                onMessageStatusUpdate?.(payload.message, payload.chat_id)
              }
              break

            case 'marked_read':
              console.log(`Marked ${payload.count || 0} messages as read in chat ${payload.chat_id}`)
              onMarkedRead?.(payload.chat_id, payload.count || 0)
              break

            case 'all_messages_delivered':
              // All messages were marked as delivered when user came online
              // The backend will broadcast message_status_update and chat_event for each affected chat
              console.log(`All ${payload.count || 0} messages marked as delivered - backend will broadcast updates`)
              break

            case 'error':
              console.error('WebSocket error:', payload.message)
              break

            default:
              console.warn('Unknown WebSocket message type:', payload.type)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      socket.onclose = (event) => {
        setIsConnected(false)
        subscribedChatsRef.current.clear()
        pendingSubscriptionsRef.current.clear()
        pendingMessagesRef.current.clear()

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        
        if (connectionHealthCheckRef.current) {
          clearInterval(connectionHealthCheckRef.current)
          connectionHealthCheckRef.current = null
        }

        // Handle authentication errors
        if (event.code === 4001 || event.code === 403) {
          console.warn('Unified chat WebSocket closed due to auth error, logging out')
          reconnectAttemptsRef.current = 0
          import('@/store/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().logout()
            if (typeof window !== 'undefined') {
              // Only redirect to login if current page requires authentication
              // For public pages (like home), just log out silently
              const currentPath = window.location.pathname
              const authRequiredPaths = ['/create-ad', '/profile', '/alerts', '/chat']
              const requiresAuth = authRequiredPaths.some(path => currentPath.startsWith(path))
              
              if (requiresAuth) {
                window.location.href = '/login'
              }
              // Otherwise, just log out silently - user can continue browsing public pages
            }
          })
          return
        }

        // Don't reconnect if it was a clean close (user logged out, etc.)
        if (event.wasClean && event.code === 1000) {
          reconnectAttemptsRef.current = 0
          return
        }

        // Automatic reconnection (like WhatsApp - always reconnect)
        // Use exponential backoff but keep trying indefinitely
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++

        console.log(
          `🔄 Reconnecting unified chat WebSocket in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
        )

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }

      socket.onerror = (event) => {
        console.error('Unified chat WebSocket error:', event)
        socket.close()
      }
    }

    connect()

    // Handle visibility change (pause/resume heartbeat when tab hidden/visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wsRef.current?.readyState === WebSocket.OPEN) {
        // Tab became visible, send immediate ping to check connection
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }))
          lastPongRef.current = Date.now()
        } catch (error) {
          console.error('Failed to send ping on visibility change:', error)
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
      
      if (connectionHealthCheckRef.current) {
        clearInterval(connectionHealthCheckRef.current)
        connectionHealthCheckRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [shouldConnect, buildUrl, subscribeToChat])

  // Subscribe/unsubscribe when activeChatIds change
  useEffect(() => {
    if (!isConnected || !wsRef.current) {
      return
    }

    const currentSubscribed = subscribedChatsRef.current
    const targetChats = new Set(activeChatIds)

    // Subscribe to new chats
    activeChatIds.forEach((chatId) => {
      if (!currentSubscribed.has(chatId)) {
        subscribeToChat(chatId)
      }
    })

    // Unsubscribe from chats no longer active
    currentSubscribed.forEach((chatId) => {
      if (!targetChats.has(chatId)) {
        unsubscribeFromChat(chatId)
      }
    })
  }, [isConnected, activeChatIds, subscribeToChat, unsubscribeFromChat])

  return {
    isConnected,
    subscribedChats: subscribedChatsRef.current,
    sendMessage,
    sendTyping,
    markAsRead,
    subscribeToChat,
    unsubscribeFromChat,
  }
}

