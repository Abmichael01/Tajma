import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
// import { useNotificationsStore } from '@/store/notificationsStore' // Implicit dependency via event handler or local logic

interface WebSocketMessage {
  type: 'notification' | 'notification_count' | 'pong'
  notification?: any
  count?: number
}

/**
 * Hook for managing WebSocket connection for real-time notifications
 * Simpler version for Mobile
 */
export const useNotificationWebSocket = () => {
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    // Backend's JWTAuthMiddleware reads ?token=<JWT> from the WS query string.
    // Without it the channels consumer treats the connection as anonymous and rejects it.
    const buildWebSocketUrl = (token?: string | null): string => {
      let baseUrl: string
      if (process.env.EXPO_PUBLIC_WS_BASE_URL) {
        baseUrl = `${process.env.EXPO_PUBLIC_WS_BASE_URL.replace(/\/$/, '')}/ws/notifications/`
      } else {
        const base = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'
        const wsBase = base.replace(/^https?/, (match: string) => match === 'https' ? 'wss' : 'ws')
        baseUrl = `${wsBase.replace(/\/$/, '')}/ws/notifications/`
      }
      return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
    }

    const accessToken = useAuthStore.getState().accessToken
    const wsUrl = buildWebSocketUrl(accessToken)
    console.log('🔌 Connecting notification WebSocket to:', wsUrl.replace(/token=[^&]+/, 'token=***'))

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected for notifications')
        reconnectAttempts.current = 0

        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          } else {
            clearInterval(pingInterval)
          }
        }, 30000)
      }

      ws.onmessage = async (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)
          console.log('[ws-notif] received:', data.type, data.notification?.title ?? '')

          if (data.type === 'notification' && data.notification) {
            const notification = data.notification
            // Transient notifications (currently: chat messages) only surface a
            // banner — they don't persist to the bell feed or bump the unread
            // count. Their record lives in the chat inbox instead.
            const isTransient = notification.transient === true

            // Chat-type notifications deep-link to the conversation, not the
            // ad. Fall back to the ad page for everything else.
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
              type: notification.type || 'other',
              title: notification.title || '',
              message: notification.message || '',
              isRead: Boolean(notification.is_read),
              link: deepLink,
              adId: notification.related_ad ? String(notification.related_ad) : undefined,
              timestamp: notification.created_at || new Date().toISOString(),
            }

            if (!isTransient) {
              // Persistent notification — add to bell feed, refresh unread count.
              const { useNotificationsStore } = require('@/store/notificationsStore')
              const store = useNotificationsStore.getState()
              const wasAdded = store.getNotifications().some((n: any) => n.id === mappedNotification.id)
              if (!wasAdded) {
                store.addNotification(mappedNotification)
              }
              const updatedNotifications = store.getNotifications()
              const newUnreadCount = updatedNotifications.filter((n: any) => !n.isRead).length
              queryClient.invalidateQueries({ queryKey: ['notifications'] })
              queryClient.setQueryData(['notifications', 'unread_count'], { count: newUnreadCount })
            }

            // Surface a top banner. Dedup happens inside the in-app store on
            // notification id, so the parallel OS-push path won't double-show.
            // Banner fires for both transient and persistent paths.
            const { useInAppNotificationStore } = require('@/store/inAppNotificationStore')
            useInAppNotificationStore.getState().show({
              id: mappedNotification.id,
              title: mappedNotification.title || 'Tajma',
              body: mappedNotification.message || '',
              type: mappedNotification.type,
              chatId,
              deepLink: mappedNotification.link,
            })
            const after = useInAppNotificationStore.getState().current
            console.log('[ws-notif] store.current after show:', after?.id ?? '<null>', isTransient ? '(transient)' : '')

          } else if (data.type === 'notification_count' && typeof data.count === 'number') {
            queryClient.setQueryData(['notifications', 'unread_count'], { count: data.count })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        if (event.wasClean && event.code === 1000) {
          return
        }

        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          setTimeout(() => {
            connect()
          }, delay)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [isAuthenticated, user, queryClient])

  const disconnect = useCallback(() => {
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
