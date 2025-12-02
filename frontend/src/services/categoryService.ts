/**
 * Category Service
 * 
 * This service handles all category-related API calls.
 * Connected to real backend API endpoints.
 */

import apiClient from '@/api/apiClient'
import { Category, CategoryTree, CategoryListResponse, CategoryTreeResponse, CategoryFilters, CategoryRequest } from '@/types/category'

/**
 * Fetch all categories with optional filters
 * 
 * @param filters - Optional filters for categories
 * @returns Promise with category list
 */
export async function fetchCategories(filters?: CategoryFilters): Promise<CategoryListResponse> {
  try {
    const response = await apiClient.get<Category[]>('/categories/all/', { params: filters })
    return {
      categories: Array.isArray(response.data) ? response.data : [],
      total: Array.isArray(response.data) ? response.data.length : 0
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return {
      categories: [],
      total: 0
    }
  }
}

/**
 * Fetch category by ID
 * 
 * @param id - Category ID
 * @param includeChildren - Whether to include subcategories
 * @returns Promise with category
 */
export async function fetchCategoryById(id: string, includeChildren: boolean = false): Promise<Category | null> {
  try {
    const response = await apiClient.get<Category>(`/categories/${id}/`)
    return response.data
  } catch (error) {
    console.error('Error fetching category by ID:', error)
    return null
  }
}

/**
 * Fetch category by slug
 * 
 * @param slug - Category slug
 * @param includeChildren - Whether to include subcategories
 * @returns Promise with category
 */
export async function fetchCategoryBySlug(slug: string, includeChildren: boolean = false): Promise<Category | null> {
  try {
    const response = await apiClient.get<Category>(`/categories/${slug}/`)
    return response.data
  } catch (error) {
    console.error('Error fetching category by slug:', error)
    return null
  }
}

/**
 * Fetch category tree (hierarchical structure)
 * 
 * @param rootOnly - If true, only return root categories
 * @returns Promise with category tree
 */
export async function fetchCategoryTree(rootOnly: boolean = false): Promise<CategoryTreeResponse> {
  try {
    const response = await apiClient.get<CategoryTree[]>('/categories/tree/')
    return {
      tree: Array.isArray(response.data) ? response.data : []
    }
  } catch (error) {
    console.error('Error fetching category tree:', error)
    return {
      tree: []
    }
  }
}

/**
 * Fetch root categories (main categories only)
 * 
 * @returns Promise with root categories
 */
export async function fetchRootCategories(): Promise<Category[]> {
  try {
    const response = await apiClient.get<CategoryTree[]>('/categories/tree/')
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('Error fetching root categories:', error)
    return []
  }
}

/**
 * Fetch subcategories for a parent category
 * 
 * @param parentId - Parent category ID
 * @returns Promise with subcategories
 */
export async function fetchSubcategories(parentId: string): Promise<Category[]> {
  try {
    // First get the parent category to access its children
    const parent = await fetchCategoryById(parentId, true)
    if (parent && 'children' in parent) {
      return (parent as any).children || []
    }
    return []
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return []
  }
}

/**
 * Request a new category (user request)
 * 
 * @param request - Category request data
 * @returns Promise with created request
 * 
 * Note: This endpoint doesn't exist in the backend yet. For MVP, this returns a mock response.
 * TODO: Create backend endpoint for category requests.
 */
export async function requestCategory(request: Omit<CategoryRequest, 'id' | 'status' | 'createdAt'>): Promise<CategoryRequest> {
  // Backend endpoint doesn't exist yet - return mock for now
  // TODO: Create /api/categories/requests/ endpoint in backend
  return {
    id: '',
    ...request,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
}

/**
 * Get category breadcrumbs (path from root to category)
 * 
 * @param categoryId - Category ID
 * @returns Promise with breadcrumb path
 */
export async function getCategoryBreadcrumbs(categoryId: string): Promise<Category[]> {
  try {
    // Fetch the category and build breadcrumbs from parent chain
    const category = await fetchCategoryById(categoryId)
    if (!category) return []
    
    const breadcrumbs: Category[] = []
    let current: Category | null = category
    
    // Build breadcrumbs by traversing parent chain
    while (current) {
      breadcrumbs.unshift(current)
      if ('parent' in current && current.parent) {
        current = await fetchCategoryById((current.parent as any).id || current.parent as any)
      } else {
        current = null
      }
    }
    
    return breadcrumbs
  } catch (error) {
    console.error('Error fetching category breadcrumbs:', error)
    return []
  }
}

/**
 * Search categories by name
 * 
 * @param query - Search query
 * @param limit - Maximum results
 * @returns Promise with matching categories
 */
export async function searchCategories(query: string, limit: number = 10): Promise<Category[]> {
  try {
    // Fetch all categories and filter client-side (backend doesn't have search endpoint)
    const response = await apiClient.get<Category[]>('/categories/all/')
    const allCategories = Array.isArray(response.data) ? response.data : []
    
    // Filter by name containing query (case-insensitive)
    const queryLower = query.toLowerCase()
    return allCategories
      .filter(cat => cat.name.toLowerCase().includes(queryLower))
      .slice(0, limit)
  } catch (error) {
    console.error('Error searching categories:', error)
    return []
  }
}

