import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationWebSocket } from '@/hooks/useWebSocket'
import { useNotificationsStore, Notification as StoreNotification } from '@/store/notificationsStore'
import { subscribeToWebPush } from '@/lib/webPush'
import type { Notification as ApiNotification } from '@/api/types'

/**
 * Hook to initialize notifications from API and set up WebSocket connection
 */
export function useInitializeNotifications() {
  const { isAuthenticated } = useAuthStore()
  const { data: notifications = [], isLoading } = useNotifications()
  const { connect, disconnect } = useNotificationWebSocket()

  // Note: we DO NOT subscribe to useNotificationsStore() here. With this hook
  // being mounted globally via NotificationLayer, subscribing would re-render
  // on every store update (e.g. every incoming WS notification), which would
  // re-fire the sync effect below, which would update the store again,
  // creating a render loop. Use getState() in the effects instead — actions
  // are stable and don't need React subscription.

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

  // Subscribe to Web Push (browser-level pushes for when the tab isn't open).
  // Idempotent: safe to call on every authenticated mount.
  useEffect(() => {
    if (!isAuthenticated) return
    subscribeToWebPush().catch(() => {})
  }, [isAuthenticated])

  // Sync API notifications to store - atomic replace
  useEffect(() => {
    if (!isLoading && isAuthenticated && Array.isArray(notifications)) {
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

      useNotificationsStore.getState().setNotifications(mappedNotifications)
    } else if (!isAuthenticated) {
      useNotificationsStore.getState().clearAll()
    }
  }, [notifications, isLoading, isAuthenticated])

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
