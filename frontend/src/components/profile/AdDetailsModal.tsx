"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Ad } from '@/data/mockAds'

interface AdDetailsModalProps {
  ad: Ad
  isOpen: boolean
  onClose: () => void
  isOwner?: boolean
}

export default function AdDetailsModal({ ad, isOpen, onClose, isOwner = false }: AdDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-5xl w-[95vw] max-h-[90vh] p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle>Ad Details</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 sm:p-6 custom-scrollbar">
          {/* Image */}
          <div className="relative w-full mb-6">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              width={800}
              height={600}
              className="w-full h-auto"
            />
            
            {/* Status Badge */}
            {ad.status && (
              <div className={`absolute top-3 left-3 px-3 py-1.5 text-sm font-semibold ${
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
          </div>

          {/* Title & Price */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{ad.title}</h3>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{ad.price}</p>
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
                <p className="text-lg font-bold text-gray-900">{ad.favorites || 0}</p>
                <p className="text-xs text-gray-600">Favorites</p>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <div className="flex flex-col items-center">
                <MessageSquare className="w-5 h-5 text-gray-600 mb-1" />
                <p className="text-lg font-bold text-gray-900">{ad.messages || 0}</p>
                <p className="text-xs text-gray-600">Messages</p>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <div className="flex flex-col items-center">
                <Calendar className="w-5 h-5 text-gray-600 mb-1" />
                <p className="text-xs font-bold text-gray-900">{ad.postedDate || 'N/A'}</p>
                <p className="text-xs text-gray-600">Posted</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-6 flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span>{ad.location}</span>
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
            <Link href={`/ads/${ad.id}`} className="flex-1">
              <Button variant="ghost" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Page
              </Button>
            </Link>
            
            {isOwner && (
              <>
                <Link href={`/ads/${ad.id}/edit`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Ad
                  </Button>
                </Link>
                
                <Button variant="ghost" className="sm:w-auto">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

