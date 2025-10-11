import { useEffect } from 'react'
import { useNotificationsStore } from '@/store/notificationsStore'
import { mockNotifications } from '@/data/mockNotifications'

// Custom hook to initialize notifications once
let isInitialized = false

export function useInitializeNotifications() {
  useEffect(() => {
    // Only initialize once globally
    if (!isInitialized) {
      const store = useNotificationsStore.getState()
      if (store.notifications.length === 0) {
        useNotificationsStore.setState({
          notifications: mockNotifications
        })
        isInitialized = true
      }
    }
  }, [])
}

