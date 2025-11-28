import { create } from 'zustand'
import type { ChatMessage, ChatSummary } from '@/api/types'

const DEFAULT_API_URL = 'http://localhost:8000'

// Build WebSocket URL
const buildWebSocketUrl = (): string => {
  const base =
    process.env.NEXT_PUBLIC_WS_URL ||
    (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/^https?/, (match) => match === 'https' ? 'wss' : 'ws')
  return `${base.replace(/\/$/, '')}/ws/chat/`
}

interface ChatWebSocketState {
  // Connection state
  ws: WebSocket | null
  isConnected: boolean
  subscribedChats: Set<string>
  pendingSubscriptions: Set<string>
  pendingMessages: Map<string, string[]>
  
  // Reconnection state
  reconnectAttempts: number
  reconnectTimeout: NodeJS.Timeout | null
  pingInterval: NodeJS.Timeout | null
  connectionHealthCheck: NodeJS.Timeout | null
  lastPongTime: number
  
  // Event handlers
  onChatMessage?: (message: ChatMessage, chatId: string) => void
  onChatListUpdate?: (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => void
  onTyping?: (payload: { userId: number; typing: boolean; chatId: string }) => void
  onMessageStatusUpdate?: (message: ChatMessage, chatId: string) => void
  onMarkedRead?: (chatId: string, count: number) => void
  
  // Actions
  connect: () => void
  disconnect: () => void
  subscribeToChat: (chatId: string) => void
  unsubscribeFromChat: (chatId: string) => void
  sendMessage: (chatId: string, content: string) => boolean
  sendTyping: (chatId: string, typing: boolean) => void
  markAsRead: (chatId: string) => void
  setHandlers: (handlers: {
    onChatMessage?: (message: ChatMessage, chatId: string) => void
    onChatListUpdate?: (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => void
    onTyping?: (payload: { userId: number; typing: boolean; chatId: string }) => void
    onMessageStatusUpdate?: (message: ChatMessage, chatId: string) => void
    onMarkedRead?: (chatId: string, count: number) => void
  }) => void
}

export const useChatWebSocketStore = create<ChatWebSocketState>((set, get) => {
  const sendQueuedMessages = (chatId: string) => {
    const state = get()
    const queuedMessages = state.pendingMessages.get(chatId)
    if (queuedMessages && queuedMessages.length > 0 && state.ws && state.ws.readyState === WebSocket.OPEN) {
      console.log(`Sending ${queuedMessages.length} queued messages for chat ${chatId}`)
      queuedMessages.forEach((content) => {
        try {
          state.ws!.send(
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
      const newPendingMessages = new Map(state.pendingMessages)
      newPendingMessages.delete(chatId)
      set({ pendingMessages: newPendingMessages })
    }
  }

  const connect = () => {
    const state = get()
    
    // Simple check: Don't connect if not authenticated
    if (typeof window !== 'undefined') {
      try {
        const { useAuthStore } = require('@/store/authStore')
        if (!useAuthStore.getState().isAuthenticated) {
          console.warn('⚠️ Cannot connect WebSocket: user is not authenticated')
          return
        }
      } catch {
        // If auth store unavailable, don't connect
        return
      }
    } else {
      return // Server-side
    }
    
    // Don't connect if already connected or connecting
    if (state.ws && (state.ws.readyState === WebSocket.CONNECTING || state.ws.readyState === WebSocket.OPEN)) {
      return
    }

    const wsUrl = buildWebSocketUrl()
    console.log('🔌 Connecting to WebSocket:', wsUrl)
    
    try {
      const socket = new WebSocket(wsUrl)
      
      socket.onopen = () => {
        console.log('✅ WebSocket connected')
        set({ 
          isConnected: true,
          reconnectAttempts: 0,
          lastPongTime: Date.now()
        })

        // Mark all unread messages as delivered when user comes online
        if (socket.readyState === WebSocket.OPEN) {
          try {
            console.log('📤 User came online, marking all messages as delivered')
            socket.send(JSON.stringify({ 
              type: 'mark_all_delivered'
            }))
          } catch (error) {
            console.error('Failed to mark all messages as delivered:', error)
          }
        }

        // Heartbeat mechanism
        const pingInterval = setInterval(() => {
          if (document.visibilityState === 'hidden') {
            console.log('⏸️ Tab hidden, skipping client ping')
            return
          }
          
          const currentState = get()
          if (currentState.ws?.readyState === WebSocket.OPEN) {
            try {
              console.log('📤 Sending client ping')
              currentState.ws.send(JSON.stringify({ type: 'ping' }))
            } catch (error) {
              console.error('Failed to send ping:', error)
              if (currentState.ws) {
                currentState.ws.close()
              }
            }
          } else {
            console.warn('⚠️ WebSocket not open, clearing ping interval')
            clearInterval(pingInterval)
            set({ pingInterval: null })
          }
        }, 20_000) // 20 seconds

        set({ pingInterval })

        // Connection health check
        const connectionHealthCheck = setInterval(() => {
          const currentState = get()
          if (currentState.ws?.readyState === WebSocket.OPEN) {
            const timeSinceLastPong = Date.now() - currentState.lastPongTime
            if (timeSinceLastPong > 300_000) { // 5 minutes
              console.warn('No pong received in 5 minutes, connection may be dead - reconnecting...')
              if (currentState.ws) {
                currentState.ws.close()
              }
            }
          }
        }, 60_000) // Check every 60 seconds

        set({ connectionHealthCheck })
      }

      socket.onmessage = (event) => {
        try {
          // Skip if data is not a string (shouldn't happen, but safety check)
          if (typeof event.data !== 'string') {
            return
          }
          
          const payload = JSON.parse(event.data)
          const state = get()
          
          // Skip HMR-related messages (they shouldn't reach here, but just in case)
          if (payload.event === 'ping' && !payload.type) {
            return
          }

          switch (payload.type) {
            case 'connection':
              console.log('Unified chat WebSocket connected')
              break

            case 'pong':
              console.log('✅ Received pong from server')
              set({ lastPongTime: Date.now() })
              break

            case 'ping':
              console.log('🏓 Received server ping, responding with pong')
              if (state.ws?.readyState === WebSocket.OPEN) {
                try {
                  state.ws.send(JSON.stringify({ type: 'pong' }))
                  set({ lastPongTime: Date.now() })
                } catch (error) {
                  console.error('Failed to respond to server ping:', error)
                }
              }
              break

            case 'subscribed':
              const subscribedChatId = payload.chat_id
              const newSubscribed = new Set(state.subscribedChats)
              newSubscribed.add(subscribedChatId)
              const newPendingSubs = new Set(state.pendingSubscriptions)
              newPendingSubs.delete(subscribedChatId)
              
              set({
                subscribedChats: newSubscribed,
                pendingSubscriptions: newPendingSubs
              })
              
              console.log('Successfully subscribed to chat:', subscribedChatId)
              sendQueuedMessages(subscribedChatId)
              break

            case 'unsubscribed':
              const unsubscribedChatId = payload.chat_id
              const updatedSubscribed = new Set(state.subscribedChats)
              updatedSubscribed.delete(unsubscribedChatId)
              set({ subscribedChats: updatedSubscribed })
              console.log('Successfully unsubscribed from chat:', unsubscribedChatId)
              break

            case 'message':
              if (payload.message && payload.chat_id) {
                state.onChatMessage?.(payload.message, payload.chat_id)
              }
              break

            case 'chat_event':
              if (payload.type === 'chat_event') {
                state.onChatListUpdate?.(payload)
              }
              break

            case 'typing':
              if (payload.user_id !== undefined && payload.chat_id) {
                state.onTyping?.({
                  userId: payload.user_id,
                  typing: payload.typing,
                  chatId: payload.chat_id,
                })
              }
              break

            case 'message_status_update':
              if (payload.message && payload.chat_id) {
                state.onMessageStatusUpdate?.(payload.message, payload.chat_id)
              }
              break

            case 'marked_read':
              console.log(`Marked ${payload.count || 0} messages as read in chat ${payload.chat_id}`)
              state.onMarkedRead?.(payload.chat_id, payload.count || 0)
              break

            case 'all_messages_delivered':
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
        console.log('WebSocket closed', event.code, event.reason)
        set({
          isConnected: false,
          subscribedChats: new Set(),
          pendingSubscriptions: new Set(),
          pendingMessages: new Map(),
        })

        // Clear intervals
        const state = get()
        if (state.pingInterval) {
          clearInterval(state.pingInterval)
          set({ pingInterval: null })
        }
        if (state.connectionHealthCheck) {
          clearInterval(state.connectionHealthCheck)
          set({ connectionHealthCheck: null })
        }

        // Handle authentication errors
        // Check for 403 close code, or if reason contains "403" or "Forbidden"
        const isAuthError = 
          event.code === 4001 || 
          event.code === 403 ||
          (event.reason && (
            event.reason.includes('403') || 
            event.reason.toLowerCase().includes('forbidden') ||
            event.reason.toLowerCase().includes('authentication') ||
            event.reason.toLowerCase().includes('unauthorized')
          )) ||
          // 1006 = Abnormal Closure (often happens with HTTP 403)
          // 1002 = Protocol Error (might indicate auth failure)
          (event.code === 1006 && !event.wasClean && !get().isConnected) ||
          (event.code === 1002 && !event.wasClean)

        if (isAuthError) {
          console.warn('Unified chat WebSocket closed due to auth error (403 Forbidden), logging out', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          })
          set({ reconnectAttempts: 0 })
          
          // Logout user and redirect to login with parameter
          import('@/store/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().logout()
            if (typeof window !== 'undefined') {
              // Redirect to login with auth_required parameter to show toast
              const currentPath = window.location.pathname
              window.location.href = `/login?auth_required=true&redirect=${encodeURIComponent(currentPath)}`
            }
          })
          return
        }

        // Don't reconnect if it was a clean close
        if (event.wasClean && event.code === 1000) {
          set({ reconnectAttempts: 0 })
          return
        }

        // Automatic reconnection
        const stateAfterClose = get()
        const delay = Math.min(1000 * Math.pow(2, stateAfterClose.reconnectAttempts), 30000)
        const newAttempts = stateAfterClose.reconnectAttempts + 1

        console.log(`🔄 Reconnecting unified chat WebSocket in ${delay}ms (attempt ${newAttempts})`)

        const reconnectTimeout = setTimeout(() => {
          connect()
        }, delay)

        set({
          reconnectAttempts: newAttempts,
          reconnectTimeout
        })
      }

      socket.onerror = (event) => {
        // Suppress HMR-related errors in development
        const errorMessage = event instanceof ErrorEvent ? event.message : String(event)
        if (process.env.NODE_ENV === 'development' && 
            (errorMessage.includes('HMR') || errorMessage.includes('unrecognized'))) {
          // Silently ignore HMR-related errors
          return
        }
        
        console.error('Unified chat WebSocket error:', event)
        
        // Check if connection failed immediately (likely auth error)
        const state = get()
        if (state.ws) {
          const ws = state.ws
          
          // If WebSocket fails before opening, it might be a 403 error
          // Wait a bit to see if onclose fires with error code
          // If it's already CLOSED, check if we should handle auth error
          if (ws.readyState === WebSocket.CLOSED && !state.isConnected) {
            // Connection failed immediately, likely auth error
            // The onclose handler will handle it, but we can help trigger logout
            // Wait a short moment for onclose to fire, then check
            setTimeout(() => {
              const currentState = get()
              // If still not connected and no reconnect attempt, it was likely auth error
              if (!currentState.isConnected && currentState.reconnectAttempts === 0) {
                // Check if close code was 403 or similar
                // onclose should have handled it, but just in case
                console.warn('WebSocket connection failed immediately, may be auth error')
              }
            }, 100)
          } else if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
            // Wait for onclose to handle 403 properly
            return
          } else {
            // Try to close cleanly to trigger onclose handler
            try {
              ws.close()
            } catch (e) {
              // Already closed or closing
            }
          }
        }
      }

      set({ ws: socket })
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  const disconnect = () => {
    const state = get()
    
    if (state.pingInterval) {
      clearInterval(state.pingInterval)
    }
    if (state.connectionHealthCheck) {
      clearInterval(state.connectionHealthCheck)
    }
    if (state.reconnectTimeout) {
      clearTimeout(state.reconnectTimeout)
    }
    
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.close(1000, 'Clean disconnect')
    }
    
    set({
      ws: null,
      isConnected: false,
      subscribedChats: new Set(),
      pendingSubscriptions: new Set(),
      pendingMessages: new Map(),
      pingInterval: null,
      connectionHealthCheck: null,
      reconnectTimeout: null,
      reconnectAttempts: 0
    })
  }

  const subscribeToChat = (chatId: string) => {
    const state = get()
    
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot subscribe to chat:', chatId)
      return
    }

    if (state.subscribedChats.has(chatId)) {
      return // Already subscribed
    }

    if (state.pendingSubscriptions.has(chatId)) {
      return // Already pending
    }

    try {
      const newPendingSubs = new Set(state.pendingSubscriptions)
      newPendingSubs.add(chatId)
      set({ pendingSubscriptions: newPendingSubs })
      
      state.ws.send(
        JSON.stringify({
          type: 'subscribe',
          chat_id: chatId,
        })
      )
      console.log('Subscribing to chat:', chatId)
    } catch (error) {
      console.error('Failed to subscribe to chat:', error)
      const updatedPendingSubs = new Set(state.pendingSubscriptions)
      updatedPendingSubs.delete(chatId)
      set({ pendingSubscriptions: updatedPendingSubs })
    }
  }

  const unsubscribeFromChat = (chatId: string) => {
    const state = get()
    
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      return
    }

    if (!state.subscribedChats.has(chatId)) {
      return // Not subscribed
    }

    try {
      state.ws.send(
        JSON.stringify({
          type: 'unsubscribe',
          chat_id: chatId,
        })
      )
      const updatedSubscribed = new Set(state.subscribedChats)
      updatedSubscribed.delete(chatId)
      set({ subscribedChats: updatedSubscribed })
      console.log('Unsubscribed from chat:', chatId)
    } catch (error) {
      console.error('Failed to unsubscribe from chat:', error)
    }
  }

  const sendMessage = (chatId: string, content: string): boolean => {
    const state = get()
    
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message')
      return false
    }

    // If not subscribed, subscribe first and queue the message
    if (!state.subscribedChats.has(chatId) && !state.pendingSubscriptions.has(chatId)) {
      console.log('Not subscribed to chat, subscribing first:', chatId)
      subscribeToChat(chatId)
      
      const newPendingMessages = new Map(state.pendingMessages)
      if (!newPendingMessages.has(chatId)) {
        newPendingMessages.set(chatId, [])
      }
      newPendingMessages.get(chatId)!.push(content)
      set({ pendingMessages: newPendingMessages })
      return true // Return true as message is queued
    }

    // If subscription is pending, queue the message
    if (state.pendingSubscriptions.has(chatId)) {
      console.log('Subscription pending for chat, queuing message:', chatId)
      const newPendingMessages = new Map(state.pendingMessages)
      if (!newPendingMessages.has(chatId)) {
        newPendingMessages.set(chatId, [])
      }
      newPendingMessages.get(chatId)!.push(content)
      set({ pendingMessages: newPendingMessages })
      return true // Return true as message is queued
    }

    // Send message immediately if subscribed
    try {
      state.ws.send(
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
  }

  const sendTyping = (chatId: string, typing: boolean) => {
    const state = get()
    
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      return
    }

    if (!state.subscribedChats.has(chatId)) {
      return // Must be subscribed first
    }

    try {
      state.ws.send(
        JSON.stringify({
          type: 'typing',
          chat_id: chatId,
          typing,
        })
      )
    } catch (error) {
      console.error('Failed to send typing indicator:', error)
    }
  }

  const markAsRead = (chatId: string) => {
    const state = get()
    
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot mark as read')
      return
    }

    if (!state.subscribedChats.has(chatId)) {
      console.warn('Not subscribed to chat, cannot mark as read:', chatId)
      return
    }

    try {
      state.ws.send(
        JSON.stringify({
          type: 'mark_read',
          chat_id: chatId,
        })
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const setHandlers = (handlers: {
    onChatMessage?: (message: ChatMessage, chatId: string) => void
    onChatListUpdate?: (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => void
    onTyping?: (payload: { userId: number; typing: boolean; chatId: string }) => void
    onMessageStatusUpdate?: (message: ChatMessage, chatId: string) => void
    onMarkedRead?: (chatId: string, count: number) => void
  }) => {
    // Replace handlers (single source of truth - WhatsApp/Telegram pattern)
    // Context-aware handlers from useChatRealtime will handle all events appropriately
    set({
      onChatMessage: handlers.onChatMessage,
      onChatListUpdate: handlers.onChatListUpdate,
      onTyping: handlers.onTyping,
      onMessageStatusUpdate: handlers.onMessageStatusUpdate,
      onMarkedRead: handlers.onMarkedRead,
    })
  }

  return {
    // Initial state
    ws: null,
    isConnected: false,
    subscribedChats: new Set(),
    pendingSubscriptions: new Set(),
    pendingMessages: new Map(),
    reconnectAttempts: 0,
    reconnectTimeout: null,
    pingInterval: null,
    connectionHealthCheck: null,
    lastPongTime: Date.now(),
    
    // Handlers (initially undefined)
    onChatMessage: undefined,
    onChatListUpdate: undefined,
    onTyping: undefined,
    onMessageStatusUpdate: undefined,
    onMarkedRead: undefined,
    
    // Actions
    connect,
    disconnect,
    subscribeToChat,
    unsubscribeFromChat,
    sendMessage,
    sendTyping,
    markAsRead,
    setHandlers,
  }
})

