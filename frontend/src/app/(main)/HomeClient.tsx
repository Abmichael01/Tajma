"use client"

import React from 'react'
import Hero from '@/components/Home/Hero'
import CategoryGrid from '@/components/Home/CategoryGrid'
import AdsList from '@/components/Home/AdsList'
import CategoriesSection from '@/components/Home/CategoriesSection'
import AdsListSkeleton from '@/components/ui/AdsListSkeleton'
import FeaturedAdsSection from '@/components/Home/FeaturedAdsSection'
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

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Categories Section - Desktop Sidebar */}
          <CategoriesSection />

          {/* Main Content */}
          <div className="flex-1 space-y-12">

            {/* Main Ads List */}
            <div>

              {isLoading ? (
                <div className="py-4">
                  <AdsListSkeleton columns={4} count={8} />
                </div>
              ) : error ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connection</h3>
                  <p className="text-gray-600 mb-4">Unable to connect to server. Displaying cached results.</p>
                  <AdsList ads={ads} columns={4} className="py-4" />
                </div>
              ) : ads.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-600 mb-4">No ads available yet. Be the first to post!</p>
                  {ads.length === 0 && backendAds && backendAds.length === 0 && (
                    <p className="text-sm text-gray-500">Check the browser console for debugging info.</p>
                  )}
                </div>
              ) : (
                <AdsList ads={ads} columns={4} className="py-0" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}