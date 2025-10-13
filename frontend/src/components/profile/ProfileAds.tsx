"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, MapPin, Eye, Heart, MessageSquare, Edit, MoreVertical, FileText } from 'lucide-react'
import AdDetailsModal from './AdDetailsModal'
import { Ad } from '@/data/mockAds'

interface ProfileAdsProps {
  ads: Ad[]
  isOwner?: boolean
}

export default function ProfileAds({ ads, isOwner = false }: ProfileAdsProps) {
  const columns = 3
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Distribute ads across columns for Pinterest-style masonry layout
  const columnArrays: Ad[][] = Array.from({ length: columns }, () => [])
  
  ads.forEach((ad, index) => {
    const columnIndex = index % columns
    columnArrays[columnIndex].push(ad)
  })

  const handleViewDetails = (ad: Ad, e: React.MouseEvent) => {
    if (isOwner) {
      e.preventDefault()
      setSelectedAd(ad)
      setIsModalOpen(true)
    }
  }

  const renderAdCard = (ad: Ad) => (
    <div 
      key={ad.id} 
      onClick={(e) => handleViewDetails(ad, e)}
      className="block"
    >
      <Link href={isOwner ? '#' : `/ads/${ad.id}`}>
        <div className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer group mb-6 break-inside-avoid">
        {/* Image Container */}
        <div className="relative w-full overflow-hidden">
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            width={400}
            height={300}
            className="w-full h-auto group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Status Badge */}
          {isOwner && ad.status && (
            <div className={`absolute top-2 left-2 px-2 py-1 text-sm font-semibold ${
              ad.status === 'active' 
                ? 'bg-green-500 text-white' 
                : ad.status === 'sold'
                  ? 'bg-gray-900 text-white'
                  : ad.status === 'expired'
                    ? 'bg-red-500 text-white'
                    : 'bg-yellow-500 text-white'
            }`}>
              {ad.status.toUpperCase()}
            </div>
          )}

          {/* Category Badge */}
          {!isOwner && ad.category && (
            <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 text-sm font-medium">
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
              <span>{ad.location}</span>
            </div>
            
            {ad.views && (
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
                  <span className="text-sm font-medium">{ad.favorites || 0}</span>
                </div>
                <span className="text-sm text-gray-500 mt-0.5">Saved</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-gray-600">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-sm font-medium">{ad.messages || 0}</span>
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
              href={`/ads/${ad.id}/edit`} 
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
    </Link>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
