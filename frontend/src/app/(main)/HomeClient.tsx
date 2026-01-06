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
            
            {/* Trending Ads Section */}
            {ads.length > 0 && (
              <FeaturedAdsSection
                title="Trending Now"
                subtitle="Most viewed items this week"
                ads={[...ads].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4)}
                viewAllLink="/ads?sort=views"
                className="!py-0"
              />
            )}

            {/* New Arrivals Section */}
            {ads.length > 0 && (
              <FeaturedAdsSection
                title="Fresh Recommendations"
                subtitle="Based on your interests"
                ads={[...ads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)}
                viewAllLink="/ads?sort=newest"
                className="!py-0"
              />
            )}

            {/* Main Ads List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Explore All Listings</h2>
              </div>
              
              {isLoading ? (
                <div className="py-4">
                  <AdsListSkeleton columns={4} count={8} />
                </div>
              ) : error ? (
                <div className="py-12 text-center">
                  <p className="text-gray-600 mb-4">Unable to load ads. Showing sample listings.</p>
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