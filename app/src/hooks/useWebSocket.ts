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

          if (data.type === 'notification' && data.notification) {
            // Dynamic import to avoid circular dependencies if any
            const { useNotificationsStore } = require('@/store/notificationsStore')
            const store = useNotificationsStore.getState()

            const notification = data.notification
            const mappedNotification = {
              id: String(notification.id || ''),
              type: notification.type || 'other',
              title: notification.title || '',
              message: notification.message || '',
              isRead: Boolean(notification.is_read),
              link: notification.related_ad_slug ? `/ads/${notification.related_ad_slug}` : undefined,
              adId: notification.related_ad ? String(notification.related_ad) : undefined,
              timestamp: notification.created_at || new Date().toISOString(),
            }

            const wasAdded = store.getNotifications().some((n: any) => n.id === mappedNotification.id)
            if (!wasAdded) {
              store.addNotification(mappedNotification)
            }

            const updatedNotifications = store.getNotifications()
            const newUnreadCount = updatedNotifications.filter((n: any) => !n.isRead).length

            // Console log instead of toast for now
            console.log('New Notification:', notification.message)

            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.setQueryData(['notifications', 'unread_count'], { count: newUnreadCount })

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
