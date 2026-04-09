"use client"

import React, { useState, useEffect } from 'react'
import { Star, ThumbsUp, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAdReviews, useMarkReviewHelpful } from '@/hooks/useReviews'
import { useAuthStore } from '@/store/authStore'
import type { Review, ReviewStats } from '@/api/types'
import { getUserInitials } from '@/utils/user'
import { getMediaUrl } from '@/lib/utils'
import ReviewForm from './ReviewForm'


interface ReviewsSectionProps {
  adId: string
  reviewStats?: ReviewStats
  isOwner?: boolean
}

export default function ReviewsSection({ adId, reviewStats, isOwner = false }: ReviewsSectionProps) {
  const { data: reviewsData, isLoading, error } = useAdReviews(adId)
  const { isAuthenticated, user } = useAuthStore()
  const [showAll, setShowAll] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const markHelpful = useMarkReviewHelpful()

  // Debug logging
  useEffect(() => {
    if (reviewsData) {
      console.log('📝 Reviews data received:', reviewsData)
      console.log('📝 Reviews count:', Array.isArray(reviewsData) ? reviewsData.length : 'Not an array')
      console.log('📝 Reviews data type:', typeof reviewsData)
      if (reviewsData && typeof reviewsData === 'object' && 'results' in reviewsData) {
        console.log('📝 Paginated response detected, results:', (reviewsData as any).results)
      }
    }
    if (error) {
      console.error('❌ Error fetching reviews:', error)
    }
  }, [reviewsData, error])

  // Ensure reviews is always an array
  // Handle both paginated response { results: [...] } and direct array [...]
  const reviews = React.useMemo(() => {
    if (!reviewsData) return []
    if (Array.isArray(reviewsData)) return reviewsData
    if (reviewsData && typeof reviewsData === 'object' && 'results' in reviewsData) {
      return Array.isArray((reviewsData as any).results) ? (reviewsData as any).results : []
    }
    return []
  }, [reviewsData])

  // Check if user has already reviewed this ad
  const userReview = reviews.find((r: Review) => r.reviewer?.id === user?.id)
  const canReview = isAuthenticated && !isOwner && !userReview

  const toggleHelpful = async (reviewId: string) => {
    try {
      await markHelpful.mutateAsync(reviewId)
    } catch (error) {
      console.error('Failed to mark review as helpful:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${starSize} ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)
  
  // Calculate stats from reviews if not provided
  const stats: ReviewStats = reviewStats || {
    total_reviews: reviews.length,
    average_rating: reviews.length > 0
      ? reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length
      : 0,
    rating_5: reviews.filter((r: Review) => r.rating === 5).length,
    rating_4: reviews.filter((r: Review) => r.rating === 4).length,
    rating_3: reviews.filter((r: Review) => r.rating === 3).length,
    rating_2: reviews.filter((r: Review) => r.rating === 2).length,
    rating_1: reviews.filter((r: Review) => r.rating === 1).length,
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(Math.round(stats.average_rating))}
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {stats.average_rating.toFixed(1)}
            </span>
            <span className="text-gray-600">({stats.total_reviews} reviews)</span>
          </div>
        </div>
        
        {canReview && (
          <button 
            onClick={() => setShowReviewForm(true)}
            className="text-sm text-primary hover:text-primary/80 font-medium px-4 py-1.5 rounded-full hover:bg-primary/5 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && canReview && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <ReviewForm 
            adId={adId}
            onSuccess={() => {
              setShowReviewForm(false)
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Rating Breakdown */}
      {stats.total_reviews > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-3xl">
          <h4 className="font-medium text-gray-900 mb-3">Rating Breakdown</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = [
                stats.rating_5,
                stats.rating_4,
                stats.rating_3,
                stats.rating_2,
                stats.rating_1
              ][5 - rating]
              const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-6">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <>
          <div className="space-y-6">
            {displayedReviews.map((review: Review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage 
                      src={getMediaUrl(review.reviewer_avatar || review.reviewer?.avatar)} 
                      alt={review.reviewer_name || review.reviewer?.full_name || 'User'} 
                    />

                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {review.reviewer 
                        ? (review.reviewer.first_name && review.reviewer.last_name
                            ? `${review.reviewer.first_name.charAt(0)}${review.reviewer.last_name.charAt(0)}`.toUpperCase()
                            : review.reviewer.full_name
                              ? review.reviewer.full_name.split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2).toUpperCase()
                              : (review.reviewer_name || 'U').charAt(0).toUpperCase())
                        : (review.reviewer_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {review.reviewer_name || review.reviewer.full_name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {renderStars(review.rating, 'sm')}
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                    </div>

                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                    )}

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleHelpful(review.id)}
                        disabled={markHelpful.isPending}
                        className="flex items-center gap-1 text-sm transition-colors text-gray-500 hover:text-primary disabled:opacity-50 px-3 py-1 rounded-full hover:bg-gray-100"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful</span>
                        {review.helpful_count > 0 && (
                          <span className="text-gray-400">({review.helpful_count})</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {reviews.length > 3 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-primary hover:text-primary/80 font-medium px-6 py-2 rounded-full border border-primary/20 hover:border-primary/40 transition-all"
              >
                {showAll ? 'Show Less' : `Show All ${stats.total_reviews} Reviews`}
              </button>
            </div>
          )}
        </>
      ) : (
        /* No Reviews State */
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⭐</div>
          <h4 className="font-medium text-gray-900 mb-2">No reviews yet</h4>
          {isOwner ? (
            <p className="text-gray-600">
              Reviews will appear here once buyers rate your ad.
            </p>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Be the first to review this seller's product!
              </p>
              {canReview && (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Write First Review
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
