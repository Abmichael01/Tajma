import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationWebSocket } from '@/hooks/useWebSocket'
import { useNotificationsStore, Notification as StoreNotification } from '@/store/notificationsStore'
import type { Notification as ApiNotification } from '@/api/types'

/**
 * Hook to initialize notifications from API and set up WebSocket connection
 */
export function useInitializeNotifications() {
  const { isAuthenticated, user } = useAuthStore()
  const { data: notifications = [], isLoading } = useNotifications()
  const { connect, disconnect } = useNotificationWebSocket()
  const { clearAll, setNotifications } = useNotificationsStore()
  
  // Set up WebSocket connection
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, connect, disconnect])

  // Sync API notifications to store - atomic replace
  useEffect(() => {
    if (!isLoading && isAuthenticated && Array.isArray(notifications)) {
      console.log(`🔄 useInitializeNotifications: Atomic sync with ${notifications.length} notifications`)
      
      const mappedNotifications: StoreNotification[] = notifications.map((notif: ApiNotification) => ({
        id: String(notif.id),
        type: mapNotificationType(notif.type || 'other'),
        title: notif.title || '',
        message: notif.message || '',
        isRead: Boolean(notif.is_read),
        timestamp: notif.created_at || new Date().toISOString(),
        link: notif.related_ad_slug ? `/ads/${notif.related_ad_slug}` : undefined,
        adId: notif.related_ad ? String(notif.related_ad) : undefined,
      }))
      
      setNotifications(mappedNotifications)
    } else if (!isAuthenticated) {
      clearAll()
    }
  }, [notifications, isLoading, isAuthenticated, setNotifications, clearAll])

  // Helper to map backend notification types to frontend types
  function mapNotificationType(type: string): 'message' | 'view' | 'favorite' | 'offer' | 'system' | 'phone_view' {
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
}
