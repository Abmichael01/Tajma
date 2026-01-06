/**
 * Category Type Definitions
 * 
 * This file defines the category data structures that will be used
 * throughout the application and will match the backend API structure.
 */

export type CategoryStatus = 'active' | 'inactive' | 'pending' | 'rejected'

export type CategoryType = 'product' | 'service' | 'job' | 'cv'

export interface Category {
  // Core fields
  id: string
  name: string
  slug: string // URL-friendly identifier
  description?: string
  icon?: string // Emoji or icon identifier
  imageUrl?: string
  
  // Hierarchy
  parentId: string | null // null for top-level categories
  parent?: Category // Populated when fetching with relations
  children?: Category[] // Subcategories (populated when needed)
  hasChildren?: boolean
  
  // Metadata
  type: CategoryType
  status: CategoryStatus
  level: number // Depth in hierarchy (0 = root, 1 = subcategory, etc.)
  
  // Display & SEO
  displayOrder: number // For sorting categories
  metaTitle?: string
  metaDescription?: string
  
  // Custom fields configuration
  customFields?: string[] | any[] 
  custom_fields?: string[] | any[] 
  requiredFields?: string[] 
  
  // Statistics (from backend)
  adsCount?: number 
  subcategoriesCount?: number 
  
  // Timestamps
  createdAt: string
  updatedAt: string
  createdBy?: string 
  approvedBy?: string 
  approvedAt?: string
  
  // User request fields
  requestedBy?: string 
  requestReason?: string 
}

export interface CategoryRequest {
  id: string
  name: string
  description?: string
  parentId: string | null 
  type: CategoryType
  requestedBy: string 
  requestReason?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedBy?: string 
  reviewedAt?: string
  reviewNotes?: string
}

export interface CategoryTree extends Category {
  children: CategoryTree[]
  hasChildren: boolean
}

export interface CategoryFilters {
  type?: CategoryType
  status?: CategoryStatus
  parentId?: string | null 
  search?: string
}

export interface CategoryListResponse {
  categories: Category[]
  total: number
  page?: number
  limit?: number
}

export interface CategoryTreeResponse {
  tree: CategoryTree[]
}

export interface CategoryOption {
  value: string
  label: string
  icon?: string
  type: CategoryType
  level: number
  parentId: string | null
}
