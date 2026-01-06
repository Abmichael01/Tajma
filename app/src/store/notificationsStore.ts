import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Notification {
  id: string
  type: 'message' | 'view' | 'favorite' | 'offer' | 'system' | 'phone_view'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  link?: string
  avatar?: string
  adId?: string
}

interface NotificationsState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
  clearAll: () => void
  getUnreadCount: () => number
  getNotifications: () => Notification[]
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          isRead: notification.isRead ?? false,
        }
        set((state) => {
          // Check if notification already exists (avoid duplicates)
          const exists = state.notifications.some(n => n.id === newNotification.id)
          if (exists) {
            return state
          }
          const updated = [newNotification, ...state.notifications]
          // Optional: Limit size to avoid too much storage usage, e.g., 50 notifications
          return {
            notifications: updated.slice(0, 50)
          }
        })
      },

      markAsRead: (notificationId: string) => {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notif) => ({ ...notif, isRead: true }))
        }))
      },

      deleteNotification: (notificationId: string) => {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== notificationId)
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },

      getUnreadCount: () => {
        return get().notifications.filter((notif) => !notif.isRead).length
      },

      getNotifications: () => {
        // Return notifications sorted by timestamp (newest first)
        return [...get().notifications].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }
    }),
    {
      name: 'tajma-notifications-storage',
      storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for React Native
    }
  )
)
