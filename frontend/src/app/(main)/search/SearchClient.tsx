"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import AdsList from '@/components/Home/AdsList'
import FiltersSection from '@/components/ui/FiltersSection'
import { searchFilters } from '@/data/filterConfigs'
import { mockAds, filterAds } from '@/data/mockAds'

export default function SearchClient() {
  const searchParams = useSearchParams()
  const [filteredAds, setFilteredAds] = useState(mockAds)
  const [isLoading, setIsLoading] = useState(false)
  
  const query = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''

  useEffect(() => {
    // Filter ads based on search query
    setIsLoading(true)
    
    setTimeout(() => {
      const filtered = filterAds(mockAds, {
        searchQuery: query,
        location: location
      })
      
      setFilteredAds(filtered)
      setIsLoading(false)
    }, 500)
  }, [query, location])

  const handleFilterChange = (filterId: string, value: string | string[], action?: string) => {
    console.log('Filter changed:', { filterId, value, action })
    
    setIsLoading(true)
    
    setTimeout(() => {
      // Build filter object
      const filterOptions: any = {
        searchQuery: query,
        location: location
      }

      // Apply category filter
      if (filterId === 'category' && Array.isArray(value) && value.length > 0) {
        // For multiple categories, we'll filter if ad matches any of them
        const filtered = mockAds.filter(ad => value.includes(ad.category))
        setFilteredAds(filtered)
      } else if (filterId === 'condition' && Array.isArray(value) && value.length > 0) {
        filterOptions.condition = value
        const filtered = filterAds(mockAds, filterOptions)
        setFilteredAds(filtered)
      } else if (filterId === 'price' && typeof value === 'string') {
        // Parse price range
        const priceRanges: any = {
          '0-50000': { min: 0, max: 50000 },
          '50000-200000': { min: 50000, max: 200000 },
          '200000-500000': { min: 200000, max: 500000 },
          '500000-1000000': { min: 500000, max: 1000000 },
          '1000000+': { min: 1000000 }
        }
        if (priceRanges[value]) {
          filterOptions.priceRange = priceRanges[value]
        }
        const filtered = filterAds(mockAds, filterOptions)
        setFilteredAds(filtered)
      } else if (filterId === 'location' && Array.isArray(value) && value.length > 0) {
        // Filter by state
        const filtered = mockAds.filter(ad => value.includes(ad.state))
        setFilteredAds(filtered)
      } else {
        const filtered = filterAds(mockAds, filterOptions)
        setFilteredAds(filtered)
      }
      
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
            filters={searchFilters}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        {/* Results Section */}
        <div className="flex-1 min-w-0">
          {/* Search Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              {query ? `Search results for "${query}"` : 'Search Results'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {filteredAds.length} {filteredAds.length === 1 ? 'result' : 'results'} found
              {location && ` in ${location}`}
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
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Try adjusting your search terms or filters
              </p>
              <button 
                onClick={() => setFilteredAds(mockAds)}
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
