import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adsApi } from '@/api/ads';

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
    enabled: enabled && !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a list of ads with optional filters
 * @param params - Query parameters (status, category, user, etc.)
 */
export const useAdsList = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['ads', params],
    queryFn: () => adsApi.list(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

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
  });
};

// ============================================================================
// MUTATIONS - Creating, Updating, Deleting Ads
// ============================================================================

/**
 * Create a new ad
 */
export const useCreateAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => adsApi.create(payload),
    onSuccess: (ad) => {
      queryClient.invalidateQueries({ queryKey: ['ad', ad.slug] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

/**
 * Update an existing ad
 * @param slug - The slug of the ad to update
 */
export const useUpdateAd = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => adsApi.update(slug, payload),
    onSuccess: (ad) => {
      queryClient.invalidateQueries({ queryKey: ['ad', slug] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['ad', ad.slug] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

/**
 * Delete an ad
 * @param slug - The slug of the ad to delete
 */
export const useDeleteAd = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adsApi.remove(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.removeQueries({ queryKey: ['ad', slug] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

