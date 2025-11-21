const baseSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
const fallbackCdn = baseSiteUrl ? `${baseSiteUrl}/cdn/categories.json` : '/cdn/categories.json'
const CDN_URL = process.env.NEXT_PUBLIC_CATEGORIES_CDN_URL || fallbackCdn

export interface CategoryNode {
  id: string
  name: string
  slug: string
  icon?: string
  imageUrl?: string
  type: 'product' | 'service' | 'job' | 'cv'
  category_type?: 'product' | 'service' | 'job' | 'cv' // Alternative field name
  description?: string
  customFields?: string[] | any[] // Supports both old format (string[]) and new format (CustomFieldConfig[])
  custom_fields?: string[] | any[]
  children?: CategoryNode[] // Backend format
  subcategories?: CategoryNode[] // CDN format
  count?: number // Ad count for this category
}

export const categoriesApi = {
  async getTree(): Promise<CategoryNode[]> {
    const response = await fetch(CDN_URL, { cache: 'no-cache' })
    if (!response.ok) {
      throw new Error(`Failed to load categories (${response.status})`)
    }
    return response.json()
  },
}


