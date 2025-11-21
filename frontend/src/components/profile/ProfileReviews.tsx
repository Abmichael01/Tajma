import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getUserInitials } from '@/utils/user'
import { 
  Star,
  ThumbsUp,
  Calendar
} from 'lucide-react'
import { useMarkReviewHelpful } from '@/hooks/useReviews'
import type { Review, ReviewStats } from '@/api/types'

interface ProfileReviewsProps {
  reviews: Review[]
  reviewStats?: ReviewStats
  isLoading?: boolean
  isOwner?: boolean
}

export default function ProfileReviews({ 
  reviews, 
  reviewStats,
  isLoading = false,
  isOwner = false 
}: ProfileReviewsProps) {
  const markHelpful = useMarkReviewHelpful()

  const toggleHelpful = async (reviewId: string) => {
    try {
      await markHelpful.mutateAsync(reviewId)
    } catch (error) {
      console.error('Failed to mark review as helpful:', error)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const stats: ReviewStats = reviewStats || {
    total_reviews: reviews.length,
    average_rating: reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0,
    rating_5: reviews.filter(r => r.rating === 5).length,
    rating_4: reviews.filter(r => r.rating === 4).length,
    rating_3: reviews.filter(r => r.rating === 3).length,
    rating_2: reviews.filter(r => r.rating === 2).length,
    rating_1: reviews.filter(r => r.rating === 1).length,
  }

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <MarketplaceLoader size="md" message="Loading reviews..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      {stats.total_reviews > 0 && (
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {renderStars(Math.round(stats.average_rating))}
              </div>
              <div className="text-sm text-gray-500">{stats.total_reviews} reviews</div>
            </div>
            
            <div className="flex-1">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = [
                    stats.rating_5,
                    stats.rating_4,
                    stats.rating_3,
                    stats.rating_2,
                    stats.rating_1
                  ][5 - star]
                  const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0
                  
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-2">{star}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <div className="flex-1 bg-gray-200 h-2 rounded">
                        <div 
                          className="bg-yellow-400 h-2 rounded"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-3 lg:space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 p-3 lg:p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage 
                      src={review.reviewer_avatar || review.reviewer?.avatar || undefined} 
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
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Link 
                        href={`/profile/${review.reviewer.username || review.reviewer.email?.split('@')[0] || 'profile'}`}
                        className="font-medium text-gray-900 hover:text-primary text-sm lg:text-base"
                      >
                        {review.reviewer_name || review.reviewer.full_name}
                      </Link>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.created_at)}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm lg:text-base text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-xs lg:text-sm text-gray-500">
                      <Link 
                        href={`/ads/${review.ad_slug}`}
                        className="text-primary hover:underline break-words"
                      >
                        View Ad: {review.ad_title}
                      </Link>
                      
                      <button 
                        onClick={() => toggleHelpful(review.id)}
                        disabled={markHelpful.isPending}
                        className="flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-50 ml-auto lg:ml-0"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="hidden sm:inline">Helpful</span>
                        {review.helpful_count > 0 && (
                          <span>({review.helpful_count})</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isOwner ? 'No reviews yet' : 'No reviews available'}
            </h3>
            <p className="text-gray-600">
              {isOwner 
                ? 'Reviews will appear here once buyers rate your items' 
                : 'This user hasn\'t received any reviews yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
