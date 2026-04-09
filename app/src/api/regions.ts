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

export const regionsApi = {
  async list(parentId?: number | null, level?: number): Promise<Region[]> {
    const params: any = {}
    if (parentId !== undefined) params.parent = parentId
    if (level !== undefined) params.level = level
    
    const response = await apiClient.get<Region[]>('/regions/', { params })
    return response.data
  },
  async get(slug: string): Promise<RegionDetail> {
    const response = await apiClient.get<RegionDetail>(`/regions/${slug}/`)
    return response.data
  },
}
