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
  const shownToastIds = useRef<Set<string>>(new Set())

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
      const base = process.env.NEXT_PUBLIC_WS_URL || 
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
          .replace(/^https?/, (match) => match === 'https' ? 'wss' : 'ws')
          .replace(/\/api\/?$/, '') // Remove /api suffix if present
      return `${base.replace(/\/$/, '')}/ws/notifications/`
    }
    
    const wsUrl = buildWebSocketUrl()
    console.log('🔌 Connecting notification WebSocket to:', wsUrl)
    
    try {
      // WebSocket will use cookies for authentication (session-based)
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
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
            // Add notification to store
            const { useNotificationsStore } = await import('@/store/notificationsStore')
            const { toast } = await import('sonner')
            const store = useNotificationsStore.getState()
            
            // Map backend notification to store format
            const notification = data.notification
            console.log('📨 WebSocket: Received notification:', notification)
            
            const mappedNotification = {
              id: String(notification.id || ''),
              type: mapNotificationType(notification.type || 'other'),
              title: notification.title || '',
              message: notification.message || '',
              isRead: Boolean(notification.is_read),
              link: notification.related_ad_slug ? `/ads/${notification.related_ad_slug}` : undefined,
              adId: notification.related_ad ? String(notification.related_ad) : undefined,
              timestamp: notification.created_at || new Date().toISOString(),
            }
            
            // Add notification to store
            const wasAdded = store.getNotifications().some(n => n.id === mappedNotification.id)
            if (!wasAdded) {
              store.addNotification(mappedNotification)
            }
            
            // Get updated unread count
            const updatedNotifications = store.getNotifications()
            const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length
            
            // Show toast notification only once per notification ID
            const notificationId = String(notification.id || '')
            if (!shownToastIds.current.has(notificationId)) {
              shownToastIds.current.add(notificationId)
              
              // Show toast with just the message (no description)
              // Use unique ID to prevent duplicate toasts
              toast(notification.message || notification.title || 'New notification', {
                id: `notification-${notificationId}`, // Unique ID to prevent duplicates
                duration: 5000,
                description: undefined, // Explicitly no description
                action: notification.link ? {
                  label: 'View',
                  onClick: () => {
                    window.location.href = notification.link!
                  }
                } : undefined,
              })
              
              // Clean up old toast IDs after 1 minute to prevent memory leak
              setTimeout(() => {
                shownToastIds.current.delete(notificationId)
              }, 60000)
            }
            
            // Invalidate notifications query to refetch
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.setQueryData(['notifications', 'unread_count'], { count: newUnreadCount })
            
            console.log(`✅ WebSocket: Notification added. Store now has ${updatedNotifications.length} notifications, ${newUnreadCount} unread`)
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
        const closeInfo = {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean
        }
        
        // Log only if not a clean close or if it's an error code
        if (!event.wasClean || event.code !== 1000) {
          console.log('Notification WebSocket disconnected', closeInfo)
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
          (event.code === 1006 && !event.wasClean && wsRef.current?.readyState === WebSocket.CLOSED)
        
        if (isAuthError) {
          console.warn('Notification WebSocket closed due to auth error (403 Forbidden), logging out', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          })
          import('@/store/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().logout()
            if (typeof window !== 'undefined') {
              // Only redirect to login if current page requires authentication
              // For public pages (like home), just log out silently
              const currentPath = window.location.pathname
              const authRequiredPaths = ['/create-ad', '/profile', '/alerts', '/chat']
              const requiresAuth = authRequiredPaths.some(path => currentPath.startsWith(path))
              
              if (requiresAuth) {
                // Redirect to login with auth_required parameter to show toast
                window.location.href = `/login?auth_required=true&redirect=${encodeURIComponent(currentPath)}`
              }
              // Otherwise, just log out silently - user can continue browsing public pages
            }
          })
          return // Don't reconnect on auth errors
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

