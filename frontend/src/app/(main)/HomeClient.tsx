"use client"

import React from 'react'
import Hero from '@/components/Home/Hero'
import CategoryGrid from '@/components/Home/CategoryGrid'
import AdsList from '@/components/Home/AdsList'
import CategoriesSection from '@/components/Home/CategoriesSection'
import AdsListSkeleton from '@/components/ui/AdsListSkeleton'
import { useAdsList } from '@/hooks/useAds'
import type { Ad } from '@/api/types'

export default function HomeClient() {
  const { data: backendAds, isLoading, error } = useAdsList({ status: 'published' })
  
  // Use backend ads directly - no transformation needed
  const ads = React.useMemo(() => {
    if (backendAds && Array.isArray(backendAds) && backendAds.length > 0) {
      return backendAds
    }
    return []
  }, [backendAds])

  return (
    <div className="bg-white min-h-screen">
      <Hero />
      
      {/* Category Grid - Mobile Only */}
      <CategoryGrid />
      
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Categories Section - Desktop Sidebar */}
          <CategoriesSection />
          
          {/* Ads List */}
          <div className="flex-1">
            {isLoading ? (
              <div className="py-4 sm:py-6 lg:py-8">
                <AdsListSkeleton columns={4} count={8} />
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-gray-600 mb-4">Unable to load ads. Showing sample listings.</p>
                <AdsList ads={ads} columns={4} className="py-4 sm:py-6 lg:py-8" />
              </div>
            ) : ads.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-600 mb-4">No ads available yet. Be the first to post!</p>
                {ads.length === 0 && backendAds && backendAds.length === 0 && (
                  <p className="text-sm text-gray-500">Check the browser console for debugging info.</p>
                )}
              </div>
            ) : (
              <AdsList ads={ads} columns={4} className="py-4 sm:py-6 lg:py-8" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}