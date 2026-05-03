'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react'
import { cn, getMediaUrl } from '@/lib/utils'
import FiltersSection, { FilterGroup } from '@/components/ui/FiltersSection'
import { Button } from '@/components/ui/button'
import AdsList from '@/components/Home/AdsList'
import AdsListSkeleton from '@/components/ui/AdsListSkeleton'
import BackButton from '@/components/ui/BackButton'
import { useAdsInfiniteList } from '@/hooks/useAds'
import { useCategories } from '@/hooks/useCategories'
import { useLocationStore } from '@/store/locationStore'
import { searchFilters, getFiltersByCategory, getCategoryIcon, getSubcategoryIcon } from '@/data/filterConfigs'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Filter as FilterIcon, ChevronRight } from 'lucide-react'
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
  const { selectedRegion, setSelectedRegion } = useLocationStore()
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Filter state - map categorySlug to category for internal use
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    // Priority: initialFilters.categorySlug > URL category param > initialFilters.category
    const categorySlug = initialFilters.categorySlug || searchParams.get('category') || initialFilters.category || ''
    const minP = initialFilters.min_price || searchParams.get('min_price') || ''
    const maxP = initialFilters.max_price || searchParams.get('max_price') || ''

    let priceRange = ''
    if (minP && maxP) priceRange = `${minP}-${maxP}`
    else if (minP) priceRange = `${minP}+`
    else if (maxP) priceRange = `0-${maxP}`

    return {
      search: initialFilters.search || searchParams.get('q') || '',
      ...initialFilters,
      // Override values for consistency
      category: categorySlug,
      price: initialFilters.price || priceRange || 'any',
    }
  })

  // Find current category from tree
  const currentCategory = useMemo(() => {
    if (!filters.category || !categoryTree) return null

    const findCategoryPath = (categories: any[], slug: string, path: any[] = []): any[] | null => {
      for (const cat of categories) {
        if (cat.slug === slug || String(cat.id) === String(slug)) return [...path, cat]
        if (cat.children || cat.subcategories) {
          const found = findCategoryPath(cat.children || cat.subcategories || [], slug, [...path, cat])
          if (found) return found
        }
      }
      return null
    }
    
    return findCategoryPath(categoryTree, filters.category)
  }, [filters.category, categoryTree])

  const categoryName = useMemo(() => {
    if (!currentCategory || currentCategory.length === 0) return null
    return currentCategory[currentCategory.length - 1]
  }, [currentCategory])

  // Build filter groups based on mode and category
  const filterGroups: FilterGroup[] = useMemo(() => {
    if (mode === 'category' && filters.category && currentCategory) {
      const groups: FilterGroup[] = []
      
      // If category has subcategories, add them as a filter group
      const subcategories = (categoryName as any)?.children || (categoryName as any)?.subcategories || []
      if (subcategories.length > 0) {
        groups.push({
          id: 'subcategory',
          title: 'Subcategories',
          type: 'link', // Use 'link' type so clicking navigates to that subcategory
          defaultExpanded: true,
          options: subcategories.map((sub: any) => ({
            id: sub.slug,
            label: sub.name,
            count: sub.adsCount || 0,
            icon: sub.imageUrl ? (
              <div className="w-4 h-4 rounded overflow-hidden relative">
                <Image src={getMediaUrl(sub.imageUrl)} alt={sub.name} fill className="object-cover" />
              </div>
            ) : <LayoutGrid className="w-4 h-4" />,
            action: `/category/${sub.slug}`,
          })),
        })
      }
      
      // Add other category-specific filters (price, condition, etc.)
      const categoryFilters = getFiltersByCategory(filters.category)
      const otherFilters = categoryFilters.filter((group) => group.id !== 'category' && group.id !== 'subcategory')
      groups.push(...otherFilters)
      
      return groups
    }
    
    // Search page: show all search filters with real category data
    if (mode === 'search' && categoryTree && categoryTree.length > 0) {
      const searchFiltersWithRealData = searchFilters.map((group) => {
        if (group.id === 'category') {
          // Replace with real category data from tree
          return {
            ...group,
            options: categoryTree.map((cat) => ({
              id: cat.slug,
              label: cat.name,
              count: cat.adsCount || 0,
              icon: cat.imageUrl ? (
                <div className="w-4 h-4 rounded overflow-hidden relative">
                  <Image src={getMediaUrl(cat.imageUrl)} alt={cat.name} fill className="object-cover" />
                </div>
              ) : <LayoutGrid className="w-4 h-4" />,
            })),
          }
        }
        return group
      })
      return searchFiltersWithRealData
    }
    
    // Fallback to default search filters
    return searchFilters
  }, [mode, filters.category, currentCategory, categoryTree])

  // Build API params from filters
  const apiParams = useMemo(() => {
    const params: Record<string, any> = {
      status: 'published',
    }

    // Add search query
    if (filters.search) {
      params.search = filters.search
    }

    // Add category filter - handle both string and array (from checkbox)
    if (filters.category) {
      if (Array.isArray(filters.category)) {
        if (filters.category.length > 0) {
          // If multiple categories selected, join them or take the first one
          // Backend likely expects a single string for 'category'
          params.category = filters.category[0]
        }
      } else {
        params.category = filters.category
      }
    }

    // Add ad type filter
    if (filters.adType) {
      params.ad_type = filters.adType
    }

    // Add price range filter
    if (filters.price && filters.price !== 'any') {
      const priceRange = String(filters.price)
      
      if (priceRange.includes('-')) {
        const parts = priceRange.split('-')
        const min = parseInt(parts[0].replace(/[Fr,\s]/g, ''), 10)
        const max = parseInt(parts[1].replace(/[Fr,\s]/g, ''), 10)
        
        if (!isNaN(min)) params.min_price = min
        if (!isNaN(max)) params.max_price = max
      } else if (priceRange.endsWith('+')) {
        const min = parseInt(priceRange.replace(/[Fr,+]/g, ''), 10)
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

    // Debug log for API params
    console.log('🔍 AdsListingLayout API Params:', params)

    return params
  }, [filters])

  // Fetch ads one backend page at a time.
  const {
    data: adsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdsInfiniteList(apiParams)

  const ads = useMemo(() => {
    return adsData?.pages.flatMap((page) => page.results) || []
  }, [adsData])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '500px 0px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Handle filter changes
  const handleFilterChange = (
    filterId: string,
    value: string | string[],
    action?: string
  ) => {
    if (filterId === 'reset') {
      setFilters({ search: '', status: 'published' })
      return
    }

    // If it's a subcategory selection and has an action (navigation), navigate to it
    if (filterId === 'subcategory' && action && action.startsWith('/category/')) {
      router.push(action)
      return // Don't update filters state, let the navigation handle it
    }
    
    if (filterId === 'location') {
      if (Array.isArray(value) && value.length > 0) {
        setSelectedRegion(value[0])
      } else if (value === 'any' || (Array.isArray(value) && value.length === 0)) {
        setSelectedRegion('All Regions')
      }
    }
    
    setFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }))

    // Update URL if it's a category navigation
    if (action && action.startsWith('/category/')) {
      router.push(action)
    }
  }

  // Sync with global location store
  useEffect(() => {
    if (selectedRegion && selectedRegion !== 'All Regions') {
      setFilters(prev => ({ ...prev, location: [selectedRegion] }))
    } else if (selectedRegion === 'All Regions') {
      setFilters(prev => {
        const next = { ...prev }
        delete next.location
        return next
      })
    }
  }, [selectedRegion])

  // Update filters when URL changes (for category navigation)
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    const searchFromUrl = searchParams.get('q')
    
    // Priority: URL param > initialFilters > current filter
    const newCategory = categoryFromUrl || initialFilters.categorySlug || filters.category || ''
    const newSearch = searchFromUrl || initialFilters.search || filters.search || ''
    
    // Only update if values actually changed
    if (newCategory !== filters.category || newSearch !== filters.search) {
      console.log('🔄 AdsListingLayout syncing from URL:', { newCategory, newSearch })
      setFilters((prev) => ({
        ...prev,
        category: newCategory,
        search: newSearch,
        // When category changes from URL, we should consider clearing subcategory/attribute filters
        // unless they are also in the URL (optional enhancement)
      }))
    }
  }, [searchParams, initialFilters.categorySlug])
  
  // Sync with initialFilters when they change (for category page navigation)
  // This ensures that when navigating to a category page, the filter is set immediately
  useEffect(() => {
    const categorySlug = initialFilters.categorySlug || ''
    const search = initialFilters.search || ''
    
    if (categorySlug && categorySlug !== filters.category) {
      setFilters((prev) => ({
        ...prev,
        category: categorySlug,
      }))
    }
    if (search && search !== filters.search) {
      setFilters((prev) => ({
        ...prev,
        search: search,
      }))
    }
  }, [initialFilters])


  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      {/* Premium White Header Area */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-3 sm:py-4">
          {/* Page Header - Title + Back Button (Beside it) */}
          <div className="flex items-center gap-4">
            <BackButton variant="outline" className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-xl sm:text-2xl font-medium text-gray-900 tracking-tight truncate">
                  {title}
                </h1>
              )}
              {!title && categoryName && (
                <h1 className="text-xl sm:text-2xl font-medium text-gray-900 tracking-tight truncate">
                  {categoryName.name}
                </h1>
              )}
            </div>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5 ml-14">{subtitle}</p>
          )}

          {/* Breadcrumbs - Full Width Under Both - Only show if more than 1 (avoid repetition with title) */}
          {currentCategory && currentCategory.length > 1 && (
            <div className="flex items-center gap-y-1 gap-x-2 mt-2 text-xs sm:text-sm text-gray-400 overflow-x-auto no-scrollbar whitespace-nowrap flex-nowrap">
              {currentCategory.map((cat, index) => (
                <React.Fragment key={cat.slug || cat.id}>
                  {index > 0 && <span className="text-gray-300 mx-1 flex-shrink-0">&gt;</span>}
                  <Link 
                    href={`/category/${cat.slug}`}
                    className={cn(
                      "hover:text-primary transition-colors font-medium flex-shrink-0",
                      index === currentCategory.length - 1 ? "text-primary cursor-default" : "text-gray-400"
                    )}
                    onClick={(e) => {
                      if (index === currentCategory.length - 1) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {cat.name}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container py-4 sm:py-6">

        {/* Mobile Filter Chips - Premium Horizontal Scroll - Sticky at Top */}
        <div className="lg:hidden -mx-4 px-4 py-1.5 bg-[#F8F9FA] border-b border-gray-100 overflow-x-auto no-scrollbar flex items-center gap-2">
          {/* Main Filter Toggle */}
          <Button
            variant={activeDrawer === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveDrawer('all')}
            className="rounded-full whitespace-nowrap gap-1.5 h-10 px-4"
          >
            <FilterIcon className="w-3.5 h-3.5" />
            Filters
          </Button>

          {/* Individual Category-specific chips */}
          {filterGroups.map((group) => {
            const hasValue = filters[group.id] && filters[group.id] !== 'any' && (!Array.isArray(filters[group.id]) || filters[group.id].length > 0)
            
            return (
              <Button
                key={group.id}
                variant={hasValue ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveDrawer(group.id)}
                className={cn(
                  "rounded-full whitespace-nowrap h-10 px-4 border-gray-200 bg-white",
                  hasValue ? "border-primary" : "text-gray-600"
                )}
              >
                {group.title}
                {hasValue && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
              </Button>
            )
          })}
        </div>

        {/* Global Drawer for Filters */}
        <Drawer open={!!activeDrawer} onOpenChange={(open) => !open && setActiveDrawer(null)}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b border-gray-50 pb-4">
              <DrawerTitle className="text-left">
                {activeDrawer === 'all' 
                  ? 'Filters' 
                  : filterGroups.find(g => g.id === activeDrawer)?.title}
              </DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto p-4 pb-12">
              <FiltersSection
                filters={filterGroups}
                selectedValues={filters}
                onFilterChange={handleFilterChange}
                filterId={activeDrawer === 'all' ? undefined : activeDrawer || undefined}
                hideHeader={true}
                className="border-none shadow-none p-0 rounded-none bg-transparent"
              />
            </div>
            {activeDrawer && (
              <div className="p-4 border-t border-gray-50 bg-white sticky bottom-0 z-10">
                <Button 
                  className="w-full h-12 rounded-full"
                  onClick={() => setActiveDrawer(null)}
                >
                  Show Results
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Sidebar: Filters */}
          <aside className={cn(
            "lg:w-[300px] flex-shrink-0 transition-all duration-300",
            "hidden lg:block"
          )}>
            <div>
              <FiltersSection
                filters={filterGroups}
                selectedValues={filters}
                onFilterChange={handleFilterChange}
                className="rounded-3xl border border-gray-200 overflow-hidden shadow-none"
              />
            </div>
          </aside>

          {/* Right Content: Ads Grid */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <AdsListSkeleton columns={4} count={12} />
            ) : error ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-gray-200">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-500 text-2xl font-bold">!</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                  We couldn't load the ads right now. Please check your connection and try again.
                </p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="primary"
                  size="lg"
                  className="px-10"
                >
                  Retry Search
                </Button>
              </div>
            ) : ads.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-3xl border border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No matching ads found</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                  {filters.search
                    ? `We couldn't find any results for "${filters.search}". Try different keywords or broaden your filters.`
                    : "There are no ads matching your current filter selection. Try removing some filters to see more results."}
                </p>
                <Button 
                  onClick={() => setFilters({ search: '', status: 'published' })}
                  variant="secondary"
                  size="lg"
                  className="px-10 bg-gray-900 text-white hover:bg-gray-800"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AdsList ads={ads as Ad[]} columns={4} />
                {hasNextPage && (
                  <div ref={loadMoreRef} className="py-6 text-center">
                    {isFetchingNextPage ? (
                      <span className="text-sm text-gray-500">Loading more ads...</span>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
