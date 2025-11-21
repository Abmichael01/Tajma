'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Eye, Heart, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useToggleSaveAd } from '@/hooks/useSavedAds'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Ad } from '@/api/types'

interface AdsListProps {
  ads: Ad[]
  columns?: 2 | 3 | 4 | 5
  className?: string
}

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'views' | 'title'

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'title', label: 'Title A-Z' }
]

// Sort function for backend Ad format
const sortAds = (ads: Ad[], sortBy: SortOption): Ad[] => {
  const sorted = [...ads]
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateA - dateB
      })
    case 'price-low':
      return sorted.sort((a, b) => {
        if (!a.price || a.price === '') return 1
        if (!b.price || b.price === '') return -1
        const priceA = parseFloat(String(a.price)) || 0
        const priceB = parseFloat(String(b.price)) || 0
        return priceA - priceB
      })
    case 'price-high':
      return sorted.sort((a, b) => {
        if (!a.price || a.price === '') return 1
        if (!b.price || b.price === '') return -1
        const priceA = parseFloat(String(a.price)) || 0
        const priceB = parseFloat(String(b.price)) || 0
        return priceB - priceA
      })
    case 'views':
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0))
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return sorted
  }
}

export default function AdsList({ ads, columns = 4, className = "" }: AdsListProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const { mutate: toggleSaveAd } = useToggleSaveAd()
  
  // Handle favorite toggle using API
  const handleToggleFavorite = (adId: string) => {
    if (isAuthenticated) {
      toggleSaveAd(adId)
    } else {
      toast.error('Please login to save ads')
      router.push('/login')
    }
  }
  
  // Check if ad is saved (from API response)
  const isFavorite = (adId: string) => {
    const ad = sortedAds.find(a => a.id === adId)
    return ad?.is_saved === true
  }

  const getColumnClasses = () => {
    switch (columns) {
      case 2:
        return "grid-cols-1 min-[420px]:grid-cols-2"
      case 3:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3"
      case 4:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-4"
      case 5:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5"
      default:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-3"
    }
  }

  // Sort ads
  const sortedAds = useMemo(() => sortAds(ads, sortBy), [ads, sortBy])

  // Distribute sorted ads across columns based on index
  const columnArrays: Ad[][] = Array.from({ length: columns }, () => [])
  
  sortedAds.forEach((ad, index) => {
    const columnIndex = index % columns
    columnArrays[columnIndex].push(ad)
  })

  const renderAdCard = (ad: Ad) => {
    // Get first image or placeholder
    const imageUrl = ad.images && ad.images.length > 0
      ? ad.images[0]
      : 'https://via.placeholder.com/400x300?text=No+Image'
    
    // Format price
    const formattedPrice = ad.price
      ? `${ad.currency || 'Fr'} ${parseFloat(String(ad.price)).toLocaleString()}`
      : 'Contact for price'
    
    // Get location from seller
    const location = ad.seller?.location || 'Location not specified'
    
    // Get category name
    const categoryName = ad.category_details?.name || ad.category || 'Uncategorized'
    
    return (
      <Link key={ad.id} href={`/ads/${ad.slug}`} className="block">
        <div className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer group mb-6 break-inside-avoid">
        {/* Image Container */}
        <div className="relative w-full overflow-hidden aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={ad.title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          
          {/* Category Badge - Smaller */}
          {categoryName && (
            <div className="absolute top-2 left-2 bg-secondary/90 text-white px-1.5 py-0.5 text-xs font-medium">
              {categoryName}
            </div>
          )}
          
          {/* Favorite Button */}
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleToggleFavorite(ad.id)
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            title={isFavorite(ad.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorite(ad.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Price - Before Title */}
          <div className="mb-1.5">
            <div className={`text-lg ${formattedPrice === 'Contact for price' ? 'text-primary' : 'text-primary'}`}>
              {formattedPrice}
            </div>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 text-sm group-hover:text-secondary transition-colors duration-200 leading-tight">
            {ad.title}
          </h3>
          
          {/* Description - Truncated */}
          {ad.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
              {ad.description}
            </p>
          )}
          
          {/* Location and Views */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{location}</span>
            </div>
            
            {ad.views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{ad.views}</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </Link>
    )
  }

  return (
    <div className={`container py-12 ${className}`}>
      {/* Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:border-secondary transition-colors text-sm whitespace-nowrap"
            >
              {sortOptions.find(option => option.value === sortBy)?.label}
              {isSortOpen ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </button>
            
            {isSortOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg z-10">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as SortOption)
                      setIsSortOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      sortBy === option.value ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          {ads.length} {ads.length === 1 ? 'ad' : 'ads'}
        </div>
      </div>

      <div className={`grid ${getColumnClasses()} gap-6`}>
        {columnArrays.map((columnAds, columnIndex) => (
          <div key={columnIndex} className="flex flex-col">
            {columnAds.map(renderAdCard)}
          </div>
        ))}
      </div>
    </div>
  )
}
