'use client'

import React, { useMemo } from 'react'
import AdsListingLayout from '@/components/ads/AdsListingLayout'
import { useCategories } from '@/hooks/useCategories'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

interface CategoryClientProps {
  slug: string[]
}

export default function CategoryClient({ slug }: CategoryClientProps) {
  const { categoryTree, loading } = useCategories()

  // Join slug segments into a single slug string
  // For nested paths like /category/this/that/them/u/bla
  // We'll use the last segment as the category slug (most specific)
  // Or we could use the full path - let's use the last segment for now
  const categorySlug = useMemo(() => {
    if (!slug || slug.length === 0) return ''
    // Use the last segment as it's the most specific category
    return slug[slug.length - 1]
  }, [slug])

  // Find category details for display
  const category = useMemo(() => {
    if (!categoryTree || !categorySlug) return null

    const findCategory = (categories: any[], targetSlug: string): any => {
      for (const cat of categories) {
        if (cat.slug === targetSlug) return cat
        if (cat.children || cat.subcategories) {
          const found = findCategory(
            cat.children || cat.subcategories || [],
            targetSlug
          )
          if (found) return found
        }
      }
      return null
    }

    return findCategory(categoryTree, categorySlug)
  }, [categoryTree, categorySlug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MarketplaceLoader size="md" message="Loading category..." />
      </div>
    )
  }

  return (
    <AdsListingLayout
      initialFilters={{
        categorySlug: categorySlug,
      }}
      title={category?.name || categorySlug}
      subtitle={category?.description}
      mode="category"
    />
  )
}


