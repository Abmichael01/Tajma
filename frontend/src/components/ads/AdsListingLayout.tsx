'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FiltersSection, { FilterGroup } from '@/components/ui/FiltersSection'
import AdsList from '@/components/Home/AdsList'
import AdsListSkeleton from '@/components/ui/AdsListSkeleton'
import { useAdsList } from '@/hooks/useAds'
import { useCategories } from '@/hooks/useCategories'
import { searchFilters, getFiltersByCategory } from '@/data/filterConfigs'
import type { Ad } from '@/api/types'

interface AdsListingLayoutProps {
  initialFilters?: {
    search?: string
    categorySlug?: string
    adType?: string
    [key: string]: any
  }
  title?: string
  subtitle?: string
  mode?: 'search' | 'category'
}

export default function AdsListingLayout({
  initialFilters = {},
  title,
  subtitle,
  mode = 'search',
}: AdsListingLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { categoryTree } = useCategories()

  // Filter state - map categorySlug to category for internal use
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    const categorySlug = initialFilters.categorySlug || searchParams.get('category') || ''
    return {
      search: initialFilters.search || searchParams.get('q') || '',
      ...initialFilters,
      // Override category with categorySlug if provided
      category: categorySlug || initialFilters.category || '',
    }
  })

  // Build filter groups based on mode and category
  const filterGroups: FilterGroup[] = useMemo(() => {
    if (mode === 'category' && filters.category) {
      // Use category-specific filters for this category (price, condition, etc.)
      // but avoid showing a top-level "Categories" selector on category pages.
      const groups = getFiltersByCategory(filters.category)
      return groups.filter((group) => group.id !== 'category')
    }
    // Search page: show all search filters, including category selector
    return searchFilters
  }, [mode, filters.category])

  // Build API params from filters
  const apiParams = useMemo(() => {
    const params: Record<string, any> = {
      status: 'published',
    }

    // Add search query
    if (filters.search) {
      params.search = filters.search
    }

    // Add category filter
    if (filters.category) {
      params.category = filters.category
    }

    // Add ad type filter
    if (filters.adType) {
      params.ad_type = filters.adType
    }

    // Add price range filter
    if (filters.price && filters.price !== 'any') {
      const priceRange = filters.price as string
      // Parse price range: "0-50000", "50000-200000", "1000000+", etc.
      if (priceRange.includes('-')) {
        const [min, max] = priceRange.split('-').map(p => parseInt(p.replace(/[₦,]/g, ''), 10))
        if (!isNaN(min)) params.min_price = min
        if (!isNaN(max)) params.max_price = max
      } else if (priceRange.endsWith('+')) {
        // Handle "1000000+" format
        const min = parseInt(priceRange.replace(/[₦,+]/g, ''), 10)
        if (!isNaN(min)) params.min_price = min
      }
    }

    // Add location filter
    if (filters.location && Array.isArray(filters.location) && filters.location.length > 0) {
      // If multiple locations selected, we'll filter by the first one
      // Backend can be extended to support multiple locations if needed
      params.seller_location = filters.location[0]
    } else if (filters.location && typeof filters.location === 'string') {
      params.seller_location = filters.location
    }

    return params
  }, [filters])

  // Fetch ads
  const { data: ads, isLoading, error } = useAdsList(apiParams)

  // Handle filter changes
  const handleFilterChange = (
    filterId: string,
    value: string | string[],
    action?: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }))

    // Update URL if it's a category navigation
    if (action && action.startsWith('/category/')) {
      router.push(action)
    }
  }

  // Update filters when URL changes (for category navigation)
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    const searchFromUrl = searchParams.get('q')
    
    if (categoryFromUrl !== filters.category || searchFromUrl !== filters.search) {
      setFilters((prev) => ({
        ...prev,
        category: categoryFromUrl || prev.category,
        search: searchFromUrl || prev.search,
      }))
    }
  }, [searchParams, filters.category, filters.search])

  // Get category name for display
  const categoryName = useMemo(() => {
    if (!filters.category || !categoryTree) return null

    const findCategory = (categories: any[], slug: string): any => {
      for (const cat of categories) {
        if (cat.slug === slug) return cat
        if (cat.children || cat.subcategories) {
          const found = findCategory(cat.children || cat.subcategories || [], slug)
          if (found) return found
        }
      }
      return null
    }

    return findCategory(categoryTree, filters.category)
  }, [filters.category, categoryTree])

  return (
    <div className="bg-white min-h-screen">
      <div className="container py-4 sm:py-6 lg:py-8">
        {/* Page Header */}
        {(title || subtitle || categoryName) && (
          <div className="mb-6">
            {title && (
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">
                {title}
              </h1>
            )}
            {!title && categoryName && (
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">
                {categoryName.name}
              </h1>
            )}
            {subtitle && (
              <p className="text-base text-gray-600">{subtitle}</p>
            )}
            {!subtitle && categoryName && categoryName.description && (
              <p className="text-base text-gray-600">{categoryName.description}</p>
            )}
          </div>
        )}

        {/* Main Layout: Filters + Ads */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar: Filters */}
          <div className="lg:w-[300px] flex-shrink-0">
            <FiltersSection
              filters={filterGroups}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Right Content: Ads Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <AdsListSkeleton columns={4} count={12} />
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-gray-600 mb-4">
                  Unable to load ads. Please try again later.
                </p>
              </div>
            ) : !ads || ads.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-600 mb-4">
                  {filters.search
                    ? `No ads found for "${filters.search}"`
                    : categoryName
                    ? `No ads found in ${categoryName.name}`
                    : 'No ads found'}
                </p>
                <p className="text-sm text-gray-500">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <AdsList ads={ads as Ad[]} columns={4} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

