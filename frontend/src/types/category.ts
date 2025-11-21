/**
 * Category Type Definitions
 * 
 * This file defines the category data structures that will be used
 * throughout the application and will match the backend API structure.
 * 
 * The category model uses a self-referential hierarchical structure,
 * allowing categories to have parent categories (for subcategories).
 */

/**
 * Category Status
 * - active: Category is live and can be used
 * - inactive: Category is hidden but not deleted
 * - pending: Category request is awaiting admin approval
 * - rejected: Category request was rejected by admin
 */
export type CategoryStatus = 'active' | 'inactive' | 'pending' | 'rejected'

/**
 * Category Type
 * - product: For physical products/items
 * - service: For services
 * - job: For job postings (employers hiring)
 * - cv: For CV ads (job seekers posting their CVs)
 */
export type CategoryType = 'product' | 'service' | 'job' | 'cv'

/**
 * Main Category Interface
 * 
 * This represents a category in the hierarchical structure.
 * Categories can be parent categories (main categories) or
 * child categories (subcategories).
 */
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
  
  // Custom fields configuration - supports both old format (string[]) and new format (CustomFieldConfig[])
  customFields?: string[] | any[] // Fields required for this category (can be string[] or CustomFieldConfig[])
  custom_fields?: string[] | any[] // Alternative field name
  requiredFields?: string[] // Fields that must be filled
  
  // Statistics (from backend)
  adsCount?: number // Number of active ads in this category
  subcategoriesCount?: number // Number of subcategories
  
  // Timestamps
  createdAt: string
  updatedAt: string
  createdBy?: string // Admin user ID who created it
  approvedBy?: string // Admin user ID who approved it (if requested)
  approvedAt?: string
  
  // User request fields (if category was requested by user)
  requestedBy?: string // User ID who requested this category
  requestReason?: string // Why user requested this category
}

/**
 * Category Request Interface
 * 
 * Used when users request new categories
 */
export interface CategoryRequest {
  id: string
  name: string
  description?: string
  parentId: string | null // Which category it should be under
  type: CategoryType
  requestedBy: string // User ID
  requestReason?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedBy?: string // Admin who reviewed
  reviewedAt?: string
  reviewNotes?: string
}

/**
 * Category Tree Structure
 * 
 * Used for displaying hierarchical category navigation
 */
export interface CategoryTree extends Category {
  children: CategoryTree[]
  hasChildren: boolean
}

/**
 * Category Filter Options
 */
export interface CategoryFilters {
  type?: CategoryType
  status?: CategoryStatus
  parentId?: string | null // null for root categories only
  search?: string
}

/**
 * Category API Response
 */
export interface CategoryListResponse {
  categories: Category[]
  total: number
  page?: number
  limit?: number
}

/**
 * Category Tree Response
 */
export interface CategoryTreeResponse {
  tree: CategoryTree[]
}

/**
 * Helper type for category selection in forms
 */
export interface CategoryOption {
  value: string
  label: string
  icon?: string
  type: CategoryType
  level: number
  parentId: string | null
}

