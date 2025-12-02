"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminStats, type PaginatedResponse, type AdminUser, type AdminAd, type AdminCategory, type AdminNotification, type AdminChat, type AdminMessage } from '@/api/admin'
import { toast } from 'sonner'

// Statistics
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 60000, // Refetch every minute
  })
}

// Users
export function useAdminUsers(params?: {
  page?: number
  search?: string
  is_active?: boolean
  is_seller?: boolean
  is_staff?: boolean
}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
  })
}

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminApi.getUser(id),
    enabled: !!id,
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminUser> }) =>
      adminApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update user')
    },
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete user')
    },
  })
}

// Ads
export function useAdminAds(params?: {
  page?: number
  search?: string
  status?: string
  ad_type?: string
  category?: string
}) {
  return useQuery({
    queryKey: ['admin', 'ads', params],
    queryFn: () => adminApi.getAds(params),
  })
}

export function useAdminAd(id: string) {
  return useQuery({
    queryKey: ['admin', 'ads', id],
    queryFn: () => adminApi.getAd(id),
    enabled: !!id,
  })
}

export function useUpdateAdminAd() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminAd> }) =>
      adminApi.updateAd(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ads'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'ads', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Ad updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update ad')
    },
  })
}

export function useDeleteAdminAd() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ads'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Ad deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete ad')
    },
  })
}

// Categories
export function useAdminCategories(params?: {
  page?: number
  search?: string
  is_active?: boolean
  category_type?: string
}) {
  return useQuery({
    queryKey: ['admin', 'categories', params],
    queryFn: () => adminApi.getCategories(params),
  })
}

export function useAdminCategory(id: number) {
  return useQuery({
    queryKey: ['admin', 'categories', id],
    queryFn: () => adminApi.getCategory(id),
    enabled: !!id,
  })
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<AdminCategory>) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Category created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create category')
    },
  })
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminCategory> }) =>
      adminApi.updateCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Category updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update category')
    },
  })
}

export function useDeleteAdminCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Category deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete category')
    },
  })
}

// Notifications
export function useAdminNotifications(params?: {
  page?: number
  search?: string
  type?: string
  is_read?: boolean
}) {
  return useQuery({
    queryKey: ['admin', 'notifications', params],
    queryFn: () => adminApi.getNotifications(params),
  })
}

export function useUpdateAdminNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminNotification> }) =>
      adminApi.updateNotification(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Notification updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update notification')
    },
  })
}

export function useDeleteAdminNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Notification deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete notification')
    },
  })
}

// Chats
export function useAdminChats(params?: {
  page?: number
  search?: string
}) {
  return useQuery({
    queryKey: ['admin', 'chats', params],
    queryFn: () => adminApi.getChats(params),
  })
}

// Get chat count for a specific ad
export function useAdminAdChatCount(adId?: string) {
  return useQuery({
    queryKey: ['admin', 'chats', 'count', adId],
    queryFn: async () => {
      if (!adId) return 0
      // Fetch chats and filter by ad ID on frontend
      // Note: Backend doesn't support filtering by ad yet, so we fetch and filter
      // For efficiency, we'll fetch multiple pages but limit to reasonable amount
      let allChats: AdminChat[] = []
      let currentPage = 1
      const maxPages = 5 // Limit to 5 pages (125 chats) to avoid excessive API calls
      
      while (currentPage <= maxPages) {
        const response = await adminApi.getChats({ page: currentPage })
        const chats = response.results || []
        allChats = [...allChats, ...chats]
        
        // If no more pages, break
        if (!response.next || chats.length === 0) break
        currentPage++
      }
      
      // Filter chats by ad ID
      return allChats.filter(chat => chat.ad === adId).length
    },
    enabled: !!adId,
    staleTime: 30000, // Cache for 30 seconds
  })
}

export function useDeleteAdminChat() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteChat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Chat deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete chat')
    },
  })
}

// Messages
export function useAdminMessages(params?: {
  page?: number
  search?: string
  is_read?: boolean
}) {
  return useQuery({
    queryKey: ['admin', 'messages', params],
    queryFn: () => adminApi.getMessages(params),
  })
}

export function useDeleteAdminMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Message deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete message')
    },
  })
}


