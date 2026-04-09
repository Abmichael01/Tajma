"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, MoreVertical, Eye, Heart, MessageSquare, MapPin, Calendar } from 'lucide-react'
import type { Ad } from '@/api/types'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { getMediaUrl } from '@/lib/utils'


interface HorizontalAdCardProps {
  ad: Ad
  isOwner?: boolean
}

export default function HorizontalAdCard({ ad, isOwner = false }: HorizontalAdCardProps) {
  // Get first image or placeholder
  const imageUrl = getMediaUrl(ad.images?.[0])

  
  // Format price
  const formattedPrice = ad.price
    ? `${ad.currency || 'XOF'} ${parseFloat(String(ad.price)).toLocaleString()}`
    : 'Contact for price'
  
  // Get location
  const location = ad.seller?.location || 'Location not specified'
  
  // Status display logic
  const statusConfig = {
    published: { label: 'ACTIVE', color: 'bg-green-500' },
    archived: { label: 'ARCHIVED', color: 'bg-gray-900' },
    draft: { label: 'DRAFT', color: 'bg-yellow-500' },
  }
  
  const statusInfo = statusConfig[ad.status as keyof typeof statusConfig] || { label: 'UNKNOWN', color: 'bg-gray-500' }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row">
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
          <div className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold text-white rounded ${statusInfo.color}`}>
            {statusInfo.label}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 p-4 flex flex-col justify-between">
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

          {/* Actions Menu */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/ads/${ad.slug}/edit`}>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Ad
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="text-red-600">
                  Delete Ad
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Stats Section */}
        {isOwner && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{ad.views || 0} Views</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">{ad.saved_count || 0} Saved</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">0 Msgs</span>
            </div>
          </div>
        )}
        
        {/* Owner Action Buttons (Direct Access) */}
        {isOwner && (
           <div className="mt-4 flex gap-3 sm:hidden">
              <Link href={`/ads/${ad.slug}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="w-3.5 h-3.5 mr-2" />
                  Edit
                </Button>
              </Link>
           </div>
        )}
      </div>
    </div>
  )
}
