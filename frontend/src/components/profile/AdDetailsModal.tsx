"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { getMediaUrl } from '@/lib/utils'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { 
  MapPin, 
  Eye, 
  Heart, 
  MessageSquare, 
  Calendar,
  Edit,
  Share2,
  ExternalLink
} from 'lucide-react'
import type { Ad } from '@/api/types'
import ShareAdModal from '@/components/modals/ShareAdModal'

interface AdDetailsModalProps {
  ad: Ad
  isOpen: boolean
  onClose: () => void
  isOwner?: boolean
}

export default function AdDetailsModal({ ad, isOpen, onClose, isOwner = false }: AdDetailsModalProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  
  // Get first image or placeholder
  const imageUrl = getMediaUrl(ad.images?.[0])

  
  // Format price
  const formattedPrice = ad.price
    ? `${ad.currency || 'XOF'} ${parseFloat(String(ad.price)).toLocaleString()}`
    : 'Contact for price'
  
  // Get location from seller
  const location = ad.seller?.location || 'Location not specified'
  
  return (
    <>
      <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ad Details"
      className="!max-w-5xl"
    >
        <div className="py-2 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {/* Image */}
          <div className="relative w-full mb-6">
            <Image
              src={imageUrl}
              alt={ad.title}
              width={800}
              height={600}
              className="w-full h-auto"
            />
            
            {/* Status Badge */}
            {ad.status && (
              <div className={`absolute top-3 left-3 px-3 py-1.5 text-sm font-semibold ${
                ad.status === 'published' 
                  ? 'bg-green-500 text-white' 
                  : ad.status === 'archived'
                    ? 'bg-gray-900 text-white'
                      : 'bg-yellow-500 text-white'
              }`}>
                {ad.status === 'published' ? 'ACTIVE' : ad.status === 'archived' ? 'ARCHIVED' : 'DRAFT'}
              </div>
            )}
          </div>

          {/* Title & Price */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{ad.title}</h3>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{formattedPrice}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <div className="flex flex-col items-center">
                <Eye className="w-5 h-5 text-gray-600 mb-1" />
                <p className="text-lg font-bold text-gray-900">{ad.views || 0}</p>
                <p className="text-xs text-gray-600">Views</p>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <div className="flex flex-col items-center">
                <Heart className="w-5 h-5 text-gray-600 mb-1" />
                <p className="text-lg font-bold text-gray-900">{ad.saved_count || 0}</p>
                <p className="text-xs text-gray-600">Saved</p>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <div className="flex flex-col items-center">
                <MessageSquare className="w-5 h-5 text-gray-600 mb-1" />
                <p className="text-lg font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-600">Messages</p>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <div className="flex flex-col items-center">
                <Calendar className="w-5 h-5 text-gray-600 mb-1" />
                <p className="text-xs font-bold text-gray-900">{ad.published_at ? new Date(ad.published_at).toLocaleDateString() : 'N/A'}</p>
                <p className="text-xs text-gray-600">Posted</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-6 flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span>{location}</span>
          </div>

          {/* Description */}
          {ad.description && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{ad.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Link href={`/ads/${ad.slug}`} className="flex-1">
              <Button variant="ghost" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Page
              </Button>
            </Link>
            
            {isOwner && (
              <>
                <Link href={`/ads/${ad.slug}/edit`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Ad
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  className="sm:w-auto"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </>
            )}
          </div>
        </div>
      </ResponsiveModal>

      {/* Share Modal */}
      <ShareAdModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        adId={ad.id}
        adTitle={ad.title}
      />
    </>
  )
}

