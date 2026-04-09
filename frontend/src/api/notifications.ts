import apiClient from './apiClient'
import type { Notification, CreateNotificationRequest } from './types'

export const notificationsApi = {
  /**
   * Create a new notification (admin/system use)
   */
  async create(payload: CreateNotificationRequest) {
    // Check if user is authenticated before making request
    if (typeof window !== 'undefined') {
      const { useAuthStore } = await import('@/store/authStore')
      const { isAuthenticated } = useAuthStore.getState()
      if (!isAuthenticated) {
        console.warn('⚠️ API: Cannot create notification - user not authenticated')
        return Promise.reject(new Error('User not authenticated'))
      }
    }
    
    console.log('📤 API: Creating notification with payload:', payload)
    try {
      const response = await apiClient.post<Notification>('/notifications/', payload)
      console.log('✅ API: Notification created successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API: Failed to create notification:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      throw error
    }
  },

  /**
   * List notifications for current user
   * @param params - Query parameters (is_read)
   */
  async list(params?: { is_read?: boolean }) {
    console.log('📤 API: Fetching notifications with params:', params)
    const response = await apiClient.get<Notification[] | { count: number; next: string | null; previous: string | null; results: Notification[] }>('/notifications/', { params })
    
    // Handle paginated response (DRF format)
    let notifications: Notification[]
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      // Paginated response
      notifications = (response.data as { results: Notification[] }).results
      console.log('✅ API: Notifications fetched (paginated):', {
        total: (response.data as { count: number }).count,
        returned: notifications.length,
        data: notifications,
      })
    } else if (Array.isArray(response.data)) {
      // Direct array response
      notifications = response.data
      console.log('✅ API: Notifications fetched (array):', {
        count: notifications.length,
        data: notifications,
      })
    } else {
      console.warn('⚠️ API: Unexpected response format:', response.data)
      notifications = []
    }
    
    return notifications
  },

  /**
   * Get a single notification
   */
  async get(id: string) {
    const response = await apiClient.get<Notification>(`/notifications/${id}/`)
    return response.data
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    const response = await apiClient.post<Notification>(`/notifications/${notificationId}/read/`)
    return response.data
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await apiClient.post<{ message: string; count: number }>('/notifications/mark_all_read/')
    return response.data
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    const response = await apiClient.get<{ count: number }>('/notifications/unread_count/')
    return response.data
  },

  /**
   * Delete a notification
   */
  async remove(id: string) {
    return apiClient.delete(`/notifications/${id}/`).then(() => undefined)
  },

  /**
   * Delete all notifications
   */
  async clearAll() {
    const response = await apiClient.delete<{ message: string; count: number }>('/notifications/clear_all/')
    return response.data
  },
}
