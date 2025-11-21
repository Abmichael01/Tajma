import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adsApi } from '@/api/ads'
import type { CreateAdRequest, UpdateAdRequest } from '@/api/types'

// ============================================================================
// QUERIES - Fetching Ad Data
// ============================================================================

/**
 * Fetch a single ad by slug
 */
export const useAdDetails = (slug: string, enabled = true) => {
  return useQuery({
    queryKey: ['ad', slug],
    queryFn: () => adsApi.get(slug),
    enabled,
  })
}

/**
 * Fetch a list of ads with optional filters
 * @param params - Query parameters (status, category, user, etc.)
 */
export const useAdsList = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['ads', params],
    queryFn: () => adsApi.list(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Fetch ads belonging to a specific user
 * @param userId - The user ID to fetch ads for
 * @param status - Optional status filter (published, draft, archived)
 */
export const useUserAds = (userId?: number, status?: string) => {
  return useQuery({
    queryKey: ['ads', 'user', userId, status],
    queryFn: () => adsApi.list({ user: userId, ...(status && { status }) }),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// MUTATIONS - Creating, Updating, Deleting Ads
// ============================================================================

/**
 * Create a new ad
 */
export const useCreateAd = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAdRequest) => adsApi.create(payload),
    onSuccess: (ad) => {
      queryClient.invalidateQueries({ queryKey: ['ad', ad.slug] })
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      // Invalidate categories to refresh ad counts
      // Note: Categories are loaded from CDN JSON which is updated by backend signals
      // We invalidate to force a fresh fetch of the updated JSON
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/**
 * Update an existing ad
 * @param slug - The slug of the ad to update
 */
export const useUpdateAd = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAdRequest) => adsApi.update(slug, payload),
    onSuccess: (ad) => {
      queryClient.invalidateQueries({ queryKey: ['ad', slug] })
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      queryClient.invalidateQueries({ queryKey: ['ad', ad.slug] })
      // Invalidate categories if status changed (affects counts)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/**
 * Delete an ad
 * @param slug - The slug of the ad to delete
 */
export const useDeleteAd = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => adsApi.remove(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      queryClient.removeQueries({ queryKey: ['ad', slug] })
      // Invalidate categories to refresh ad counts
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}


