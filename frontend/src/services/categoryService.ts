/**
 * Category Service
 * 
 * This service handles all category-related API calls.
 * Currently uses mock data, but structured to easily switch to real API.
 * 
 * When backend is ready, replace the mock implementations with actual API calls.
 */

import { Category, CategoryTree, CategoryListResponse, CategoryTreeResponse, CategoryFilters, CategoryRequest } from '@/types/category'

// Base API URL - will be replaced with actual backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * Fetch all categories with optional filters
 * 
 * @param filters - Optional filters for categories
 * @returns Promise with category list
 */
export async function fetchCategories(filters?: CategoryFilters): Promise<CategoryListResponse> {
  // TODO: Replace with actual API call when backend is ready
  // const response = await fetch(`${API_BASE_URL}/categories?${new URLSearchParams(filters as any)}`)
  // return response.json()
  
  // Mock implementation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        categories: [],
        total: 0
      })
    }, 100)
  })
}

/**
 * Fetch category by ID
 * 
 * @param id - Category ID
 * @param includeChildren - Whether to include subcategories
 * @returns Promise with category
 */
export async function fetchCategoryById(id: string, includeChildren: boolean = false): Promise<Category | null> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/categories/${id}?includeChildren=${includeChildren}`)
  // return response.json()
  
  return null
}

/**
 * Fetch category by slug
 * 
 * @param slug - Category slug
 * @param includeChildren - Whether to include subcategories
 * @returns Promise with category
 */
export async function fetchCategoryBySlug(slug: string, includeChildren: boolean = false): Promise<Category | null> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}?includeChildren=${includeChildren}`)
  // return response.json()
  
  return null
}

/**
 * Fetch category tree (hierarchical structure)
 * 
 * @param rootOnly - If true, only return root categories
 * @returns Promise with category tree
 */
export async function fetchCategoryTree(rootOnly: boolean = false): Promise<CategoryTreeResponse> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/categories/tree?rootOnly=${rootOnly}`)
  // return response.json()
  
  return {
    tree: []
  }
}

/**
 * Fetch root categories (main categories only)
 * 
 * @returns Promise with root categories
 */
export async function fetchRootCategories(): Promise<Category[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/categories?parentId=null&status=active`)
  // return response.json()
  
  return []
}

/**
 * Fetch subcategories for a parent category
 * 
 * @param parentId - Parent category ID
 * @returns Promise with subcategories
 */
export async function fetchSubcategories(parentId: string): Promise<Category[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/categories?parentId=${parentId}&status=active`)
  // return response.json()
  
  return []
}

/**
 * Request a new category (user request)
 * 
 * @param request - Category request data
 * @returns Promise with created request
 */
export async function requestCategory(request: Omit<CategoryRequest, 'id' | 'status' | 'createdAt'>): Promise<CategoryRequest> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/categories/requests`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request)
  // })
  // return response.json()
  
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
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/breadcrumbs`)
  // return response.json()
  
  return []
}

/**
 * Search categories by name
 * 
 * @param query - Search query
 * @param limit - Maximum results
 * @returns Promise with matching categories
 */
export async function searchCategories(query: string, limit: number = 10): Promise<Category[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/categories/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  // return response.json()
  
  return []
}

