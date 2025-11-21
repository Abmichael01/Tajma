"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, MapPin, Eye, Heart, MessageSquare, Edit, MoreVertical, FileText } from 'lucide-react'
import AdDetailsModal from './AdDetailsModal'
import type { Ad } from '@/api/types'

interface ProfileAdsProps {
  ads: Ad[]
  isOwner?: boolean
}

export default function ProfileAds({ ads, isOwner = false }: ProfileAdsProps) {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [columns, setColumns] = useState(2) // Default to 2 columns for mobile
  
  // Update columns based on window size
  useEffect(() => {
    const updateColumns = () => {
      if (typeof window !== 'undefined') {
        // 1 column on very small (< 420px), 2 columns on 420px-699px, 3 columns on 700px+ (< 1024px), 3 columns on large+ (>= 1024px)
        if (window.innerWidth >= 1024) {
          setColumns(3)
        } else if (window.innerWidth >= 700) {
          setColumns(3)
        } else if (window.innerWidth >= 420) {
          setColumns(2)
        } else {
          setColumns(1)
        }
      }
    }
    
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])
  
  // Distribute ads across columns for Pinterest-style masonry layout
  const columnArrays: Ad[][] = useMemo(() => {
    const arrays: Ad[][] = Array.from({ length: columns }, () => [])
    ads.forEach((ad, index) => {
      const columnIndex = index % columns
      arrays[columnIndex].push(ad)
    })
    return arrays
  }, [ads, columns])

  const handleViewDetails = (ad: Ad, e: React.MouseEvent) => {
    if (isOwner) {
      e.preventDefault()
      setSelectedAd(ad)
      setIsModalOpen(true)
    }
  }

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
    
    // Map backend status to display status
    const statusDisplay = ad.status === 'published' ? 'ACTIVE' :
                         ad.status === 'archived' ? 'ARCHIVED' :
                         ad.status === 'draft' ? 'DRAFT' : 'UNKNOWN'
    
    const statusColor = ad.status === 'published' ? 'bg-green-500' :
                       ad.status === 'archived' ? 'bg-gray-900' :
                       ad.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
    
    const card = (
      <div className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer group mb-6 break-inside-avoid">
        {/* Image Container */}
        <div className="relative w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={ad.title}
            width={400}
            height={400}
            className="w-full h-auto group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Status Badge */}
          {isOwner && ad.status && (
            <div className={`absolute top-2 left-2 px-1.5 py-0.5 text-xs font-semibold text-white ${statusColor}`}>
              {statusDisplay}
            </div>
          )}

          {/* Category Badge - Smaller */}
          {!isOwner && categoryName && (
            <div className="absolute top-2 left-2 bg-secondary/90 text-white px-1.5 py-0.5 text-xs font-medium">
              {categoryName}
            </div>
          )}
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

          {/* Owner Stats Row */}
          {isOwner && (
            <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-gray-100">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-gray-600">
                  <Eye className="w-3 h-3" />
                  <span className="text-sm font-medium">{ad.views || 0}</span>
                </div>
                <span className="text-sm text-gray-500 mt-0.5">Views</span>
              </div>
              
              <div className="flex flex-col items-center border-x border-gray-100">
                <div className="flex items-center gap-1 text-gray-600">
                  <Heart className="w-3 h-3" />
                  <span className="text-sm font-medium">{ad.saved_count || 0}</span>
                </div>
                <span className="text-sm text-gray-500 mt-0.5">Saved</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-gray-600">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-sm font-medium">0</span>
                </div>
                <span className="text-sm text-gray-500 mt-0.5">Msgs</span>
              </div>
            </div>
          )}
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-100 pt-3">
            <Link 
              href={`/ads/${ad.slug}/edit`} 
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="sm" className="w-full text-sm">
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    )

    return (
      <div
        key={ad.id}
        className="block"
        onClick={isOwner ? (e) => handleViewDetails(ad, e) : undefined}
      >
        {isOwner ? (
          <div>{card}</div>
        ) : (
          <Link href={`/ads/${ad.slug || ad.id}`} className="block">
            {card}
          </Link>
        )}

        {/* Ad Details Modal */}
        {selectedAd && selectedAd.id === ad.id && (
          <AdDetailsModal
            ad={selectedAd}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedAd(null)
            }}
            isOwner={isOwner}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            {isOwner ? 'My Ads' : 'All Ads'}
          </h3>
          <p className="text-sm text-gray-500">
            {ads.length} {ads.length === 1 ? 'ad' : 'ads'} {isOwner ? 'posted' : 'found'}
          </p>
        </div>
        {isOwner && (
          <Link href="/create-ad">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Post New Ad
            </Button>
          </Link>
        )}
      </div>
      
      {/* Ads Grid - Pinterest Style Masonry Layout */}
      {ads.length > 0 ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3 gap-4 sm:gap-6">
          {columnArrays.map((columnAds, columnIndex) => (
            <div key={columnIndex} className="flex flex-col">
              {columnAds.map(renderAdCard)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isOwner ? 'No ads posted yet' : 'No ads available'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isOwner ? 'Start by posting your first ad' : 'This user hasn\'t posted any ads'}
          </p>
          {isOwner && (
            <Link href="/create-ad">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Ad
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
