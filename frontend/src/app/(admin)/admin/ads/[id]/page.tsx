"use client"

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAdminAd, useAdminAdChatCount } from '@/hooks/useAdmin'
import { useReviewStats } from '@/hooks/useReviews'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Eye, MessageSquare, Star } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { getUserFullName, getUserInitials } from '@/utils/user'

export default function AdminAdDetailPage() {
  const params = useParams()
  const router = useRouter()
  const adId = params.id as string

  const { data: ad, isLoading, error } = useAdminAd(adId)
  const { data: chatCount, isLoading: isLoadingChats } = useAdminAdChatCount(adId)
  const { data: reviewStats, isLoading: isLoadingReviews } = useReviewStats(
    { ad: adId },
    !!adId
  )

  // Helper function to get image URL
  // Uses API endpoint to bypass browser extension blocking
  const getImageUrl = (image: string | undefined) => {
    if (!image) return null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    
    // If it's a /media/ path, convert to API endpoint
    if (image.startsWith('/media/')) {
      const path = image.replace('/media/', '')
      return `${apiUrl}/api/media/${path}`
    }
    
    // If it's just a path starting with /, use as is but try API endpoint
    if (image.startsWith('/')) {
      // Try API endpoint first (bypasses blockers)
      if (image.startsWith('/ads/') || image.includes('/ads/')) {
        const path = image.replace(/^\//, '')
        return `${apiUrl}/api/media/${path}`
      }
      return `${apiUrl}${image}`
    }
    
    // Relative path (e.g., 'ads/uuid.jpg'), use API endpoint
    return `${apiUrl}/api/media/${image}`
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MarketplaceLoader size="md" message="Loading ad details..." />
      </div>
    )
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ad Not Found</h1>
          <p className="text-gray-600 mb-6">The ad you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/ads')} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const adImages = ad.images && ad.images.length > 0 ? ad.images : []
  const formattedPrice = ad.price
    ? `${ad.currency} ${parseFloat(ad.price).toLocaleString()}`
    : 'Contact for price'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/ads')}
          className="h-9 w-9"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-medium text-gray-900 truncate">{ad.title}</h1>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatsCard
          title="Views"
          value={ad.views.toLocaleString()}
          icon={Eye}
        />
        <AdminStatsCard
          title="Messages"
          value={isLoadingChats ? '...' : (chatCount || 0).toLocaleString()}
          icon={MessageSquare}
        />
        <AdminStatsCard
          title="Reviews"
          value={isLoadingReviews ? '...' : (reviewStats?.total_reviews || 0).toLocaleString()}
          icon={Star}
        />
      </div>

      {/* Ad Details Sections */}
      <div className="space-y-6">
        {/* Images Gallery */}
        {adImages.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-base font-medium text-gray-900 mb-4">Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {adImages.map((image, index) => {
                const imageUrl = getImageUrl(image)
                const isLocalhost = imageUrl ? (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) : false
                return (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${ad.title} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized={isLocalhost}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Title</p>
              <p className="text-sm font-medium text-gray-900">{ad.title}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Price</p>
              <p className="text-sm font-medium text-gray-900">{formattedPrice}</p>
              {ad.is_negotiable && (
                <Badge variant="outline" className="mt-2">
                  Negotiable
                </Badge>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Status</p>
              <Badge
                variant={
                  ad.status === 'published'
                    ? 'default'
                    : ad.status === 'draft'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
              </Badge>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Type</p>
              <Badge variant="outline">
                {ad.ad_type.charAt(0).toUpperCase() + ad.ad_type.slice(1)}
              </Badge>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Category</p>
              <p className="text-sm font-medium text-gray-900">
                {ad.category_name || ad.category}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Slug</p>
              <p className="text-sm font-medium text-gray-900 font-mono">{ad.slug}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {ad.description && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Description</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ad.description}</p>
            </div>
          </div>
        )}

        {/* Attributes */}
        {ad.attributes && Object.keys(ad.attributes).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Attributes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(ad.attributes).map(([key, value]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seller Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Seller Information</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={ad.seller.avatar || undefined} alt={getUserFullName(ad.seller)} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getUserInitials(ad.seller)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getUserFullName(ad.seller)}
                </p>
                <p className="text-sm text-gray-500">{ad.seller.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Timestamps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Created At</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(ad.created_at).toLocaleString()}
              </p>
            </div>
            {ad.updated_at && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Updated At</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(ad.updated_at).toLocaleString()}
                </p>
              </div>
            )}
            {ad.published_at && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Published At</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(ad.published_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

