"use client"

import React, { useState, useEffect } from 'react'
import AdsList from '@/components/Home/AdsList'
import FiltersSection from '@/components/ui/FiltersSection'
import { getFiltersByCategory } from '@/data/filterConfigs'
import { mockAds, filterAds } from '@/data/mockAds'
import type { Ad } from '@/api/types'

interface CategoryClientProps {
  categorySlug: string
}

export default function CategoryClient({ categorySlug }: CategoryClientProps) {
  const [filteredAds, setFilteredAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Get category-specific filters
  const filters = getFiltersByCategory(categorySlug)
  
  // Format category name for display
  const categoryName = categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  useEffect(() => {
    // Filter ads by category
    setIsLoading(true)
    
    setTimeout(() => {
      const categoryFiltered = filterAds(mockAds, {
        category: categorySlug
      }) as unknown as Ad[]
      
      setFilteredAds(categoryFiltered)
      setIsLoading(false)
    }, 300)
  }, [categorySlug])

  const handleFilterChange = (filterId: string, value: string | string[], action?: string) => {
    console.log('Filter changed:', { filterId, value, action })
    
    setIsLoading(true)
    
    setTimeout(() => {
      // Build filter object
      const filterOptions: any = {
        category: categorySlug
      }

      // Apply brand filter
      if (filterId === 'brand' && Array.isArray(value) && value.length > 0) {
        filterOptions.brand = value
      }
      
      // Apply condition filter
      if (filterId === 'condition' && Array.isArray(value) && value.length > 0) {
        filterOptions.condition = value
      }
      
      // Apply price range filter
      if (filterId === 'price' && typeof value === 'string') {
        const priceRanges: any = {
          '0-50000': { min: 0, max: 50000 },
          '50000-150000': { min: 50000, max: 150000 },
          '150000-300000': { min: 150000, max: 300000 },
          '300000-500000': { min: 300000, max: 500000 },
          '500000+': { min: 500000 }
        }
        if (priceRanges[value]) {
          filterOptions.priceRange = priceRanges[value]
        }
      }
      
      const filtered = filterAds(mockAds, filterOptions) as unknown as Ad[]
      setFilteredAds(filtered)
      setIsLoading(false)
    }, 300)
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Filters Section */}
        <div className="lg:w-[300px] lg:flex-shrink-0">
          <FiltersSection 
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        {/* Results Section */}
        <div className="flex-1 min-w-0">
          {/* Category Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {categoryName}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {filteredAds.length} {filteredAds.length === 1 ? 'listing' : 'listings'} in {categoryName.toLowerCase()}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-secondary"></div>
            </div>
          ) : (
            <AdsList 
              ads={filteredAds} 
              columns={3}
              className="py-0"
            />
          )}
          
          {!isLoading && filteredAds.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No listings found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Try adjusting your filters or check back later for new listings
              </p>
              <button 
                onClick={() => setFilteredAds(mockAds.filter(ad => 
                  ad.category?.toLowerCase() === categorySlug || 
                  ad.category?.toLowerCase().includes(categorySlug.split('-')[0])
                ) as unknown as Ad[])}
                className="bg-secondary text-secondary-foreground px-4 py-2 hover:bg-secondary/90 transition-colors text-sm sm:text-base"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
