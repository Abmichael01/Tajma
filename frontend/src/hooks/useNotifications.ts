import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'
import { useAuthStore } from '@/store/authStore'
import type { CreateNotificationRequest } from '@/api/types'

// ============================================================================
// QUERIES - Fetching Notification Data
// ============================================================================

/**
 * Fetch notifications for the current user
 */
export const useNotifications = (params?: { is_read?: boolean }) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const data = await notificationsApi.list(params)
      console.log('📥 useNotifications: API returned data', {
        params,
        count: Array.isArray(data) ? data.length : 0,
        data: data,
      })
      return data
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Fetch unread notification count
 */
export const useUnreadNotificationCount = () => {
  const { isAuthenticated } = useAuthStore()
  
  return useQuery({
    queryKey: ['notifications', 'unread_count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: isAuthenticated, // Only fetch if user is authenticated
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Fetch a single notification
 */
export const useNotification = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: () => notificationsApi.get(id),
    enabled: enabled && !!id,
  })
}

// ============================================================================
// MUTATIONS - Creating, Updating, Deleting Notifications
// ============================================================================

/**
 * Create a new notification (admin/system use)
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateNotificationRequest) => notificationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread_count'] })
    },
  })
}

/**
 * Mark notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread_count'] })
    },
  })
}

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread_count'] })
    },
  })
}

/**
 * Delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread_count'] })
    },
  })
}

/**
 * Delete all notifications
 */
export const useClearAllNotifications = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread_count'] })
    },
  })
}
