import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationWebSocket } from '@/hooks/useWebSocket'
import { useNotificationsStore } from '@/store/notificationsStore'
import type { Notification as ApiNotification } from '@/api/types'

/**
 * Hook to initialize notifications from API and set up WebSocket connection
 */
export function useInitializeNotifications() {
  const { isAuthenticated, user } = useAuthStore()
  const { data: notifications = [], isLoading } = useNotifications()
  const { connect, disconnect } = useNotificationWebSocket()
  const { clearAll, addNotification } = useNotificationsStore()
  
  // Log user info
  useEffect(() => {
    console.log('👤 useInitializeNotifications: User info', {
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email,
    })
  }, [isAuthenticated, user])

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

  // Sync API notifications to store - replace all with backend data
  useEffect(() => {
    console.log('🔄 useInitializeNotifications: Effect triggered', {
      isLoading,
      isAuthenticated,
      notificationsIsArray: Array.isArray(notifications),
      notificationsLength: Array.isArray(notifications) ? notifications.length : 'not an array',
      notificationsType: typeof notifications,
    })
    
    if (!isLoading && isAuthenticated) {
      console.log('📥 useInitializeNotifications: API data received', {
        isLoading,
        isAuthenticated,
        userId: user?.id,
        userEmail: user?.email,
        notificationsCount: Array.isArray(notifications) ? notifications.length : 0,
        notifications: notifications,
      })
      
      // Always sync with backend - replace store with API data
      console.log('🧹 Clearing store...')
      clearAll()
      
      // Small delay to ensure clearAll completes
      setTimeout(() => {
        if (Array.isArray(notifications) && notifications.length > 0) {
          console.log(`📥 Loading ${notifications.length} notifications from API`)
          // Add all notifications from API
          notifications.forEach((notif: ApiNotification, index: number) => {
            console.log(`  [${index}] Processing notification:`, {
              id: notif.id,
              title: notif.title,
              type: notif.type,
            })
            
            const notificationId = String(notif.id || '')
            addNotification({
              type: mapNotificationType(notif.type || 'other'),
              title: notif.title || '',
              message: notif.message || '',
              isRead: Boolean(notif.is_read),
              link: notif.related_ad_slug ? `/ads/${notif.related_ad_slug}` : undefined,
              adId: notif.related_ad ? String(notif.related_ad) : undefined,
              avatar: notif.related_user_name ? undefined : undefined, // Can add avatar later if needed
            })
          })
          
          // Verify notifications were added
          setTimeout(() => {
            const store = useNotificationsStore.getState()
            console.log(`✅ Loaded notifications. Store now has: ${store.notifications.length} notifications`)
            console.log('📋 Store notifications:', store.notifications)
          }, 100)
        } else {
          console.log('📭 No notifications to load from API. Data:', notifications)
          console.log('📭 Data type:', typeof notifications)
          console.log('📭 Is array?', Array.isArray(notifications))
        }
      }, 50)
    } else if (!isAuthenticated) {
      // Clear notifications when user logs out
      console.log('🚪 User not authenticated, clearing notifications')
      clearAll()
    }
  }, [notifications, isLoading, isAuthenticated, user, addNotification, clearAll])

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

