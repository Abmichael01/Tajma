import apiClient from './apiClient'

// Admin API types
export interface AdminStats {
  total_users: number
  total_ads: number
  active_ads: number
  pending_ads: number
  draft_ads: number
  archived_ads: number
  total_categories: number
  active_categories: number
  total_notifications: number
  unread_notifications: number
  total_chats: number
  total_messages: number
  recent_activity_24h: {
    new_users: number
    new_ads: number
    new_messages: number
  }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface AdminUser {
  id: number
  email: string
  username?: string | null
  first_name: string
  last_name: string
  full_name?: string
  avatar?: string | null
  is_active: boolean
  is_seller: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login?: string | null
}

export interface AdminAd {
  id: string
  slug: string
  title: string
  description?: string
  seller: {
    id: number
    email: string
    username?: string | null
    first_name: string
    last_name: string
    avatar?: string | null
  }
  category: string
  category_name?: string
  category_details?: {
    id: number
    name: string
    slug: string
    icon?: string | null
    category_type: string
  }
  ad_type: 'product' | 'service' | 'job' | 'cv'
  price?: string | null
  currency: string
  is_negotiable?: boolean
  attributes?: Record<string, any>
  status: 'draft' | 'published' | 'archived'
  views: number
  images?: string[]
  created_at: string
  updated_at?: string
  published_at?: string | null
}

export interface AdminCategory {
  id: number
  name: string
  slug: string
  parent?: number | null
  parent_name?: string | null
  category_type: 'product' | 'service' | 'job' | 'cv'
  is_active: boolean
  sort_order: number
}

export interface AdminNotification {
  id: string
  recipient: {
    id: number
    email: string
    username?: string | null
    avatar?: string | null
  }
  type: string
  title: string
  message: string
  is_read: boolean
  related_ad?: string | null
  related_ad_title?: string | null
  created_at: string
  read_at?: string | null
}

export interface AdminChat {
  id: string
  participant1: {
    id: number
    email: string
    username?: string | null
    avatar?: string | null
  }
  participant2: {
    id: number
    email: string
    username?: string | null
    avatar?: string | null
  }
  ad?: string | null
  ad_title?: string | null
  last_message_at?: string | null
  created_at: string
  message_count: number
}

export interface AdminMessage {
  id: string
  chat: string
  sender: {
    id: number
    email: string
    username?: string | null
    avatar?: string | null
  }
  content: string
  is_read: boolean
  created_at: string
  read_at?: string | null
}

// Admin API functions
export const adminApi = {
  // Statistics
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get('/admin/stats/')
    return response.data
  },

  // Users
  getUsers: async (params?: {
    page?: number
    search?: string
    is_active?: boolean
    is_seller?: boolean
    is_staff?: boolean
  }): Promise<PaginatedResponse<AdminUser>> => {
    const response = await apiClient.get('/admin/users/', { params })
    return response.data
  },

  getUser: async (id: number): Promise<AdminUser> => {
    const response = await apiClient.get(`/admin/users/${id}/`)
    return response.data
  },

  updateUser: async (id: number, data: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await apiClient.put(`/admin/users/${id}/`, data)
    return response.data
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}/`)
  },

  // Ads
  getAds: async (params?: {
    page?: number
    search?: string
    status?: string
    ad_type?: string
    category?: string
  }): Promise<PaginatedResponse<AdminAd>> => {
    const response = await apiClient.get('/admin/ads/', { params })
    return response.data
  },

  getAd: async (id: string): Promise<AdminAd> => {
    const response = await apiClient.get(`/admin/ads/${id}/`)
    return response.data
  },

  updateAd: async (id: string, data: Partial<AdminAd>): Promise<AdminAd> => {
    // Use PATCH for partial updates (only send changed fields)
    const response = await apiClient.patch(`/admin/ads/${id}/`, data)
    return response.data
  },

  deleteAd: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/ads/${id}/`)
  },

  // Categories
  getCategories: async (params?: {
    page?: number
    search?: string
    is_active?: boolean
    category_type?: string
  }): Promise<PaginatedResponse<AdminCategory>> => {
    const response = await apiClient.get('/admin/categories/', { params })
    return response.data
  },

  getCategory: async (id: number): Promise<AdminCategory> => {
    const response = await apiClient.get(`/admin/categories/${id}/`)
    return response.data
  },

  createCategory: async (data: Partial<AdminCategory>): Promise<AdminCategory> => {
    const response = await apiClient.post('/admin/categories/', data)
    return response.data
  },

  updateCategory: async (id: number, data: Partial<AdminCategory>): Promise<AdminCategory> => {
    const response = await apiClient.put(`/admin/categories/${id}/`, data)
    return response.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}/`)
  },

  // Notifications
  getNotifications: async (params?: {
    page?: number
    search?: string
    type?: string
    is_read?: boolean
  }): Promise<PaginatedResponse<AdminNotification>> => {
    const response = await apiClient.get('/admin/notifications/', { params })
    return response.data
  },

  getNotification: async (id: string): Promise<AdminNotification> => {
    const response = await apiClient.get(`/admin/notifications/${id}/`)
    return response.data
  },

  updateNotification: async (id: string, data: Partial<AdminNotification>): Promise<AdminNotification> => {
    const response = await apiClient.put(`/admin/notifications/${id}/`, data)
    return response.data
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/notifications/${id}/`)
  },

  // Chats
  getChats: async (params?: {
    page?: number
    search?: string
  }): Promise<PaginatedResponse<AdminChat>> => {
    const response = await apiClient.get('/admin/chats/', { params })
    return response.data
  },

  getChat: async (id: string): Promise<AdminChat> => {
    const response = await apiClient.get(`/admin/chats/${id}/`)
    return response.data
  },

  deleteChat: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/chats/${id}/`)
  },

  // Messages
  getMessages: async (params?: {
    page?: number
    search?: string
    is_read?: boolean
  }): Promise<PaginatedResponse<AdminMessage>> => {
    const response = await apiClient.get('/admin/messages/', { params })
    return response.data
  },

  getMessage: async (id: string): Promise<AdminMessage> => {
    const response = await apiClient.get(`/admin/messages/${id}/`)
    return response.data
  },

  deleteMessage: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/messages/${id}/`)
  },
}


