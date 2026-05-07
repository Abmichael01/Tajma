import apiClient from './apiClient'

export interface Country {
  id: number
  name: string
  code: string
  flag_emoji?: string
}

export interface Location {
  id: number
  name: string
  slug?: string
  level?: number
  parent?: number | null
  country?: number | Country
  subdivision_type?: string
  full_name?: string
  adsCount: number
  sort_order?: number
}

export interface LocationDetail extends Location {
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

export interface LocationParams {
  page?: number
  search?: string
  level?: number | 'all'
  parent?: number | null
  country?: number | null
  ids?: number[] | string
  ordering?: string
}

export const locationsApi = {
  async list(params?: LocationParams): Promise<PaginatedResponse<Location>> {
    const apiParams: any = { ...params }
    if (apiParams.level === 'all') delete apiParams.level
    if (Array.isArray(apiParams.ids)) apiParams.ids = apiParams.ids.join(',')
    
    const response = await apiClient.get<PaginatedResponse<Location>>('/regions/', { params: apiParams })
    return response.data
  },
  async get(slug: string): Promise<LocationDetail> {
    const response = await apiClient.get<LocationDetail>(`/regions/${slug}/`)
    return response.data
  },
  async countries(): Promise<Country[]> {
    const response = await apiClient.get<PaginatedResponse<Country>>('/countries/')
    return response.data.results
  },
}

