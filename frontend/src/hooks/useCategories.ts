/**
 * useCategories Hook
 * 
 * React hook for managing categories throughout the application.
 * Uses React Query for caching and automatic refetching.
 * 
 * Usage:
 *   const { categories, loading, error, getCategoryById } = useCategories()
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { Category, CategoryTree } from '@/types/category'
import { categoriesApi, CategoryNode } from '@/api/categories'

interface UseCategoriesOptions {
  autoFetch?: boolean
  includeInactive?: boolean
}

interface UseCategoriesReturn {
  categories: Category[]
  categoryTree: CategoryTree[]
  rootCategories: Category[]
  loading: boolean
  error: string | null
  getCategoryById: (id: string) => Category | undefined
  getCategoryBySlug: (slug: string) => Category | undefined
  getSubcategories: (parentId: string) => Category[]
  refreshCategories: () => Promise<void>
  loadCategoryTree: () => Promise<void>
}

const timestamp = () => new Date().toISOString()

const convertNode = (
  node: CategoryNode,
  parentId: string | null,
  level: number,
  flat: Category[]
): CategoryTree => {
  // Handle both 'children' (backend) and 'subcategories' (CDN) formats
  const childNodes = node.children || node.subcategories || []
  const children = childNodes.map((child: CategoryNode) =>
    convertNode(child, node.id, level + 1, flat)
  )

  const base: CategoryTree = {
    id: node.id,
    name: node.name,
    slug: node.slug || node.id,
    description: node.description,
    icon: node.icon,
    imageUrl: (node as any).imageUrl,
    parentId,
    type: node.type || node.category_type || 'product', // Use type from CDN data
    status: 'active',
    level,
    displayOrder: 0,
    customFields: node.customFields || node.custom_fields || [],
    adsCount: node.count || 0, // Use count from JSON if available
    subcategoriesCount: children.length,
    createdAt: timestamp(),
    updatedAt: timestamp(),
    children,
    hasChildren: children.length > 0,
  }

  flat.push({
    ...base,
    children: [],
    hasChildren: base.hasChildren,
  })

  return base
}

const normalizeNodes = (nodes: CategoryNode[]) => {
  const flat: Category[] = []
  const tree = nodes.map((node) => convertNode(node, null, 0, flat))
  const rootCategories = flat.filter((cat) => cat.parentId === null)
  return { flat, tree, rootCategories }
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { autoFetch = true } = options
  const queryClient = useQueryClient()
  
  // Use React Query to fetch and cache categories
  const { data: cdnTree, isLoading, error: queryError } = useQuery<CategoryNode[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getTree(),
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([])
  const [rootCategories, setRootCategories] = useState<Category[]>([])
  
  const loadFromNodes = useCallback((nodes: CategoryNode[]) => {
    const { flat, tree, rootCategories } = normalizeNodes(nodes)
    setCategories(flat)
    setCategoryTree(tree)
    setRootCategories(rootCategories)
  }, [])

  // Update local state when React Query data changes
  useEffect(() => {
    if (cdnTree && Array.isArray(cdnTree)) {
      loadFromNodes(cdnTree)
    }
  }, [cdnTree, loadFromNodes])

  const loadCategories = useCallback(async () => {
    // Invalidate and refetch using React Query
    await queryClient.invalidateQueries({ queryKey: ['categories'] })
  }, [queryClient])
  
  const loadCategoryTree = useCallback(async () => {
    // Category tree is already built from the CDN data
    // This function is kept for backward compatibility
    if (categoryTree.length === 0 && cdnTree && Array.isArray(cdnTree)) {
      loadFromNodes(cdnTree)
    }
  }, [categoryTree, cdnTree, loadFromNodes])
  
  // Get category by ID
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return categories.find(cat => cat.id === id)
  }, [categories])
  
  // Get category by slug
  const getCategoryBySlug = useCallback((slug: string): Category | undefined => {
    return categories.find(cat => cat.slug === slug)
  }, [categories])
  
  // Get subcategories
  const getSubcategories = useCallback((parentId: string): Category[] => {
    return categories.filter(cat => cat.parentId === parentId)
  }, [categories])
  
  return {
    categories,
    categoryTree,
    rootCategories,
    loading: isLoading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Unable to load categories. Please try again.') : null,
    getCategoryById,
    getCategoryBySlug,
    getSubcategories,
    refreshCategories: loadCategories,
    loadCategoryTree
  }
}

/**
 * Hook for fetching a single category
 */
