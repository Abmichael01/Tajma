import apiClient from './apiClient'
import type { Ad } from './types'

// Paginated response type from DRF
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const savedAdsApi = {
  async list(params?: { page?: number; page_size?: number }) {
    const response = await apiClient.get<Ad[] | PaginatedResponse<Ad>>('/saved-ads/list/', { params })
    
    // Handle paginated response (DRF wraps results in { results: [...], count: N })
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data as PaginatedResponse<Ad>
    }
    
    // Handle direct array response (if pagination is disabled)
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data,
      } as PaginatedResponse<Ad>
    }
    
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    } as PaginatedResponse<Ad>
  },

  async save(adId: string) {
    const response = await apiClient.post<{ message: string; saved: boolean }>(`/saved-ads/${adId}/save/`)
    return response.data
  },

  async unsave(adId: string) {
    const response = await apiClient.delete<{ message: string; saved: boolean }>(`/saved-ads/${adId}/unsave/`)
    return response.data
  },

  async toggle(adId: string) {
    const response = await apiClient.post<{ message: string; saved: boolean; ad: Ad }>(`/saved-ads/${adId}/toggle/`)
    return response.data
  },
}

