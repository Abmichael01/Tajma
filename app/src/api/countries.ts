import apiClient from './apiClient'

export interface BaseCountry {
  id: number
  name: string
  code: string
  flag_emoji?: string
}

export interface Country {
  id: number
  name: string
  slug?: string
  level?: number
  parent?: number | null
  country?: number | BaseCountry
  subdivision_type?: string
  full_name?: string
  adsCount: number
}

export interface CountryDetail extends Country {
  is_active: boolean
  sort_order: number
  ads: any[]
}

export const countriesApi = {
  async list(parentId?: number | null, level?: number, countryId?: number): Promise<Country[]> {
    const params: any = {}
    if (parentId !== undefined) params.parent = parentId
    if (level !== undefined) params.level = level
    if (countryId !== undefined) params.country = countryId
    
    const response = await apiClient.get<Country[]>('/regions/', { params })
    return response.data
  },
  async get(slug: string): Promise<CountryDetail> {
    const response = await apiClient.get<CountryDetail>(`/regions/${slug}/`)
    return response.data
  },
  async countries(): Promise<BaseCountry[]> {
    // Countries endpoint returns a paginated response
    const response = await apiClient.get<{ results: BaseCountry[] }>('/countries/')
    return response.data.results || []
  },
}
