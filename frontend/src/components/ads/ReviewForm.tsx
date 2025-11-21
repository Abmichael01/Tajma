"use client"

import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateReview, useAdReviews } from '@/hooks/useReviews'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ReviewFormProps {
  adId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ReviewForm({ adId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const createReview = useCreateReview()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rating) {
      toast.error('Please select a rating')
      return
    }

    try {
      await createReview.mutateAsync({
        ad: adId,
        rating,
        comment: comment.trim() || undefined,
      })
      
      // Explicitly invalidate and refetch reviews for this ad
      await queryClient.invalidateQueries({ queryKey: ['reviews', 'ad', adId] })
      await queryClient.refetchQueries({ queryKey: ['reviews', 'ad', adId] })
      
      toast.success('Review submitted successfully!')
      setRating(null)
      setComment('')
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || 'Failed to submit review'
      toast.error(errorMessage)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = (i + 1) as 1 | 2 | 3 | 4 | 5
      const isFilled = hoveredRating ? i < hoveredRating : rating ? i < rating : false
      
      return (
        <button
          key={i}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(null)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${
              isFilled ? 'text-yellow-500 fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {renderStars()}
          {rating && (
            <span className="text-sm text-gray-600 ml-2">
              {rating === 5 && 'Excellent'}
              {rating === 4 && 'Very Good'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Poor'}
            </span>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-900 mb-2">
          Your Review (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="Share your experience with this seller..."
          maxLength={1000}
        />
        <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 characters</p>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!rating || createReview.isPending}
          className="flex-1"
        >
          {createReview.isPending ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  )
}

