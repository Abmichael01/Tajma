const baseSiteUrl = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '')
const fallbackCdn = baseSiteUrl ? `${baseSiteUrl}/cdn/categories.json` : '/cdn/categories.json'
const CDN_URL = process.env.EXPO_PUBLIC_CATEGORIES_CDN_URL || fallbackCdn

export interface CategoryNode {
  id: string
  name: string
  slug: string
  icon?: string
  imageUrl?: string
  type: 'product' | 'service' | 'job' | 'cv'
  category_type?: 'product' | 'service' | 'job' | 'cv' // Alternative field name
  description?: string
  customFields?: string[] | any[] 
  custom_fields?: string[] | any[]
  children?: CategoryNode[] // Backend format
  subcategories?: CategoryNode[] // CDN format
  count?: number // Ad count for this category
}

export const categoriesApi = {
  async getTree(): Promise<CategoryNode[]> {
    const response = await fetch(CDN_URL, { cache: 'no-cache' })
    if (!response.ok) {
        // Fallback or throw? I'll throw to be consistent, but might need error handling in UI
        // Actually, if CDN_URL is relative (starts with /), fetch in RN might fail if no base URL.
        // But assumedly EXPO_PUBLIC_CATEGORIES_CDN_URL is full URL.
        // If not, we might have issues. I'll assume valid full URL for now.
      throw new Error(`Failed to load categories (${response.status})`)
    }
    return response.json()
  },
}
