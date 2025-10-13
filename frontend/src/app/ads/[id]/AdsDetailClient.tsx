"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { mockAds } from '@/data/mockAds'
import { useFavoritesStore } from '@/store/favoritesStore'
import ReviewsSection from '@/components/ads/ReviewsSection'
import { mockReviews, calculateReviewStats } from '@/data/mockReviews'
import ReportAdModal from '@/components/modals/ReportAdModal'
import ShareAdModal from '@/components/modals/ShareAdModal'
import { 
  MapPin, 
  Eye, 
  Heart, 
  Share2, 
  Flag, 
  MessageSquare,
  Phone,
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  Calendar,
  Tag
} from 'lucide-react'

interface AdsDetailClientProps {
  adId: string
}

export default function AdsDetailClient({ adId }: AdsDetailClientProps) {
  const [ad, setAd] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const { toggleFavorite, isFavorite } = useFavoritesStore()

  // Mock review data for the seller
  const reviewStats = calculateReviewStats(mockReviews)

  useEffect(() => {
    // Simulate API call
    const fetchAd = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const foundAd = mockAds.find(ad => ad.id === adId)
      setAd(foundAd || null)
      setIsLoading(false)
    }

    fetchAd()
  }, [adId])

  const nextImage = () => {
    if (ad && currentImageIndex < 2) { // Assuming max 3 images
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ad Not Found</h1>
          <p className="text-gray-600 mb-6">The ad you're looking for doesn't exist or has been removed.</p>
          <Button variant="primary">
            Browse Other Ads
          </Button>
        </div>
      </div>
    )
  }

  // Mock additional images for gallery
  const adImages = [
    ad.imageUrl,
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
              {/* Main Image */}
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={adImages[currentImageIndex]}
                  alt={ad.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                
                {/* Navigation Arrows */}
                {adImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={currentImageIndex === adImages.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {adImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 text-sm">
                    {currentImageIndex + 1} / {adImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {adImages.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2 overflow-x-auto">
                    {adImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex 
                            ? 'border-secondary' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${ad.title} ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="mt-6 lg:mt-8 bg-white shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                  {ad.description || `This is a high-quality ${ad.title.toLowerCase()} in excellent condition. Perfect for anyone looking for a reliable device. The item has been well-maintained and comes with original packaging and accessories.`}
                </p>
              </div>
            </div>
            
            {/* Ad Info */}
            {(ad.brand || ad.condition || ad.postedDate) && (
              <div className="mt-6 bg-white shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {ad.category && (
                    <div>
                      <p className="text-gray-600 mb-1">Category</p>
                      <p className="font-medium text-gray-900 capitalize">{ad.category}</p>
                    </div>
                  )}
                  {ad.condition && (
                    <div>
                      <p className="text-gray-600 mb-1">Condition</p>
                      <p className="font-medium text-gray-900 capitalize">{ad.condition.replace('-', ' ')}</p>
                    </div>
                  )}
                  {ad.brand && (
                    <div>
                      <p className="text-gray-600 mb-1">Brand</p>
                      <p className="font-medium text-gray-900">{ad.brand}</p>
                    </div>
                  )}
                  {ad.postedDate && (
                    <div>
                      <p className="text-gray-600 mb-1">Posted</p>
                      <p className="font-medium text-gray-900">{new Date(ad.postedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Product Info & Seller */}
          <div className="space-y-4 lg:space-y-6">
            {/* Product Info Card */}
            <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight flex-1">{ad.title}</h1>
                <button
                  onClick={() => toggleFavorite(ad.id)}
                  className={`p-2 transition-colors flex-shrink-0 ${
                    isFavorite(ad.id)
                      ? 'text-red-500 bg-red-50' 
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                  title={isFavorite(ad.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorite(ad.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-primary mb-6">{ad.price}</div>

              <div className="space-y-3 mb-6 text-sm sm:text-base">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{ad.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  <span>{ad.views} views</span>
                </div>
                {ad.category && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="w-4 h-4 flex-shrink-0" />
                    <span className="capitalize">{ad.category}</span>
                  </div>
                )}
                {ad.postedDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{new Date(ad.postedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Link href="/chat" className="block">
                  <Button className="w-full" size="lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Contact Seller
                  </Button>
                </Link>
                <Button variant="secondary" className="w-full" size="lg" onClick={() => alert('Phone: +234 801 234 5678')}>
                  <Phone className="w-5 h-5 mr-2" />
                  Call Seller
                </Button>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </Button>
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
              
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                  alt="Seller"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">{ad.userName || 'John Doe'}</h4>
                    <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-4">
                <div>Member since 2023</div>
                <div>Response rate: 95%</div>
                <div>Usually responds within 1 hour</div>
              </div>

              <Link href={`/profile/${ad.userId || 'john_doe_123'}`}>
                <Button variant="ghost" className="w-full">
                  View Profile
                </Button>
              </Link>
            </div>

            {/* Safety Tips */}
            <div className="bg-blue-50 border border-blue-200 p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Safety Tips</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>• Meet in a public place</li>
                <li>• Inspect the item before paying</li>
                <li>• Never pay in advance</li>
                <li>• Report suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section - Full Width Below */}
        <div className="lg:col-span-3 mt-8">
          <ReviewsSection
            reviews={mockReviews}
            averageRating={reviewStats.averageRating}
            totalReviews={reviewStats.totalReviews}
          />
        </div>
      </div>

      {/* Modals */}
      <ReportAdModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        adId={ad.id}
        adTitle={ad.title}
      />
      <ShareAdModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        adId={ad.id}
        adTitle={ad.title}
      />
    </div>
  )
}
