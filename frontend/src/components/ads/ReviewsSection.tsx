"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Star, ThumbsUp, MoreHorizontal } from 'lucide-react'

interface Review {
  id: string
  reviewerName: string
  reviewerAvatar?: string
  rating: number
  comment: string
  date: string
  helpful: number
  verified: boolean
}

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export default function ReviewsSection({ reviews, averageRating, totalReviews }: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set())

  const toggleHelpful = (reviewId: string) => {
    const newHelpful = new Set(helpfulReviews)
    if (newHelpful.has(reviewId)) {
      newHelpful.delete(reviewId)
    } else {
      newHelpful.add(reviewId)
    }
    setHelpfulReviews(newHelpful)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-600">({totalReviews} reviews)</span>
          </div>
        </div>
        
        <button className="text-sm text-primary hover:text-primary/80 font-medium">
          Write a Review
        </button>
      </div>

      {/* Rating Breakdown */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Rating Breakdown</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter(r => Math.round(r.rating) === rating).length
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
            
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

      {/* Reviews List */}
      <div className="space-y-6">
        {displayedReviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <Image
                src={review.reviewerAvatar || '/default-avatar.png'}
                alt={review.reviewerName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{review.reviewerName}</h4>
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                  <button className="ml-auto text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(review.date)}</span>
                </div>

                <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleHelpful(review.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      helpfulReviews.has(review.id)
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-primary'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>
                      {helpfulReviews.has(review.id) ? 'Helpful' : 'Helpful'}
                    </span>
                    <span className="text-gray-400">({review.helpful})</span>
                  </button>
                  
                  <button className="text-sm text-gray-500 hover:text-primary">
                    Reply
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
            className="text-primary hover:text-primary/80 font-medium"
          >
            {showAll ? 'Show Less' : `Show All ${totalReviews} Reviews`}
          </button>
        </div>
      )}

      {/* No Reviews State */}
      {reviews.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⭐</div>
          <h4 className="font-medium text-gray-900 mb-2">No reviews yet</h4>
          <p className="text-gray-600 mb-4">
            Be the first to review this seller's product!
          </p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            Write First Review
          </button>
        </div>
      )}
    </div>
  )
}
