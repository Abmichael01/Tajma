import React from 'react'
import Image from 'next/image'
import { MapPin, Eye, Heart } from 'lucide-react'
import { Ad } from '@/data/mockAds'

interface AdsListProps {
  ads: Ad[]
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export default function AdsList({ ads, columns = 4, className = "" }: AdsListProps) {
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

  // Distribute ads across columns based on index
  const distributeAdsAcrossColumns = () => {
    const columnArrays: Ad[][] = Array.from({ length: columns }, () => [])
    
    ads.forEach((ad, index) => {
      const columnIndex = index % columns
      columnArrays[columnIndex].push(ad)
    })
    
    return columnArrays
  }

  const columnArrays = distributeAdsAcrossColumns()

  const renderAdCard = (ad: Ad) => (
    <div key={ad.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer group mb-6 break-inside-avoid">
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
          <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 text-sm font-medium">
            {ad.category}
          </div>
        )}
        
        {/* Favorite Button */}
        <button className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Heart className={`w-4 h-4 ${ad.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
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
  )

  return (
    <div className={`container ${className}`}>
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
