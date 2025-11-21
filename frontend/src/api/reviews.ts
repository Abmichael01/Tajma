import apiClient from './apiClient'
import type { Review, ReviewStats, CreateReviewRequest } from './types'

export const reviewsApi = {
  /**
   * List reviews with optional filters
   * @param params - Query parameters (ad, seller, reviewer)
   * Returns paginated data: { count, next, previous, results: Review[] }
   */
  list(params?: { ad?: string; seller?: number; reviewer?: number }) {
    return apiClient.get<Review[] | { count: number; next: string | null; previous: string | null; results: Review[] }>('/reviews/', { params }).then(res => {
      // Handle paginated response
      if (res.data && typeof res.data === 'object' && 'results' in res.data) {
        return res.data.results
      }
      // Handle direct array response (if pagination is disabled)
      return Array.isArray(res.data) ? res.data : []
    })
  },

  /**
   * Get a single review by ID
   */
  get(id: string) {
    return apiClient.get<Review>(`/reviews/${id}/`).then(res => res.data)
  },

  /**
   * Create a new review
   */
  create(payload: CreateReviewRequest) {
    return apiClient.post<Review>('/reviews/', payload).then(res => res.data)
  },

  /**
   * Update a review
   */
  update(id: string, payload: Partial<CreateReviewRequest>) {
    return apiClient.patch<Review>(`/reviews/${id}/`, payload).then(res => res.data)
  },

  /**
   * Delete a review
   */
  remove(id: string) {
    return apiClient.delete(`/reviews/${id}/`).then(() => undefined)
  },

  /**
   * Get review statistics
   * @param params - Query parameters (seller or ad)
   */
  stats(params: { seller?: number; ad?: string }) {
    return apiClient.get<ReviewStats>('/reviews/stats/', { params }).then(res => res.data)
  },

  /**
   * Mark a review as helpful
   */
  markHelpful(id: string) {
    return apiClient.post<{ helpful_count: number }>(`/reviews/${id}/mark_helpful/`).then(res => res.data)
  },
}

