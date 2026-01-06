import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '@/api/reviews'

// ============================================================================
// QUERIES - Fetching Review Data
// ============================================================================

/**
 * Fetch reviews for an ad
 */
export const useAdReviews = (adId?: string) => {
  return useQuery({
    queryKey: ['reviews', 'ad', adId],
    queryFn: () => reviewsApi.list({ ad: adId }),
    enabled: !!adId,
  })
}

/**
 * Fetch reviews for a seller
 */
export const useSellerReviews = (sellerId?: number) => {
  return useQuery({
    queryKey: ['reviews', 'seller', sellerId],
    queryFn: () => reviewsApi.list({ seller: sellerId }),
    enabled: !!sellerId,
  })
}

/**
 * Fetch review statistics
 */
export const useReviewStats = (params: { seller?: number; ad?: string }, enabled = true) => {
  return useQuery({
    queryKey: ['reviews', 'stats', params],
    queryFn: () => reviewsApi.stats(params),
    enabled: enabled && (!!params.seller || !!params.ad),
  })
}

/**
 * Fetch a single review
 */
export const useReview = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['review', id],
    queryFn: () => reviewsApi.get(id),
    enabled: enabled && !!id,
  })
}

// ============================================================================
// MUTATIONS - Creating, Updating, Deleting Reviews
// ============================================================================

/**
 * Create a new review
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => reviewsApi.create(payload),
    onSuccess: (review, variables) => {
      // Invalidate all reviews queries for this ad (using prefix match to handle both ID and slug)
      queryClient.invalidateQueries({ queryKey: ['reviews', 'ad'], exact: false })
      // Also invalidate with the exact ad ID/slug from the payload
      if (variables.ad) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'ad', variables.ad] })
      }
      queryClient.invalidateQueries({ queryKey: ['reviews', 'seller', review.seller] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'stats'] })
    },
  })
}

/**
 * Update a review
 */
export const useUpdateReview = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => reviewsApi.update(id, payload),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: ['review', id] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'ad', review.ad] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'seller', review.seller] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'stats'] })
    },
  })
}

/**
 * Delete a review
 */
export const useDeleteReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reviewsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.removeQueries({ queryKey: ['review', id] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'stats'] })
    },
  })
}

/**
 * Mark a review as helpful
 */
export const useMarkReviewHelpful = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reviewsApi.markHelpful(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['review', id] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

