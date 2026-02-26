import apiClient from './apiClient'

export interface UserWithReviewStats {
  id: string
  username?: string
  email: string
  first_name?: string
  last_name?: string
  avatar?: string
  bio?: string
  location?: string
  phone?: string
  website?: string
  is_verified: boolean
  is_seller: boolean
  date_joined: string
  review_stats?: {
    average_rating: number
    total_reviews: number
    rating_5: number
    rating_4: number
    rating_3: number
    rating_2: number
    rating_1: number
  }
  response_stats?: {
    average_response_time_hours: number
    response_rate: number
  }
}

export const usersApi = {
  getProfile: async (slug: string): Promise<UserWithReviewStats> => {
    const response = await apiClient.get<UserWithReviewStats>(`/auth/profile/${slug}/`)
    return response.data
  },

  getById: async (id: number): Promise<UserWithReviewStats> => {
    const response = await apiClient.get<UserWithReviewStats>(`/auth/profile/${id}/`)
    return response.data
  },
}

