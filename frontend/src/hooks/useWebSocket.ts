import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'

interface WebSocketMessage {
  type: 'notification' | 'notification_count' | 'pong'
  notification?: any
  count?: number
}

/**
 * Hook for managing WebSocket connection for real-time notifications
 */
export const useNotificationWebSocket = () => {
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      return
    }

    // Close existing connection if any
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    // Build WebSocket URL - extract base URL and convert to WebSocket protocol
    const buildWebSocketUrl = (): string => {
      const base = process.env.NEXT_PUBLIC_WS_BASE_URL ||
        process.env.NEXT_PUBLIC_WS_URL ||
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
          .replace(/^https?/, (match: string) => match === 'https' ? 'wss' : 'ws')
          .replace(/\/api\/?$/, '') // Remove /api suffix if present
      return `${base.replace(/\/$/, '')}/ws/notifications/`
    }

    const wsUrl = buildWebSocketUrl()
    console.log('🔌 Connecting notification WebSocket to:', wsUrl)

    try {
      // WebSocket will use cookies for authentication (session-based)
      const ws = new WebSocket(wsUrl)
      const connectionStartTime = Date.now()
      let connectionOpened = false

      ws.onopen = () => {
        connectionOpened = true
        console.log('WebSocket connected for notifications')
        reconnectAttempts.current = 0

        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          } else {
            clearInterval(pingInterval)
          }
        }, 30000) // Ping every 30 seconds
      }

      // Helper to map backend notification types to frontend types
      const mapNotificationType = (type: string): 'message' | 'view' | 'favorite' | 'offer' | 'system' | 'phone_view' => {
        switch (type) {
          case 'phone_view':
            return 'phone_view'
          case 'ad_view':
            return 'view'
          case 'favorite':
            return 'favorite'
          case 'message':
            return 'message'
          case 'review':
            return 'offer'
          default:
            return 'system'
        }
      }

      ws.onmessage = async (event) => {
        try {
          console.log('📨 WebSocket message received:', event.data)
          const data: WebSocketMessage = JSON.parse(event.data)
          console.log('📦 Parsed WebSocket data:', data)

          if (data.type === 'notification' && data.notification) {
            const notification = data.notification
            console.log('📨 WebSocket: Received notification:', notification)
            // Transient notifications (currently: chat messages) only surface a
            // banner — they don't persist to the bell feed or bump the unread
            // count. Their record lives in the chat inbox instead.
            const isTransient = notification.transient === true

            const { useInAppNotificationStore } = await import('@/store/inAppNotificationStore')

            // Chat-type notifications deep-link to the conversation, not the ad.
            const chatId: string | undefined = notification.related_chat
              ? String(notification.related_chat)
              : undefined
            const deepLink: string | undefined = chatId
              ? `/messages/${chatId}`
              : notification.related_ad_slug
                ? `/ads/${notification.related_ad_slug}`
                : undefined

            const mappedNotification = {
              id: String(notification.id || ''),
              type: mapNotificationType(notification.type || 'other'),
              title: notification.title || '',
              message: notification.message || '',
              isRead: Boolean(notification.is_read),
              link: deepLink,
              adId: notification.related_ad ? String(notification.related_ad) : undefined,
              timestamp: notification.created_at || new Date().toISOString(),
            }

            if (!isTransient) {
              const { useNotificationsStore } = await import('@/store/notificationsStore')
              const store = useNotificationsStore.getState()
              const wasAdded = store.getNotifications().some(n => n.id === mappedNotification.id)
              if (!wasAdded) {
                store.addNotification(mappedNotification)
              }
              const updatedNotifications = store.getNotifications()
              const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length
              queryClient.invalidateQueries({ queryKey: ['notifications'] })
              queryClient.setQueryData(['notifications', 'unread_count'], { count: newUnreadCount })
              console.log(`✅ WebSocket: Notification added. Store now has ${updatedNotifications.length} notifications, ${newUnreadCount} unread`)
            } else {
              console.log('🔔 WebSocket: Transient notification (banner only, no persist)')
            }

            // Surface the WhatsApp-style top banner. The in-app store dedupes
            // on notification id, so the parallel service-worker push path
            // (which postMessages on visible tabs) can't double-show.
            useInAppNotificationStore.getState().show({
              id: mappedNotification.id,
              title: mappedNotification.title || 'Tajma',
              body: mappedNotification.message || '',
              type: notification.type || 'other',
              deepLink: mappedNotification.link,
              avatarUrl: notification.actor_avatar || notification.related_user_avatar,
            })
          } else if (data.type === 'notification_count' && typeof data.count === 'number') {
            console.log('📊 Updating notification count:', data.count)
            // Update unread count
            queryClient.setQueryData(['notifications', 'unread_count'], { count: data.count })
            console.log('✅ Notification count updated')
          } else if (data.type === 'pong') {
            console.log('🏓 Received pong from server')
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
          console.error('Raw message:', event.data)
        }
      }

      ws.onerror = (error) => {
        // WebSocket error event is typically empty, actual error info is in onclose
        // Only log if we have useful information
        if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          console.warn('Notification WebSocket error - connection closed or closing', {
            readyState: ws.readyState,
            url: wsUrl
          })
        }
      }

      ws.onclose = (event) => {
        const connectionDuration = Date.now() - connectionStartTime
        const closeInfo = {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          connectionOpened,
          connectionDuration: `${connectionDuration}ms`
        }

        // Log close event details for debugging
        console.log('🔌 Notification WebSocket closed:', closeInfo)

        // Handle anonymous user errors - ONLY logout when backend explicitly indicates user is anonymous
        // Backend sends code 4001 with reason "User is anonymous" when user.is_anonymous is true
        // DO NOT logout on connection failures - they can happen for many reasons (network, timing, etc.)
        const isAnonymousUserError =
          event.code === 4001 ||
          (event.reason && (
            event.reason.toLowerCase().includes('user is anonymous') ||
            event.reason.toLowerCase().includes('anonymous user')
          ))

        if (isAnonymousUserError) {
          console.warn('🚫 Notification WebSocket: User is anonymous - stopping reconnection', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            connectionDuration: `${connectionDuration}ms`
          })
          // DO NOT logout the entire app session here. 
          // WebSocket can fail to send cookies for many reasons that are not "the session is dead".
          // The main API client will handle actual 401/403 errors and logout if necessary.
          return // Don't reconnect on anonymous user errors
        }

        // Log connection errors but don't logout
        if (!event.wasClean && event.code !== 1000) {
          console.log('WebSocket connection error (not auth-related, staying logged in):', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          })
        }

        // Don't reconnect if it was a clean close (normal disconnection)
        if (event.wasClean && event.code === 1000) {
          return
        }

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++

          console.log(`Reconnecting notification WebSocket in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          console.error('Max reconnection attempts reached for notification WebSocket')
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [isAuthenticated, user, queryClient])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    reconnectAttempts.current = 0
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, user, connect, disconnect])

  return { connect, disconnect }
}

