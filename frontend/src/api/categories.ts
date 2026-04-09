import apiClient from './apiClient'

export interface CategoryNode {
  id: string
  name: string
  slug: string
  icon?: string
  imageUrl?: string
  image_url?: string
  type?: 'product' | 'service' | 'job' | 'cv'
  category_type?: 'product' | 'service' | 'job' | 'cv'
  description?: string
  customFields?: string[] | any[]
  custom_fields?: string[] | any[]
  children?: CategoryNode[]
  subcategories?: CategoryNode[]
  count?: number
}

export const categoriesApi = {
  async getTree(): Promise<CategoryNode[]> {
    const response = await apiClient.get<CategoryNode[]>('/categories/tree/')
    return response.data
  },
}
