import apiClient from './apiClient'

export interface Region {
  id: number
  name: string
  slug?: string
  adsCount: number
}

export interface RegionDetail extends Region {
  is_active: boolean
  sort_order: number
  ads: any[]
}

export const regionsApi = {
  async list(): Promise<Region[]> {
    const response = await apiClient.get<Region[]>('/regions/')
    return response.data
  },
  async get(slug: string): Promise<RegionDetail> {
    const response = await apiClient.get<RegionDetail>(`/regions/${slug}/`)
    return response.data
  },
}
