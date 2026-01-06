import apiClient from './apiClient'

// Paginated response type from DRF
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const adsApi = {
  async list(params?: Record<string, any>) {
    const response = await apiClient.get<any>('/ads/', { params })
    
    // Handle paginated response (DRF wraps results in { results: [...], count: N })
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      const paginatedData = response.data as PaginatedResponse<any>
      return paginatedData.results
    }
    
    // Handle direct array response (if pagination is disabled)
    if (Array.isArray(response.data)) {
      return response.data
    }
    
    return []
  },

  async get(slug: string) {
    const response = await apiClient.get<any>(`/ads/${slug}/`)
    return response.data
  },

  async create(payload: any) {
    const response = await apiClient.post<any>('/ads/', payload)
    return response.data
  },

  async update(slug: string, payload: any) {
    const response = await apiClient.patch<any>(`/ads/${slug}/`, payload)
    return response.data
  },

  async remove(slug: string) {
    await apiClient.delete(`/ads/${slug}/`)
  },
}


