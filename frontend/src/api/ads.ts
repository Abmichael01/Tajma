import apiClient from './apiClient'
import type { Ad, CreateAdRequest, UpdateAdRequest } from './types'

// Paginated response type from DRF
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const adsApi = {
  async suggested() {
    const response = await apiClient.get<Ad[]>('/ads/suggested/')
    return response.data
  },

  async trackSearch(query: string) {
    if (!query) return
    await apiClient.post('/track-search/', { q: query })
  },

  async list(params?: Record<string, any>) {
    const response = await apiClient.get<Ad[] | PaginatedResponse<Ad>>('/ads/', { params })
    
    // Handle paginated response (DRF wraps results in { results: [...], count: N })
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      const paginatedData = response.data as PaginatedResponse<Ad>
      return paginatedData.results
    }
    
    // Handle direct array response (if pagination is disabled)
    if (Array.isArray(response.data)) {
      return response.data
    }
    
    return []
  },

  async get(slug: string) {
    const response = await apiClient.get<Ad>(`/ads/${slug}/`)
    return response.data
  },

  async create(payload: CreateAdRequest) {
    const response = await apiClient.post<Ad>('/ads/', payload)
    return response.data
  },

  async update(slug: string, payload: UpdateAdRequest) {
    const response = await apiClient.patch<Ad>(`/ads/${slug}/`, payload)
    return response.data
  },

  async remove(slug: string) {
    await apiClient.delete(`/ads/${slug}/`)
  },
}


