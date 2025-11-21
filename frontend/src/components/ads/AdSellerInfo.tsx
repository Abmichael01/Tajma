"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Star, Shield } from 'lucide-react'
import type { User, ReviewStats } from '@/api/types'
import { getUserFullName } from '@/utils/user'

interface AdSellerInfoProps {
  seller: User
  sellerName: string
  sellerProfileSlug: string
  reviewStats?: ReviewStats
  className?: string
}

export default function AdSellerInfo({
  seller,
  sellerName,
  sellerProfileSlug,
  reviewStats,
  className = ''
}: AdSellerInfoProps) {
  return (
    <div className={`bg-white border border-gray-200 p-4 sm:p-6 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
      
      <div className="flex items-center gap-3 mb-4">
        {seller.avatar ? (
          <Image
            src={seller.avatar}
            alt={sellerName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {sellerName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 truncate">{sellerName}</h4>
            {seller.is_verified && (
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm text-gray-600">
              {reviewStats?.average_rating 
                ? `${reviewStats.average_rating.toFixed(1)} (${reviewStats.total_reviews || 0} reviews)`
                : 'No reviews yet'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-4">
        {seller.date_joined && (
          <div>Member since {new Date(seller.date_joined).getFullYear()}</div>
        )}
        <div>Response rate: 95%</div>
        <div>Usually responds within 1 hour</div>
      </div>

      <Link href={`/profile/${sellerProfileSlug}`}>
        <Button variant="ghost" className="w-full">
          View Profile
        </Button>
      </Link>
    </div>
  )
}

