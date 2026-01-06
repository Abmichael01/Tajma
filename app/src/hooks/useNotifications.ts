import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi, type Notification } from '@/api/notifications'
import { useAuthStore } from '@/store/authStore'

export const useNotifications = (params?: { is_read?: boolean }) => {
  const { isAuthenticated } = useAuthStore()
  
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.list(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useUnreadNotificationCount = () => {
  const { isAuthenticated } = useAuthStore()
  
  return useQuery({
    queryKey: ['notifications', 'unread_count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export const useNotification = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: () => notificationsApi.get(id),
    enabled: enabled && !!id,
  })
}

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

