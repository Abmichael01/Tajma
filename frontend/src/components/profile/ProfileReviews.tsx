import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Star,
  MessageSquare,
  ThumbsUp,
  Calendar
} from 'lucide-react'

interface Review {
  id: string
  reviewerName: string
  reviewerAvatar?: string
  rating: number
  comment: string
  date: string
  helpful: number
}

interface ProfileReviewsProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
  isOwner?: boolean
}

export default function ProfileReviews({ reviews, averageRating, totalReviews, isOwner = false }: ProfileReviewsProps) {
  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{averageRating}</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-sm text-gray-500">{totalReviews} reviews</div>
          </div>
          
          <div className="flex-1">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter(r => Math.round(r.rating) === star).length
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                
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

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
          {!isOwner && (
            <Button variant="secondary" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Write Review
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {getInitials(review.reviewerName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{review.reviewerName}</h4>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {review.date}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{review.comment}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-secondary transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      Helpful ({review.helpful})
                    </button>
                    <button className="hover:text-secondary transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
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
