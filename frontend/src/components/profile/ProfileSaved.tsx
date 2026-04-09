'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Eye, X, ShoppingBag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSavedAdsInfinite, useUnsaveAd } from '@/hooks/useSavedAds'
import { getMediaUrl } from '@/lib/utils'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import type { Ad } from '@/api/types'

export default function ProfileSaved() {
  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useSavedAdsInfinite()
  
  const { mutate: unsaveAd } = useUnsaveAd()

  // Flatten all pages into a single array
  const savedAds: Ad[] = React.useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.results || [])
  }, [data])

  const totalCount = data?.pages?.[0]?.count || 0

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-[32px] p-6 max-w-4xl mx-auto">
        <div className="py-12 flex items-center justify-center">
          <MarketplaceLoader size="md" message="Loading saved ads..." />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white border border-gray-200 rounded-[32px] p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Failed to load saved ads. Please try again.</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (savedAds.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-[32px] p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-gray-100 transition-transform hover:scale-105 duration-300">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 to-transparent opacity-50" />
            <Heart className="w-10 h-10 text-gray-300 relative z-10" />
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-white">
              0
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
            No saved ads yet
          </h3>
          <p className="text-gray-500 max-w-xs leading-relaxed text-sm mb-8">
            Start saving your favorite items by clicking the heart icon on any ad to keep track of them here.
          </p>
          <Link href="/">
            <Button variant="primary" size="lg" className="rounded-full px-8 shadow-md hover:shadow-lg transition-all active:scale-95">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Ads
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Format price helper
  const formatPrice = (ad: Ad) => {
    if (ad.price) {
      return `${ad.currency || 'XOF'} ${parseFloat(String(ad.price)).toLocaleString()}`
    }
    return 'Contact for price'
  }

  // Get first image or placeholder
  const getImageUrl = (ad: Ad) => {
    return getMediaUrl(ad.images?.[0])
  }


  // Get location from seller
  const getLocation = (ad: Ad) => {
    return ad.seller?.location || 'Location not specified'
  }

  // Get category name
  const getCategoryName = (ad: Ad) => {
    return ad.category_details?.name || ad.category || 'Uncategorized'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[32px] p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Saved Ads</h3>
          <p className="text-sm text-gray-500">
            {totalCount} {totalCount === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      {/* Saved Ads Grid */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3 gap-4 sm:gap-6">
        {savedAds.map((ad) => (
          <div
            key={ad.id}
            className="bg-white border border-gray-200 rounded-[32px] overflow-hidden hover:shadow-lg transition-shadow duration-200 group relative"
          >
            <Link href={`/ads/${ad.slug || ad.id}`}>
              {/* Image Container */}
              <div className="relative w-full overflow-hidden">
                <Image
                  src={getImageUrl(ad)}
                  alt={ad.title}
                  width={400}
                  height={400}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                
                {/* Category Badge */}
                {getCategoryName(ad) && (
                  <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 text-xs font-medium">
                    {getCategoryName(ad)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Title */}
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-secondary transition-colors duration-200">
                  {ad.title}
                </h3>
                
                {/* Price */}
                <div className="text-lg font-bold text-primary mb-2">
                  {formatPrice(ad)}
                </div>
                
                {/* Location and Views */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{getLocation(ad)}</span>
                  </div>
                  
                  {ad.views !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">{ad.views || 0}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Remove Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                unsaveAd(ad.id)
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md z-10 rounded-full"
              title="Remove from saved"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

