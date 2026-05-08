import { create } from 'zustand'
import type { ChatMessage, ChatSummary } from '@/api/types'

// Default to localhost for dev, but in production/device it should be IP or valid URL
// Ideally this comes from ENV
// EXPO_PUBLIC_API_URL often includes /api/v1 or /api/
// If it includes /api/, we need to strip it for WS if WS is at root/ws/
// Based on routing.py, WS is at root/ws/chat/ NOT /api/ws/chat/
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

// Build WebSocket URL with optional JWT token query param.
// Backend's JWTAuthMiddleware (api/middleware/jwt_auth_middleware.py) reads
// ?token=<JWT> from the WS query string; without it the chat consumer
// rejects the connection with code 4001 (anonymous user).
const buildWebSocketUrl = (token?: string | null): string => {
  let baseUrl: string
  if (process.env.EXPO_PUBLIC_WS_BASE_URL) {
    baseUrl = `${process.env.EXPO_PUBLIC_WS_BASE_URL.replace(/\/$/, '')}/ws/chat/`
  } else {
    let base = (DEFAULT_API_URL).replace(/^https?/, (match: string) => match === 'https' ? 'wss' : 'ws')
    base = base.replace(/\/$/, '').replace(/\/api$/, '')
    baseUrl = `${base}/ws/chat/`
  }
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
}

interface ChatWebSocketState {
  // Connection state
  ws: WebSocket | null
  isConnected: boolean
  subscribedChats: Set<string>
  pendingSubscriptions: Set<string>
  // Messages typed before subscription confirms — flushed on 'subscribed'.
  // Must carry clientId so the server's broadcast can be matched back to
  // the optimistic message and replace it (otherwise it stays "sending").
  pendingMessages: Map<string, { content: string; parentMessageId?: string; clientId?: string }[]>

  // Reconnection state
  reconnectAttempts: number
  reconnectTimeout: any
  pingInterval: any
  connectionHealthCheck: any
  lastPongTime: number
  connectionStartTime?: number

  // Event handlers
  onChatMessage?: (message: ChatMessage, chatId: string) => void
  onChatListUpdate?: (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => void
  onTyping?: (payload: { userId: number; typing: boolean; chatId: string }) => void
  onMessageStatusUpdate?: (message: ChatMessage, chatId: string) => void
  onMarkedRead?: (chatId: string, count: number) => void
  onUserStatus?: (payload: { user_id: number; is_online: boolean; last_seen?: string }) => void

  // Typing status (tracked per chat)
  typingStatus: Record<string, Record<number, boolean>>

  // Actions
  connect: () => void
  disconnect: () => void
  subscribeToChat: (chatId: string) => void
  unsubscribeFromChat: (chatId: string) => void
  sendMessage: (chatId: string, content: string, parentMessageId?: string, clientId?: string) => boolean
  sendTyping: (chatId: string, typing: boolean) => void
  markAsRead: (chatId: string) => void
  setHandlers: (handlers: {
    onChatMessage?: (message: ChatMessage, chatId: string) => void
    onChatListUpdate?: (payload: { type: 'chat_event'; chat_id: string; chat?: ChatSummary; message?: ChatMessage }) => void
    onTyping?: (payload: { userId: number; typing: boolean; chatId: string }) => void
    onMessageStatusUpdate?: (message: ChatMessage, chatId: string) => void
    onMarkedRead?: (chatId: string, count: number) => void
    onUserStatus?: (payload: { user_id: number; is_online: boolean; last_seen?: string }) => void
  }) => void
}

export const useChatWebSocketStore = create<ChatWebSocketState>((set, get) => {
  const sendQueuedMessages = (chatId: string) => {
    const state = get()
    const queuedMessages = state.pendingMessages.get(chatId)
    if (queuedMessages && queuedMessages.length > 0 && state.ws && state.ws.readyState === WebSocket.OPEN) {
      console.log(`Sending ${queuedMessages.length} queued messages for chat ${chatId}`)
      queuedMessages.forEach(({ content, parentMessageId, clientId }) => {
        try {
          state.ws!.send(
            JSON.stringify({
              type: 'message',
              chat_id: chatId,
              content,
              parent_message_id: parentMessageId,
              client_id: clientId,
            })
          )
        } catch (error) {
          console.error('Failed to flush queued message:', error)
        }
      })
      const newPendingMessages = new Map(state.pendingMessages)
      newPendingMessages.delete(chatId)
      set({ pendingMessages: newPendingMessages })
    }
  }

  const connect = () => {
    const state = get()

    try {
      // Direct import since require might behave differently in RN bundler depending on config
      // But adhering to the original logic structure:
      // useAuthStore is likely available globally or via import. 
      // We'll import it at top but to avoid cycle we might need to be careful.
      // Actually, checking authentication inside connect is fine.
      // Ideally we pass isAuthenticated as arg or use separate logic.
      // For now, let's assume valid user if this is called, or handle auth error in WS.
    } catch {
      return
    }

    // Don't connect if already connected or connecting
    if (state.ws && (state.ws.readyState === WebSocket.CONNECTING || state.ws.readyState === WebSocket.OPEN)) {
      return
    }

    // Late-require to avoid a circular import between the WS store and the auth store.
    const { useAuthStore } = require('@/store/authStore')
    const accessToken = useAuthStore.getState().accessToken
    const wsUrl = buildWebSocketUrl(accessToken)
    console.log('🔌 Connecting to WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'))

    try {
      const socket = new WebSocket(wsUrl)
      const connectionStartTime = Date.now()
      let connectionOpened = false

      socket.onopen = () => {
        connectionOpened = true
        console.log('✅ WebSocket connected')
        set({
          isConnected: true,
          reconnectAttempts: 0,
          lastPongTime: Date.now(),
          connectionStartTime
        })

        // Mark all unread messages as delivered when user comes online
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
          // RN doesn't have document.visibilityState, assume strictly handled by app lifecycle if needed
          // or just ping always. We'll simplify for now.

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
          if (typeof event.data !== 'string') {
            return
          }

          const payload = JSON.parse(event.data)
          const state = get()

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
                console.log('📨 [WebSocket] Received message event:', {
                  chatId: payload.chat_id,
                  messageId: payload.message.id,
                  type: 'message'
                })
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
                // Update typing status in store
                const currentTyping = { ...get().typingStatus }
                if (!currentTyping[payload.chat_id]) {
                  currentTyping[payload.chat_id] = {}
                }
                currentTyping[payload.chat_id][payload.user_id] = payload.typing
                set({ typingStatus: currentTyping })

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

            case 'user_status':
              if (payload.user_id !== undefined) {
                console.log(`👤 [WebSocket] User status update: ${payload.user_id} - ${payload.is_online ? 'online' : 'offline'}`)
                state.onUserStatus?.({
                  user_id: payload.user_id,
                  is_online: payload.is_online,
                  last_seen: payload.last_seen,
                })
              }
              break

            case 'all_messages_delivered':
              console.log(`All ${payload.count || 0} messages marked as delivered - backend will broadcast updates`)
              break

            case 'error':
              if (payload.message?.includes('mark') || payload.message?.includes('delivered')) {
                console.warn('WebSocket warning:', payload.message)
              } else {
                console.error('WebSocket error:', payload.message)
              }
              break

            default:
              console.warn('Unknown WebSocket message type:', payload.type)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      socket.onclose = (event) => {
        console.log('🔌 Chat WebSocket closed:', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean
        })

        set({
          isConnected: false,
          subscribedChats: new Set(),
          pendingSubscriptions: new Set(),
          pendingMessages: new Map(),
        })

        const state = get()

        if (state.pingInterval) {
          clearInterval(state.pingInterval)
          set({ pingInterval: null })
        }
        if (state.connectionHealthCheck) {
          clearInterval(state.connectionHealthCheck)
          set({ connectionHealthCheck: null })
        }

        const isAnonymousUserError =
          event.code === 4001 ||
          (event.reason && (
            event.reason.toLowerCase().includes('user is anonymous') ||
            event.reason.toLowerCase().includes('anonymous user')
          ))

        if (isAnonymousUserError) {
          console.warn('🚫 Chat WebSocket: User is anonymous - logging out')
          set({ reconnectAttempts: 0 })

          // Replaced import/toast with simple console log for now
          // We can add Alert or similar later if needed
          console.log('Account was logged out due to anonymous user error')
          return
        }

        if (!event.wasClean && event.code !== 1000) {
          console.log('WebSocket connection error')
        }

        if (event.wasClean && event.code === 1000) {
          set({ reconnectAttempts: 0 })
          return
        }

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
        const errorMessage = (event as any).message || String(event)
        if (process.env.NODE_ENV === 'development' &&
          (errorMessage.includes('HMR') || errorMessage.includes('unrecognized'))) {
          return
        }

        console.error('Unified chat WebSocket error:', event)

        const state = get()
        if (state.ws) {
          const ws = state.ws
          if (ws.readyState === WebSocket.CLOSED && !state.isConnected) {
            setTimeout(() => {
              const currentState = get()
              if (!currentState.isConnected && currentState.reconnectAttempts === 0) {
                console.warn('WebSocket connection failed immediately, may be auth error')
              }
            }, 100)
          } else if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
            return
          } else {
            try {
              ws.close()
            } catch (e) {
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
      reconnectAttempts: 0,
      typingStatus: {},
      onChatMessage: undefined,
      onChatListUpdate: undefined,
      onTyping: undefined,
      onMessageStatusUpdate: undefined,
      onMarkedRead: undefined,
    })
  }

  const subscribeToChat = (chatId: string) => {
    const state = get()

    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot subscribe to chat:', chatId)
      return
    }

    if (state.subscribedChats.has(chatId)) {
      return
    }

    if (state.pendingSubscriptions.has(chatId)) {
      return
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
      return
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

  const sendMessage = (chatId: string, content: string, parentMessageId?: string, clientId?: string): boolean => {
    const state = get()

    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message')
      return false
    }

    if (!state.subscribedChats.has(chatId) && !state.pendingSubscriptions.has(chatId)) {
      console.log('Not subscribed to chat, subscribing first:', chatId)
      subscribeToChat(chatId)

      const newPendingMessages = new Map(state.pendingMessages)
      if (!newPendingMessages.has(chatId)) {
        newPendingMessages.set(chatId, [])
      }
      newPendingMessages.get(chatId)!.push({ content, parentMessageId, clientId })
      set({ pendingMessages: newPendingMessages })
      return true
    }

    if (state.pendingSubscriptions.has(chatId)) {
      console.log('Subscription pending for chat, queuing message:', chatId)
      const newPendingMessages = new Map(state.pendingMessages)
      if (!newPendingMessages.has(chatId)) {
        newPendingMessages.set(chatId, [])
      }
      newPendingMessages.get(chatId)!.push({ content, parentMessageId, clientId })
      set({ pendingMessages: newPendingMessages })
      return true
    }

    try {
      state.ws.send(
        JSON.stringify({
          type: 'message',
          chat_id: chatId,
          content,
          parent_message_id: parentMessageId,
          client_id: clientId,
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
      return
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
      console.log(`[chatWebSocketStore] Sending mark_read for chat ${chatId}`);
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
    onUserStatus?: (payload: { user_id: number; is_online: boolean; last_seen?: string }) => void
  }) => {
    set({
      onChatMessage: handlers.onChatMessage,
      onChatListUpdate: handlers.onChatListUpdate,
      onTyping: handlers.onTyping,
      onMessageStatusUpdate: handlers.onMessageStatusUpdate,
      onMarkedRead: handlers.onMarkedRead,
      onUserStatus: handlers.onUserStatus,
    })
  }

  return {
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

    onChatMessage: undefined,
    onChatListUpdate: undefined,
    onTyping: undefined,
    onMessageStatusUpdate: undefined,
    onMarkedRead: undefined,
    onUserStatus: undefined,
    typingStatus: {},

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
