'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Eye, Heart, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useFavoritesStore } from '@/store/favoritesStore'
import { sortAds, Ad } from '@/data/mockAds'

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

export default function AdsList({ ads, columns = 4, className = "" }: AdsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const { toggleFavorite, isFavorite } = useFavoritesStore()

  const getColumnClasses = () => {
    switch (columns) {
      case 2:
        return "grid-cols-1 md:grid-cols-2"
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      case 5:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    }
  }

  // Sort ads using imported function
  const sortedAds = sortAds(ads, sortBy)

  // Distribute sorted ads across columns based on index
  const columnArrays: Ad[][] = Array.from({ length: columns }, () => [])
  
  sortedAds.forEach((ad, index) => {
    const columnIndex = index % columns
    columnArrays[columnIndex].push(ad)
  })

  const renderAdCard = (ad: Ad) => (
    <Link key={ad.id} href={`/ads/${ad.id}`} className="block">
      <div className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer group mb-6 break-inside-avoid">
      {/* Image Container */}
      <div className="relative w-full overflow-hidden">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          width={400}
          height={300}
          className="w-full h-auto group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        
        {/* Category Badge */}
        {ad.category && (
          <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 text-xs font-medium">
            {ad.category}
          </div>
        )}
        
        {/* Favorite Button */}
        <button 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFavorite(ad.id)
          }}
          className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          title={isFavorite(ad.id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 transition-colors ${isFavorite(ad.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
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
            <span>{ad.location}</span>
          </div>
          
          {ad.views && (
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
