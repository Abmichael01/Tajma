'use client'

import React, { useMemo } from 'react'
import { useFavoritesStore } from '@/store/favoritesStore'
import { mockAds } from '@/data/mockAds'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Eye, X, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProfileSaved() {
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore()

  // Get saved ads from mock data
  const savedAds = useMemo(() => {
    return mockAds.filter(ad => favorites.includes(ad.id))
  }, [favorites])

  if (savedAds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No saved ads yet
        </h3>
        <p className="text-gray-600 mb-6">
          Start saving your favorite items by clicking the heart icon on any ad
        </p>
        <Link href="/">
          <Button>
            <ShoppingBag className="w-5 h-5 mr-2" />
            Browse Ads
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Saved Ads</h3>
          <p className="text-sm text-gray-500">
            {savedAds.length} {savedAds.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        
        {savedAds.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Are you sure you want to remove all saved ads?')) {
                clearFavorites()
              }
            }}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Saved Ads Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {savedAds.map((ad) => (
          <div
            key={ad.id}
            className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 group relative"
          >
            <Link href={`/ads/${ad.id}`}>
              {/* Image Container */}
              <div className="relative w-full h-48 bg-gray-100">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                
                {/* Category Badge */}
                {ad.category && (
                  <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 text-xs font-medium">
                    {ad.category}
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
                  {ad.price}
                </div>
                
                {/* Location and Views */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{ad.location}</span>
                  </div>
                  
                  {ad.views && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">{ad.views}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Remove Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                removeFavorite(ad.id)
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md z-10"
              title="Remove from saved"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

