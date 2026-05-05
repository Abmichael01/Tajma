"use client"

import React from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Edit, MoreVertical, Eye, Heart, MessageSquare, MapPin, Calendar, ArrowUp } from 'lucide-react'
import type { Ad } from '@/api/types'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { getMediaUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import PromotionModal from './PromotionModal'
import { useState } from 'react'


interface HorizontalAdCardProps {
  ad: Ad
  isOwner?: boolean
}

export default function HorizontalAdCard({ ad, isOwner = false }: HorizontalAdCardProps) {
  const t = useTranslations('common')
  const [showPromoModal, setShowPromoModal] = useState(false)
  // Get first image or placeholder
  const imageUrl = getMediaUrl(ad.images?.[0])

  
  // Format price
  const formattedPrice = ad.price
    ? `${ad.currency || 'XOF'} ${parseFloat(String(ad.price)).toLocaleString()}`
    : t('contact_for_price')
  
  // Get location
  const location = ad.seller?.location || t('location_not_specified')
  
  // Status display logic
  const statusConfig = {
    published: { label: t('status_active'), color: 'bg-green-500' },
    archived: { label: t('status_archived'), color: 'bg-gray-900' },
    draft: { label: t('status_draft'), color: 'bg-yellow-500' },
  }
  
  const statusInfo = statusConfig[ad.status as keyof typeof statusConfig] || { label: 'UNKNOWN', color: 'bg-gray-500' }

  const isFeatured = ad.is_featured
  const isBoosted = ad.promotion_rank === 50

  return (
    <div className={`
      bg-white rounded-xl overflow-hidden transition-all duration-300 flex flex-col sm:flex-row relative border-2
      ${isFeatured 
        ? 'border-primary shadow-[0_0_15px_-3px_rgba(214,175,55,0.2)] ring-1 ring-primary/5' 
        : isBoosted 
          ? 'border-secondary shadow-sm shadow-secondary/5' 
          : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
      }
    `}>
      {/* Image Section */}
      <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
        <Image
          src={imageUrl}
          alt={ad.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 200px"
        />
        {isOwner && ad.status && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold text-white rounded ${statusInfo.color} z-10`}>
            {statusInfo.label}
          </div>
        )}
        
        {/* Promotion Badges */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1.5 z-10">
          {isFeatured && (
            <div className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider shadow-sm flex items-center gap-1 w-fit">
              <ArrowUp className="w-2.5 h-2.5" /> {t('featured')}
            </div>
          )}
          {isBoosted && !isFeatured && (
            <div className="bg-secondary text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider shadow-sm flex items-center gap-1 w-fit">
              <ArrowUp className="w-2.5 h-2.5" /> {t('boosted')}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className={`flex-1 p-4 flex flex-col justify-between ${isFeatured ? 'bg-primary/5' : ''}`}>
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
              <Link href={`/ads/${ad.slug || ad.id}`} className="hover:text-secondary transition-colors">
                {ad.title}
              </Link>
            </h3>
            <div className={`font-bold text-lg ${formattedPrice === 'Contact for price' ? 'text-primary' : 'text-primary'}`}>
              {formattedPrice}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(ad.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <Button 
                onClick={() => setShowPromoModal(true)}
                variant="outline" 
                size="sm" 
                className="hidden md:flex rounded-full border-primary/20 text-primary hover:bg-primary/5 font-bold gap-2 h-8"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                {t('boost')}
              </Button>
            )}

            {/* Actions Menu */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-50 rounded-full">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link href={`/ads/${ad.slug}/edit`}>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      {t('edit_ad')}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => setShowPromoModal(true)}>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    {t('promote_ad')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    {t('delete_ad')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Stats Section */}
        {isOwner && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{ad.views || 0} {t('views')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">{ad.saved_count || 0} {t('saved')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">0 {t('msgs')}</span>
            </div>
          </div>
        )}
        
        {/* Owner Action Buttons (Direct Access) */}
        {isOwner && (
           <div className="mt-4 flex gap-3 sm:hidden">
              <Link href={`/ads/${ad.slug}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="w-3.5 h-3.5 mr-2" />
                  {t('edit')}
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-primary/20 text-primary font-bold"
                onClick={() => setShowPromoModal(true)}
              >
                <ArrowUp className="w-3.5 h-3.5 mr-2" />
                {t('boost')}
              </Button>
           </div>
        )}
      </div>

      {isOwner && (
        <PromotionModal
          open={showPromoModal}
          onOpenChange={setShowPromoModal}
          adId={ad.id}
          adTitle={ad.title}
        />
      )}
    </div>
  )
}
