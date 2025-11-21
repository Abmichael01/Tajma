import apiClient from './apiClient'
import type { UserWithReviewStats } from './types'

export const usersApi = {
  getProfile: async (slug: string): Promise<UserWithReviewStats> => {
    const response = await apiClient.get<UserWithReviewStats>(`/auth/profile/${slug}/`)
    return response.data
  },
}


