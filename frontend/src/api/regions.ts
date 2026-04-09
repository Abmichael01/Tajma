import apiClient from './apiClient'

export interface Region {
  id: number
  name: string
  slug?: string
  level?: number
  parent?: number | null
  adsCount: number
}

export interface RegionDetail extends Region {
  is_active: boolean
  sort_order: number
  ads: any[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface RegionParams {
  page?: number
  search?: string
  level?: number | 'all'
  parent?: number | null
  ordering?: string
}

export const regionsApi = {
  async list(params?: RegionParams): Promise<PaginatedResponse<Region>> {
    const apiParams: any = { ...params }
    if (apiParams.level === 'all') delete apiParams.level
    
    const response = await apiClient.get<PaginatedResponse<Region>>('/regions/', { params: apiParams })
    return response.data
  },
  async get(slug: string): Promise<RegionDetail> {
    const response = await apiClient.get<RegionDetail>(`/regions/${slug}/`)
    return response.data
  },
}

