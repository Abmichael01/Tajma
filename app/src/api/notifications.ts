import apiClient from './apiClient'

export interface Notification {
  id: string
  recipient: number
  type: 'phone_view' | 'message' | 'ad_view' | 'favorite' | 'review' | 'report' | 'ad_status' | 'other'
  title: string
  message: string
  is_read: boolean
  related_ad?: string | null
  related_ad_title?: string | null
  related_ad_slug?: string | null
  related_user?: number | null
  related_user_name?: string | null
  created_at: string
  read_at?: string | null
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const notificationsApi = {
  async list(params?: { is_read?: boolean }) {
    const response = await apiClient.get<Notification[] | PaginatedResponse<Notification>>('/notifications/', { params })
    
    // Handle paginated response
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return (response.data as PaginatedResponse<Notification>).results
    }
    
    // Handle direct array response
    if (Array.isArray(response.data)) {
      return response.data
    }
    
    return []
  },

  async get(id: string) {
    const response = await apiClient.get<Notification>(`/notifications/${id}/`)
    return response.data
  },

  async markAsRead(notificationId: string) {
    const response = await apiClient.post<Notification>(`/notifications/${notificationId}/read/`)
    return response.data
  },

  async markAllAsRead() {
    const response = await apiClient.post<{ message: string; count: number }>('/notifications/mark_all_read/')
    return response.data
  },

  async getUnreadCount() {
    const response = await apiClient.get<{ count: number }>('/notifications/unread_count/')
    return response.data
  },

  async remove(id: string) {
    return apiClient.delete(`/notifications/${id}/`).then(() => undefined)
  },
}

